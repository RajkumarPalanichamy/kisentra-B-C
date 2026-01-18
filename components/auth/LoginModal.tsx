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

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setError('');
            setMessage('');
            setEmail('');
            setPassword('');
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
                            {isLogin && <a href="#" style={{ color: 'var(--color-primary-two)', textDecoration: 'none', fontWeight: 500 }}>Forgot?</a>}
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
            </div>
        </div>
    );
};

export default LoginModal;
