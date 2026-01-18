'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

import MobileMenu from '../MobileMenu/MobileMenu';
import MegaMenu1 from './MegaMenu1';
import MegaMenu2 from './MegaMenu2';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';
import LoginModal from '@/components/auth/LoginModal';

const Header: React.FC = () => {
  const router = useRouter();
  const [mobailActive, setMobailState] = useState(false);
  const [isSticky, setSticky] = useState(false);
  const { user, isLoading, signOut } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { getTotalItems } = useCart();

  useEffect(() => {
    // Automatically show login modal if user is not logged in AND hasn't seen it yet
    // Only run this once when loading finishes and we know user is not logged in
    if (!isLoading && !user) {
      const hasSeenModal = sessionStorage.getItem('hasSeenLoginModal');
      if (!hasSeenModal) {
        // Small delay to ensure smooth entry
        setTimeout(() => {
          setShowLoginModal(true);
          sessionStorage.setItem('hasSeenLoginModal', 'true');
        }, 1000);
      }
    }
  }, [isLoading, user]);

  const handleLogout = async () => {
    await signOut();
    // Redirect is handled in signOut but we can ensure menu closes
    setShowUserMenu(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setSticky(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-wrapper')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const SubmitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nav-link {
          position: relative;
          transition: all 0.3s ease;
        }
        .nav-link:hover {
          color: var(--color-primary-two) !important;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: var(--color-primary-two);
          transition: width 0.3s ease;
        }
        .nav-link:hover::after {
          width: 100%;
        }
        /* Ensure main menu is visible on desktop */
        @media (min-width: 992px) {
          .main-menu__wrap .navbar-collapse {
            display: flex !important;
            visibility: visible !important;
          }
        }
        /* Hide main menu on mobile, show hamburger instead */
        @media (max-width: 991px) {
          .main-menu__wrap .navbar-collapse {
            display: none !important;
          }
        }
      `}</style>
      <div id="xb-header-area" className="header-area header-style-two header-transparent">
        {/* Top bar */}
        <div className="header-top">
          <span>
            🎉 Free Shipping on Orders Above ₹499! Premium Water Bottles & Tiffin Boxes for Your Daily Needs
          </span>
          <span>
            <Link href="/products">Shop Now</Link>
            <i className="far fa-angle-right" />
          </span>
          <div className="header-shape">
            <div className="shape shape--one">
              <Image src="/images/shape/trangle-shape.png" alt="Shape 1" width={50} height={50} />
            </div>
            <div className="shape shape--two">
              <Image src="/images/shape/trangle-shape.png" alt="Shape 2" width={50} height={50} />
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className={`xb-header stricky ${isSticky ? 'stricked-menu stricky-fixed' : ''}`}>
          <div className="container">
            <div className="header__wrap ul_li_between">
              {/* Logo */}
              <div className="header-logo">
                <Link href="/">
                  <Image src="/images/logo/logo-black.svg" alt="Texpo Logo" width={150} height={50} />
                </Link>
              </div>

              {/* Main Menu */}
              <div className="main-menu__wrap ul_li navbar navbar-expand-lg">
                <nav className="main-menu collapse navbar-collapse show">
                  <ul>
                    <li>
                      <Link href="/" className="nav-link">
                        <span>Home</span>
                      </Link>
                    </li>

                    <li className="menu-item-has-children">
                      <Link href="/products" className="nav-link">
                        <span>Shop</span>
                      </Link>
                      <ul className="submenu">
                        <li><Link href="/products"><span>All Products</span></Link></li>
                        <li><Link href="/cart"><span>Shopping Cart</span></Link></li>
                      </ul>
                    </li>

                    <li>
                      <Link href="/contact" className="nav-link">
                        <span>Contact</span>
                      </Link>
                    </li>
                  </ul>
                </nav>

                {/* Mobile Menu Wrapper */}
                <div className="xb-header-wrap">
                  <div className={`xb-header-menu ${mobailActive ? 'active' : ''}`}>
                    <div className="xb-header-menu-scroll lenis lenis-smooth">
                      <div className="xb-menu-close xb-hide-xl xb-close" onClick={() => setMobailState(!mobailActive)} />
                      <div className="xb-logo-mobile xb-hide-xl">
                        <Link href="/" rel="home">
                          <Image src="/images/logo/logo-black.svg" alt="Mobile Logo" width={150} height={50} />
                        </Link>
                      </div>
                      <div className="xb-header-mobile-search xb-hide-xl">
                        <form role="search" onSubmit={SubmitHandler}>
                          <input type="text" placeholder="Search..." name="s" className="search-field" />
                          <button className="search-submit" type="submit">
                            <i className="far fa-search" />
                          </button>
                        </form>
                      </div>
                      <nav className="xb-header-nav">
                        <MobileMenu />
                      </nav>
                    </div>
                  </div>
                  <div className="xb-header-menu-backdrop"></div>
                </div>
              </div>

              {/* Mobile toggle button & Cart */}
              <div className="header-bar-mobile side-menu d-md-none ul_li" style={{ gap: '15px', alignItems: 'center' }}>
                <Link
                  href="/cart"
                  className="cart-icon"
                  style={{
                    position: 'relative',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    color: 'var(--color-heading)',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    width: '40px',
                    height: '40px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f6f6f8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <i className="fas fa-shopping-cart" style={{ fontSize: '20px' }}></i>
                  {getTotalItems() > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      left: 'auto',
                      backgroundColor: 'var(--color-primary-two)',
                      color: '#fff',
                      borderRadius: '50%',
                      minWidth: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '0 4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      lineHeight: '1',
                      zIndex: 10,
                      transform: 'translate(30%, -30%)'
                    }}>
                      {getTotalItems()}
                    </span>
                  )}
                </Link>
                <button
                  className="xb-nav-mobile"
                  onClick={() => setMobailState(!mobailActive)}
                  style={{
                    padding: '10px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--color-heading)',
                    transition: 'all 0.3s ease',
                    borderRadius: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f6f6f8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <i className="far fa-bars" />
                </button>
              </div>

              {/* Cart & Auth & CTA */}
              <div className="header-contact d-none d-md-flex ul_li" style={{ gap: '12px', alignItems: 'center' }}>
                {/* Cart Icon */}
                <Link
                  href="/cart"
                  className="cart-icon"
                  style={{
                    position: 'relative',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    color: 'var(--color-heading)',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f6f6f8';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <i className="fas fa-shopping-cart" style={{ fontSize: '20px' }}></i>
                  {getTotalItems() > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      backgroundColor: 'var(--color-primary-two)',
                      color: '#fff',
                      borderRadius: '50%',
                      minWidth: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '0 5px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      animation: getTotalItems() > 0 ? 'pulse 2s infinite' : 'none'
                    }}>
                      {getTotalItems()}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                {isLoading ? (
                  <div style={{
                    width: '100px',
                    height: '40px',
                    backgroundColor: '#f6f6f8',
                    borderRadius: '8px',
                    animation: 'pulse 1.5s infinite'
                  }}></div>
                ) : user ? (
                  <div className="user-menu-wrapper" style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        border: '1px solid #e7e8ec',
                        backgroundColor: 'transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: 'var(--color-heading)',
                        transition: 'all 0.3s ease',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary-two)';
                        e.currentTarget.style.backgroundColor = '#f6f6f8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e7e8ec';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-two)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.email?.split('@')[0]}</span>
                      <i className={`far fa-angle-${showUserMenu ? 'up' : 'down'}`} style={{ fontSize: '12px' }}></i>
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        marginTop: '8px',
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid #e7e8ec',
                        minWidth: '200px',
                        zIndex: 1000,
                        overflow: 'hidden',
                        animation: 'fadeIn 0.2s ease'
                      }}>
                        <div style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #e7e8ec',
                          backgroundColor: '#f6f6f8'
                        }}>
                          <div style={{ fontSize: '12px', color: 'var(--color-default)', marginBottom: '4px' }}>
                            Signed in as
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-heading)' }}>
                            {user.email}
                          </div>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setShowUserMenu(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            textDecoration: 'none',
                            color: 'var(--color-heading)',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            borderBottom: '1px solid #eee'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f6f6f8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <i className="fas fa-user-circle" style={{ width: '16px' }}></i>
                          <span>My Profile</span>
                        </Link>
                        <Link
                          href="/cart"
                          onClick={() => setShowUserMenu(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            textDecoration: 'none',
                            color: 'var(--color-heading)',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f6f6f8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <i className="fas fa-shopping-cart" style={{ width: '16px' }}></i>
                          <span>My Cart ({getTotalItems()} items)</span>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: '#dc3545',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fee';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <i className="fas fa-sign-out-alt" style={{ width: '16px' }}></i>
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    style={{
                      padding: '10px 20px',
                      border: '1px solid var(--color-primary-two)',
                      backgroundColor: 'transparent',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'var(--color-primary-two)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-two)';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(54, 147, 217, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-primary-two)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <i className="far fa-user" style={{ fontSize: '14px' }}></i>
                    Login
                  </Link>
                )}

                <Link
                  href="/contact"
                  className="thm-btn thm-btn--aso thm-btn--header-black"
                  style={{
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Let's talk
                  <Image src="/images/icon/sms-white-icon01.svg" alt="Message Icon" width={20} height={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};

export default Header;
