'use client';

import React, { Fragment, useState, useEffect } from 'react';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import Scrollbar from '../components/scrollbar/scrollbar';
import ProductCarousel from '../components/ProductCarousel/ProductCarousel';
import ProductCard from '../components/ProductCard/ProductCard';
import { getProducts, Product } from '@/api/products';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';

const HomePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    setProducts(getProducts());
  }, []);

  // Banner rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Amazon-style product categorization
  const categories = isMounted
    ? Array.from(new Set(products.map(p => p.category))).slice(0, 12)
    : [];

  const todaysDeals = isMounted
    ? products.filter(p => p.visible !== false && p.originalPrice && (p.originalPrice - p.price) > 0)
      .sort((a, b) => {
        const discountA = ((a.originalPrice! - a.price) / a.originalPrice!) * 100;
        const discountB = ((b.originalPrice! - b.price) / b.originalPrice!) * 100;
        return discountB - discountA;
      })
      .slice(0, 8)
    : [];

  const bestSellers = isMounted
    ? products.filter(p => p.visible !== false && p.reviews && p.reviews > 100)
      .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
      .slice(0, 8)
    : [];

  const newArrivals = isMounted
    ? products.filter(p => p.visible !== false).slice(0, 8)
    : [];

  const topRated = isMounted
    ? products.filter(p => p.visible !== false && p.rating && p.rating >= 4.5)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8)
    : [];

  const recommendedForYou = isMounted
    ? products.filter(p => p.visible !== false).slice(0, 8)
    : [];

  const customerFavorites = isMounted
    ? products.filter(p => p.visible !== false && p.rating && p.rating >= 4.7)
      .slice(0, 8)
    : [];

  return (
    <Fragment>
      <div className='body_wrap sco_agency'>
        <Header />
        <main className="page_content">
          {/* Hero Banner Carousel - Amazon Style */}
          <section style={{ backgroundColor: 'var(--color-primary-five)', position: 'relative', overflow: 'hidden' }}>
            <div className="container-fluid" style={{ padding: 0 }}>
              <div style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: currentBannerIndex === index ? 1 : 0,
                      transition: 'opacity 1s ease-in-out',
                      background: `linear-gradient(135deg, var(--color-primary-two) 0%, var(--color-primary-five) 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-white)',
                      padding: '60px 20px'
                    }}
                  >
                    <div className="container">
                      <div className="row align-items-center">
                        <div className="col-lg-6">
                          <Fade direction="left" triggerOnce={false}>
                            <h1 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '20px', color: 'var(--color-white)' }}>
                              {index === 0 && 'Special Deals This Week!'}
                              {index === 1 && 'Best Products at Best Prices'}
                              {index === 2 && 'Shop Now & Save Big'}
                            </h1>
                            <p style={{ fontSize: '20px', marginBottom: '30px', color: 'var(--color-white)', opacity: 0.9 }}>
                              {index === 0 && 'Get up to 50% off on selected items'}
                              {index === 1 && 'Premium quality products for your business'}
                              {index === 2 && 'Limited time offers - Don\'t miss out!'}
                            </p>
                            <Link href="/products" className="thm-btn thm-btn--aso thm-btn--aso_yellow" style={{ fontSize: '18px', padding: '15px 40px' }}>
                              Shop Now
                            </Link>
                          </Fade>
                        </div>
                        <div className="col-lg-6">
                          <Fade direction="right" triggerOnce={false}>
                            <div style={{ textAlign: 'center', fontSize: '120px', opacity: 0.2 }}>
                              🛒
                            </div>
                          </Fade>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Banner Navigation Dots */}
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '10px',
                  zIndex: 10
                }}>
                  {[0, 1, 2].map((index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBannerIndex(index)}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: currentBannerIndex === index ? 'var(--color-white)' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Category Grid - Amazon Style */}
          {categories.length > 0 && (
            <section className="service pt-80 pb-80" style={{ backgroundColor: 'var(--color-white)' }}>
              <div className="container">
                <div className="row">
                  <div className="col-12 mb-40">
                    <h2 className="title text-center" style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-heading)' }}>
                      Shop by Category
                    </h2>
                  </div>
                </div>
                <div className="row">
                  {categories.map((category, index) => (
                    <div key={category} className="col-lg-2 col-md-3 col-sm-4 col-6 mb-30">
                      <Fade direction="up" triggerOnce duration={600} delay={index * 100}>
                        <Link
                          href={`/products?category=${encodeURIComponent(category)}`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '30px 20px',
                            backgroundColor: 'var(--color-body)',
                            borderRadius: '15px',
                            textDecoration: 'none',
                            color: 'var(--color-heading)',
                            transition: 'all 0.3s ease',
                            border: '2px solid transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-white)';
                            e.currentTarget.style.borderColor = 'var(--color-primary-two)';
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-body)';
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary-two)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '15px',
                            fontSize: '24px',
                            color: 'var(--color-white)'
                          }}>
                            <i className="fas fa-box"></i>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
                            {category}
                          </span>
                        </Link>
                      </Fade>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Today's Deals - Amazon Style */}
          {todaysDeals.length > 0 && (
            <section className="service pt-100 pb-100" style={{ backgroundColor: 'var(--color-body)' }}>
              <div className="container">
                <div className="row mb-50">
                  <div className="col-12">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                      <div>
                        <h2 className="title" style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px', color: 'var(--color-heading)' }}>
                          <span style={{ color: 'var(--color-primary)' }}>🔥</span> Today's Deals
                        </h2>
                        <p className="content" style={{ fontSize: '16px', color: 'var(--color-default)' }}>
                          Limited time offers - Don't miss out!
                        </p>
                      </div>
                      <Link href="/products" className="thm-btn thm-btn--border" style={{ whiteSpace: 'nowrap' }}>
                        View All Deals
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="row mt-none-30">
                  {todaysDeals.map((product) => (
                    <div key={product.Id} className="col-lg-3 col-md-4 col-sm-6 mt-30">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Best Sellers */}
          {bestSellers.length > 0 && (
            <ProductCarousel
              title="Best Sellers"
              subtitle="Most popular products loved by customers"
              products={bestSellers}
            />
          )}

          {/* New Arrivals */}
          {newArrivals.length > 0 && (
            <section className="service pt-100 pb-100" style={{ backgroundColor: 'var(--color-white)' }}>
              <div className="container">
                <div className="row mb-50">
                  <div className="col-12">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                      <div>
                        <h2 className="title" style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px', color: 'var(--color-heading)' }}>
                          ✨ New Arrivals
                        </h2>
                        <p className="content" style={{ fontSize: '16px', color: 'var(--color-default)' }}>
                          Fresh products just added to our collection
                        </p>
                      </div>
                      <Link href="/products" className="thm-btn thm-btn--border" style={{ whiteSpace: 'nowrap' }}>
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="row mt-none-30">
                  {newArrivals.map((product) => (
                    <div key={product.Id} className="col-lg-3 col-md-4 col-sm-6 mt-30">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Top Rated Products */}
          {topRated.length > 0 && (
            <ProductCarousel
              title="Top Rated Products"
              subtitle="Highest rated products with excellent reviews"
              products={topRated}
            />
          )}

          {/* Customer Favorites */}
          {customerFavorites.length > 0 && (
            <section className="service pt-100 pb-100" style={{ backgroundColor: 'var(--color-body)' }}>
              <div className="container">
                <div className="row mb-50">
                  <div className="col-12">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                      <div>
                        <h2 className="title" style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px', color: 'var(--color-heading)' }}>
                          <span style={{ color: 'var(--color-yellow)' }}>⭐</span> Customer Favorites
                        </h2>
                        <p className="content" style={{ fontSize: '16px', color: 'var(--color-default)' }}>
                          Products our customers love the most
                        </p>
                      </div>
                      <Link href="/products" className="thm-btn thm-btn--border" style={{ whiteSpace: 'nowrap' }}>
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="row mt-none-30">
                  {customerFavorites.map((product) => (
                    <div key={product.Id} className="col-lg-3 col-md-4 col-sm-6 mt-30">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recommended For You */}
          {recommendedForYou.length > 0 && (
            <ProductCarousel
              title="Recommended For You"
              subtitle="Based on your browsing history"
              products={recommendedForYou}
            />
          )}

          {/* Benefits Section - Amazon Prime Style */}
          <section className="service pt-80 pb-80" style={{ backgroundColor: 'var(--color-primary-five)', color: 'var(--color-white)' }}>
            <div className="container">
              <div className="row">
                <div className="col-12 mb-50">
                  <h2 className="title text-center" style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-white)', marginBottom: '10px' }}>
                    Why Shop With Us?
                  </h2>
                  <p className="content text-center" style={{ fontSize: '18px', color: 'var(--color-white)', opacity: 0.8 }}>
                    Premium benefits for all our customers
                  </p>
                </div>
              </div>
              <div className="row">
                {[
                  { icon: '🚚', title: 'Free Shipping', desc: 'On orders over $100' },
                  { icon: '🔒', title: 'Secure Payment', desc: '100% secure transactions' },
                  { icon: '↩️', title: 'Easy Returns', desc: '30-day return policy' },
                  { icon: '💬', title: '24/7 Support', desc: 'Always here to help' },
                  { icon: '⭐', title: 'Quality Guaranteed', desc: 'Premium products only' },
                  { icon: '🎁', title: 'Special Offers', desc: 'Exclusive deals daily' }
                ].map((benefit, index) => (
                  <div key={index} className="col-lg-2 col-md-4 col-sm-6 mb-30">
                    <Fade direction="up" triggerOnce duration={600} delay={index * 100}>
                      <div style={{
                        textAlign: 'center',
                        padding: '30px 20px',
                        borderRadius: '15px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.transform = 'translateY(-5px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      >
                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>{benefit.icon}</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: 'var(--color-white)' }}>
                          {benefit.title}
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--color-white)', opacity: 0.7 }}>
                          {benefit.desc}
                        </p>
                      </div>
                    </Fade>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Newsletter Section */}
          <section className="service pt-80 pb-80" style={{ backgroundColor: 'var(--color-body)' }}>
            <div className="container">
              <div className="row">
                <div className="col-lg-8 offset-lg-2">
                  <Fade direction="up" triggerOnce duration={1000}>
                    <div style={{
                      textAlign: 'center',
                      padding: '60px 40px',
                      backgroundColor: 'var(--color-white)',
                      borderRadius: '15px',
                      border: '1px solid #e7e8ec'
                    }}>
                      <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '15px', color: 'var(--color-heading)' }}>
                        Stay Updated
                      </h2>
                      <p style={{ fontSize: '16px', color: 'var(--color-default)', marginBottom: '30px' }}>
                        Subscribe to our newsletter and get exclusive deals and updates
                      </p>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          // Handle newsletter subscription
                        }}
                        style={{ display: 'flex', gap: '10px', maxWidth: '500px', margin: '0 auto', flexWrap: 'wrap' }}
                      >
                        <input
                          type="email"
                          placeholder="Enter your email"
                          required
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '15px 20px',
                            borderRadius: '7px',
                            border: '1px solid #e7e8ec',
                            fontSize: '16px',
                            fontFamily: 'var(--font-body)',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'var(--color-primary-two)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(15, 83, 220, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e7e8ec';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <button type="submit" className="thm-btn thm-btn--aso thm-btn--aso_yellow" style={{ whiteSpace: 'nowrap' }}>
                          Subscribe
                        </button>
                      </form>
                    </div>
                  </Fade>
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
};

export default HomePage;