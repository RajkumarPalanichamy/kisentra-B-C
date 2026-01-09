'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Fade } from 'react-awesome-reveal';
import { Product } from '@/api/products';
import ProductCard from '../ProductCard/ProductCard';

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  products: Product[];
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ title, subtitle, products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1200) {
        setItemsPerView(4);
      } else if (window.innerWidth >= 992) {
        setItemsPerView(3);
      } else if (window.innerWidth >= 768) {
        setItemsPerView(2);
      } else {
        setItemsPerView(1);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + itemsPerView >= products.length ? 0 : prev + itemsPerView
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev - itemsPerView < 0 
        ? Math.max(0, products.length - itemsPerView) 
        : prev - itemsPerView
    );
  };

  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerView);
  const canNavigate = products.length > itemsPerView;

  return (
    <section className="service pt-100 pb-100">
      <div className="container">
        <div className="row mb-50">
          <div className="col-12">
            <div className="sec-title--two text-center">
              <Fade direction="down" triggerOnce duration={1000}>
                <h2 className="title mb-20">{title}</h2>
                {subtitle && <p className="content">{subtitle}</p>}
              </Fade>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div style={{ position: 'relative' }}>
              {/* Navigation Buttons */}
              {canNavigate && (
                <>
                  <button
                    onClick={prevSlide}
                    className="thm-btn thm-btn--border product-carousel-nav-btn"
                    style={{
                      position: 'absolute',
                      left: '-60px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e7e8ec'
                    }}
                    aria-label="Previous products"
                  >
                    <i className="far fa-angle-left"></i>
                  </button>
                  <button
                    onClick={nextSlide}
                    className="thm-btn thm-btn--border product-carousel-nav-btn"
                    style={{
                      position: 'absolute',
                      right: '-60px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e7e8ec'
                    }}
                    aria-label="Next products"
                  >
                    <i className="far fa-angle-right"></i>
                  </button>
                </>
              )}

              {/* Products Grid */}
              <div className="row mt-none-30">
                {visibleProducts.map((product) => (
                  <div key={product.Id} className="col-lg-3 col-md-6 mt-30">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* View All Link */}
              {products.length > itemsPerView && (
                <div className="row mt-40">
                  <div className="col-12 text-center">
                    <Link href="/products" className="thm-btn thm-btn--border">
                      View All Products
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;
