'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image, { StaticImageData } from 'next/image';
import { Fade } from 'react-awesome-reveal';
import { Product } from '@/api/products';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [imageSrc, setImageSrc] = useState<string | StaticImageData | null>(null);
  const [isStaticImage, setIsStaticImage] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Slideshow state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [processedImages, setProcessedImages] = useState<(string | StaticImageData)[]>([]);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Process all images for slideshow
  useEffect(() => {
    if (!product.images || product.images.length === 0) {
      setProcessedImages([]);
      setImageSrc(null);
      setIsStaticImage(false);
      setImgError(false);
      setCurrentImageIndex(0);
      return;
    }

    const processed: (string | StaticImageData)[] = [];
    
    product.images.forEach((img) => {
      if (typeof img === 'string') {
        const trimmed = img.trim();
        if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || 
            trimmed.startsWith('http://') || trimmed.startsWith('https://') || 
            trimmed.startsWith('//') || trimmed.startsWith('/')) {
          processed.push(trimmed);
        }
      } else if (img && typeof img === 'object') {
        if ((img as any).src && (img as any).width && (img as any).height) {
          processed.push(img as StaticImageData);
        } else {
          const extractedSrc = (img as any).src || (img as any).default?.src || (img as any).default;
          if (extractedSrc && typeof extractedSrc === 'string') {
            processed.push(extractedSrc);
          }
        }
      }
    });

    setProcessedImages(processed);
    setCurrentImageIndex(0);
    
    if (processed.length > 0) {
      const firstImage = processed[0];
      if (typeof firstImage === 'string') {
        setImageSrc(firstImage);
        setIsStaticImage(false);
      } else {
        setImageSrc(firstImage);
        setIsStaticImage(true);
      }
    } else {
      setImageSrc(null);
      setIsStaticImage(false);
    }
    
    setImgError(false);
  }, [product.images, product.title]);

  // Update current image when index changes
  useEffect(() => {
    if (processedImages.length > 0 && currentImageIndex < processedImages.length) {
      const currentImage = processedImages[currentImageIndex];
      if (typeof currentImage === 'string') {
        setImageSrc(currentImage);
        setIsStaticImage(false);
      } else {
        setImageSrc(currentImage);
        setIsStaticImage(true);
      }
    }
  }, [currentImageIndex, processedImages]);

  // Auto-play slideshow on hover (Titan style)
  useEffect(() => {
    // Clear any existing interval
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }

    if (processedImages.length > 1 && isHovered) {
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % processedImages.length);
      }, 2500); // Change image every 2.5 seconds (Titan style)
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
    };
  }, [isHovered, processedImages.length]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Manual navigation (Titan style - pauses auto-play)
  const pauseAutoPlay = () => {
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }
    // Resume after 4 seconds
    setTimeout(() => {
      if (isHovered && processedImages.length > 1 && !autoPlayIntervalRef.current) {
        autoPlayIntervalRef.current = setInterval(() => {
          setCurrentImageIndex((prev) => (prev + 1) % processedImages.length);
        }, 2500);
      }
    }, 4000);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (processedImages.length > 0) {
      pauseAutoPlay();
      setCurrentImageIndex((prev) => (prev + 1) % processedImages.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (processedImages.length > 0) {
      pauseAutoPlay();
      setCurrentImageIndex((prev) => (prev - 1 + processedImages.length) % processedImages.length);
    }
  };


  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Compute which image component to render
  const renderImage = () => {
    if (imgError || !imageSrc) {
      return (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#999',
          backgroundColor: '#eee'
        }}>
          <i className="fas fa-image" style={{ fontSize: '48px', marginBottom: '10px' }}></i>
          <span style={{ fontSize: '14px' }}>No Image</span>
        </div>
      );
    }

    // StaticImageData objects (from static imports as objects)
    if (isStaticImage) {
      return (
        <Image
          key={currentImageIndex}
          src={imageSrc as StaticImageData}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{
            objectFit: 'contain',
            transition: 'opacity 0.3s ease, transform 0.5s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
          onError={() => {
            console.error('Image load error for:', product.title);
            setImgError(true);
          }}
        />
      );
    }
    
    // String images - check type
    if (typeof imageSrc === 'string') {
      // Static media paths from Next.js - MUST use regular img
      if (imageSrc.startsWith('/_next/static/media/')) {
        return (
          <img
            key={currentImageIndex}
            src={imageSrc}
            alt={product.title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transition: 'opacity 0.3s ease, transform 0.5s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              backgroundColor: 'transparent'
            }}
            onError={(e) => {
              console.error('Image load error for:', product.title, 'Source:', imageSrc.substring(0, 100));
              setImgError(true);
            }}
          />
        );
      }
      
      // Base64 data URLs or blob URLs - use regular img
      if (imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')) {
        return (
          <img
            key={currentImageIndex}
            src={imageSrc}
            alt={product.title}
            loading="eager"
            className="product-card-base64-image"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transition: 'opacity 0.3s ease, transform 0.5s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              backgroundColor: 'transparent',
              display: 'block',
              zIndex: 1,
              opacity: 1,
              visibility: 'visible',
              maxWidth: '100%',
              maxHeight: '100%',
              pointerEvents: 'auto'
            } as React.CSSProperties}
            onError={(e) => {
              console.error('Image load error for:', product.title, 'Source type:', typeof imageSrc, 'Preview:', imageSrc.substring(0, 100));
              setImgError(true);
            }}
          />
        );
      }
      
      // Regular URLs - use Next.js Image
      return (
        <Image
          key={currentImageIndex}
          src={imageSrc}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{
            objectFit: 'contain',
            transition: 'opacity 0.3s ease, transform 0.5s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
          onError={() => {
            console.error('Image load error for:', product.title, imageSrc);
            setImgError(true);
          }}
          unoptimized={imageSrc.startsWith('http') && !imageSrc.includes('supabase.co')}
        />
      );
    }
    
    return null;
  };

  return (
    <Fade direction="up" triggerOnce duration={600}>
      <div
        className="product-card-wrapper"
        style={{ height: '100%' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="product-card"
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #f0f0f0',
            transition: 'all 0.3s ease',
            boxShadow: isHovered ? '0 12px 24px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          {/* Wishlist Icon */}
          <button
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10,
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#c2c2c2',
              transition: 'all 0.2s',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => { e.preventDefault(); /* Add wishlist logic later */ }}
          >
            <i className="fas fa-heart"></i>
          </button>

          {/* Product Image Slideshow - Titan Style */}
          <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none', display: 'block', position: 'relative' }}>
            <div 
              className="product-card-image" 
              style={{ 
                position: 'relative', 
                width: '100%', 
                aspectRatio: '1', 
                overflow: 'hidden', 
                backgroundColor: '#f0f0f0', 
                minHeight: '200px',
                cursor: 'pointer'
              }}
            >
              {renderImage()}

              {/* Titan Style Navigation Arrows - Left and Right Sides */}
              {processedImages.length > 1 && isHovered && (
                <>
                  <button
                    onClick={prevImage}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease',
                      padding: 0,
                      zIndex: 5
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                    }}
                    aria-label="Previous image"
                  >
                    <i className="fas fa-chevron-left" style={{ color: '#212121', fontSize: '12px' }}></i>
                  </button>
                  <button
                    onClick={nextImage}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease',
                      padding: 0,
                      zIndex: 5
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                    }}
                    aria-label="Next image"
                  >
                    <i className="fas fa-chevron-right" style={{ color: '#212121', fontSize: '12px' }}></i>
                  </button>
                </>
              )}

              {/* Discount Badge */}
              {discountPercentage > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: '#e53935', // Titan Red
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  zIndex: 3,
                  letterSpacing: '0.5px'
                }}>
                  {discountPercentage}% OFF
                </div>
              )}
            </div>
          </Link>

          {/* Product Details */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3
                className="product-title"
                style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#212121',
                  marginBottom: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.4',
                  height: '44px' // Fixed height for alignment
                }}
              >
                {product.title}
              </h3>
            </Link>

            {product.rating && (
              <div className="product-rating" style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                <span style={{
                  background: '#388e3c',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {product.rating} <i className="fas fa-star" style={{ fontSize: '10px' }}></i>
                </span>
                {product.reviews && <span style={{ color: '#878787', fontSize: '14px', fontWeight: '500' }}>({product.reviews})</span>}
                {/* Flipkart Assured-like badge for premium feel */}
                <Image src="/assets/img/icon/check.png" alt="" width={16} height={16} style={{ display: 'none' }} />
              </div>
            )}

            <div className="product-price" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#212121' }}>₹{product.price}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span style={{ fontSize: '14px', color: '#878787', textDecoration: 'line-through' }}>₹{product.originalPrice}</span>
                  <span style={{ fontSize: '13px', color: '#388e3c', fontWeight: '700' }}>
                    {discountPercentage}% off
                  </span>
                </>
              )}
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px 0',
                background: addedToCart ? '#388e3c' : isHovered ? '#2874f0' : '#fff', // Flipkart Blue on Hover
                color: addedToCart || isHovered ? '#fff' : '#2874f0',
                border: `1px solid ${addedToCart ? '#388e3c' : '#2874f0'}`,
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase'
              }}
            >
              {addedToCart ? (
                <>
                  <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
                  Added
                </>
              ) : (
                'Add to Cart'
              )}
            </button>
          </div>
        </div>
      </div>
    </Fade>
  );
};

export default ProductCard;



