'use client';

import React, { Fragment, useState, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import { getProducts, getProductsFromSupabaseAsync, Product } from '@/api/products';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard/ProductCard';
import Reviews from '@/components/Reviews/Reviews';
import Image from 'next/image';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useUser();
  const [userPincode, setUserPincode] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);

  // Calculate delivery date based on pincode
  const calculateDeliveryDate = (pincode: string): string => {
    // Simple delivery estimation: 3-5 business days
    // You can make this more sophisticated based on pincode zones
    const today = new Date();
    const deliveryDays = 4; // Average 4 days
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + deliveryDays);
    
    // Format: "Thu, Jan 16"
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return deliveryDate.toLocaleDateString('en-US', options);
  };


  // Fetch user's default address pincode
  useEffect(() => {
    const fetchUserAddress = async () => {
      if (!user?.id) {
        setUserPincode(null);
        setDeliveryDate(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('pincode')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .single();

        if (!error && data?.pincode) {
          setUserPincode(data.pincode);
          setDeliveryDate(calculateDeliveryDate(data.pincode));
        } else {
          // If no default address, try to get any address
          const { data: anyAddress, error: anyError } = await supabase
            .from('addresses')
            .select('pincode')
            .eq('user_id', user.id)
            .limit(1)
            .single();

          if (!anyError && anyAddress?.pincode) {
            setUserPincode(anyAddress.pincode);
            setDeliveryDate(calculateDeliveryDate(anyAddress.pincode));
          }
        }
      } catch (err) {
        console.error('Error fetching user address:', err);
      }
    };

    fetchUserAddress();
  }, [user]);

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
  const [activeTab, setActiveTab] = useState('Overview');
  const [showLightbox, setShowLightbox] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [productUUID, setProductUUID] = useState<string | null>(null);

  // Fetch product UUID from Supabase
  useEffect(() => {
    const fetchProductUUID = async () => {
      if (!product?.slug) return;

      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.Id);
        
        if (isUUID) {
          setProductUUID(product.Id);
        } else {
          // Lookup by slug
          const { data, error } = await supabase
            .from('products')
            .select('id')
            .eq('slug', product.slug)
            .single();

          if (!error && data?.id) {
            setProductUUID(data.id);
          }
        }
      } catch (err) {
        console.error('Error fetching product UUID:', err);
      }
    };

    if (product) {
      fetchProductUUID();
    }
  }, [product]);

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
      // Validate it's a proper URL or path
      if (selectedImage.startsWith('http') || selectedImage.startsWith('//') || selectedImage.startsWith('data:') || selectedImage.startsWith('/')) {
        return selectedImage;
      }
      return '/images/placeholder.jpg';
    }

    // Handle StaticImageData or object with src property
    if (selectedImage && typeof selectedImage === 'object') {
      const src = (selectedImage as any).src || 
                  (selectedImage as any).default?.src || 
                  (selectedImage as any).default ||
                  null;
      return src || '/images/placeholder.jpg';
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

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Fragment>
      <div className='body_wrap sco_agency'>
        <Header />
        <main className="page_content" style={{ backgroundColor: '#fff', paddingBottom: '60px', paddingTop: '100px', fontFamily: 'Inter, sans-serif', minHeight: 'calc(100vh - 200px)' }}>

          <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', marginTop: '40px', position: 'relative', zIndex: 1 }}>

            {/* Header Info Section - Title & Ratings */}
            <div className="row" style={{ marginBottom: '48px' }}>
              <div className="col-12">
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: '300',
                  letterSpacing: '-0.5px',
                  color: '#0a0e27',
                  marginBottom: '32px',
                  marginTop: '24px',
                  lineHeight: '1.2',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                  {product.title}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px', flexWrap: 'wrap', marginBottom: '16px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ color: '#ffc107', fontSize: '14px' }}>
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`fa${i < Math.floor(product.rating || 4) ? 's' : 'r'} fa-star`} />
                      ))}
                    </div>
                    <strong style={{ color: '#0a0e27', marginLeft: '4px', fontWeight: '400' }}>{product.rating || '4.8'}</strong>
                    <span style={{ color: '#0f55dc', cursor: 'pointer', fontWeight: '400', letterSpacing: '0.2px' }}>({product.reviews || 85} Reviews)</span>
                    <span style={{ margin: '0 8px', color: 'rgba(15, 85, 220, 0.3)' }}>|</span>
                    <span style={{ color: '#0f55dc', fontWeight: '400', cursor: 'pointer', letterSpacing: '0.2px' }}>Answered Questions</span>
                  </div>

                </div>
              </div>
            </div>

            <div className="row" style={{ marginTop: '32px' }}>

              {/* LEFT COLUMN: Image Gallery (Larger Column 7 or 8) */}
              <div className="col-lg-8" style={{ paddingLeft: '15px', paddingRight: '15px' }}>
                <div style={{
                  position: 'relative',
                  marginBottom: '40px'
                }}>
                  {/* Main Image Container */}
                  <div className="main-image-container" style={{
                    position: 'relative',
                    width: '100%',
                    height: '520px',
                    marginBottom: '32px',
                    backgroundColor: '#fff',
                    borderRadius: '0',
                    border: '1px solid rgba(15, 85, 220, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                    onMouseMove={(e) => {
                      if (!isZoomed) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setZoomPosition({ x, y });
                    }}
                  >
                    {mainImage.startsWith('data:') || mainImage.startsWith('blob:') ? (
                      <img
                        src={mainImage}
                        alt={product.title}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          transform: isZoomed ? `scale(2)` : 'scale(1)',
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                          transition: isZoomed ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          cursor: 'zoom-in'
                        }}
                      />
                    ) : (
                      <Image
                        src={mainImage}
                        alt={product.title}
                        fill
                        style={{
                          objectFit: 'contain',
                          transform: isZoomed ? `scale(2)` : 'scale(1)',
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                          transition: isZoomed ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          cursor: 'zoom-in'
                        }}
                        unoptimized={mainImage.startsWith('http') && !mainImage.includes('supabase.co')}
                      />
                    )}

                    {/* Overlay Icons */}
                    <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 5 }}>
                      <button
                        onClick={() => setIsWishlisted(!isWishlisted)}
                        title="Save"
                        style={{
                          width: '45px', height: '45px', borderRadius: '50%', border: '1px solid #e0e6ef', background: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'all 0.2s'
                        }}>
                        <i className={`${isWishlisted ? 'fas' : 'far'} fa-heart`} style={{ color: isWishlisted ? '#c00' : '#0046be', fontSize: '18px' }}></i>
                      </button>
                      <button title="Share" style={{
                        width: '45px', height: '45px', borderRadius: '50%', border: '1px solid #e0e6ef', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }}>
                        <i className="fas fa-share-alt" style={{ color: '#0046be', fontSize: '18px' }}></i>
                      </button>
                    </div>
                  </div>

                  {/* Thumbnails Row */}
                  {product.images && product.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '16px 0', justifyContent: 'center', marginBottom: '32px' }}>
                      {product.images.map((img, idx) => {
                        // Safely extract image source
                        let imgSrc: string = '/images/placeholder.jpg';
                        if (typeof img === 'string') {
                          imgSrc = img;
                        } else if (img && typeof img === 'object') {
                          imgSrc = (img as any).src || 
                                   (img as any).default?.src || 
                                   (img as any).default || 
                                   '/images/placeholder.jpg';
                        }
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIndex(idx)}
                            style={{
                              width: '80px',
                              height: '80px',
                              border: selectedImageIndex === idx ? '2px solid #0f55dc' : '1px solid rgba(15, 85, 220, 0.15)',
                              borderRadius: '0',
                              position: 'relative',
                              cursor: 'pointer',
                              background: '#fff',
                              padding: '5px',
                              transition: 'all 0.25s',
                              overflow: 'hidden'
                            }}
                          >
                            {imgSrc.startsWith('data:') || imgSrc.startsWith('blob:') ? (
                              <img
                                src={imgSrc}
                                alt="thumbnail"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  padding: '5px'
                                }}
                              />
                            ) : (
                              <Image
                                src={imgSrc}
                                alt="thumbnail"
                                fill
                                style={{ objectFit: 'contain', padding: '5px' }}
                                unoptimized={imgSrc.startsWith('http') && !imgSrc.includes('supabase.co')}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Below The Fold - Tabs/Overview */}
                <div style={{ marginTop: '64px', paddingTop: '40px', borderTop: '1px solid rgba(15, 85, 220, 0.1)' }}>
                  {/* Tab Navigation */}
                  <div style={{ 
                    borderBottom: '1px solid rgba(15, 85, 220, 0.1)', 
                    marginBottom: '48px', 
                    display: 'flex', 
                    gap: '40px', 
                    flexWrap: 'wrap',
                    paddingBottom: '4px'
                  }}>
                    {['Overview', 'Reviews'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                          fontSize: '16px',
                          fontWeight: activeTab === tab ? '700' : '500',
                          paddingBottom: '12px',
                          marginBottom: '-2px',
                          color: activeTab === tab ? '#0046be' : '#555',
                          cursor: 'pointer',
                          background: 'none',
                          border: 'none',
                          borderBottom: activeTab === tab ? '3px solid #0046be' : '3px solid transparent',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                      >
                        {tab === 'Reviews' ? `${tab} (${product.reviews || 85})` : tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'Overview' && (
                    <div className="row">
                      <div className="col-lg-12">
                        {/* Highlights Section - Top Priority */}
                        {product.highlights && Object.keys(product.highlights).length > 0 && (
                          <div style={{
                            backgroundColor: '#fff',
                            border: '2px solid #e0e6ef',
                            borderRadius: '16px',
                            padding: '35px',
                            marginBottom: '40px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              marginBottom: '25px',
                              paddingBottom: '20px',
                              borderBottom: '2px solid #f0f2f4'
                            }}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #0046be 0%, #0066ff 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,70,190,0.2)'
                              }}>
                                <i className="fas fa-star" style={{ color: '#fff', fontSize: '20px' }}></i>
                              </div>
                              <h4 style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#040c13',
                                margin: 0
                              }}>Key Highlights</h4>
                            </div>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                              gap: '20px'
                            }}>
                              {Object.entries(product.highlights).map(([key, value]) => (
                                <div key={key} style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  padding: '20px',
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: '12px',
                                  border: '1px solid #e0e6ef',
                                  transition: 'all 0.3s ease',
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-4px)';
                                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,70,190,0.12)';
                                  e.currentTarget.style.borderColor = '#0046be';
                                  e.currentTarget.style.backgroundColor = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                  e.currentTarget.style.borderColor = '#e0e6ef';
                                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                                }}
                                >
                                  <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '4px',
                                    height: '100%',
                                    background: 'linear-gradient(180deg, #0046be 0%, #0066ff 100%)',
                                    opacity: 0,
                                    transition: 'opacity 0.3s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0';
                                  }}
                                  ></div>
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#6c757d',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '10px'
                                  }}>{key}</span>
                                  <strong style={{
                                    fontSize: '18px',
                                    color: '#040c13',
                                    fontWeight: '700',
                                    lineHeight: '1.4'
                                  }}>{value}</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Description Section */}
                        <div style={{
                          backgroundColor: '#fff',
                          border: '1px solid #e0e6ef',
                          borderRadius: '16px',
                          padding: '35px',
                          marginBottom: '40px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}>
                          <h4 style={{
                            fontSize: '26px',
                            fontWeight: '700',
                            marginBottom: '25px',
                            color: '#040c13',
                            paddingBottom: '20px',
                            borderBottom: '2px solid #f0f2f4',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <i className="fas fa-info-circle" style={{ color: '#0046be', fontSize: '24px' }}></i>
                            Description
                          </h4>
                          <div style={{
                            fontSize: '16px',
                            lineHeight: '1.8',
                            color: '#1d252c'
                          }}>
                            {product.longDescription ? (
                              <div dangerouslySetInnerHTML={{ __html: product.longDescription }} />
                            ) : (
                              <p style={{ margin: 0 }}>{product.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Features Section */}
                        {product.features && product.features.length > 0 && (
                          <div style={{
                            backgroundColor: '#fff',
                            border: '1px solid #e0e6ef',
                            borderRadius: '16px',
                            padding: '35px',
                            marginBottom: '40px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              marginBottom: '25px',
                              paddingBottom: '20px',
                              borderBottom: '2px solid #f0f2f4'
                            }}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(40,167,69,0.2)'
                              }}>
                                <i className="fas fa-check-circle" style={{ color: '#fff', fontSize: '20px' }}></i>
                              </div>
                              <h4 style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#040c13',
                                margin: 0
                              }}>Features</h4>
                            </div>
                            <ul style={{
                              padding: 0,
                              listStyle: 'none',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                              gap: '16px'
                            }}>
                              {product.features.map((f, i) => (
                                <li key={i} style={{
                                  display: 'flex',
                                  gap: '14px',
                                  alignItems: 'flex-start',
                                  padding: '16px',
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: '10px',
                                  border: '1px solid #e0e6ef',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#e9ecef';
                                  e.currentTarget.style.borderColor = '#28a745';
                                  e.currentTarget.style.transform = 'translateX(4px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                                  e.currentTarget.style.borderColor = '#e0e6ef';
                                  e.currentTarget.style.transform = 'translateX(0)';
                                }}
                                >
                                  <div style={{
                                    minWidth: '24px',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: '2px',
                                    boxShadow: '0 2px 6px rgba(40,167,69,0.3)'
                                  }}>
                                    <i className="fas fa-check" style={{
                                      color: '#fff',
                                      fontSize: '12px'
                                    }}></i>
                                  </div>
                                  <span style={{
                                    fontSize: '15px',
                                    color: '#1d252c',
                                    lineHeight: '1.6',
                                    fontWeight: '500'
                                  }}>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'Reviews' && (
                    <div className="row">
                      <div className="col-lg-12">
                        {productUUID ? (
                          <Reviews productId={productUUID} productSlug={product.slug} />
                        ) : (
                          <div style={{
                            backgroundColor: '#fff',
                            border: '1px solid rgba(15, 85, 220, 0.1)',
                            borderRadius: '0',
                            padding: '60px',
                            textAlign: 'center'
                          }}>
                            <p style={{ color: '#4a5568', fontSize: '14px', margin: 0 }}>
                              Loading reviews...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* RIGHT COLUMN: Buy Box (Sticky if possible) */}
              <div className="col-lg-4" style={{ paddingLeft: '15px', paddingRight: '15px' }}>
                <div style={{
                  border: '1px solid rgba(15, 85, 220, 0.1)',
                  borderRadius: '0',
                  padding: '42px 38px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(15, 85, 220, 0.08)',
                  position: 'sticky',
                  top: '120px',
                  transition: 'box-shadow 0.3s ease'
                }}>

                  {/* Price Info */}
                  <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid rgba(15, 85, 220, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <span style={{ fontSize: '42px', fontWeight: '300', color: '#0a0e27', letterSpacing: '-0.5px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                        ₹{product.price.toLocaleString()}
                      </span>
                    </div>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#9ca3af', letterSpacing: '0.2px' }}>
                          Was <span style={{ textDecoration: 'line-through' }}>₹{product.originalPrice.toLocaleString()}</span>
                        </span>
                        <span style={{ fontSize: '13px', color: '#0f55dc', fontWeight: '400', marginTop: '4px', letterSpacing: '0.3px' }}>
                          Save ₹{(product.originalPrice - product.price).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fulfillment */}
                  <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', gap: '18px', marginBottom: '24px', alignItems: 'flex-start', paddingBottom: '24px', borderBottom: '1px solid rgba(15, 85, 220, 0.08)' }}>
                      <div style={{ minWidth: '20px', textAlign: 'center' }}>
                        <i className="fas fa-store" style={{ fontSize: '16px', color: '#0f55dc' }}></i>
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: '400', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#4a5568' }}>Pickup</strong>
                        <span style={{ color: '#0f55dc', fontWeight: '400', fontSize: '13px', letterSpacing: '0.2px' }}>Order now for pickup tomorrow</span>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>at <a href="#" style={{ color: '#0f55dc', fontWeight: '400', textDecoration: 'none', letterSpacing: '0.2px' }}>Nearby Store</a></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: '20px', textAlign: 'center' }}>
                        <i className="fas fa-truck" style={{ fontSize: '16px', color: '#0f55dc' }}></i>
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: '400', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#4a5568' }}>Shipping</strong>
                        {userPincode ? (
                          <>
                            <span style={{ color: '#0a0e27', fontSize: '13px', letterSpacing: '0.2px' }}>Free Shipping to <span style={{ color: '#0f55dc', fontWeight: '400' }}>Pincode {userPincode}</span></span>
                            {deliveryDate && (
                              <div style={{ fontSize: '12px', color: '#4a5568', marginTop: '2px', letterSpacing: '0.1px' }}>Get it by <strong style={{ fontWeight: '400', color: '#0a0e27' }}>{deliveryDate}</strong></div>
                            )}
                          </>
                        ) : user ? (
                          <>
                            <span style={{ color: '#0a0e27', fontSize: '13px', letterSpacing: '0.2px' }}>Free Shipping</span>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                              <Link href="/account/addresses/add" style={{ color: '#0f55dc', textDecoration: 'none', letterSpacing: '0.2px' }}>
                                Add address to see delivery date
                              </Link>
                            </div>
                          </>
                        ) : (
                          <>
                            <span style={{ color: '#0a0e27', fontSize: '13px', letterSpacing: '0.2px' }}>Free Shipping</span>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                              <Link href="/auth" style={{ color: '#0f55dc', textDecoration: 'none', letterSpacing: '0.2px' }}>
                                Login to see delivery date
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Main Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '40px' }}>
                    <button
                      onClick={handleAddToCart}
                      className="hover-brightness"
                      style={{
                        width: '100%',
                        backgroundColor: '#0f55dc',
                        color: '#ffffff',
                        fontWeight: '400',
                        letterSpacing: '1.2px',
                        textTransform: 'uppercase',
                        border: 'none',
                        padding: '18px 24px',
                        borderRadius: '0',
                        fontSize: '13px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#0d47b8';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 85, 220, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#0f55dc';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <i className="fas fa-shopping-cart" style={{ fontSize: '14px' }}></i>
                      {addedToCart ? 'Added to Cart' : 'Add to Cart'}
                    </button>
                  </div>

                  {/* Secondary Actions */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', borderTop: '1px solid rgba(15, 85, 220, 0.1)', paddingTop: '32px', marginTop: '8px' }}>
                    <button style={{ background: 'none', border: 'none', color: '#0f55dc', fontWeight: '400', fontSize: '12px', letterSpacing: '0.3px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s', padding: '0' }}>
                      <i className="fas fa-retweet" style={{ fontSize: '13px' }}></i> Compare
                    </button>
                    <button style={{ background: 'none', border: 'none', color: '#0f55dc', fontWeight: '400', fontSize: '12px', letterSpacing: '0.3px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s', padding: '0' }}>
                      <i className="far fa-bookmark" style={{ fontSize: '13px' }}></i> Save
                    </button>
                  </div>

                  {/* Mini Specs / Highlights */}
                  {product.highlights && Object.keys(product.highlights).length > 0 && (
                    <div style={{ backgroundColor: '#f9f9fb', margin: '20px -24px -24px', padding: '20px', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', borderTop: '1px solid #e0e6ef' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Highlights</h4>
                      <ul style={{ padding: 0, listStyle: 'none', fontSize: '13px' }}>
                        {Object.entries(product.highlights).map(([key, value]) => (
                          <li key={key} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#555' }}>{key}</span>
                            <strong>{value}</strong>
                          </li>
                        ))}
                      </ul>
                      <a href="#" style={{ display: 'block', textAlign: 'center', color: '#0046be', fontSize: '13px', fontWeight: '600', marginTop: '15px' }}>See all specifications</a>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
              <div style={{ marginTop: '80px', paddingTop: '60px', borderTop: '1px solid rgba(15, 85, 220, 0.1)' }}>
                <div style={{ marginBottom: '40px' }}>
                  <h2 style={{
                    fontSize: '14px',
                    fontWeight: '300',
                    letterSpacing: '1.5px',
                    color: '#0a0e27',
                    marginBottom: '8px',
                    textTransform: 'uppercase'
                  }}>
                    Related Products
                  </h2>
                  <div style={{ width: '60px', height: '1px', background: '#0f55dc', marginTop: '12px' }}></div>
                </div>
                <div className="row" style={{ marginLeft: '-15px', marginRight: '-15px' }}>
                  {relatedProducts.map((relatedProduct) => (
                    <div key={relatedProduct.Id} className="col-lg-3 col-md-4 col-sm-6" style={{ paddingLeft: '15px', paddingRight: '15px', marginBottom: '30px' }}>
                      <ProductCard product={relatedProduct} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
        <Scrollbar />
      </div>
    </Fragment>
  );
};

export default ProductDetailPage;
