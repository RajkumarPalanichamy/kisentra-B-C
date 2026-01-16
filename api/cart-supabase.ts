
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CartItem } from '@/contexts/CartContext';
import { Product } from './products';
import { saveProductToSupabase } from './products-supabase';

// Fetch cart from Supabase for a specific user
export const getCartFromSupabase = async (userId: string): Promise<CartItem[]> => {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, returning empty cart');
        return [];
    }

    if (!userId) {
        console.warn('No user ID provided, returning empty cart');
        return [];
    }

    try {
        // We assume there is a 'cart_items' table with product_id referencing products
        // Use left join instead of inner join to handle cases where product might be deleted
        const { data, error } = await supabase
            .from('cart_items')
            .select('*, product:products(*)') // Left join to handle missing products gracefully
            .eq('user_id', userId);

        if (error) {
            // Ignore abort errors
            if (error.message?.includes('AbortError') || error.message?.includes('signal is aborted')) {
                return [];
            }
            console.error('Error fetching cart from Supabase:', error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Transform data to CartItem[], filter out items with missing products
        return (data || [])
            .filter((item: any) => item.product) // Only include items where product exists
            .map((item: any) => {
                const product = item.product;
                // Map using the same logic as products-supabase.ts
                const mappedProduct: Product = {
                    Id: product.id,
                    title: product.title,
                    slug: product.slug,
                    price: parseFloat(product.price),
                    originalPrice: product.original_price ? parseFloat(product.original_price) : undefined,
                    description: product.description,
                    longDescription: product.long_description || product.description,
                    category: product.category,
                    images: product.images || [],
                    inStock: product.stock > 0,
                    rating: product.rating ? parseFloat(product.rating) : undefined,
                    reviews: product.reviews || undefined,
                    features: product.features || [],
                    tags: product.tags || [],
                    visible: product.is_active !== false,
                };

                return {
                    ...mappedProduct,
                    quantity: item.quantity
                };
            });

    } catch (error: any) {
        if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('signal is aborted')) {
            return [];
        }
        console.error('Error in getCartFromSupabase:', error);
        return [];
    }
};

// Add or Update item in Supabase cart
export const syncCartItemToSupabase = async (userId: string, product: Product, quantity: number) => {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, skipping cart sync');
        return;
    }

    if (!userId) {
        console.warn('No user ID provided, skipping cart sync');
        return;
    }

    // Verify the user session is still valid
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session || session.user.id !== userId) {
            console.error('Invalid or expired session, cannot sync cart:', sessionError);
            return;
        }
    } catch (sessionCheckError: any) {
        if (sessionCheckError.name === 'AbortError' || sessionCheckError.message?.includes('AbortError') || sessionCheckError.message?.includes('signal is aborted')) {
            return;
        }
        console.error('Error checking session:', sessionCheckError);
        return;
    }

    try {
        let productId = product.Id;

        // If the product ID is not a UUID (e.g. "1", "2" from local data),
        // we need to find the real UUID from Supabase using the slug
        // Simple regex check for UUID format
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

        if (!isUUID) {
            console.log(`Product ID ${productId} is not a UUID, looking up by slug: ${product.slug}`);
            const { data: realProduct, error } = await supabase
                .from('products')
                .select('id')
                .eq('slug', product.slug)
                .single();

            if (error || !realProduct) {
                console.log(`Product not found in Supabase (slug: ${product.slug}), creating it...`);
                const created = await saveProductToSupabase(product);

                if (!created) {
                    console.error(`Failed to create product in Supabase: ${product.slug}`);
                    return;
                }

                // Try lookup again
                const { data: retryProduct, error: retryError } = await supabase
                    .from('products')
                    .select('id')
                    .eq('slug', product.slug)
                    .single();

                if (retryError || !retryProduct) {
                    console.error(`Could not create/find Supabase UUID for product slug: ${product.slug}`, retryError);
                    return;
                }
                productId = retryProduct.id;
            } else {
                productId = realProduct.id;
            }
        }

        // Check if item exists using the correct UUID
        const { data: existingItem, error: checkError } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .maybeSingle(); // Use maybeSingle() instead of single() to avoid error when no rows

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
            if (checkError.message?.includes('AbortError') || checkError.message?.includes('signal is aborted')) {
                return;
            }
            console.error('Error checking existing cart item:', checkError);
            return;
        }

        if (existingItem) {
            // Update quantity
            if (quantity <= 0) {
                const { error: deleteError } = await supabase.from('cart_items').delete().eq('id', existingItem.id);
                if (deleteError) {
                    console.error('Error deleting cart item:', deleteError);
                }
            } else {
                const { data: updateData, error: updateError } = await supabase
                    .from('cart_items')
                    .update({ quantity, updated_at: new Date().toISOString() })
                    .eq('id', existingItem.id)
                    .select();
                if (updateError) {
                    console.error('Error updating cart item:', updateError);
                    console.error('Update data attempted:', {
                        id: existingItem.id,
                        quantity: quantity
                    });
                } else {
                    console.log('Successfully updated cart item:', updateData);
                }
            }
        } else {
            if (quantity > 0) {
                // Insert new item
                const now = new Date().toISOString();
                const { data: insertData, error: insertError } = await supabase.from('cart_items').insert({
                    user_id: userId,
                    product_id: productId,
                    quantity: quantity,
                    created_at: now,
                    updated_at: now
                }).select();

                if (insertError) {
                    console.error('Error inserting cart item:', insertError);
                    console.error('Insert data attempted:', {
                        user_id: userId,
                        product_id: productId,
                        quantity: quantity
                    });
                    // Log more details about the error
                    if (insertError.code) {
                        console.error('Error code:', insertError.code);
                    }
                    if (insertError.message) {
                        console.error('Error message:', insertError.message);
                    }
                    if (insertError.details) {
                        console.error('Error details:', insertError.details);
                    }
                } else {
                    console.log('Successfully inserted cart item:', insertData);
                }
            }
        }
    } catch (error: any) {
        if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('signal is aborted')) {
            return;
        }
        console.error('Error syncing cart item to Supabase:', error);
        // throw error; // Don't rethrow to keep app stable 
    }
};

// Remove item from Supabase cart
export const removeCartItemFromSupabase = async (userId: string, productId: string) => {
    if (!isSupabaseConfigured()) return;

    try {
        await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId) // Security measure
            .eq('product_id', productId);
    } catch (error: any) {
        if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('aborted')) {
            return;
        }
        console.error('Error removing cart item from Supabase:', error);
    }
};

// Clear cart in Supabase
export const clearSupabaseCart = async (userId: string) => {
    if (!isSupabaseConfigured()) return;

    try {
        await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);
    } catch (error: any) {
        if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('aborted')) {
            return;
        }
        console.error('Error clearing Supabase cart:', error);
    }
};

// Merge local cart upon login
export const mergeLocalCart = async (userId: string, localCart: CartItem[]) => {
    if (!isSupabaseConfigured() || localCart.length === 0) return;

    // This is a naive merge: local overwrites/adds to server
    // In production, you might want more complex logic
    for (const item of localCart) {
        await syncCartItemToSupabase(userId, item, item.quantity);
    }
};
