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

    useEffect(() => {
        let mounted = true;

        async function getInitialSession() {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (mounted) {
                    if (error) {
                        console.error('Error getting session:', error);
                    }
                    if (session) {
                        setSession(session);
                        setUser(session.user);
                    }
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Unexpected error during session check:', err);
                if (mounted) setIsLoading(false);
            }
        }

        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    setIsLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
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
