'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import { Product, getProducts, saveProducts } from '@/api/products';
import { getCategories, Category } from '@/api/categories';
import Products from '@/api/products';
import { Fade } from 'react-awesome-reveal';
import Image from 'next/image';

const AdminProductsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAdmin();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Immediate redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/admin/login';
      return;
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isAuthenticated) return; // Don't load if not authenticated

    const controller = new AbortController();
    loadProducts(controller.signal);
    const action = searchParams?.get('action');
    if (action === 'add') {
      setShowForm(true);
      setEditingProduct(null);
    }

    return () => controller.abort();
  }, [searchParams, isAuthenticated]);

  const loadProducts = async (signal?: AbortSignal) => {
    if (signal?.aborted) return;

    // Load local first for speed
    const loadedProducts = getProducts();
    setProducts(loadedProducts);

    // Then try to fetch fresh data from server
    try {
      const { getProductsFromSupabaseAsync } = await import('@/api/products');
      const remoteProducts = await getProductsFromSupabaseAsync(signal);
      if (signal?.aborted) return;
      if (remoteProducts) {
        setProducts(remoteProducts);
        // Also update local cache
        localStorage.setItem('adminProducts', JSON.stringify(remoteProducts));
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('signal is aborted')) {
        return;
      }
      console.error("Failed to load remote products", error);
    }
  };

  const handleSave = async (productData: Partial<Product>) => {
    let newProduct: Product;
    let updatedProducts: Product[];

    if (editingProduct) {
      // Update existing product
      newProduct = { ...editingProduct, ...productData } as Product;
      updatedProducts = products.map(p =>
        p.Id === editingProduct.Id ? newProduct : p
      );
    } else {
      // Add new product
      newProduct = {
        Id: Date.now().toString(),
        title: productData.title || '',
        slug: productData.slug || productData.title?.toLowerCase().replace(/\s+/g, '-') || '',
        price: productData.price || 0,
        originalPrice: productData.originalPrice,
        description: productData.description || '',
        longDescription: productData.longDescription || productData.description || '',
        category: productData.category || '',
        images: productData.images || [],
        inStock: productData.inStock ?? true,
        rating: productData.rating,
        reviews: productData.reviews,
        features: productData.features || [],
        tags: productData.tags || [],
        visible: productData.visible ?? true
      };
      updatedProducts = [...products, newProduct];
    }

    // Optimistic UI update
    setProducts(updatedProducts);
    setShowForm(false);
    setEditingProduct(null);
    router.push('/admin/products');

    // Save properly
    const { saveProduct } = await import('@/api/products');
    await saveProduct(newProduct);
  };

  const handleDelete = async (productId: string) => {
    // Optimistic UI update
    const updatedProducts = products.filter(p => p.Id !== productId);
    setProducts(updatedProducts);
    setDeleteConfirm(null);

    // API call
    const { deleteProduct } = await import('@/api/products');
    await deleteProduct(productId);
  };

  const handleToggleVisibility = async (productId: string) => {
    const product = products.find(p => p.Id === productId);
    if (!product) return;

    const updatedProduct = { ...product, visible: !product.visible };
    const updatedProducts = products.map(p =>
      p.Id === productId ? updatedProduct : p
    );

    // Optimistic update
    setProducts(updatedProducts);

    // Save
    const { saveProduct } = await import('@/api/products');
    await saveProduct(updatedProduct);
  };

  // Don't render if loading or not authenticated (layout will handle redirect)
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div>
      <Fade direction="up" triggerOnce duration={1000}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'var(--color-heading)',
              marginBottom: '10px'
            }}>
              Product Management
            </h1>
            <p style={{ color: 'var(--color-default)' }}>
              Manage your product catalog
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
              }}
              className="thm-btn thm-btn--aso thm-btn--aso_yellow"
            >
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
              Add Product
            </button>
          </div>
        </div>
      </Fade>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
            router.push('/admin/products');
          }}
        />
      )}

      {/* Products Table */}
      <Fade direction="up" triggerOnce duration={1000} delay={200}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '15px',
          border: '1px solid #e7e8ec',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f6f6f8', borderBottom: '2px solid #e7e8ec' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Image</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Product</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Category</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Price</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Stock</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => {
                  const mainImage = typeof product.images[0] === 'string'
                    ? product.images[0]
                    : product.images[0]?.src || product.images[0];

                  return (
                    <tr key={product.Id} style={{
                      borderBottom: '1px solid #e7e8ec',
                      transition: 'background-color 0.2s'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '15px' }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#f6f6f8',
                          position: 'relative'
                        }}>
                          {mainImage && (
                            <Image
                              src={mainImage}
                              alt={product.title}
                              fill
                              sizes="60px"
                              style={{ objectFit: 'cover' }}
                            />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                            {product.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-default)' }}>
                            {product.description.substring(0, 50)}...
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>{product.category}</td>
                      <td style={{ padding: '15px' }}>
                        <div>
                          <span style={{ fontWeight: '700', color: 'var(--color-primary-two)' }}>
                            ₹{product.price}
                          </span>
                          {product.originalPrice && (
                            <span style={{
                              marginLeft: '10px',
                              textDecoration: 'line-through',
                              color: 'var(--color-default)',
                              fontSize: '14px'
                            }}>
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '5px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: product.inStock ? '#e8f5e9' : '#ffebee',
                          color: product.inStock ? '#2e7d32' : '#c62828'
                        }}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <button
                          onClick={() => handleToggleVisibility(product.Id)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: product.visible !== false ? '#e8f5e9' : '#ffebee',
                            color: product.visible !== false ? '#2e7d32' : '#c62828'
                          }}
                        >
                          {product.visible !== false ? 'Visible' : 'Hidden'}
                        </button>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setShowForm(true);
                            }}
                            style={{
                              padding: '8px 15px',
                              borderRadius: '5px',
                              border: '1px solid #e7e8ec',
                              backgroundColor: '#fff',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: 'var(--color-heading)'
                            }}
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.Id)}
                            style={{
                              padding: '8px 15px',
                              borderRadius: '5px',
                              border: '1px solid #e7e8ec',
                              backgroundColor: '#fff',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#c62828'
                            }}
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Fade>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '15px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '15px', fontSize: '20px' }}>Confirm Delete</h3>
            <p style={{ marginBottom: '20px', color: 'var(--color-default)' }}>
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="thm-btn thm-btn--border"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  padding: '12px 25px',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: '#c62828',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable form components - defined outside to prevent re-creation on each render
const InputLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-heading)', fontSize: '14px' }}>
    {children}
    {required && <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span>}
  </label>
);

const StyledInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { error?: string }> = (props) => (
  <div>
    <input
      {...props}
      style={{
        width: '100%',
        padding: '12px 15px',
        borderRadius: '8px',
        border: `1px solid ${props.error ? '#ff4d4f' : '#e7e8ec'}`,
        fontSize: '15px',
        outline: 'none',
        transition: 'border-color 0.2s',
        backgroundColor: '#fff'
      }}
      onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-two)'}
      onBlur={(e) => e.target.style.borderColor = props.error ? '#ff4d4f' : '#e7e8ec'}
    />
    {props.error && <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{props.error}</div>}
  </div>
);

const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) => (
  <div style={{ position: 'relative' }}>
    <select
      {...props}
      style={{
        width: '100%',
        padding: '12px 15px',
        borderRadius: '8px',
        border: `1px solid ${props.error ? '#ff4d4f' : '#e7e8ec'}`,
        fontSize: '15px',
        outline: 'none',
        backgroundColor: '#fff',
        cursor: 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 15px center',
        paddingRight: '40px'
      }}
    >
      {props.children}
    </select>
    {props.error && <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{props.error}</div>}
  </div>
);

// Product Form Component
const ProductForm: React.FC<{
  product: Product | null;
  onSave: (data: Partial<Product>) => void;
  onCancel: () => void;
}> = ({ product, onSave, onCancel }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'details' | 'media' | 'attributes'>('general');

  useEffect(() => {
    getCategories().then(setCategories).catch(() => { });
  }, []);

  const [formData, setFormData] = useState<Partial<Product>>({
    title: product?.title || '',
    slug: product?.slug || '',
    price: product?.price || 0,
    originalPrice: product?.originalPrice,
    description: product?.description || '',
    longDescription: product?.longDescription || '',
    category: product?.category || '',
    inStock: product?.inStock ?? true,
    rating: product?.rating,
    reviews: product?.reviews,
    features: product?.features || [],
    tags: product?.tags || [],
    highlights: product?.highlights || {},
    visible: product?.visible ?? true
  });

  const [newFeature, setNewFeature] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newHighlightKey, setNewHighlightKey] = useState('');
  const [newHighlightValue, setNewHighlightValue] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.images || formData.images.length === 0) newErrors.images = 'At least one image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    } else {
      // Find the tab with the first error and switch to it
      if (errors.title || errors.category || errors.price) setActiveTab('general');
      else if (errors.images) setActiveTab('media');

      alert('Please fix the errors before saving.');
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features?.filter((_, i) => i !== index)
    });
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((_, i) => i !== index)
    });
  };

  const addHighlight = () => {
    if (newHighlightKey.trim() && newHighlightValue.trim()) {
      setFormData({
        ...formData,
        highlights: {
          ...(formData.highlights || {}),
          [newHighlightKey.trim()]: newHighlightValue.trim()
        }
      });
      setNewHighlightKey('');
      setNewHighlightValue('');
    }
  };

  const removeHighlight = (key: string) => {
    const newHighlights = { ...(formData.highlights || {}) };
    delete newHighlights[key];
    setFormData({
      ...formData,
      highlights: newHighlights
    });
  };

  // Image compression helper
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG 70%
        };
      };
    });
  };

  const handleDragDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.style.borderColor = '#e0e0e0';
    target.style.backgroundColor = '#f8f9fa';
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const compressedImages = await Promise.all(files.map(compressImage));
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...compressedImages]
      }));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const compressedImages = await Promise.all(files.map(compressImage));
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...compressedImages]
      }));
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '20px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
          animation: 'slideUp 0.3s ease-out',
          position: 'relative',
          overflow: 'visible'
        }}>

        {/* Header */}
        <div style={{
          padding: '25px 30px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fcfcfc',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: 'var(--color-heading)' }}>
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p style={{ margin: '5px 0 0', color: 'var(--color-default)', fontSize: '14px' }}>
              Fill in the details below to {product ? 'update' : 'create'} your product.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: '#f1f1f1',
              border: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#666',
              transition: 'all 0.2s',
              fontSize: '18px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e1e1e1'; e.currentTarget.style.color = '#333'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f1f1'; e.currentTarget.style.color = '#666'; }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          padding: '0 30px',
          borderBottom: '1px solid #eee',
          backgroundColor: '#fff'
        }}>
          {[
            { id: 'general', label: 'General Info', icon: 'fa-info-circle' },
            { id: 'details', label: 'Details', icon: 'fa-align-left' },
            { id: 'media', label: 'Media', icon: 'fa-images' },
            { id: 'attributes', label: 'Attributes & Metadata', icon: 'fa-list-ul' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '18px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary-two)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--color-primary-two)' : '#666',
                fontWeight: activeTab === tab.id ? '700' : '500',
                cursor: 'pointer',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
              {tab.id === 'general' && (errors.title || errors.price || errors.category) &&
                <span style={{ width: '6px', height: '6px', backgroundColor: '#ff4d4f', borderRadius: '50%', display: 'inline-block', marginBottom: '8px' }}></span>}
              {tab.id === 'media' && errors.images &&
                <span style={{ width: '6px', height: '6px', backgroundColor: '#ff4d4f', borderRadius: '50%', display: 'inline-block', marginBottom: '8px' }}></span>}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', overflowX: 'visible', position: 'relative', zIndex: 1 }}>
          <div style={{ padding: '30px', position: 'relative', minHeight: 'fit-content', overflow: 'visible' }}>

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="row" style={{ position: 'relative', overflow: 'visible' }}>
                <div className="col-12 mb-30">
                  <InputLabel required>Product Title</InputLabel>
                  <StyledInput
                    type="text"
                    placeholder="e.g. Premium Business Consultation"
                    value={formData.title}
                    error={errors.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        title: newTitle,
                        // Only auto-generate slug if user hasn't manually edited it
                        slug: (!product && !slugManuallyEdited) ? newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug
                      }));
                      if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                    }}
                  />
                </div>

                <div className="col-12 mb-30">
                  <InputLabel required>URL Slug</InputLabel>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <StyledInput
                      type="text"
                      value={formData.slug}
                      placeholder="premium-business-consultation"
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        setFormData(prev => ({ ...prev, slug: e.target.value }));
                      }}
                    />
                    <button
                      type="button"
                      className="thm-btn thm-btn--border"
                      onClick={() => {
                        setFormData(prev => {
                          const generatedSlug = prev.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
                          return { ...prev, slug: generatedSlug };
                        });
                        setSlugManuallyEdited(false);
                      }}
                      title="Generate from Title"
                      style={{ padding: '0 20px', whiteSpace: 'nowrap' }}
                    >
                      <i className="fas fa-sync-alt"></i>
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                    The localized friendly part of the URL. Must be unique.
                  </p>
                </div>

                <div className="col-md-6 mb-30">
                  <InputLabel required>Price (₹)</InputLabel>
                  <StyledInput
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={formData.price || ''}
                    error={errors.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="col-md-6 mb-30">
                  <InputLabel>Original Price (₹)</InputLabel>
                  <StyledInput
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={formData.originalPrice || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || undefined }))}
                  />
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                    Set higher than price to show a discount.
                  </p>
                </div>

                <div className="col-md-12 mb-30" style={{ position: 'relative', zIndex: 1000 }}>
                  <InputLabel required>Category</InputLabel>
                  <div style={{ position: 'relative', zIndex: 1001 }}>
                    <StyledSelect
                      value={formData.category}
                      error={errors.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="">Select a Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id || cat.slug} value={cat.name}>{cat.name}</option>
                      ))}
                    </StyledSelect>
                  </div>
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="row">
                <div className="col-12 mb-30">
                  <InputLabel required>Short Description</InputLabel>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '8px',
                      border: '1px solid #e7e8ec',
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-two)'}
                    onBlur={(e) => e.target.style.borderColor = '#e7e8ec'}
                    placeholder="Brief summary of the product (1-2 sentences)"
                  />
                </div>

                <div className="col-12 mb-30">
                  <InputLabel>Long Description</InputLabel>
                  <textarea
                    rows={10}
                    value={formData.longDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, longDescription: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '8px',
                      border: '1px solid #e7e8ec',
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                      lineHeight: '1.6'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-two)'}
                    onBlur={(e) => e.target.style.borderColor = '#e7e8ec'}
                    placeholder="Detailed description of the product..."
                  />
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div>
                <div className="mb-30">
                  <InputLabel required>Product Images</InputLabel>
                  <div
                    style={{
                      border: `2px dashed ${errors.images ? '#ff4d4f' : '#e0e0e0'}`,
                      borderRadius: '12px',
                      padding: '40px',
                      textAlign: 'center',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--color-primary-two)';
                      e.currentTarget.style.backgroundColor = '#f0f7ff';
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onDrop={handleDragDrop}
                    onClick={() => document.getElementById('product-image-upload')?.click()}
                  >
                    <input
                      type="file"
                      id="product-image-upload"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fff',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
                    }}>
                      <i className="fas fa-cloud-upload-alt" style={{ fontSize: '24px', color: 'var(--color-primary-two)' }}></i>
                    </div>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#424242' }}>
                      Click or Drag & Drop to Upload
                    </h4>
                    <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
                      Supported formats: JPG, PNG, WEBP
                    </p>
                  </div>
                  {errors.images && <div style={{ color: '#ff4d4f', fontSize: '13px', marginTop: '8px' }}>{errors.images}</div>}
                </div>

                {/* Image Grid */}
                {formData.images && formData.images.length > 0 && (
                  <div>
                    <h5 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Uploaded Images ({formData.images.length})</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
                      {formData.images.map((img, index) => (
                        <div key={index} style={{
                          position: 'relative',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '1px solid #eee',
                          aspectRatio: '1/1',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}>
                          <img
                            src={typeof img === 'string' ? img : (img as any).src}
                            alt={`Preview ${index}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {/* Actions Overlay */}
                          <div className="image-overlay" style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = [...(formData.images || [])];
                                newImages.splice(index, 1);
                                setFormData({ ...formData, images: newImages });
                              }}
                              style={{
                                background: '#fff', border: 'none', width: '30px', height: '30px',
                                borderRadius: '50%', color: '#ff4d4f', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                          {index === 0 && (
                            <div style={{
                              position: 'absolute', bottom: '0', left: '0', right: '0',
                              background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px',
                              padding: '4px', textAlign: 'center', fontWeight: '600'
                            }}>
                              Main Image
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attributes Tab */}
            {activeTab === 'attributes' && (
              <div className="row">
                <div className="col-md-6 mb-30">
                  <InputLabel>Rating (0-5)</InputLabel>
                  <StyledInput
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    placeholder="4.5"
                    value={formData.rating || ''}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || undefined })}
                  />
                </div>

                <div className="col-md-6 mb-30">
                  <InputLabel>Review Count</InputLabel>
                  <StyledInput
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.reviews || ''}
                    onChange={(e) => setFormData({ ...formData, reviews: parseInt(e.target.value) || undefined })}
                  />
                </div>

                <div className="col-12 mb-30">
                  <div style={{ display: 'flex', gap: '30px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{
                        width: '44px', height: '24px', backgroundColor: formData.inStock ? '#4caf50' : '#ddd',
                        borderRadius: '12px', position: 'relative', transition: 'background-color 0.2s'
                      }}>
                        <div style={{
                          width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%',
                          position: 'absolute', top: '2px', left: formData.inStock ? '22px' : '2px',
                          transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                        <input
                          type="checkbox"
                          checked={formData.inStock}
                          onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                          style={{ display: 'none' }}
                        />
                      </div>
                      <span style={{ fontWeight: '600', color: 'var(--color-heading)' }}>In Stock</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{
                        width: '44px', height: '24px', backgroundColor: formData.visible !== false ? '#2196f3' : '#ddd',
                        borderRadius: '12px', position: 'relative', transition: 'background-color 0.2s'
                      }}>
                        <div style={{
                          width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%',
                          position: 'absolute', top: '2px', left: formData.visible !== false ? '22px' : '2px',
                          transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                        <input
                          type="checkbox"
                          checked={formData.visible !== false}
                          onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                          style={{ display: 'none' }}
                        />
                      </div>
                      <span style={{ fontWeight: '600', color: 'var(--color-heading)' }}>Visible on Store</span>
                    </label>
                  </div>
                </div>

                <div className="col-12 mb-30">
                  <InputLabel>Features</InputLabel>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                      type="text"
                      value={newFeature}
                      placeholder="Add a product feature (e.g. 'Wireless Charging')"
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      style={{
                        flex: 1, padding: '12px 15px', borderRadius: '8px', border: '1px solid #e7e8ec', fontSize: '15px', outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="thm-btn"
                      style={{ padding: '0 25px', borderRadius: '8px' }}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {formData.features?.map((feature, index) => (
                      <div key={index} style={{
                        padding: '8px 15px', backgroundColor: '#f0f4f8', color: '#444',
                        borderRadius: '20px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px'
                      }}>
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          style={{ border: 'none', background: 'none', color: '#aaa', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ff4d4f'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#aaa'}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                    {(!formData.features || formData.features.length === 0) && (
                      <span style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>No features added yet.</span>
                    )}
                  </div>
                </div>

                <div className="col-12 mb-30">
                  <InputLabel>Tags</InputLabel>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                      type="text"
                      value={newTag}
                      placeholder="Add a search tag (e.g. 'bestseller')"
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      style={{
                        flex: 1, padding: '12px 15px', borderRadius: '8px', border: '1px solid #e7e8ec', fontSize: '15px', outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="thm-btn thm-btn--border"
                      style={{ padding: '0 25px', borderRadius: '8px' }}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {formData.tags?.map((tag, index) => (
                      <div key={index} style={{
                        padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #e7e8ec', color: '#666',
                        borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
                      }}>
                        # {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ff4d4f'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-12 mb-20">
                  <InputLabel>Highlights / Specifications</InputLabel>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>
                    Add key specifications that will be displayed in the product highlights section (e.g., Material, Capacity, Weight)
                  </p>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={newHighlightKey}
                      placeholder="Key (e.g., 'Material')"
                      onChange={(e) => setNewHighlightKey(e.target.value)}
                      style={{
                        flex: 1, minWidth: '150px', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e7e8ec', fontSize: '15px', outline: 'none'
                      }}
                    />
                    <input
                      type="text"
                      value={newHighlightValue}
                      placeholder="Value (e.g., 'Plastic')"
                      onChange={(e) => setNewHighlightValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && newHighlightKey && newHighlightValue && (e.preventDefault(), addHighlight())}
                      style={{
                        flex: 1, minWidth: '150px', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e7e8ec', fontSize: '15px', outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="thm-btn"
                      style={{ padding: '0 25px', borderRadius: '8px', whiteSpace: 'nowrap' }}
                      disabled={!newHighlightKey || !newHighlightValue}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {formData.highlights && Object.entries(formData.highlights).map(([key, value]) => (
                      <div key={key} style={{
                        padding: '12px 15px', backgroundColor: '#f0f4f8', border: '1px solid #e7e8ec', borderRadius: '8px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px'
                      }}>
                        <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <strong style={{ minWidth: '120px', color: '#555' }}>{key}:</strong>
                          <span style={{ color: '#333' }}>{value}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeHighlight(key)}
                          style={{ border: 'none', background: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '16px', padding: '5px' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#c62828'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#ff4d4f'}
                          title="Remove highlight"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                    {(!formData.highlights || Object.keys(formData.highlights).length === 0) && (
                      <span style={{ color: '#999', fontSize: '14px', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                        No highlights added yet. Add key specifications like Material, Capacity, Weight, etc.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px 30px',
            borderTop: '1px solid #eee',
            backgroundColor: '#fcfcfc',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '15px',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px'
          }}>
            <button
              type="button"
              onClick={onCancel}
              className="thm-btn thm-btn--border"
              style={{ padding: '12px 30px', borderRadius: '8px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="thm-btn thm-btn--aso thm-btn--aso_yellow"
              style={{ padding: '12px 30px', borderRadius: '8px' }}
            >
              {product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminProductsPage;

