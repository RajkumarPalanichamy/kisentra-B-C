// products-supabase.ts - Supabase integration for products
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product } from './products';
import Products from './products';

// Get products from Supabase or fallback to localStorage/default
export const getProductsFromSupabase = async (): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage if Supabase not configured
    if (typeof window !== 'undefined') {
      const savedProducts = localStorage.getItem('adminProducts');
      if (savedProducts) {
        try {
          return JSON.parse(savedProducts);
        } catch (error) {
          console.error('Error parsing saved products:', error);
        }
      }
    }
    return Products;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      // Ignore abort errors
      if (error.message?.includes('aborted') || error.code === '20') return Products; // 20 is sometimes code for abort/cancel

      console.error('Error fetching products from Supabase:', JSON.stringify(error, null, 2));

      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const savedProducts = localStorage.getItem('adminProducts');
        if (savedProducts) {
          try {
            return JSON.parse(savedProducts);
          } catch (e) {
            return Products;
          }
        }
      }
      return Products;
    }

    // Transform Supabase data to match Product interface
    return (data || []).map((item: any) => ({
      Id: item.id,
      title: item.title,
      slug: item.slug,
      price: parseFloat(item.price),
      originalPrice: item.original_price ? parseFloat(item.original_price) : undefined,
      description: item.description,
      longDescription: item.long_description || item.description,
      category: item.category,
      images: item.images || [],
      inStock: item.stock > 0,
      rating: item.rating ? parseFloat(item.rating) : undefined,
      reviews: item.reviews || undefined,
      features: item.features || [],
      tags: item.tags || [],
      visible: item.is_active !== false,
    }));
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('signal is aborted')) {
      return Products;
    }
    console.error('Error in getProductsFromSupabase:', error);
    return Products;
  }
};

// Save product to Supabase
export const saveProductToSupabase = async (product: Partial<Product>): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    return false;
  }

  if (!product.slug) {
    console.error('Product slug is required');
    return false;
  }

  try {
    const productData: any = {
      title: product.title,
      slug: product.slug,
      price: product.price,
      original_price: product.originalPrice || null,
      description: product.description || null,
      long_description: product.longDescription || product.description || null,
      category: product.category,
      images: (product.images || []).map((img: any) => {
        if (typeof img === 'string') return img;
        return img.src || img; // Handle StaticImageData or object with src
      }),
      stock: product.inStock ? 100 : 0,
      rating: product.rating || null,
      reviews: product.reviews || null,
      features: product.features || [],
      tags: product.tags || [],
      is_active: product.visible !== false,
      updated_at: new Date().toISOString(),
    };

    let existingId: string | undefined;

    // 1. Try to match by ID if it's a UUID (Supabase ID)
    // UUID regex basic check or just length > 20
    if (product.Id && product.Id.length > 20) {
      existingId = product.Id;
    }

    // 2. If no ID match candidate, check by Slug
    if (!existingId) {
      const { data: existingBySlug, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', product.slug)
        .single();

      if (!checkError && existingBySlug) {
        existingId = existingBySlug.id;
      }
    }

    if (existingId) {
      // Update existing product
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', existingId);

      if (error) {
        console.error('Error updating product:', error);
        return false;
      }
    } else {
      // Insert new product
      const { error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) {
        console.error('Error inserting product:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in saveProductToSupabase:', error);
    return false;
  }
};

// Delete product from Supabase
export const deleteProductFromSupabase = async (productId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteProductFromSupabase:', error);
    return false;
  }
};

