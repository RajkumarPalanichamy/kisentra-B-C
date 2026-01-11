'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';

const AuthPage: React.FC = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Check if it's an email confirmation error
          if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
            setError('Email not confirmed. Please check your email for the verification link, or click "Resend Confirmation Email" below.');
          } else {
            setError(error.message);
          }
        } else if (data.user) {
          setMessage('Successfully logged in! Redirecting...');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 1000);
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else if (data.user) {
          // Check if email confirmation is required
          if (data.user.email_confirmed_at) {
            setMessage('Account created successfully! You can now log in.');
            setIsLogin(true);
          } else {
            setMessage('Account created! Please check your email to verify your account. If email confirmation is disabled, you can log in now.');
            setIsLogin(true);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setResendingEmail(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Confirmation email sent! Please check your inbox and click the verification link.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className='body_wrap sco_agency'>
      <Header />
      <main className="page_content">
        <section className="service pt-140 pb-140">
          <div className="container">
            <div className="row">
              <div className="col-lg-6 offset-lg-3">
                <Fade direction="up" triggerOnce duration={1000}>
                  <div style={{
                    padding: '40px',
                    backgroundColor: '#fff',
                    borderRadius: '15px',
                    border: '1px solid #e7e8ec',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '20px',
                      marginBottom: '30px',
                      borderBottom: '1px solid #e7e8ec',
                      paddingBottom: '20px'
                    }}>
                      <button
                        onClick={() => {
                          setIsLogin(true);
                          setError('');
                          setMessage('');
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: 'none',
                          backgroundColor: isLogin ? 'var(--color-primary-two)' : 'transparent',
                          color: isLogin ? '#fff' : 'var(--color-default)',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          setIsLogin(false);
                          setError('');
                          setMessage('');
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: 'none',
                          backgroundColor: !isLogin ? 'var(--color-primary-two)' : 'transparent',
                          color: !isLogin ? '#fff' : 'var(--color-default)',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Sign Up
                      </button>
                    </div>

                    <h2 className="title mb-30" style={{ fontSize: '28px', marginBottom: '20px' }}>
                      {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="content mb-40" style={{ marginBottom: '30px', color: 'var(--color-default)' }}>
                      {isLogin 
                        ? 'Sign in to sync your cart across devices' 
                        : 'Create an account to save your cart and preferences'}
                    </p>

                    {error && (
                      <div style={{
                        padding: '15px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '7px',
                        marginBottom: '20px',
                        color: '#c33'
                      }}>
                        {error}
                        {(error.includes('Email not confirmed') || error.includes('email_not_confirmed')) && (
                          <div style={{ marginTop: '10px' }}>
                            <button
                              onClick={handleResendConfirmation}
                              disabled={resendingEmail || !email}
                              style={{
                                padding: '8px 15px',
                                backgroundColor: 'var(--color-primary-two)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: (resendingEmail || !email) ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                opacity: (resendingEmail || !email) ? 0.6 : 1
                              }}
                            >
                              {resendingEmail ? 'Sending...' : 'Resend Confirmation Email'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {message && (
                      <div style={{
                        padding: '15px',
                        backgroundColor: '#efe',
                        border: '1px solid #cfc',
                        borderRadius: '7px',
                        marginBottom: '20px',
                        color: '#3c3'
                      }}>
                        {message}
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '600',
                          color: 'var(--color-heading)'
                        }}>
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
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
                          minLength={6}
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
                        disabled={loading}
                        className="thm-btn thm-btn--aso thm-btn--aso_yellow"
                        style={{
                          width: '100%',
                          opacity: loading ? 0.6 : 1,
                          cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
                      </button>
                    </form>

                    <div style={{
                      marginTop: '30px',
                      padding: '15px',
                      backgroundColor: '#f6f6f8',
                      borderRadius: '7px',
                      fontSize: '14px',
                      color: 'var(--color-default)',
                      textAlign: 'center'
                    }}>
                      <p style={{ margin: 0 }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <Link 
                          href="/auth" 
                          onClick={(e) => {
                            e.preventDefault();
                            setIsLogin(!isLogin);
                            setError('');
                            setMessage('');
                          }}
                          style={{ 
                            color: 'var(--color-primary-two)', 
                            textDecoration: 'none',
                            fontWeight: '600'
                          }}
                        >
                          {isLogin ? 'Sign Up' : 'Login'}
                        </Link>
                      </p>
                    </div>

                    <div style={{
                      marginTop: '20px',
                      padding: '15px',
                      backgroundColor: '#fff3cd',
                      borderRadius: '7px',
                      fontSize: '12px',
                      color: '#856404',
                      border: '1px solid #ffeaa7'
                    }}>
                      <strong>Note:</strong> After signing up or logging in, your cart items will automatically sync to Supabase and persist across devices.
                    </div>

                    {isLogin && (
                      <div style={{
                        marginTop: '15px',
                        padding: '15px',
                        backgroundColor: '#e7f3ff',
                        borderRadius: '7px',
                        fontSize: '12px',
                        color: '#004085',
                        border: '1px solid #b3d9ff'
                      }}>
                        <strong>Email Confirmation Issue?</strong> If you see "Email not confirmed", you can either:
                        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                          <li>Check your email for the verification link</li>
                          <li>Click "Resend Confirmation Email" above</li>
                          <li>Or disable email confirmation in Supabase Dashboard → Authentication → Settings (for testing)</li>
                        </ul>
                      </div>
                    )}
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
  );
};

export default AuthPage;
