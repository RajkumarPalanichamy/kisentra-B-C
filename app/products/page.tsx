'use client';

import React, { useState, Fragment, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import { getProducts, getProductsFromSupabaseAsync, Product } from '@/api/products';
import { getCategories, Category } from '@/api/categories';
import ProductCard from '@/components/ProductCard/ProductCard';
import { Fade } from 'react-awesome-reveal';

const ProductsContent: React.FC = () => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get('search') || '';
  const categoryParam = searchParams?.get('category') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'All');
  const [sortBy, setSortBy] = useState<string>('default');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Sync selectedCategory with URL param
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('All');
    }
  }, [categoryParam]);

  // Load products only on client side to avoid hydration mismatch
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

    // Fetch official categories
    getCategories().then(cats => setCategoriesList(cats));

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

  const categories = ['All', ...categoriesList.map(c => c.name)];

  const maxPrice = isMounted
    ? Math.max(...products.map(p => p.price), 0) || 5000
    : 5000;

  // Update price range when products load
  useEffect(() => {
    if (isMounted && maxPrice > 0) {
      setPriceRange([0, maxPrice]);
    }
  }, [isMounted, maxPrice]);

  // Enhanced filtering logic - client-side only
  const filteredProducts = isMounted
    ? products.filter((product) => {
      // Visibility
      if (product.visible === false) return false;

      // Category filter
      if (selectedCategory !== 'All' && product.category !== selectedCategory) return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !product.title.toLowerCase().includes(query) &&
          !product.description.toLowerCase().includes(query) &&
          !product.category.toLowerCase().includes(query)
        ) return false;
      }

      // Price range
      if (product.price < priceRange[0] || product.price > priceRange[1]) return false;

      // Rating filter
      if (minRating > 0 && (!product.rating || product.rating < minRating)) return false;

      return true;
    })
    : [];

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'name':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSelectedCategory('All');
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setSortBy('default');
  };

  return (
    <Fragment>
      <div className='body_wrap sco_agency'>
        <Header />
        <main className="page_content">
          <section className="service pt-140 pb-140">
            <div className="container">
              {/* Page Header */}
              <div className="row mb-60">
                <div className="col-12">
                  <Fade direction="up" triggerOnce duration={1000}>
                    <h1 className="title text-center mb-30">
                      {searchQuery ? `Search Results for "${searchQuery}"` : 'Our Products'}
                    </h1>
                    <p className="content text-center">
                      {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                    </p>
                  </Fade>
                </div>
              </div>

              <div className="row">
                {/* Left Sidebar Filters - Flipkart Style */}
                <div className="col-lg-3 col-md-4">
                  <Fade direction="left" triggerOnce duration={1000}>
                    <div className="product-filters" style={{
                      padding: '30px',
                      backgroundColor: '#fff',
                      borderRadius: '15px',
                      border: '1px solid #e7e8ec',
                      position: 'sticky',
                      top: '100px',
                      maxHeight: 'calc(100vh - 120px)',
                      overflowY: 'auto'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Filters</h3>
                        <button
                          onClick={clearFilters}
                          style={{
                            padding: '5px 15px',
                            border: '1px solid #e7e8ec',
                            backgroundColor: 'transparent',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: 'var(--color-default)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f6f6f8';
                            e.currentTarget.style.borderColor = 'var(--color-primary-two)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = '#e7e8ec';
                          }}
                        >
                          Clear All
                        </button>
                      </div>

                      {/* Category Filter */}
                      <div className="filter-section mb-30">
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Category</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {categories.map((category) => (
                            <label
                              key={category}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '7px',
                                transition: 'background-color 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f6f6f8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <input
                                type="radio"
                                name="category"
                                value={category}
                                checked={selectedCategory === category}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '14px' }}>{category}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Price Range Filter */}
                      <div className="filter-section mb-30">
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Price Range</h4>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                          <input
                            type="number"
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                            style={{
                              width: '100px',
                              padding: '8px 12px',
                              borderRadius: '7px',
                              border: '1px solid #e7e8ec',
                              fontSize: '14px',
                              fontFamily: 'var(--font-body)'
                            }}
                            min="0"
                          />
                          <span>-</span>
                          <input
                            type="number"
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                            style={{
                              width: '100px',
                              padding: '8px 12px',
                              borderRadius: '7px',
                              border: '1px solid #e7e8ec',
                              fontSize: '14px',
                              fontFamily: 'var(--font-body)'
                            }}
                            min={priceRange[0]}
                            max={maxPrice}
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={maxPrice}
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          style={{ width: '100%', cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-default)', marginTop: '5px' }}>
                          <span>₹{priceRange[0]}</span>
                          <span>₹{priceRange[1]}</span>
                        </div>
                      </div>

                      {/* Rating Filter */}
                      <div className="filter-section mb-30">
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Minimum Rating</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {[4, 3, 2, 1].map((rating) => (
                            <label
                              key={rating}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '7px',
                                transition: 'background-color 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f6f6f8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <input
                                type="radio"
                                name="rating"
                                value={rating}
                                checked={minRating === rating}
                                onChange={() => setMinRating(rating)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', gap: '3px' }}>
                                {[...Array(5)].map((_, i) => (
                                  <i
                                    key={i}
                                    className={`fas fa-star`}
                                    style={{ color: i < rating ? '#ffd600' : '#ccc', fontSize: '12px' }}
                                  ></i>
                                ))}
                              </div>
                              <span style={{ fontSize: '14px' }}>& Up</span>
                            </label>
                          ))}
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '7px',
                              transition: 'background-color 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f6f6f8';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <input
                              type="radio"
                              name="rating"
                              value="0"
                              checked={minRating === 0}
                              onChange={() => setMinRating(0)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px' }}>All Ratings</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </Fade>
                </div>

                {/* Products Grid */}
                <div className="col-lg-9 col-md-8">
                  {/* Sort Bar */}
                  <div className="row mb-30">
                    <div className="col-12">
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '15px 20px',
                        backgroundColor: '#fff',
                        borderRadius: '7px',
                        border: '1px solid #e7e8ec'
                      }}>
                        <span style={{ fontSize: '14px', color: 'var(--color-default)' }}>
                          Showing {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <label style={{ fontSize: '14px', fontWeight: '600' }}>Sort by:</label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                              padding: '10px 20px',
                              borderRadius: '7px',
                              border: '1px solid #e7e8ec',
                              fontSize: '14px',
                              fontFamily: 'var(--font-body)',
                              cursor: 'pointer',
                              backgroundColor: '#fff',
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
                          >
                            <option value="default">Default</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                            <option value="name">Name (A-Z)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="row mt-none-30">
                    {sortedProducts.length > 0 ? (
                      sortedProducts.map((product) => (
                        <div key={product.Id} className="col-lg-4 col-md-6 mt-30">
                          <ProductCard product={product} />
                        </div>
                      ))
                    ) : (
                      <div className="col-12 text-center" style={{ padding: '80px 20px' }}>
                        <p className="content" style={{ fontSize: '18px', marginBottom: '20px' }}>No products found matching your filters.</p>
                        <button
                          onClick={clearFilters}
                          className="thm-btn thm-btn--border"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>
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

const ProductsPage = () => {
  return (
    <Suspense fallback={<div className="container pt-140 pb-140 text-center">Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  );
};

export default ProductsPage;



