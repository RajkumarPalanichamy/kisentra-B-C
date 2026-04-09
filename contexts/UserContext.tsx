'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface UserContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Global handler for unhandled promise rejections (AbortErrors from Supabase)
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error = event.reason;
            // Silently ignore AbortErrors - they're expected during hot reload/unmount
            if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('signal is aborted')) {
                event.preventDefault();
                return;
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();

        async function getInitialSession() {
            // Wrap in a promise that catches all rejections, including AbortErrors
            const sessionPromise = supabase.auth.getSession().catch((err: any) => {
                // Silently ignore AbortErrors - they're expected during hot reload/unmount
                if (err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('signal is aborted')) {
                    return { data: { session: null }, error: null };
                }
                // Re-throw other errors to be handled below
                throw err;
            });

            try {
                const { data: { session }, error } = await sessionPromise;

                if (controller.signal.aborted || !mounted) return;

                if (error) {
                    console.error('Error getting session:', error);
                }
                if (session) {
                    setSession(session);
                    setUser(session.user);
                }
                setIsLoading(false);
            } catch (err: any) {
                // Ignore AbortErrors - they're expected during hot reload/unmount
                if (err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('signal is aborted')) {
                    return;
                }
                console.error('Unexpected error during session check:', err);
                if (mounted) setIsLoading(false);
            }
        }

        // Wrap the entire call to catch any unhandled promise rejections
        getInitialSession().catch(() => {
            // Silently ignore - errors are already handled in the function
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (mounted && !controller.signal.aborted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    setIsLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
            controller.abort();
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        window.location.href = '/';
    };

    return (
        <UserContext.Provider value={{ user, session, isLoading, signOut }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
