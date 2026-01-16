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
          if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
            setError('Email not confirmed. Please check your email for the verification link, or click "Resend Confirmation Email" below.');
          } else {
            setError(error.message);
          }
        } else if (data.user) {
          setMessage('Successfully logged in!');
          router.push('/');
          router.refresh();
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
          if (data.user.email_confirmed_at) {
            setMessage('Account created successfully! You can now log in.');
            setIsLogin(true);
          } else {
            setMessage('Account created! Please check your email to verify your account.');
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
        setMessage('Confirmation email sent! Please check your inbox.');
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
      <main className="page_content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', backgroundColor: '#f5f5f5', paddingTop: '100px', paddingBottom: '60px' }}>
        <Fade direction="up" triggerOnce duration={300} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              maxWidth: '850px',
              height: '528px',
              backgroundColor: '#fff',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              position: 'relative',
              margin: '20px'
            }}
          >
            {/* Left Panel - Branding */}
            <div style={{
              width: '38%',
              backgroundColor: 'var(--color-primary-two)',
              padding: '40px 33px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: '#fff',
              position: 'relative',
              backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 100%)'
            }}>
              <div>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  marginBottom: '15px',
                  color: '#fff',
                  lineHeight: '1.2'
                }}>
                  {isLogin ? 'Login' : 'Looks like you\'re new here!'}
                </h2>
                <p style={{
                  fontSize: '18px',
                  color: '#dbdbdb',
                  lineHeight: '1.5',
                  marginTop: '15px',
                  fontWeight: '500'
                }}>
                  {isLogin
                    ? 'Get access to your Orders, Wishlist and Recommendations'
                    : 'Sign up with your email to get started'}
                </p>
              </div>

              <div style={{
                textAlign: 'center',
                marginTop: 'auto',
                marginBottom: '30px'
              }}>
                {/* Using a font-awesome icon or similar large graphic */}
                <i className={`fa-duotone ${isLogin ? 'fa-bag-shopping' : 'fa-rocket-launch'}`} style={{
                  fontSize: '120px',
                  color: 'rgba(255,255,255,0.95)',
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                }}></i>
              </div>
            </div>

            {/* Right Panel - Form */}
            <div style={{
              flex: 1,
              padding: '56px 35px 16px',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fff',
              position: 'relative',
              overflowY: 'auto'
            }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                <div style={{ marginBottom: '24px', position: 'relative' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter Email"
                    style={{
                      width: '100%',
                      border: 'none',
                      borderBottom: '1px solid #e0e0e0',
                      padding: '10px 0',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-bottom-color 0.2s',
                      background: 'transparent'
                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-primary-two)'}
                    onBlur={(e) => e.target.style.borderBottomColor = '#e0e0e0'}
                  />
                </div>

                <div style={{ marginBottom: '35px', position: 'relative' }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter Password"
                    style={{
                      width: '100%',
                      border: 'none',
                      borderBottom: '1px solid #e0e0e0',
                      padding: '10px 0',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-bottom-color 0.2s',
                      background: 'transparent'
                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-primary-two)'}
                    onBlur={(e) => e.target.style.borderBottomColor = '#e0e0e0'}
                  />
                  {isLogin && (
                    <a href="#" style={{
                      position: 'absolute',
                      right: 0,
                      top: '10px',
                      fontSize: '14px',
                      color: 'var(--color-primary-two)',
                      textDecoration: 'none',
                      fontWeight: '600'
                    }}>
                      Forgot?
                    </a>
                  )}
                </div>

                <p style={{ fontSize: '12px', color: '#878787', marginTop: '-10px', marginBottom: '20px' }}>
                  By continuing, you agree to our <a href="#" style={{ color: 'var(--color-primary-two)', textDecoration: 'none' }}>Terms of Use</a> and <a href="#" style={{ color: 'var(--color-primary-two)', textDecoration: 'none' }}>Privacy Policy</a>.
                </p>

                {error && (
                  <div style={{ marginBottom: '15px', fontSize: '12px', color: '#ff6161', fontWeight: '500' }}>
                    {error}
                    {(error.includes('Email not confirmed') || error.includes('email_not_confirmed')) && (
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resendingEmail || !email}
                        style={{
                          display: 'block',
                          marginTop: '5px',
                          color: 'var(--color-primary-two)',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {resendingEmail ? 'Sending...' : 'Resend Confirmation Email'}
                      </button>
                    )}
                  </div>
                )}
                {message && (
                  <div style={{ marginBottom: '15px', fontSize: '13px', color: '#26a541', fontWeight: '500' }}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    backgroundColor: '#fb641b',
                    background: 'var(--color-primary-two)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '2px',
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    marginBottom: '15px',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Processing...' : (isLogin ? 'Login' : 'Signup')}
                </button>

                <div style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setMessage('');
                    }}
                    style={{
                      color: 'var(--color-primary-two)',
                      background: 'none',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {isLogin ? "New to Kisentra? Create an account" : "Existing User? Log in"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Fade>
      </main>
      <Footer />
      <Scrollbar />
    </div>
  );
};

export default AuthPage;
