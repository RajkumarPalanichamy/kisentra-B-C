'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';
import Image from 'next/image';

const AuthPage: React.FC = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession().catch((err: any) => {
          // Ignore AbortErrors during hot reload
          if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
            return { data: { session: null }, error: null };
          }
          throw err;
        });
        if (session) {
          router.push('/');
        }
      } catch (err: any) {
        // Silently ignore AbortErrors
        if (err?.name !== 'AbortError' && !err?.message?.includes('aborted')) {
          console.error('Error checking session:', err);
        }
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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className='body_wrap'>
      <Header />
      <style jsx global>{`
        .auth-container-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: #f3f4f6;
            padding: 140px 20px 80px; /* Added top padding to push card down */
        }
        .auth-card {
            display: flex;
            width: 100%;
            max-width: 1100px;
            background-color: #fff;
            border-radius: 30px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
            min-height: 650px;
        }
        .auth-left {
            flex: 1;
            background-color: #2563eb; 
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); /* Blue Brand Gradient */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #fff;
            padding: 60px;
            position: relative;
            overflow: hidden;
        }
        /* Abstract decorative circles */
        .auth-left::before {
            content: '';
            position: absolute;
            top: -100px;
            right: -100px;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .auth-left::after {
            content: '';
            position: absolute;
            bottom: -50px;
            left: -50px;
            width: 300px;
            height: 300px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
        }

        .auth-right {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 60px;
            background-color: #fff;
        }
        .auth-form-container {
            width: 100%;
            max-width: 400px;
        }
        .input-group-pill {
            margin-bottom: 24px;
        }
        .input-group-pill label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600; /* Made slightly bolder */
            color: #475569; /* Darker slate for better contrast */
            margin-left: 12px;
        }
        .input-field-pill {
            width: 100%;
            padding: 16px 24px;
            border-radius: 50px; 
            border: 1px solid #dbeafe; /* Changed from #cbd5e1 */
            background-color: #eff6ff !important; /* Changed from #f8fafc */
            font-size: 15px;
            color: #1e293b;
            outline: none;
            transition: all 0.2s ease;
        }
        .input-field-pill:hover {
            background-color: #dbeafe !important; /* Changed from #f1f5f9 */
            border-color: #93c5fd; /* Changed from #94a3b8 */
        }
        .input-field-pill:focus {
            background-color: #fff !important; /* White on focus */
            border-color: var(--color-primary-two);
            box-shadow: 0 0 0 4px rgba(var(--color-primary-two-rgb, 54, 147, 217), 0.1);
        }
        .btn-pill {
            width: 100%;
            padding: 16px;
            border-radius: 50px;
            border: none;
            background: linear-gradient(90deg, var(--color-primary-two) 0%, #2563eb 100%); /* Brand Blue Gradient */
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2); /* Updated shadow */
        }
        .btn-pill:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 30px rgba(37, 99, 235, 0.3); /* Updated shadow */
        }
        .btn-pill:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }
        @media (max-width: 991px) {
            .auth-card {
                flex-direction: column;
                max-width: 500px;
            }
            .auth-left {
                display: none;
            }
            .auth-right {
                padding: 40px 30px;
            }
        }
      `}</style>

      <main className="auth-container-wrapper">
        <Fade direction="up" triggerOnce duration={400} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div className="auth-card">
            {/* Left Side - Visual */}
            <div className="auth-left">
              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '80%' }}>
                <div style={{ marginBottom: '40px' }}>
                  {/* Improved Glassmorphism Icon Container */}
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    transform: 'rotate(-5deg)'
                  }}>
                    <div style={{
                      transform: 'rotate(5deg)', /* Counter-rotate icon */
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className={`fas ${isLogin ? 'fa-shopping-bag' : 'fa-gift'} fa-3x`} style={{
                        color: '#fff',
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))'
                      }}></i>
                    </div>
                  </div>
                </div>

                <h1 style={{
                  fontSize: '48px',
                  fontWeight: '800',
                  marginBottom: '24px',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  color: '#ffffff', /* Explicit White */
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}>
                  {isLogin ? 'Welcome Back' : 'Join the Community'}
                </h1>
                <p style={{
                  fontSize: '18px',
                  color: '#e2e8f0', /* Light Slate/White */
                  lineHeight: 1.6,
                  maxWidth: '320px',
                  margin: '0 auto',
                  fontWeight: '400'
                }}>
                  {isLogin
                    ? 'Access your orders, wishlist, and exclusive recommendations.'
                    : 'Get instant access to thousands of premium products and deals.'}
                </p>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="auth-right">
              <div className="auth-form-container">
                <div style={{ marginBottom: '40px' }}>
                  <Link href="/">
                    <Image src="/images/logo/logo-black.svg" alt="Logo" width={140} height={40} style={{ height: 'auto', marginBottom: '30px' }} />
                  </Link>
                  <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '16px' }}>
                    {isLogin ? 'Welcome back! Please enter your details.' : 'Fill in the form below to get started.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit}>

                  <div className="input-group-pill">
                    <label>Email or Username</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@company.com"
                      className="input-field-pill"
                    />
                  </div>

                  <div className="input-group-pill">
                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Enter your password"
                        className="input-field-pill"
                        style={{ paddingRight: '50px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '20px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          padding: '4px',
                          display: 'flex'
                        }}
                      >
                        <i className={`far fa-eye${showPassword ? '-slash' : ''}`} style={{ fontSize: '18px' }}></i>
                      </button>
                    </div>
                    {isLogin && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <Link href="/forgot-password" style={{ color: 'var(--color-primary-two)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                          Forgot password?
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  {(error || message) && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: error ? '#fef2f2' : '#f0fdf4',
                      color: error ? '#991b1b' : '#166534',
                      border: `1px solid ${error ? '#fecaca' : '#bbf7d0'}`,
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'start',
                      marginBottom: '30px'
                    }}>
                      <div style={{ marginTop: '2px' }}>
                        <i className={`fas fa-${error ? 'exclamation-circle' : 'check-circle'}`}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        {error || message}
                        {error && (error.includes('Email not confirmed') || error.includes('email_not_confirmed')) && (
                          <button
                            type="button"
                            onClick={handleResendConfirmation}
                            disabled={resendingEmail || !email}
                            style={{
                              display: 'block',
                              marginTop: '8px',
                              fontWeight: '600',
                              textDecoration: 'underline',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              color: 'inherit'
                            }}
                          >
                            {resendingEmail ? 'Sending...' : 'Resend Confirmation Email'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <button className="btn-pill" type="submit" disabled={loading}>
                    {loading ? (
                      <span><i className="fas fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i> Processing...</span>
                    ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </button>

                  <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Or continue with</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '50px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#fff',
                      color: '#1e293b',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                  >
                    <img src="https://www.google.com/favicon.ico" alt="Google" width="20" height="20" />
                    Google
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <span style={{ color: '#64748b', fontSize: '15px' }}>
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                    </span>
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
                        fontSize: '15px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      {isLogin ? "Sign up" : "Log in"}
                    </button>
                  </div>
                </form>
              </div>
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
