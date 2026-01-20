'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';
import Image from 'next/image';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [resendingEmail, setResendingEmail] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setError('');
            setMessage('');
            setEmail('');
            setPassword('');
            setShowForgotPassword(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

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
                    setTimeout(() => {
                        onClose();
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

    const handleGoogleSignIn = async () => {
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                setError(error.message);
                setLoading(false);
            }
            // Note: If successful, user will be redirected to Google, so we don't need to handle success here
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setForgotPasswordLoading(true);
        setError('');
        setMessage('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                setError(error.message);
            } else {
                setMessage('Password reset email sent! Please check your inbox and follow the instructions.');
                setTimeout(() => {
                    setShowForgotPassword(false);
                    setMessage('');
                }, 3000);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send password reset email');
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            transition: 'all 0.3s ease'
        }} onClick={onClose}>
            <style jsx>{`
                @keyframes floatUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .modal-content {
                    animation: floatUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .input-group:focus-within label {
                    color: var(--color-primary-two);
                }
                .input-field {
                    transition: all 0.2s ease;
                }
                .input-field:focus {
                    background-color: #fff;
                    box-shadow: 0 0 0 2px var(--color-primary-two);
                    border-color: transparent;
                }
            `}</style>

            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    backgroundColor: '#fff',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    position: 'relative',
                    padding: '40px',
                    margin: '20px'
                }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#f3f4f6',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        fontSize: '18px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e5e7eb';
                        e.currentTarget.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.color = '#666';
                    }}
                >
                    &times;
                </button>

                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ marginBottom: '24px', display: 'inline-block' }}>
                        <Image src="/images/logo/logo-black.svg" alt="Logo" width={140} height={40} style={{ height: 'auto' }} />
                    </div>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '8px'
                    }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{
                        fontSize: '15px',
                        color: '#6b7280',
                        lineHeight: '1.5'
                    }}>
                        {isLogin
                            ? 'Please enter your details to sign in'
                            : 'Enter your details to get started'}
                    </p>
                </div>

                {/* Form Section */}
                {showForgotPassword ? (
                    <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="login-input-group" style={{ display: 'block' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '6px',
                                marginLeft: '4px'
                            }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <i className="far fa-envelope" style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af',
                                    fontSize: '16px',
                                    pointerEvents: 'none'
                                }}></i>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="name@company.com"
                                    className="input-field"
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px 14px 44px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        background: '#f9fafb',
                                        fontSize: '15px',
                                        color: '#1f2937',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {(error || message) && (
                            <div style={{
                                padding: '12px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '500',
                                backgroundColor: error ? '#fef2f2' : '#f0fdf4',
                                color: error ? '#991b1b' : '#166534',
                                border: `1px solid ${error ? '#fecaca' : '#bbf7d0'}`,
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'start'
                            }}>
                                <i className={`fas fa-${error ? 'exclamation-circle' : 'check-circle'}`} style={{ marginTop: '2px' }}></i>
                                <div>{error || message}</div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={forgotPasswordLoading}
                            style={{
                                width: '100%',
                                backgroundColor: 'var(--color-primary-two)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                height: '50px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 12px rgba(var(--color-primary-two-rgb, 54, 147, 217), 0.3)',
                                transition: 'all 0.2s ease',
                                opacity: forgotPasswordLoading ? 0.7 : 1,
                                marginTop: '8px'
                            }}
                        >
                            {forgotPasswordLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <i className="fas fa-circle-notch fa-spin"></i>
                                    <span>Sending...</span>
                                </div>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowForgotPassword(false);
                                setError('');
                                setMessage('');
                            }}
                            style={{
                                width: '100%',
                                backgroundColor: 'transparent',
                                color: '#6b7280',
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                height: '50px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Back to Sign In
                        </button>
                    </form>
                ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div className="login-input-group" style={{ display: 'block' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '6px',
                            marginLeft: '4px'
                        }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <i className="far fa-envelope" style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af',
                                fontSize: '16px',
                                pointerEvents: 'none'
                            }}></i>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@company.com"
                                className="input-field"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 44px',
                                    borderRadius: '12px',
                                    border: '1px solid #e5e7eb',
                                    background: '#f9fafb',
                                    fontSize: '15px',
                                    color: '#1f2937',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div className="login-input-group" style={{ display: 'block' }}>
                        <label style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '6px',
                            marginLeft: '4px',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            Password
                            {isLogin && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowForgotPassword(true);
                                        setError('');
                                        setMessage('');
                                    }}
                                    style={{
                                        color: 'var(--color-primary-two)',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                >
                                    Forgot?
                                </button>
                            )}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <i className="far fa-lock" style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af',
                                fontSize: '16px',
                                pointerEvents: 'none'
                            }}></i>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Enter your password"
                                className="input-field"
                                style={{
                                    width: '100%',
                                    padding: '14px 44px 14px 44px',
                                    borderRadius: '12px',
                                    border: '1px solid #e5e7eb',
                                    background: '#f9fafb',
                                    fontSize: '15px',
                                    color: '#1f2937',
                                    outline: 'none'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#9ca3af',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10
                                }}
                            >
                                <i className={`far fa-eye${showPassword ? '-slash' : ''}`} style={{ fontSize: '16px' }}></i>
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    {(error || message) && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '500',
                            backgroundColor: error ? '#fef2f2' : '#f0fdf4',
                            color: error ? '#991b1b' : '#166534',
                            border: `1px solid ${error ? '#fecaca' : '#bbf7d0'}`,
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'start'
                        }}>
                            <i className={`fas fa-${error ? 'exclamation-circle' : 'check-circle'}`} style={{ marginTop: '2px' }}></i>
                            <div>
                                {error || message}
                                {error && (error.includes('Email not confirmed') || error.includes('email_not_confirmed')) && (
                                    <button
                                        type="button"
                                        onClick={handleResendConfirmation}
                                        disabled={resendingEmail || !email}
                                        style={{
                                            display: 'block',
                                            marginTop: '4px',
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

                    {/* Google Sign In Button */}
                    {isLogin && (
                        <>
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#fff',
                                    color: '#374151',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    height: '50px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    opacity: loading ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        e.currentTarget.style.borderColor = '#d1d5db';
                                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span>Continue with Google</span>
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
                                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                                <span style={{ fontSize: '14px', color: '#9ca3af' }}>or</span>
                                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                            </div>
                        </>
                    )}

                    {/* Terms */}
                    <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5', textAlign: 'center', marginTop: '-4px' }}>
                        By continuing, you agree to our <a href="#" style={{ color: 'var(--color-primary-two)', textDecoration: 'none', fontWeight: 500 }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--color-primary-two)', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</a>.
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            backgroundColor: 'var(--color-primary-two)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            height: '50px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 12px rgba(var(--color-primary-two-rgb, 54, 147, 217), 0.3)',
                            transition: 'all 0.2s ease',
                            opacity: loading ? 0.7 : 1,
                            marginTop: '8px'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.currentTarget.style.transform = 'translateY(-2px)';
                            if (!loading) e.currentTarget.style.boxShadow = '0 6px 16px rgba(var(--color-primary-two-rgb, 54, 147, 217), 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(var(--color-primary-two-rgb, 54, 147, 217), 0.3)';
                        }}
                    >
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <i className="fas fa-circle-notch fa-spin"></i>
                                <span>Processing...</span>
                            </div>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </button>

                    <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>
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
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: '4px',
                                transition: 'color 0.2s'
                            }}
                        >
                            {isLogin ? "Sign up" : "Log in"}
                        </button>
                    </div>
                </form>
                )}
            </div>
        </div>
    );
};

export default LoginModal;
