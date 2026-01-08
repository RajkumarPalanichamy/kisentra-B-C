'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import { Fade } from 'react-awesome-reveal';

const AdminLoginPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAdmin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return;
    
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Simulate login delay
    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        router.push('/admin/dashboard');
      } else {
        setError('Invalid username or password');
        setIsSubmitting(false);
      }
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f6f6f8',
      padding: '20px'
    }}>
      <Fade direction="up" triggerOnce duration={1000}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: '#fff',
          borderRadius: '15px',
          border: '1px solid #e7e8ec',
          boxShadow: '0 5px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'var(--color-heading)',
              marginBottom: '10px'
            }}>
              Admin Login
            </h1>
            <p style={{ color: 'var(--color-default)', fontSize: '14px' }}>
              Enter your credentials to access the admin panel
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: '12px 15px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '7px',
                color: '#c33',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: 'var(--color-heading)'
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '7px',
                  border: '1px solid #e7e8ec',
                  fontSize: '16px',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-two)'}
                onBlur={(e) => e.target.style.borderColor = '#e7e8ec'}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: 'var(--color-heading)'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '7px',
                  border: '1px solid #e7e8ec',
                  fontSize: '16px',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-two)'}
                onBlur={(e) => e.target.style.borderColor = '#e7e8ec'}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="thm-btn thm-btn--aso thm-btn--aso_yellow"
              style={{
                width: '100%',
                opacity: (isSubmitting || isLoading) ? 0.6 : 1,
                cursor: (isSubmitting || isLoading) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{
            marginTop: '30px',
            padding: '15px',
            backgroundColor: '#f6f6f8',
            borderRadius: '7px',
            fontSize: '12px',
            color: 'var(--color-default)',
            textAlign: 'center'
          }}>
            <strong>Demo Credentials:</strong><br />
            Username: <code>admin</code><br />
            Password: <code>admin123</code>
          </div>
        </div>
      </Fade>
    </div>
  );
};

export default AdminLoginPage;

