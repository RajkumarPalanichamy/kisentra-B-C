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
      highlights: item.highlights || {},
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
    // Build base product data without highlights first
    const baseProductData: any = {
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

    // Try with highlights first, fallback without if column doesn't exist
    const productDataWithHighlights = {
      ...baseProductData,
      highlights: product.highlights || {},
    };

    let existingId: string | undefined;

    // 1. Try to match by ID if it's a UUID (Supabase ID)
    // UUID regex basic check or just length > 20
    if (product.Id && product.Id.length > 20) {
      existingId = product.Id;
    }

    // 2. If no ID match candidate, check by Slug
    if (!existingId) {
      // NOTE: PostgREST returns 406 (PGRST116) for `.single()` when 0 rows match.
      // We want "not found" to be a normal case, so use maybeSingle().
      const { data: existingBySlug, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', product.slug)
        .maybeSingle();

      // maybeSingle() returns:
      // - data: null, error: null when no rows match
      // - data: {id}, error: null when one row matches
      // - error when multiple rows match or other failures
      if (!checkError && existingBySlug?.id) {
        existingId = existingBySlug.id;
      } else if (checkError) {
        console.error('Error checking existing product by slug:', checkError);
      }
    }

    // Helper function to attempt save
    const attemptSave = async (dataToSave: any, isUpdate: boolean): Promise<{ success: boolean; isColumnError: boolean }> => {
      let result: any;
      
      if (isUpdate) {
        result = await supabase
          .from('products')
          .update(dataToSave)
          .eq('id', existingId!)
          .select();
      } else {
        result = await supabase
          .from('products')
          .insert([dataToSave])
          .select();
      }

      if (result.error) {
        const error = result.error;
        const isColumnError = error.message?.includes('column') && 
                             (error.message?.includes('not found') || 
                              error.message?.includes('does not exist') ||
                              error.message?.includes('highlights'));
        
        if (isColumnError) {
          return { success: false, isColumnError: true };
        }
        
        // Other errors - log and return
        let errorString = 'Unable to serialize error';
        try {
          errorString = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
        } catch (e) {
          errorString = `Error object: ${error.toString()}`;
        }
        
        console.error(`❌ Error ${isUpdate ? 'updating' : 'inserting'} product:`, {
          message: error.message || 'No error message',
          code: error.code || 'No error code',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          productId: existingId,
          productSlug: product.slug,
          productTitle: product.title,
          fullError: errorString
        });
        
        return { success: false, isColumnError: false };
      }
      
      if (result.data && result.data.length > 0) {
        console.log(`✅ Product "${product.title}" ${isUpdate ? 'updated' : 'inserted'} successfully`);
      }
      
      return { success: true, isColumnError: false };
    };

    const isUpdate = !!existingId;
    
    // Try with highlights first
    let saveResult = await attemptSave(productDataWithHighlights, isUpdate);
    
    // If it failed due to missing column, retry without highlights
    if (!saveResult.success && saveResult.isColumnError) {
      console.warn(`⚠️ Highlights column not found, saving without highlights for "${product.title}"`);
      console.warn('💡 Run supabase_products_highlights.sql to enable highlights feature');
      saveResult = await attemptSave(baseProductData, isUpdate);
    }

    return saveResult.success;
  } catch (error: any) {
    console.error('❌ Error in saveProductToSupabase:', {
      message: error?.message || 'Unknown error',
      name: error?.name,
      stack: error?.stack,
      fullError: error
    });
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

