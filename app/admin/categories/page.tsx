'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import Link from 'next/link';
import { getCategories, saveCategory, deleteCategory, Category } from '@/api/categories';
import { Fade } from 'react-awesome-reveal';

const AdminCategoriesPage = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<Category>({
        name: '',
        slug: '',
        image_url: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        loadCategories().catch(() => { });
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const handleEdit = (category: Category) => {
        setFormData(category);
        setEditingId(category.id || null);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this category?')) {
            await deleteCategory(id);
            loadCategories();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveCategory({ ...formData, id: editingId || undefined });
        setShowModal(false);
        loadCategories();
        setFormData({ name: '', slug: '', image_url: '' });
        setEditingId(null);
    };

    // Image compression helper (reused from products)
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 200; // Smaller icon size for categories
                    const MAX_HEIGHT = 200;
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
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
            };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const compressed = await compressImage(e.target.files[0]);
            setFormData({ ...formData, image_url: compressed });
        }
    };

    return (
        <div>
            <Fade direction="down" triggerOnce>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 className="title" style={{ fontSize: '32px' }}>Manage Categories</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link href="/admin/dashboard" className="thm-btn thm-btn--border" style={{ padding: '10px 20px', fontSize: '14px' }}>
                            Back to Dashboard
                        </Link>
                        <button
                            onClick={() => {
                                setFormData({ name: '', slug: '', image_url: '' });
                                setEditingId(null);
                                setShowModal(true);
                            }}
                            className="thm-btn"
                            style={{ padding: '10px 20px', fontSize: '14px' }}
                        >
                            <i className="fas fa-plus mr-2"></i> Add Category
                        </button>
                    </div>
                </div>
            </Fade>

            <div className="row">
                {categories.map((cat) => (
                    <div key={cat.id || cat.slug} className="col-lg-3 col-md-4 col-sm-6 mb-30">
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                            position: 'relative',
                            border: '1px solid #eee'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 15px',
                                borderRadius: '50%',
                                backgroundColor: '#f8f9fa',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {cat.image_url ? (
                                    <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <i className="fas fa-folder" style={{ fontSize: '30px', color: '#ccc' }}></i>
                                )}
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>{cat.name}</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                <button onClick={() => handleEdit(cat)} style={{ background: 'none', border: 'none', color: '#2196f3', cursor: 'pointer' }}>
                                    <i className="fas fa-edit"></i>
                                </button>
                                <button onClick={() => handleDelete(cat.id!)} style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer' }}>
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {categories.length === 0 && (
                    <div className="col-12 text-center py-5">
                        <p>No categories found. Create one to get started!</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', padding: '30px', borderRadius: '15px',
                        width: '90%', maxWidth: '500px'
                    }}>
                        <h2 style={{ marginBottom: '20px' }}>{editingId ? 'Edit Category' : 'New Category'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label style={{ display: 'block', marginBottom: '5px' }}>Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        name: e.target.value,
                                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
                                    })}
                                    required
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div className="mb-3">
                                <label style={{ display: 'block', marginBottom: '5px' }}>Slug</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    readOnly
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}
                                />
                            </div>
                            <div className="mb-3">
                                <label style={{ display: 'block', marginBottom: '5px' }}>Icon / Image</label>
                                <input type="file" accept="image/*" onChange={handleImageUpload} />
                                {formData.image_url && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img src={formData.image_url} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="thm-btn thm-btn--border" style={{ padding: '8px 20px' }}>Cancel</button>
                                <button type="submit" className="thm-btn" style={{ padding: '8px 20px' }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategoriesPage;
