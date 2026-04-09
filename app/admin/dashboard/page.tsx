'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import Products from '@/api/products';
import { Product } from '@/api/products';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdmin();

  // Immediate redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/admin/login';
    }
  }, [isAuthenticated, isLoading]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    inStock: 0,
    outOfStock: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      // 1. Load local for immediate render
      const savedProducts = localStorage.getItem('adminProducts');
      let products: Product[] = savedProducts ? JSON.parse(savedProducts) : Products;

      const updateStats = (prods: Product[]) => {
        const totalValue = prods.reduce((sum, p) => sum + p.price, 0);
        const inStock = prods.filter(p => p.inStock).length;
        const outOfStock = prods.filter(p => !p.inStock).length;
        setStats({
          totalProducts: prods.length,
          totalValue,
          inStock,
          outOfStock
        });
      };

      updateStats(products);

      // 2. Fetch fresh data
      try {
        const { getProductsFromSupabaseAsync } = await import('@/api/products');
        const remoteProducts = await getProductsFromSupabaseAsync();
        if (remoteProducts) {
          updateStats(remoteProducts);
          // Update cache
          localStorage.setItem('adminProducts', JSON.stringify(remoteProducts));
        }
      } catch (error) {
        console.error("Failed to update dashboard stats", error);
      }
    };

    loadStats();
  }, []);

  // Don't render if loading or not authenticated (layout will handle redirect)
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div>
      <Fade direction="up" triggerOnce duration={1000}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--color-heading)',
            marginBottom: '10px'
          }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--color-default)' }}>
            Overview of your product management
          </p>
        </div>
      </Fade>

      <div className="row" style={{ marginBottom: '30px' }}>
        <div className="col-md-3">
          <Fade direction="up" triggerOnce duration={1000} delay={100}>
            <div style={{
              padding: '30px',
              backgroundColor: '#fff',
              borderRadius: '15px',
              border: '1px solid #e7e8ec',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#e3f2fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '15px'
              }}>
                <i className="fas fa-box" style={{ fontSize: '24px', color: 'var(--color-primary-two)' }}></i>
              </div>
              <h3 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: 'var(--color-heading)',
                margin: '0 0 5px 0'
              }}>
                {stats.totalProducts}
              </h3>
              <p style={{ color: 'var(--color-default)', margin: 0, fontSize: '14px' }}>
                Total Products
              </p>
            </div>
          </Fade>
        </div>

        <div className="col-md-3">
          <Fade direction="up" triggerOnce duration={1000} delay={200}>
            <div style={{
              padding: '30px',
              backgroundColor: '#fff',
              borderRadius: '15px',
              border: '1px solid #e7e8ec',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#e8f5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '15px'
              }}>
                <i className="fas fa-check-circle" style={{ fontSize: '24px', color: '#4caf50' }}></i>
              </div>
              <h3 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: 'var(--color-heading)',
                margin: '0 0 5px 0'
              }}>
                {stats.inStock}
              </h3>
              <p style={{ color: 'var(--color-default)', margin: 0, fontSize: '14px' }}>
                In Stock
              </p>
            </div>
          </Fade>
        </div>

        <div className="col-md-3">
          <Fade direction="up" triggerOnce duration={1000} delay={300}>
            <div style={{
              padding: '30px',
              backgroundColor: '#fff',
              borderRadius: '15px',
              border: '1px solid #e7e8ec',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#fff3e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '15px'
              }}>
                <i className="fas fa-exclamation-circle" style={{ fontSize: '24px', color: '#ff9800' }}></i>
              </div>
              <h3 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: 'var(--color-heading)',
                margin: '0 0 5px 0'
              }}>
                {stats.outOfStock}
              </h3>
              <p style={{ color: 'var(--color-default)', margin: 0, fontSize: '14px' }}>
                Out of Stock
              </p>
            </div>
          </Fade>
        </div>

        <div className="col-md-3">
          <Fade direction="up" triggerOnce duration={1000} delay={400}>
            <div style={{
              padding: '30px',
              backgroundColor: '#fff',
              borderRadius: '15px',
              border: '1px solid #e7e8ec',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#f3e5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '15px'
              }}>
                <i className="fas fa-dollar-sign" style={{ fontSize: '24px', color: '#9c27b0' }}></i>
              </div>
              <h3 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: 'var(--color-heading)',
                margin: '0 0 5px 0'
              }}>
                ₹{stats.totalValue.toLocaleString()}
              </h3>
              <p style={{ color: 'var(--color-default)', margin: 0, fontSize: '14px' }}>
                Total Value
              </p>
            </div>
          </Fade>
        </div>
      </div>

      <Fade direction="up" triggerOnce duration={1000} delay={500}>
        <div style={{
          padding: '30px',
          backgroundColor: '#fff',
          borderRadius: '15px',
          border: '1px solid #e7e8ec'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--color-heading)',
              margin: 0
            }}>
              Quick Actions
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <Link
              href="/admin/products?action=add"
              className="thm-btn thm-btn--aso thm-btn--aso_yellow"
            >
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
              Add New Product
            </Link>
            <Link
              href="/admin/products"
              className="thm-btn thm-btn--border"
            >
              <i className="fas fa-list" style={{ marginRight: '8px' }}></i>
              Manage Products
            </Link>
            <Link
              href="/"
              className="thm-btn thm-btn--border"
            >
              <i className="fas fa-store" style={{ marginRight: '8px' }}></i>
              View Storefront
            </Link>
            <Link
              href="/admin/categories"
              className="thm-btn thm-btn--border"
            >
              <i className="fas fa-tags" style={{ marginRight: '8px' }}></i>
              Manage Categories
            </Link>
          </div>
        </div>
      </Fade>
    </div>
  );
};

export default AdminDashboard;

