'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';
import Image from 'next/image';

const ResetPasswordPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
    const isSubmittingRef = useRef(false);

    useEffect(() => {
        let mounted = true;
        const timeoutIds: NodeJS.Timeout[] = [];

        // Handle AbortErrors locally to prevent runtime errors - use capture phase
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error = event.reason;
            const isAbortError = 
                error?.name === 'AbortError' ||
                error?.name === 'DOMException' && error?.code === 20 ||
                error?.message?.includes('aborted') ||
                error?.message?.includes('signal is aborted') ||
                error?.message?.includes('abort') ||
                error?.code === '20' ||
                error?.code === 20 ||
                (typeof error === 'string' && error.includes('aborted'));
            
            if (isAbortError) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return;
            }
        };
        // Use capture phase to catch errors before they bubble
        window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

        // Check if this is a password recovery flow
        const checkRecoveryFlow = () => {
            // Check URL params for recovery flag
            const recoveryParam = searchParams.get('recovery');
            if (recoveryParam === 'true') {
                if (mounted) setIsRecoveryFlow(true);
                // Set sessionStorage flag to persist across navigation
                sessionStorage.setItem('password_recovery_flow', 'true');
                // Clean up URL param
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }

            // Check sessionStorage for recovery flag
            const fromStorage = sessionStorage.getItem('password_recovery_flow');
            if (fromStorage === 'true' && mounted) {
                setIsRecoveryFlow(true);
            }

            // Check cookie (fallback)
            const cookies = document.cookie.split(';');
            const recoveryCookie = cookies.find(c => c.trim().startsWith('password_recovery_flow='));
            if (recoveryCookie && recoveryCookie.split('=')[1] === 'true' && mounted) {
                setIsRecoveryFlow(true);
                sessionStorage.setItem('password_recovery_flow', 'true');
            }
        };

        checkRecoveryFlow();

        // Use auth state change listener for better session detection
        let authSubscription: { unsubscribe: () => void } | null = null;
        try {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (!mounted) return;
                
                if (session) {
                    // Session found! Check if it's recovery flow
                    const recoveryFlag = sessionStorage.getItem('password_recovery_flow');
                    const recoveryCookie = document.cookie.split(';').find(c => c.trim().startsWith('password_recovery_flow='));
                    
                    if ((recoveryFlag === 'true' || (recoveryCookie && recoveryCookie.split('=')[1] === 'true')) && mounted) {
                        setIsRecoveryFlow(true);
                    }
                }
            });
            authSubscription = subscription;
        } catch (err: any) {
            // Ignore errors setting up auth listener
            if (err?.name !== 'AbortError' && !err?.message?.includes('aborted')) {
                console.error('Error setting up auth state listener:', err);
            }
        }

        // Check if we have a valid session for password reset
        const checkSession = async () => {
            try {
                // Wait longer for callback to complete (especially important for email links)
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (!mounted) return;
                
                const getSessionSafely = async () => {
                    try {
                        const result = await supabase.auth.getSession();
                        return result;
                    } catch (err: any) {
                        // Silently ignore AbortErrors
                        if (err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('signal is aborted')) {
                            return { data: { session: null }, error: null };
                        }
                        throw err;
                    }
                };

                let sessionResult = await getSessionSafely();
                let session = sessionResult.data?.session;
                let error = sessionResult.error;
                
                if (!mounted) return;

                // If no session, retry with increasing delays
                if (!session) {
                    const checkSessionWithRetries = async (attempt = 1, maxAttempts = 6) => {
                        if (!mounted) return;
                        
                        const delay = attempt * 800; // 800ms, 1600ms, 2400ms, 3200ms, 4000ms, 4800ms
                        const timeoutId = setTimeout(async () => {
                            if (!mounted) return;
                            
                            try {
                                const retryResult = await getSessionSafely();
                                const retrySession = retryResult.data?.session;
                                
                                if (!mounted) return;
                                
                                if (!retrySession) {
                                    // If no session and we haven't exhausted retries, try again
                                    if (attempt < maxAttempts) {
                                        checkSessionWithRetries(attempt + 1, maxAttempts);
                                    } else {
                                        // All retries exhausted
                                        if (mounted) {
                                            setError('No active session found. Please click the link from your email again or request a new password reset link.');
                                        }
                                    }
                                } else {
                                    // Session found! Check if it's recovery flow
                                    if (mounted) {
                                        const recoveryFlag = sessionStorage.getItem('password_recovery_flow');
                                        const recoveryCookie = document.cookie.split(';').find(c => c.trim().startsWith('password_recovery_flow='));
                                        
                                        if (recoveryFlag === 'true' || (recoveryCookie && recoveryCookie.split('=')[1] === 'true')) {
                                            setIsRecoveryFlow(true);
                                        }
                                    }
                                }
                            } catch (err: any) {
                                if (!mounted) return;
                                // Only log non-abort errors
                                if (err?.name !== 'AbortError' && !err?.message?.includes('aborted')) {
                                    console.error('Retry session check error:', err);
                                    // If error and we haven't exhausted retries, try again
                                    if (attempt < maxAttempts) {
                                        checkSessionWithRetries(attempt + 1, maxAttempts);
                                    } else if (mounted) {
                                        setError('Session error. Please click the link from your email again.');
                                    }
                                } else if (attempt < maxAttempts) {
                                    // Abort error, retry
                                    checkSessionWithRetries(attempt + 1, maxAttempts);
                                }
                            }
                        }, delay);
                        
                        timeoutIds.push(timeoutId);
                    };
                    
                    // Start retry sequence
                    checkSessionWithRetries();
                } else {
                    // Session exists - check if this is a recovery flow
                    const recoveryFlag = sessionStorage.getItem('password_recovery_flow');
                    const recoveryCookie = document.cookie.split(';').find(c => c.trim().startsWith('password_recovery_flow='));
                    
                    // If we have a recovery flag or cookie, this is a recovery flow
                    if ((recoveryFlag === 'true' || (recoveryCookie && recoveryCookie.split('=')[1] === 'true')) && mounted) {
                        setIsRecoveryFlow(true);
                    } else {
                        // User has session but no recovery flag - they might have navigated here directly
                        // Check if they came from a password reset email by checking URL or redirect them
                        const recoveryParam = searchParams.get('recovery');
                        if (recoveryParam !== 'true' && mounted) {
                            // No recovery indicators - this might be a direct navigation
                            // Still allow them to change password if they want, but don't force it
                            console.log('User arrived at reset password page without recovery flow indicators');
                        }
                    }
                }
            } catch (err: any) {
                if (!mounted) return;
                // Only log non-abort errors
                if (err?.name !== 'AbortError' && !err?.message?.includes('aborted') && !err?.message?.includes('signal is aborted')) {
                    console.error('Error checking session:', err);
                }
            }
        };
        checkSession();

        // Prevent navigation away if in recovery flow and password not changed
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isRecoveryFlow && !passwordChanged) {
                e.preventDefault();
                e.returnValue = 'You must change your password before leaving this page.';
                return e.returnValue;
            }
        };

        // Intercept all link clicks to prevent navigation
        const handleLinkClick = (e: MouseEvent) => {
            if (isRecoveryFlow && !passwordChanged) {
                const target = e.target as HTMLElement;
                const link = target.closest('a');
                if (link && link.href && !link.href.includes('#') && link.href !== window.location.href) {
                    e.preventDefault();
                    setError('Please change your password before navigating away from this page.');
                    return false;
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('click', handleLinkClick);

        return () => {
            mounted = false;
            // Clear all timeouts
            timeoutIds.forEach(id => clearTimeout(id));
            // Unsubscribe from auth state changes
            if (authSubscription) {
                try {
                    authSubscription.unsubscribe();
                } catch (err) {
                    // Ignore unsubscribe errors
                }
            }
            // Remove event listeners
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
            document.removeEventListener('click', handleLinkClick);
        };
    }, [searchParams, isRecoveryFlow, passwordChanged]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent multiple submissions
        if (isSubmittingRef.current || loading) {
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        isSubmittingRef.current = true;
        setLoading(true);
        setMessage('');
        setError('');

        try {
            // Verify we have a session before updating password
            let currentSession = null;
            let sessionError = null;

            // Try to get session with retry logic for abort errors
            const getSessionWithRetry = async (retryCount = 0): Promise<{ session: any; error: any }> => {
                try {
                    const result = await supabase.auth.getSession();
                    return { session: result.data.session, error: result.error };
                } catch (err: any) {
                    // Handle abort errors
                    if ((err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('signal is aborted')) && retryCount < 2) {
                        // Wait a bit and retry
                        await new Promise(resolve => setTimeout(resolve, 300));
                        return getSessionWithRetry(retryCount + 1);
                    }
                    // For other errors or max retries, return error
                    return { session: null, error: err };
                }
            };

            const sessionResult = await getSessionWithRetry();
            currentSession = sessionResult.session;
            sessionError = sessionResult.error;

            if (sessionError) {
                // Only show error if it's not an abort error (abort errors are handled by retry)
                if (sessionError.name !== 'AbortError' && !sessionError.message?.includes('aborted')) {
                    setError('Session error. Please request a new password reset link.');
                    isSubmittingRef.current = false;
                    setLoading(false);
                    return;
                }
            }

            if (!currentSession) {
                setError('No active session. Please click the link from your email again or request a new password reset link.');
                isSubmittingRef.current = false;
                setLoading(false);
                return;
            }

            // Update password with better error handling
            // Wrap in try-catch to handle abort errors gracefully
            let updateResult;
            try {
                updateResult = await supabase.auth.updateUser({
                    password: password,
                });
            } catch (updateErr: any) {
                // If the promise itself throws (abort error), retry
                if (updateErr?.name === 'AbortError' || 
                    updateErr?.message?.includes('aborted') || 
                    updateErr?.message?.includes('signal is aborted')) {
                    console.log('Password update was aborted. Retrying...');
                    // Wait a bit before retry
                    await new Promise(resolve => setTimeout(resolve, 300));
                    updateResult = await supabase.auth.updateUser({
                        password: password,
                    });
                } else {
                    throw updateErr;
                }
            }

            // Check for abort errors specifically
            if (updateResult.error) {
                const error = updateResult.error;
                
                // Handle abort errors
                if (error.message?.includes('aborted') || 
                    error.message?.includes('signal is aborted') ||
                    error.name === 'AbortError') {
                    console.log('Password update error was aborted. Retrying...');
                    
                    // Wait a bit before retry
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Retry once
                    const retryResult = await supabase.auth.updateUser({
                        password: password,
                    });
                    
                    if (retryResult.error) {
                        // If retry also fails, check if it's still an abort error
                        if (retryResult.error.message?.includes('aborted') || 
                            retryResult.error.message?.includes('signal is aborted') ||
                            retryResult.error.name === 'AbortError') {
                            setError('Network request was interrupted. Please check your connection and try again.');
                        } else {
                            setError(retryResult.error.message || 'Failed to update password. Please try again.');
                        }
                    } else {
                        // Retry succeeded
                        setPasswordChanged(true);
                        setMessage('Password updated successfully! Redirecting to login...');
                        sessionStorage.removeItem('password_recovery_flow');
                        // Wait a moment before signing out to ensure password update is complete
                        await new Promise(resolve => setTimeout(resolve, 500));
                        try {
                            await supabase.auth.signOut();
                        } catch (signOutError) {
                            // Ignore sign out errors
                        }
                        setTimeout(() => {
                            router.push('/auth');
                        }, 1500);
                    }
                } else {
                    // Other errors
                    console.error('Password update error:', error);
                    setError(error.message || 'Failed to update password. Please try again.');
                }
            } else {
                // Success
                setPasswordChanged(true);
                setMessage('Password updated successfully! Redirecting to login...');
                // Clear any recovery flags
                sessionStorage.removeItem('password_recovery_flow');
                // Wait a moment before signing out to ensure password update is complete
                await new Promise(resolve => setTimeout(resolve, 500));
                try {
                    await supabase.auth.signOut();
                } catch (signOutError) {
                    // Ignore sign out errors
                }
                setTimeout(() => {
                    router.push('/auth');
                }, 1500);
            }
        } catch (err: any) {
            // Handle abort errors in catch block
            if (err?.name === 'AbortError' || 
                err?.message?.includes('aborted') || 
                err?.message?.includes('signal is aborted')) {
                // Don't log abort errors - they're expected during development
                setError('Request was interrupted. Please check your internet connection and try again.');
            } else {
                console.error('Password update exception:', err);
                setError(err.message || 'An error occurred. Please try again.');
            }
        } finally {
            isSubmittingRef.current = false;
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
                                            <i className="fas fa-key fa-3x" style={{
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
                                    Reset Password
                                </h1>
                                <p style={{
                                    fontSize: '18px',
                                    color: '#e2e8f0',
                                    lineHeight: 1.6,
                                    maxWidth: '320px',
                                    margin: '0 auto',
                                    fontWeight: '400'
                                }}>
                                    Create a new strong password for your account to keep it secure.
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
                                        New Password
                                    </h2>
                                    {isRecoveryFlow && !passwordChanged && (
                                        <div style={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            backgroundColor: '#fef3c7',
                                            color: '#92400e',
                                            border: '1px solid #fcd34d',
                                            marginBottom: '20px',
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'start'
                                        }}>
                                            <i className="fas fa-exclamation-triangle" style={{ marginTop: '2px', fontSize: '18px' }}></i>
                                            <div>
                                                <strong style={{ display: 'block', marginBottom: '8px' }}>Password Reset Required</strong>
                                                You must set a new password to complete the password reset process. You cannot navigate away from this page until you change your password.
                                            </div>
                                        </div>
                                    )}
                                    <p style={{ color: '#64748b', fontSize: '16px' }}>
                                        Please enter your new password below.
                                    </p>
                                </div>

                                <form onSubmit={handleUpdatePassword}>
                                    <div className="input-group-pill">
                                        <label>New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                placeholder="New password"
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
                                    </div>

                                    <div className="input-group-pill">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            placeholder="Confirm new password"
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
                                            <span><i className="fas fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i> Updating...</span>
                                        ) : (
                                            'Update Password'
                                        )}
                                    </button>
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

export default ResetPasswordPage;
