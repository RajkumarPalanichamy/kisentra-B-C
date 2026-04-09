'use client';

import { useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const processedRef = useRef(false);

    useEffect(() => {
        if (processedRef.current) return;

        const code = searchParams?.get('code');
        const next = searchParams?.get('next') || '/';
        const error = searchParams?.get('error');
        const error_description = searchParams?.get('error_description');

        if (error) {
            processedRef.current = true;
            router.replace(`/auth?error=${encodeURIComponent(error_description || error)}`);
            return;
        }

        if (code) {
            processedRef.current = true;
            const callbackUrl = `/auth/callback?code=${code}&next=${next}`;
            // Use setTimeout to ensure the current render cycle completes and avoid "AbortError"
            setTimeout(() => {
                window.location.href = callbackUrl;
            }, 100);
        } else {
            // If there's no code and no error, this might be a premature load or a direct visit.
            // We'll wait a brief moment to see if params populate (unlikely with searchParams hook, but safe)
            // or just redirect.
            const timer = setTimeout(() => {
                if (!processedRef.current) {
                    processedRef.current = true;
                    router.replace('/auth');
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchParams, router]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div className="spinner"></div>
            <p>Verifying secure link...</p>
            <style jsx>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyContent />
        </Suspense>
    )
}
