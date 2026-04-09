
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface Banner {
    id?: string;
    title: string;
    subtitle?: string;
    image_url: string;
    link: string;
    bg_color_from?: string; // Gradient start
    bg_color_to?: string;   // Gradient end
    is_active?: boolean;
    order?: number;         // For sorting
}

const LOCAL_STORAGE_KEY = 'adminBanners';

export const getBanners = async (): Promise<Banner[]> => {
    // 1. Try Supabase
    // 1. Try Supabase
    if (isSupabaseConfigured()) {
        try {
            // Create a promise that rejects after 1.5 seconds
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Supabase fetch timeout')), 1500);
            });

            // Race Supabase fetch against timeout
            const supabasePromise = supabase
                .from('banners')
                .select('*')
                .eq('is_active', true)
                .order('order', { ascending: true })
                .limit(3);

            const { data, error } = await Promise.race([supabasePromise, timeoutPromise]) as any;

            if (!error && data) {
                // Supabase success
                if (typeof window !== 'undefined') {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
                }
                return mergeWithLocal(data);
            }
        } catch (e: any) {
            // If timeout or other error, just fall through to local storage
            if (e?.message !== 'Supabase fetch timeout' &&
                !(e?.name === 'AbortError' || e?.message?.includes('aborted') || e?.message?.includes('signal is aborted'))) {
                console.warn('Banner fetch skipped/failed (using local):', e.message);
            }
        }
    }

    // 2. Fallback to Local Storage
    return getLocalBanners();
};

const mergeWithLocal = (serverData: Banner[]): Banner[] => {
    if (typeof window === 'undefined') return serverData;
    const local = getLocalBanners();
    const localOnly = local.filter(b => b.id && b.id.startsWith('local-'));
    return [...serverData, ...localOnly];
};

const getLocalBanners = (): Banner[] => {
    if (typeof window === 'undefined') return [];
    try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.filter((b: any) => !b.image_url || b.image_url.length < 2000000);
        }
    } catch { } // Ignore JSON errors

    // Default data if local is empty
    return [
        {
            id: 'default-1',
            title: 'New Season Sale',
            subtitle: 'Up to 50% Off',
            image_url: '/images/hero/hero-product-group.png',
            link: '/products',
            bg_color_from: '#00C6FF',
            bg_color_to: '#0072FF',
            is_active: true
        },
        {
            id: 'default-2',
            title: 'Latest Gadgets',
            subtitle: 'Starting at ₹99',
            image_url: 'https://placehold.co/500x300/png?text=Gadgets',
            link: '/products?category=electronics',
            bg_color_from: '#FF6A00',
            bg_color_to: '#FF9000',
            is_active: true
        }
    ];
};

export const resetAllBanners = async () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    // Attempt to delete all banners from Supabase if possible (requires RLS policy allowing delete)
    if (isSupabaseConfigured()) {
        try {
            await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete allow rows
        } catch (e) {
            console.error("Failed to clear Supabase banners", e);
        }
    }
    return true;
};

export const saveBanner = async (banner: Banner): Promise<boolean> => {
    // Save locally first
    let savedBanners = [];
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        savedBanners = stored ? JSON.parse(stored) : [];

        if (banner.id) {
            const index = savedBanners.findIndex((b: Banner) => b.id === banner.id);
            if (index >= 0) savedBanners[index] = banner;
            else savedBanners.push(banner);
        } else {
            // Generate a temp ID if new
            const newBanner = { ...banner, id: `local-${Date.now()}` };
            savedBanners.push(newBanner);
            // Update the arg for Supabase use (though ID is omitted for insert usually)
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedBanners));
    }

    if (isSupabaseConfigured()) {
        try {
            const payload = {
                title: banner.title,
                subtitle: banner.subtitle,
                image_url: banner.image_url,
                link: banner.link,
                bg_color_from: banner.bg_color_from,
                bg_color_to: banner.bg_color_to,
                is_active: banner.is_active !== false,
                order: banner.order || 0
            };

            if (banner.id && !banner.id.startsWith('local-')) {
                const { error } = await supabase
                    .from('banners')
                    .update(payload)
                    .eq('id', banner.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('banners')
                    .insert([payload]);
                if (error) throw error;
            }
            return true;
        } catch (e: any) {
            if (e?.name === 'AbortError' || e?.message?.includes('aborted') || e?.message?.includes('signal is aborted')) {
                return false;
            }
            console.error('Error saving banner to Supabase', e);
            return false; // Return false but local is saved
        }
    }

    return true; // Local save success logic
};

export const deleteBanner = async (id: string): Promise<boolean> => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            const banners = JSON.parse(stored);
            const updated = banners.filter((b: Banner) => b.id !== id);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        }
    }

    if (isSupabaseConfigured() && !id.startsWith('local-')) {
        try {
            const { error } = await supabase.from('banners').delete().eq('id', id);
            if (error) throw error;
        } catch (e: any) {
            if (e?.name === 'AbortError' || e?.message?.includes('aborted') || e?.message?.includes('signal is aborted')) {
                return false;
            }
            console.error('Error deleting banner from Supabase', e);
            return false;
        }
    }
    return true;
};
