'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/contexts/AdminContext';
import { useRouter } from 'next/navigation';
import { Banner, getBanners, saveBanner, deleteBanner } from '@/api/banners';

export default function AdminBannersPage() {
    const { isAuthenticated, isLoading } = useAdmin();
    const router = useRouter();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loadingBanners, setLoadingBanners] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Banner>>({
        title: '',
        subtitle: '',
        image_url: '',
        link: '',
        bg_color_from: '#00C6FF',
        bg_color_to: '#0072FF',
        is_active: true,
        order: 0
    });

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/auth');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        setLoadingBanners(true);
        const data = await getBanners();
        setBanners(data);
        setLoadingBanners(false);
    };

    const handleEdit = (banner: Banner) => {
        setCurrentBanner(banner);
        setFormData(banner);
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setCurrentBanner(null);
        setFormData({
            title: '',
            subtitle: '',
            image_url: '',
            link: '',
            bg_color_from: '#00C6FF',
            bg_color_to: '#0072FF',
            is_active: true,
            order: 0
        });
        setIsEditing(true);
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
                    const MAX_WIDTH = 800; // Aggressively optimized for DB storage
                    const MAX_HEIGHT = 600;
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
                    // Compress to JPEG 0.6 (very small file size)
                    resolve(canvas.toDataURL('image/jpeg', 0.6));
                };
            };
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            try {
                const compressed = await compressImage(file);
                setFormData(prev => ({ ...prev, image_url: compressed }));
            } catch (err) {
                console.error("Error compressing image", err);
                alert("Failed to process image");
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.image_url) {
            alert('Title and Image are required!');
            return;
        }

        const success = await saveBanner({
            ...formData,
            id: currentBanner?.id, // Keep ID if editing
        } as Banner);

        if (success) {
            setIsEditing(false);
            loadBanners(); // Reload
        } else {
            alert('Failed to save banner. Please try a smaller image or check connection.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this banner?')) {
            const success = await deleteBanner(id);
            if (success) loadBanners();
        }
    };

    if (isLoading) return <div className="p-10">Loading Admin...</div>;
    if (!isAuthenticated) return null;

    return (
        <div className="admin-content" style={{ padding: '30px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 style={{ fontWeight: 700 }}>Banner Management</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={async () => {
                            if (confirm("DANGER: This will delete ALL banners to fix database error. Continue?")) {
                                const { resetAllBanners } = await import('@/api/banners');
                                await resetAllBanners();
                                alert("Banners reset. Reloading...");
                                window.location.reload();
                            }
                        }}
                        className="btn btn-danger"
                        style={{
                            borderRadius: '30px',
                            padding: '10px 20px',
                            fontWeight: 600,
                        }}
                    >
                        <i className="fas fa-trash-alt"></i> Reset DB
                    </button>
                    <button
                        onClick={handleAddNew}
                        className="btn btn-primary"
                        style={{
                            borderRadius: '30px',
                            padding: '10px 25px',
                            fontWeight: 600,
                            backgroundColor: 'var(--color-primary)',
                            border: 'none',
                            color: '#fff'
                        }}
                    >
                        + Add New Banner
                    </button>
                </div>
            </div>

            {/* Banner List */}
            {loadingBanners ? (
                <p>Loading banners...</p>
            ) : (
                <div className="row">
                    {banners.map((banner) => (
                        <div key={banner.id} className="col-md-6 mb-4">
                            <div style={{
                                borderRadius: '15px',
                                overflow: 'hidden',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                                backgroundColor: '#fff',
                                position: 'relative',
                                border: '1px solid #eee'
                            }}>
                                {/* Full Image Preview */}
                                <div style={{ height: '200px', width: '100%', position: 'relative', backgroundColor: '#f0f0f0' }}>
                                    <img
                                        src={banner.image_url}
                                        alt={banner.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    {/* Overlay Actions */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0, left: 0, right: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                        color: '#fff',
                                        padding: '15px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'end'
                                    }}>
                                        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '65%' }}>
                                            <div style={{ fontWeight: '600', fontSize: '16px' }}>{banner.title}</div>
                                            {banner.link && <div style={{ fontSize: '12px', opacity: 0.8 }}><i className="fas fa-link"></i> {banner.link}</div>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleEdit(banner)} className="btn btn-sm btn-light" style={{ fontSize: '12px' }}>
                                                <i className="fas fa-pen"></i> Edit
                                            </button>
                                            <button onClick={() => banner.id && handleDelete(banner.id)} className="btn btn-sm btn-danger" style={{ fontSize: '12px' }}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {banners.length === 0 && (
                        <div className="col-12 text-center p-5">
                            <p className="text-muted">No banners found. Click "Add New Banner" to upload one.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit/Add Modal Overlay */}
            {isEditing && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '15px',
                        padding: '30px',
                        width: '90%',
                        maxWidth: '550px',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 style={{ margin: 0, fontSize: '24px' }}>{currentBanner ? 'Edit Banner' : 'New Banner'}</h2>
                            <button onClick={() => setIsEditing(false)} className="btn-close"></button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="mb-3">
                                <label className="form-label">Internal Name (Title)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Summer Sale 2024"
                                    required
                                />
                                <small className="text-muted">Only visible to admin for identification.</small>
                            </div>

                            {/* Image Selection Area */}
                            <div className="mb-3">
                                <label className="form-label">Banner Image (Full Width)</label>
                                <div style={{
                                    border: '2px dashed #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '30px',
                                    textAlign: 'center',
                                    backgroundColor: '#f8f9fa',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }} onClick={() => document.getElementById('banner-image-upload')?.click()}>
                                    <input
                                        type="file"
                                        id="banner-image-upload"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleFileSelect}
                                    />
                                    {formData.image_url ? (
                                        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                                            <img src={formData.image_url} alt="Preview" style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData({ ...formData, image_url: '' });
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-10px',
                                                    right: '-10px',
                                                    background: 'white',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '50%',
                                                    width: '24px',
                                                    height: '24px',
                                                    lineHeight: '22px',
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    color: 'red',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <i className="fas fa-cloud-upload-alt" style={{ fontSize: '32px', color: '#ccc', marginBottom: '15px' }}></i>
                                            <p style={{ margin: 0, fontWeight: 500, color: '#555' }}>Click to upload banner image</p>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>Recommended size: 1600x400px</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Destination Link (Optional)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.link}
                                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                                    placeholder="/products"
                                />
                            </div>

                            <div className="mb-3 form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="activeCheck"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label className="form-check-label" htmlFor="activeCheck">Is Active?</label>
                            </div>

                            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                                <button type="button" className="btn btn-light" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary px-4">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
