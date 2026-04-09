'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/contexts/AdminContext';
import Link from 'next/link';

const AdminLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout } = useAdmin();

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return;

    // Allow access to login page without authentication
    if (pathname !== '/admin/login' && !isAuthenticated) {
      // Use window.location for immediate redirect (prevents any rendering)
      window.location.href = '/admin/login';
    }
  }, [isAuthenticated, isLoading, pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f6f6f8'
      }}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid var(--color-primary-two)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: 'var(--color-default)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // CRITICAL: Don't render anything if not authenticated - redirect immediately
  if (!isLoading && !isAuthenticated && pathname !== '/admin/login') {
    // Return null and let useEffect handle the redirect
    // This prevents any content from rendering
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      {/* Admin Header */}
      <header style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e7e8ec',
        padding: '15px 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--color-heading)',
                margin: 0
              }}>
                Admin Panel
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <Link
                href="/"
                style={{
                  color: 'var(--color-default)',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}
              >
                View Store
              </Link>
              <button
                onClick={logout}
                className="thm-btn thm-btn--border"
                style={{ padding: '10px 20px', fontSize: '14px' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Admin Sidebar */}
        <aside style={{
          width: '250px',
          backgroundColor: '#fff',
          borderRight: '1px solid #e7e8ec',
          minHeight: 'calc(100vh - 60px)',
          padding: '20px 0'
        }}>
          <nav>
            <Link
              href="/admin/dashboard"
              style={{
                display: 'block',
                padding: '12px 30px',
                color: pathname === '/admin/dashboard' ? 'var(--color-primary-two)' : 'var(--color-heading)',
                textDecoration: 'none',
                fontWeight: pathname === '/admin/dashboard' ? '600' : '400',
                backgroundColor: pathname === '/admin/dashboard' ? '#f6f6f8' : 'transparent',
                borderLeft: pathname === '/admin/dashboard' ? '3px solid var(--color-primary-two)' : '3px solid transparent'
              }}
            >
              <i className="fas fa-chart-line" style={{ marginRight: '10px' }}></i>
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              style={{
                display: 'block',
                padding: '12px 30px',
                color: pathname === '/admin/products' ? 'var(--color-primary-two)' : 'var(--color-heading)',
                textDecoration: 'none',
                fontWeight: pathname === '/admin/products' ? '600' : '400',
                backgroundColor: pathname === '/admin/products' ? '#f6f6f8' : 'transparent',
                borderLeft: pathname === '/admin/products' ? '3px solid var(--color-primary-two)' : '3px solid transparent'
              }}
            >
              <i className="fas fa-box" style={{ marginRight: '10px' }}></i>
              Products
            </Link>
            <Link
              href="/admin/orders"
              style={{
                display: 'block',
                padding: '12px 30px',
                color: pathname === '/admin/orders' ? 'var(--color-primary-two)' : 'var(--color-heading)',
                textDecoration: 'none',
                fontWeight: pathname === '/admin/orders' ? '600' : '400',
                backgroundColor: pathname === '/admin/orders' ? '#f6f6f8' : 'transparent',
                borderLeft: pathname === '/admin/orders' ? '3px solid var(--color-primary-two)' : '3px solid transparent'
              }}
            >
              <i className="fas fa-shopping-cart" style={{ marginRight: '10px' }}></i>
              Orders
            </Link>
            <Link href="/admin/categories" className={`nav-link ${pathname === '/admin/categories' ? 'active' : ''}`} style={{
              color: pathname === '/admin/categories' ? '#333' : '#666',
              padding: '12px 15px',
              borderRadius: '8px',
              marginBottom: '5px',
              backgroundColor: pathname === '/admin/categories' ? '#f0f0f0' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '500'
            }}>
              <i className="far fa-tags" style={{ width: '20px' }}></i> Categories
            </Link>

            <Link href="/admin/banners" className={`nav-link ${pathname === '/admin/banners' ? 'active' : ''}`} style={{
              color: pathname === '/admin/banners' ? '#333' : '#666',
              padding: '12px 15px',
              borderRadius: '8px',
              marginBottom: '5px',
              backgroundColor: pathname === '/admin/banners' ? '#f0f0f0' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '500'
            }}>
              <i className="far fa-images" style={{ width: '20px' }}></i> Banners
            </Link>
            <Link
              href="/admin/profile"
              style={{
                display: 'block',
                padding: '12px 30px',
                color: pathname === '/admin/profile' ? 'var(--color-primary-two)' : 'var(--color-heading)',
                textDecoration: 'none',
                fontWeight: pathname === '/admin/profile' ? '600' : '400',
                backgroundColor: pathname === '/admin/profile' ? '#f6f6f8' : 'transparent',
                borderLeft: pathname === '/admin/profile' ? '3px solid var(--color-primary-two)' : '3px solid transparent'
              }}
            >
              <i className="fas fa-user-circle" style={{ marginRight: '10px' }}></i>
              Profile
            </Link>
          </nav>
        </aside>

        {/* Admin Content */}
        <main style={{ flex: 1, padding: '30px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}

