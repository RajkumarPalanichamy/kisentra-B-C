'use client';

import React, { Fragment, useState, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import { getProducts, getProductsFromSupabaseAsync, Product } from '@/api/products';
import { useCart } from '@/contexts/CartContext';
import ProductCard from '@/components/ProductCard/ProductCard';
import Image from 'next/image';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  // Load products only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    setProducts(getProducts());
    
    // Also try to load from Supabase in background
    getProductsFromSupabaseAsync().then((supabaseProducts) => {
      if (supabaseProducts && supabaseProducts.length > 0) {
        setProducts(supabaseProducts);
        // Also update localStorage with Supabase data
        localStorage.setItem('adminProducts', JSON.stringify(supabaseProducts));
      }
    });
    
    const handleStorageChange = () => {
      setProducts(getProducts());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const product = isMounted ? products.find((p) => p.slug === slug) : null;
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  if (!isMounted) {
    return (
      <Fragment>
        <div className='body_wrap sco_agency'>
          <Header />
          <main className="page_content">
            <section className="service pt-140 pb-140">
              <div className="container">
                <div className="row">
                  <div className="col-12 text-center">
                    <p className="content">Loading...</p>
                  </div>
                </div>
              </div>
            </section>
          </main>
          <Footer />
          <Scrollbar />
        </div>
      </Fragment>
    );
  }

  if (!product) {
    notFound();
  }

  // Get related products (same category, excluding current product, only visible)
  const relatedProducts = products.filter(
    (p) => p.category === product.category && p.Id !== product.Id && p.visible !== false
  ).slice(0, 4);

  // Safely get the main image with fallback
  const getMainImage = () => {
    if (!product.images || product.images.length === 0) {
      return '/images/placeholder.jpg'; // Fallback placeholder
    }
    
    const selectedImage = product.images[selectedImageIndex] || product.images[0];
    if (typeof selectedImage === 'string') {
      return selectedImage;
    }
    
    // Handle StaticImageData or object with src property
    if (selectedImage && typeof selectedImage === 'object') {
      return (selectedImage as any).src || selectedImage;
    }
    
    return '/images/placeholder.jpg'; // Final fallback
  };
  
  const mainImage = getMainImage();

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push('/checkout');
  };

  const handleQuantityChange = (change: number) => {
    setQuantity((prev) => Math.max(1, prev + change));
  };

  return (
    <Fragment>
      <div className='body_wrap sco_agency'>
        <Header />
        <main className="page_content">
          <section className="service pt-140 pb-140">
            <div className="container">
              <div className="row mb-40">
                <div className="col-12">
                  <Fade direction="up" triggerOnce duration={1000}>
                    <nav aria-label="breadcrumb" style={{ marginBottom: '30px' }}>
                      <ol className="breadcrumb" style={{ 
                        listStyle: 'none', 
                        display: 'flex', 
                        padding: 0,
                        margin: 0,
                        gap: '10px',
                        fontSize: '14px',
                        color: 'var(--color-default)'
                      }}>
                        <li><Link href="/">Home</Link></li>
                        <li>/</li>
                        <li><Link href="/products">Products</Link></li>
                        <li>/</li>
                        <li style={{ color: 'var(--color-heading)' }}>{product.title}</li>
                      </ol>
                    </nav>
                  </Fade>
                </div>
              </div>

              <div className="row">
                {/* Product Images */}
                <div className="col-lg-6">
                  <Fade direction="left" triggerOnce duration={1000}>
                    <div className="product-detail-images">
                      <div 
                        className="main-product-image mb-30" 
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '15px',
                          overflow: 'hidden',
                          backgroundColor: '#f6f6f8',
                          border: '1px solid #e7e8ec',
                          cursor: isZoomed ? 'zoom-out' : 'zoom-in'
                        }}
                        onMouseMove={(e) => {
                          if (!isZoomed) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
                        }}
                        onMouseEnter={() => setIsZoomed(true)}
                        onMouseLeave={() => setIsZoomed(false)}
                      >
                        <Image
                          src={mainImage}
                          alt={product.title}
                          fill
                          style={{ 
                            objectFit: 'cover',
                            transform: isZoomed ? `scale(2)` : 'scale(1)',
                            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            transition: isZoomed ? 'none' : 'transform 0.3s ease'
                          }}
                        />
                      </div>
                      
                      {product.images && product.images.length > 1 && (
                        <div className="product-thumbnails" style={{
                          display: 'flex',
                          gap: '15px',
                          flexWrap: 'wrap'
                        }}>
                          {product.images.map((img, index) => {
                            const thumbSrc = typeof img === 'string' 
                              ? img 
                              : (img && typeof img === 'object' ? (img as any).src : '/images/placeholder.jpg') || '/images/placeholder.jpg';
                            return (
                              <div
                                key={index}
                                onClick={() => setSelectedImageIndex(index)}
                                style={{
                                  position: 'relative',
                                  width: '80px',
                                  height: '80px',
                                  borderRadius: '10px',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  border: selectedImageIndex === index ? '2px solid var(--color-primary-two)' : '1px solid #e7e8ec',
                                  backgroundColor: '#f6f6f8'
                                }}
                              >
                                <Image
                                  src={thumbSrc}
                                  alt={`${product.title} thumbnail ${index + 1}`}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Fade>
                </div>

                {/* Product Info */}
                <div className="col-lg-6">
                  <Fade direction="right" triggerOnce duration={1000}>
                    <div className="product-detail-info">
                      <h1 className="title mb-20" style={{ fontSize: '42px', lineHeight: '1.2' }}>
                        {product.title}
                      </h1>
                      
                      {product.rating && (
                        <div className="product-rating mb-20" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            {[...Array(5)].map((_, i) => (
                              <i
                                key={i}
                                className={`fas fa-star ${i < Math.floor(product.rating || 0) ? 'text-warning' : 'text-muted'}`}
                                style={{ color: i < Math.floor(product.rating || 0) ? '#ffd600' : '#ccc' }}
                              ></i>
                            ))}
                          </div>
                          <span style={{ color: 'var(--color-default)' }}>
                            {product.rating} ({product.reviews} reviews)
                          </span>
                        </div>
                      )}

                      <div className="product-price mb-30" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                      }}>
                        <span className="current-price" style={{
                          fontSize: '36px',
                          fontWeight: '700',
                          color: 'var(--color-primary-two)'
                        }}>
                          ${product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="original-price" style={{
                            fontSize: '24px',
                            textDecoration: 'line-through',
                            color: 'var(--color-default)'
                          }}>
                            ${product.originalPrice}
                          </span>
                        )}
                      </div>

                      <p className="content mb-30" style={{ fontSize: '18px', lineHeight: '1.8' }}>
                        {product.longDescription || product.description}
                      </p>

                      {product.features && product.features.length > 0 && (
                        <div className="product-features mb-30">
                          <h3 className="mb-20" style={{ fontSize: '24px', marginBottom: '15px' }}>Key Features:</h3>
                          <ul className="list-unstyled" style={{ padding: 0 }}>
                            {product.features.map((feature, index) => (
                              <li key={index} style={{
                                padding: '10px 0',
                                paddingLeft: '30px',
                                position: 'relative',
                                fontSize: '16px',
                                lineHeight: '1.6'
                              }}>
                                <i className="far fa-check" style={{
                                  position: 'absolute',
                                  left: '0',
                                  color: 'var(--color-primary-two)'
                                }}></i>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="product-actions mb-30">
                        <div className="quantity-selector mb-20" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px'
                        }}>
                          <label style={{ fontWeight: '600' }}>Quantity:</label>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid #e7e8ec',
                            borderRadius: '7px',
                            overflow: 'hidden'
                          }}>
                            <button
                              onClick={() => handleQuantityChange(-1)}
                              style={{
                                padding: '12px 20px',
                                border: 'none',
                                backgroundColor: '#f6f6f8',
                                cursor: 'pointer',
                                fontSize: '18px'
                              }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                              style={{
                                width: '60px',
                                padding: '12px',
                                border: 'none',
                                textAlign: 'center',
                                fontSize: '16px',
                                fontWeight: '600'
                              }}
                              min="1"
                            />
                            <button
                              onClick={() => handleQuantityChange(1)}
                              style={{
                                padding: '12px 20px',
                                border: 'none',
                                backgroundColor: '#f6f6f8',
                                cursor: 'pointer',
                                fontSize: '18px'
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="action-buttons" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                          <button
                            onClick={handleAddToCart}
                            className="thm-btn thm-btn--aso thm-btn--aso_yellow"
                            style={{ flex: '1', minWidth: '200px' }}
                          >
                            {addedToCart ? (
                              <>
                                <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
                                Added to Cart!
                              </>
                            ) : (
                              'Add to Cart'
                            )}
                          </button>
                          <button
                            onClick={handleBuyNow}
                            className="thm-btn thm-btn--border"
                            style={{ flex: '1', minWidth: '200px' }}
                          >
                            Buy Now
                          </button>
                        </div>
                        
                        {addedToCart && (
                          <div style={{
                            marginTop: '15px',
                            padding: '12px 20px',
                            backgroundColor: '#d4edda',
                            border: '1px solid #c3e6cb',
                            borderRadius: '7px',
                            color: '#155724',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            <i className="fas fa-check-circle"></i>
                            Product added to cart! <Link href="/cart" style={{ color: 'var(--color-primary-two)', textDecoration: 'underline', marginLeft: '5px' }}>View Cart</Link>
                          </div>
                        )}
                      </div>

                      <div className="product-meta" style={{
                        padding: '20px',
                        backgroundColor: '#f6f6f8',
                        borderRadius: '10px',
                        border: '1px solid #e7e8ec'
                      }}>
                        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                          <div>
                            <strong>Category:</strong> {product.category}
                          </div>
                          <div>
                            <strong>Stock:</strong>{' '}
                            <span style={{ color: product.inStock ? 'green' : 'red' }}>
                              {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                        </div>
                        {product.tags && product.tags.length > 0 && (
                          <div className="mt-20" style={{ marginTop: '15px' }}>
                            <strong>Tags:</strong>{' '}
                            {product.tags.map((tag, index) => (
                              <span key={index} style={{
                                display: 'inline-block',
                                padding: '5px 12px',
                                margin: '5px 5px 5px 0',
                                backgroundColor: '#fff',
                                borderRadius: '5px',
                                fontSize: '14px',
                                border: '1px solid #e7e8ec'
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Fade>
                </div>
              </div>

              {/* Related Products Section */}
              {relatedProducts.length > 0 && (
                <div className="row mt-100">
                  <div className="col-12">
                    <Fade direction="up" triggerOnce duration={1000}>
                      <div className="text-center mb-60">
                        <h2 className="title mb-20">Related Products</h2>
                        <p className="content">
                          You might also like these products from the same category
                        </p>
                      </div>
                    </Fade>
                  </div>
                  <div className="col-12">
                    <div className="row mt-none-30">
                      {relatedProducts.map((relatedProduct) => (
                        <div key={relatedProduct.Id} className="col-lg-3 col-md-6 mt-30">
                          <ProductCard product={relatedProduct} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
        <Footer />
        <Scrollbar />
      </div>
    </Fragment>
  );
};

export default ProductDetailPage;



