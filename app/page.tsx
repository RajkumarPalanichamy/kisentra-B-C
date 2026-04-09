'use client';

import React, { Fragment, useState, useEffect } from 'react';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import Scrollbar from '../components/scrollbar/scrollbar';
import ProductCarousel from '../components/ProductCarousel/ProductCarousel';
import ProductCard from '../components/ProductCard/ProductCard';
import { getProducts, Product } from '@/api/products';
import { getCategories, Category } from '@/api/categories';
import { getBanners, Banner } from '@/api/banners';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';

const HomePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    setProducts(getProducts());
    getBanners().then((data) => {
      console.log('Homepage Banners Loaded:', data);
      setBanners(data);
    }).catch(err => console.error('Homepage Banner Fetch Error:', err));
  }, []);

  // Banner rotation
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Premium Scroll Reveal Animation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    const gridItems = document.querySelectorAll('.premium-grid-item');
    gridItems.forEach((item) => observer.observe(item));

    return () => {
      gridItems.forEach((item) => observer.unobserve(item));
    };
  }, [isMounted]);

  // Amazon-style product categorization
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    // 1. Optimistic UI: Load from local storage immediately
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminCategories');
      if (saved) {
        try {
          setCategories(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse cached categories', e);
        }
      }
    }

    // 2. Fetch fresh data in background
    setIsLoadingCategories(true);
    getCategories().then((data) => {
      setCategories(data);
      setIsLoadingCategories(false);
    });
  }, []);

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
        <main className="page_content" style={{ paddingTop: '160px' }}>

          {/* Category Bar - Flipkart Style */}
          {/* Category Bar - Flipkart Style */}
          <section style={{ marginBottom: '30px', marginTop: '20px', backgroundColor: '#fff', padding: '15px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '120px' }}>
            <div className="container">
              <div style={{
                display: 'flex',
                justifyContent: 'center', // Centered for cleaner look, or 'flex-start' if scrollable
                gap: '40px',
                overflowX: 'auto',
                paddingBottom: '10px'
              }}>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <Link
                      key={category.id || category.slug}
                      href={`/products?category=${encodeURIComponent(category.name)}`}
                      className="category-item"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textDecoration: 'none',
                        minWidth: '80px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        const title = e.currentTarget.querySelector('.cat-title') as HTMLElement;
                        if (title) title.style.color = 'var(--color-primary-two)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        const title = e.currentTarget.querySelector('.cat-title') as HTMLElement;
                        if (title) title.style.color = 'var(--color-heading)';
                      }}
                    >
                      <div style={{
                        width: '64px',
                        height: '64px',
                        marginBottom: '10px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f1f3f6'
                      }}>
                        {category.image_url ? (
                          <img src={category.image_url} alt={category.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          // Default icons based on name or generic
                          <span style={{ fontSize: '24px' }}>
                            {['📱', '👗', '👟', '🏠', '💄', '🧸', '🚲'][Math.abs(category.name.length) % 7]}
                          </span>
                        )}
                      </div>
                      <span className="cat-title" style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--color-heading)',
                        textAlign: 'center',
                        lineHeight: '1.2'
                      }}>
                        {category.name}
                      </span>
                    </Link>
                  ))
                ) : (
                  // Skeleton Loader
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: '#eee',
                        animation: 'pulse 1.5s infinite'
                      }} />
                      <div style={{
                        width: '50px',
                        height: '10px',
                        backgroundColor: '#eee',
                        borderRadius: '4px',
                        animation: 'pulse 1.5s infinite'
                      }} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Hero Banner - Dynamic Admin Controlled */}
          {banners.length > 0 && (
            <section style={{ marginBottom: '40px', padding: '10px' }}>
              <div className="container-fluid" style={{ maxWidth: '1600px', padding: 0 }}>
                <div style={{ position: 'relative', overflow: 'hidden', minHeight: '320px' }}>

                  {/* Banner Content (Single Image Mode) */}
                  <Link href={banners[currentBannerIndex].link || '/products'} style={{ display: 'block', width: '100%', height: '100%' }}>
                    <div style={{
                      width: '100%',
                      height: '320px',
                      position: 'relative',
                      backgroundColor: '#f5f5f5' // placeholder bg
                    }}>
                      <img
                        key={banners[currentBannerIndex].image_url}
                        src={banners[currentBannerIndex].image_url}
                        alt={banners[currentBannerIndex].title}
                        onError={(e) => e.currentTarget.src = 'https://placehold.co/1600x320/png?text=Banner+Image'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover', // Ensures image covers the area nicely
                          display: 'block'
                        }}
                      />
                      {/* Optional: Add minimal invisible overlay for clickability if needed, but wrapping Link handles it. */}
                    </div>
                  </Link>



                  {/* Dots indicator */}
                  <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
                    {banners.map((_, idx) => (
                      <div key={idx}
                        onClick={() => setCurrentBannerIndex(idx)}
                        style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', opacity: currentBannerIndex === idx ? 1 : 0.5, cursor: 'pointer' }}></div>
                    ))}
                  </div>

                </div>
              </div>
            </section>
          )}

          {/* Featured / Deals Section - Custom Design */}
          {todaysDeals.length > 0 && (
            <section style={{ marginBottom: '80px' }}>
              <div className="container">
                <div className="row mb-40 align-items-end">
                  <div className="col-lg-8">
                    <span style={{
                      color: 'var(--color-primary-two)',
                      fontWeight: '700',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      fontSize: '12px',
                      display: 'block',
                      marginBottom: '10px'
                    }}>Don't Miss Out</span>
                    <h2 className="title" style={{
                      fontSize: '36px',
                      marginBottom: 0,
                      position: 'relative',
                      display: 'inline-block'
                    }}>
                      Lightning Deals
                      <span style={{
                        position: 'absolute',
                        bottom: '5px',
                        right: '-15px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'var(--color-primary-two)',
                        borderRadius: '50%'
                      }}></span>
                    </h2>
                  </div>
                  <div className="col-lg-4 text-lg-end">
                    <Link href="/products" className="text-btn">
                      View All Collections <i className="far fa-long-arrow-right" />
                    </Link>
                  </div>
                </div>

                <div className="row">
                  {todaysDeals.slice(0, 4).map((product) => (
                    <div key={product.Id} className="col-lg-3 col-md-4 col-sm-6 mb-40">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Best Sellers Section */}
          {bestSellers.length > 0 && (
            <section style={{
              marginBottom: '80px',
              backgroundColor: 'var(--color-body)',
              padding: '80px 0',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
              <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                <div className="row mb-50 text-center">
                  <div className="col-12">
                    <h2 className="title" style={{ fontSize: '36px' }}>Curated Best Sellers</h2>
                    <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--color-primary-two)', margin: '20px auto' }}></div>
                  </div>
                </div>
                <div className="row">
                  {bestSellers.slice(0, 4).map((product) => (
                    <div key={product.Id} className="col-lg-3 col-md-4 col-sm-6 mb-30">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* New Arrivals Grid */}
          {newArrivals.length > 0 && (
            <section style={{ marginBottom: '80px' }}>
              <div className="container">
                <div className="row mb-50">
                  <div className="col-12">
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #eee',
                      paddingBottom: '20px'
                    }}>
                      <h2 className="title" style={{ fontSize: '32px', margin: 0 }}>Fresh Arrivals</h2>
                      <Link href="/products" style={{ fontWeight: '600', color: 'var(--color-primary-two)' }}>See All New Items</Link>
                    </div>
                  </div>
                </div>
                <div className="row">
                  {newArrivals.slice(0, 8).map((product) => (
                    <div key={product.Id} className="col-lg-3 col-md-4 col-sm-6 mb-40">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Benefits Section - Modern Grid */}
          <section className="service" style={{
            marginBottom: '80px',
            padding: '0 20px'
          }}>
            <div className="container">
              <div className="row g-4">
                {[
                  { icon: '🚚', title: 'Free Shipping', desc: 'Free delivery on orders above ₹499' },
                  { icon: '🛡️', title: 'Quality Guaranteed', desc: 'Premium BPA-free & food-grade materials' },
                  { icon: '🤝', title: 'Easy Returns', desc: '7-day return policy for your peace of mind' },
                  { icon: '✨', title: 'Eco-Friendly', desc: 'Sustainable products for a healthier lifestyle' }
                ].map((benefit, index) => (
                  <div key={index} className="col-xl-3 col-lg-6">
                    <Fade direction="up" triggerOnce duration={600} delay={index * 100}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '30px',
                          borderRadius: '20px',
                          backgroundColor: 'var(--color-white)',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
                          border: '1px solid rgba(0,0,0,0.02)',
                          transition: 'transform 0.3s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{
                          fontSize: '32px',
                          marginRight: '20px',
                          width: '60px',
                          height: '60px',
                          borderRadius: '15px',
                          backgroundColor: 'var(--color-body)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>{benefit.icon}</div>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '5px', color: 'var(--color-heading)' }}>{benefit.title}</h3>
                          <p style={{ color: 'var(--color-text)', fontSize: '14px', marginBottom: 0, lineHeight: 1.4 }}>{benefit.desc}</p>
                        </div>
                      </div>
                    </Fade>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Newsletter Section - Uniquely Shaped */}
          <section className="newsletter-section" style={{
            padding: '100px 0',
            backgroundColor: '#111',
            borderRadius: '40px 40px 0 0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Abstract Background Shapes */}
            <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, var(--color-primary-two) 0%, transparent 60%)', opacity: 0.1, filter: 'blur(80px)' }}></div>
            <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, var(--color-secondary) 0%, transparent 60%)', opacity: 0.1, filter: 'blur(60px)' }}></div>

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
              <div className="row justify-content-center">
                <div className="col-lg-8 text-center">
                  <span style={{ color: 'var(--color-primary-two)', fontWeight: 'bold', letterSpacing: '2px', fontSize: '12px', textTransform: 'uppercase' }}>Join Our Newsletter</span>
                  <h2 style={{ color: '#fff', fontSize: '48px', fontWeight: '800', marginTop: '20px', marginBottom: '20px' }}>Stay Hydrated & Healthy</h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '50px', fontSize: '18px' }}>Get exclusive deals on premium water bottles and tiffin boxes. Be the first to know about new arrivals and special offers.</p>

                  <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
                    <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.1)', padding: '5px', borderRadius: '50px' }}>
                      <input
                        type="email"
                        placeholder="Your email address"
                        style={{
                          flex: 1,
                          padding: '20px 30px',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: '#fff',
                          fontSize: '16px'
                        }}
                      />
                      <button type="submit" style={{
                        backgroundColor: 'var(--color-primary-two)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0 40px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }} className="hover-brightness">
                        Join
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>
        <Footer />
      </div>
      <Scrollbar />
    </Fragment>
  );
};

export default HomePage;