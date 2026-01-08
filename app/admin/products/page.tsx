'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import { Product, getProducts, saveProducts } from '@/api/products';
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
    
    loadProducts();
    const action = searchParams?.get('action');
    if (action === 'add') {
      setShowForm(true);
      setEditingProduct(null);
    }
  }, [searchParams, isAuthenticated]);

  const loadProducts = () => {
    const loadedProducts = getProducts();
    setProducts(loadedProducts);
  };

  const handleSave = (productData: Partial<Product>) => {
    let updatedProducts: Product[];

    if (editingProduct) {
      // Update existing product
      updatedProducts = products.map(p =>
        p.Id === editingProduct.Id ? { ...p, ...productData } : p
      );
    } else {
      // Add new product
      const newProduct: Product = {
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

    saveProducts(updatedProducts);
    setProducts(updatedProducts);
    setShowForm(false);
    setEditingProduct(null);
    router.push('/admin/products');
  };

  const handleDelete = (productId: string) => {
    const updatedProducts = products.filter(p => p.Id !== productId);
    saveProducts(updatedProducts);
    setProducts(updatedProducts);
    setDeleteConfirm(null);
  };

  const handleToggleVisibility = (productId: string) => {
    const updatedProducts = products.map(p =>
      p.Id === productId ? { ...p, visible: !p.visible } : p
    );
    saveProducts(updatedProducts);
    setProducts(updatedProducts);
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
                            ${product.price}
                          </span>
                          {product.originalPrice && (
                            <span style={{
                              marginLeft: '10px',
                              textDecoration: 'line-through',
                              color: 'var(--color-default)',
                              fontSize: '14px'
                            }}>
                              ${product.originalPrice}
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

// Product Form Component
const ProductForm: React.FC<{
  product: Product | null;
  onSave: (data: Partial<Product>) => void;
  onCancel: () => void;
}> = ({ product, onSave, onCancel }) => {
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
    visible: product?.visible ?? true
  });

  const [newFeature, setNewFeature] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(formData);
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

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '15px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '24px', margin: 0 }}>
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              color: 'var(--color-default)',
              cursor: 'pointer',
              padding: '5px 10px',
              lineHeight: '1',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#f6f6f8'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-heading)';
              e.currentTarget.style.backgroundColor = '#e7e8ec';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-default)';
              e.currentTarget.style.backgroundColor = '#f6f6f8';
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-20">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Product Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    title: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
                  });
                }}
                required
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '7px',
                  border: '1px solid #e7e8ec',
                  fontSize: '16px'
                }}
              />
            </div>

            <div className="col-md-6 mb-20">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '7px',
                  border: '1px solid #e7e8ec',
                  fontSize: '16px'
                }}
              />
            </div>

            <div className="col-md-6 mb-20">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Price *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '7px',
                  border: '1px solid #e7e8ec',
                  fontSize: '16px'
                }}
              />
            </div>

            <div className="col-md-6 mb-20">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Original Price
              </label>
              <input
                type="number"
                value={formData.originalPrice || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  originalPrice: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '7px',
                  border: '1px solid #e7e8ec',
                  fontSize: '16px'
                }}
              />
            </div>

            <div className="col-md-6 mb-20">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '7px',
                  border: '1px solid #e7e8ec',
                  fontSize: '16px'
                }}
              />
            </div>

            <div className="col-md-6 mb-20">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Rating
              </label>
              <input
                type="number"
                value={formData.rating || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  rating: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                min="0"
                max="5"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '7px',
                  border: '1px solid #e7e8ec',
                  fontSize: '16px'
                }}
              />
            </div>

            <div className="col-12 mb-20">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '7px',
                  border: '1px solid #e7e8ec',
                  fontSize: '16px',
                  fontFamily: 'var(--font-body)'
                }}
              />
            </div>

            <div className="col-12 mb-20">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Long Description
              </label>
              <textarea
                value={formData.longDescription}
                onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '7px',
                  border: '1px solid #e7e8ec',
                  fontSize: '16px',
                  fontFamily: 'var(--font-body)'
                }}
              />
            </div>

            <div className="col-md-6 mb-20">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  style={{ width: '20px', height: '20px' }}
                />
                <span>In Stock</span>
              </label>
            </div>

            <div className="col-md-6 mb-20">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.visible !== false}
                  onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                  style={{ width: '20px', height: '20px' }}
                />
                <span>Visible on Storefront</span>
              </label>
            </div>

            <div className="col-12 mb-20">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Features
              </label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  placeholder="Add feature"
                  style={{
                    flex: 1,
                    padding: '10px 15px',
                    borderRadius: '7px',
                    border: '1px solid #e7e8ec',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="thm-btn thm-btn--border"
                  style={{ padding: '10px 20px' }}
                >
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {formData.features?.map((feature, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: '#f6f6f8',
                      borderRadius: '5px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#c62828',
                        padding: 0,
                        fontSize: '14px'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="col-12 mb-30">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Tags
              </label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag"
                  style={{
                    flex: 1,
                    padding: '10px 15px',
                    borderRadius: '7px',
                    border: '1px solid #e7e8ec',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="thm-btn thm-btn--border"
                  style={{ padding: '10px 20px' }}
                >
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {formData.tags?.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: '#f6f6f8',
                      borderRadius: '5px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#c62828',
                        padding: 0,
                        fontSize: '14px'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
            <button
              type="button"
              onClick={onCancel}
              className="thm-btn thm-btn--border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="thm-btn thm-btn--aso thm-btn--aso_yellow"
            >
              {product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductsPage;

