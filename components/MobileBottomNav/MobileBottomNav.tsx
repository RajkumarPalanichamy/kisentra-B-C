'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';

const MobileBottomNav: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { getTotalItems } = useCart();
  const { user } = useUser();
  const cartItemsCount = getTotalItems();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 767;
      setIsMobile(mobile);
      // Add padding to body to prevent content from being hidden behind bottom nav
      if (mobile && !pathname?.startsWith('/admin')) {
        document.body.style.paddingBottom = '64px';
      } else {
        document.body.style.paddingBottom = '';
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.body.style.paddingBottom = '';
    };
  }, [pathname]);

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  if (!isMobile) {
    return null;
  }

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
        </svg>
      ),
    },
    {
      href: '/products',
      label: 'Shop',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" fill="currentColor"/>
        </svg>
      ),
    },
    {
      href: '/cart',
      label: 'Cart',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.15.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/>
        </svg>
      ),
      badge: cartItemsCount > 0 ? cartItemsCount : null,
    },
    {
      href: user ? '/profile' : '/auth',
      label: user ? 'Profile' : 'Login',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
        </svg>
      ),
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '6px 0 calc(6px + env(safe-area-inset-bottom))',
        zIndex: 10000,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08), 0 -1px 0 rgba(0, 0, 0, 0.05)',
        height: '64px',
      }}
    >
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: active ? '#0f55dc' : '#6b7280',
              position: 'relative',
              flex: 1,
              padding: '6px 12px',
              borderRadius: '12px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              background: active ? 'rgba(15, 85, 220, 0.08)' : 'transparent',
            }}
          >
            <div 
              style={{ 
                position: 'relative', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '2px',
              }}
            >
              <div
                style={{
                  color: active ? '#0f55dc' : '#6b7280',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: active ? 'scale(1.1)' : 'scale(1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </div>
              {item.badge && item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-10px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    borderRadius: '10px',
                    minWidth: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '0 5px',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                    border: '2px solid #ffffff',
                  }}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: active ? '600' : '500',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '0.01em',
              }}
            >
              {item.label}
            </span>
            {active && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '32px',
                  height: '3px',
                  backgroundColor: '#0f55dc',
                  borderRadius: '0 0 3px 3px',
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
