'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';
import Image from 'next/image';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            if (!email || !email.includes('@')) {
                setError('Please enter a valid email address');
                setLoading(false);
                return;
            }

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            });

            if (error) {
                console.error('Password reset error:', error);
                setError(error.message || 'Failed to send password reset email. Please try again.');
            } else {
                setMessage('Password reset link sent to your email. Please check your inbox and spam folder.');
            }
        } catch (err: any) {
            console.error('Password reset exception:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
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
            padding: 140px 20px 80px;
        }
        .auth-card {
            display: flex;
            width: 100%;
            max-width: 1100px;
            background-color: #fff;
            border-radius: 30px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
            min-height: 600px;
        }
        .auth-left {
            flex: 1;
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #fff;
            padding: 60px;
            position: relative;
            overflow: hidden;
        }
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
            font-weight: 600;
            color: #475569;
            margin-left: 12px;
        }
        .input-field-pill {
            width: 100%;
            padding: 16px 24px;
            border-radius: 50px; 
            border: 1px solid #dbeafe;
            background-color: #eff6ff !important;
            font-size: 15px;
            color: #1e293b;
            outline: none;
            transition: all 0.2s ease;
        }
        .input-field-pill:hover {
            background-color: #dbeafe !important;
            border-color: #93c5fd;
        }
        .input-field-pill:focus {
            background-color: #fff !important;
            border-color: var(--color-primary-two);
            box-shadow: 0 0 0 4px rgba(var(--color-primary-two-rgb, 54, 147, 217), 0.1);
        }
        .btn-pill {
            width: 100%;
            padding: 16px;
            border-radius: 50px;
            border: none;
            background: linear-gradient(90deg, var(--color-primary-two) 0%, #2563eb 100%);
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
        }
        .btn-pill:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 30px rgba(37, 99, 235, 0.3);
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
                                            transform: 'rotate(5deg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <i className="fas fa-lock-open fa-3x" style={{
                                                color: '#fff',
                                                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))'
                                            }}></i>
                                        </div>
                                    </div>
                                </div>

                                <h1 style={{
                                    fontSize: '42px',
                                    fontWeight: '800',
                                    marginBottom: '24px',
                                    lineHeight: 1.1,
                                    letterSpacing: '-0.02em',
                                    color: '#ffffff',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                                }}>
                                    Account Recovery
                                </h1>
                                <p style={{
                                    fontSize: '18px',
                                    color: '#e2e8f0',
                                    lineHeight: 1.6,
                                    maxWidth: '320px',
                                    margin: '0 auto',
                                    fontWeight: '400'
                                }}>
                                    Don't worry, it happens to the best of us. We'll help you get back into your account.
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
                                        Forgot Password?
                                    </h2>
                                    <p style={{ color: '#64748b', fontSize: '16px' }}>
                                        Enter your email address to receive a password reset link.
                                    </p>
                                </div>

                                <form onSubmit={handleReset}>
                                    <div className="input-group-pill">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="name@company.com"
                                            className="input-field-pill"
                                        />
                                    </div>

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
                                            </div>
                                        </div>
                                    )}

                                    <button className="btn-pill" type="submit" disabled={loading}>
                                        {loading ? (
                                            <span><i className="fas fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i> Sending...</span>
                                        ) : (
                                            'Send Reset Link'
                                        )}
                                    </button>

                                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                        <Link href="/auth" style={{
                                            color: 'var(--color-primary-two)',
                                            textDecoration: 'none',
                                            fontSize: '15px',
                                            fontWeight: '700',
                                        }}>
                                            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                                            Back to Login
                                        </Link>
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

export default ForgotPasswordPage;
