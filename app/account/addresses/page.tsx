'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { Address } from '@/types';
import { Fade } from 'react-awesome-reveal';

const AddressesPage: React.FC = () => {
    const { user } = useUser();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchAddresses();
        } else {
            // If no user, maybe waiting for context or redirect? 
            // Ideally protected route, but for now just wait.
            setLoading(false);
        }
    }, [user]);

    const fetchAddresses = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false }) // Default first
            .order('created_at', { ascending: false });

        if (error) {
            if (error.message && (error.message.includes('AbortError') || error.message.includes('signal is aborted'))) {
                // Ignore abort errors caused by navigation/cancellation
                return;
            }
            console.error('Error fetching addresses:', error.message || error);
        } else {
            setAddresses(data || []);
        }
        setLoading(false);
    };

    const handleSetDefault = async (addressId: string) => {
        if (!user) return;
        setActionLoading(addressId);

        // 1. Unset current default
        await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', user.id);

        // 2. Set new default
        const { error } = await supabase
            .from('addresses')
            .update({ is_default: true })
            .eq('id', addressId);

        if (error) {
            alert('Failed to update default address');
        } else {
            fetchAddresses();
        }
        setActionLoading(null);
    };

    const handleDelete = async (addressId: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return;

        setActionLoading(addressId);
        const { error } = await supabase
            .from('addresses')
            .delete()
            .eq('id', addressId);

        if (error) {
            alert(error.message);
        } else {
            fetchAddresses();
        }
        setActionLoading(null);
    };

    return (
        <div className="body_wrap">
            <Header />
            <main className="account-container">
                <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '140px 20px 80px' }}>
                    <div className="page-header">
                        <h1>Your Addresses</h1>
                        <Link href="/account/addresses/add" className="add-btn">
                            <i className="fas fa-plus"></i> Add New Address
                        </Link>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}><i className="fas fa-circle-notch fa-spin fa-2x"></i></div>
                    ) : addresses.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <i className="fas fa-map-marker-alt"></i>
                            </div>
                            <h3>No Addresses Found</h3>
                            <p>Add a new address to speed up checkout.</p>
                            <Link href="/account/addresses/add" className="btn-primary-soft">
                                Add Address
                            </Link>
                        </div>
                    ) : (
                        <div className="address-grid">
                            <Fade cascade damping={0.1} triggerOnce>
                                {addresses.map((addr) => (
                                    <div key={addr.id} className={`address-card ${addr.is_default ? 'default-card' : ''}`}>
                                        <div className="card-header">
                                            <div className="badge-group">
                                                <span className="addr-type">Home</span>
                                                {addr.is_default && <span className="default-badge">Default</span>}
                                            </div>
                                            <div className="actions">
                                                {!addr.is_default && (
                                                    <button
                                                        onClick={() => handleSetDefault(addr.id)}
                                                        disabled={actionLoading === addr.id}
                                                        className="action-btn text-blue"
                                                    >
                                                        {actionLoading === addr.id ? 'Setting...' : 'Set Default'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(addr.id)}
                                                    className="action-btn text-red"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="card-body">
                                            <h4 className="name">{addr.full_name}</h4>
                                            <p className="phone">{addr.phone}</p>
                                            <div className="address-text">
                                                {addr.address_line1}, <br />
                                                {addr.address_line2 && <>{addr.address_line2}<br /></>}
                                                {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Fade>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <Scrollbar />

            <style jsx>{`
                .account-container {
                    background-color: #f8fafc;
                    min-height: 100vh;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .page-header h1 {
                    font-size: 28px;
                    font-weight: 700;
                    color: #1e293b;
                }
                .add-btn {
                    background-color: #2563eb;
                    color: #fff;
                    padding: 12px 24px;
                    border-radius: 50px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
                }
                .add-btn:hover {
                    background-color: #1d4ed8;
                    transform: translateY(-2px);
                }
                
                .address-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 20px;
                }

                .address-card {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 24px;
                    position: relative;
                    transition: all 0.2s ease;
                }
                .address-card:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                }
                .default-card {
                    border: 2px solid #3b82f6;
                    background-color: #eff6ff;
                }
                
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                }
                .badge-group {
                    display: flex;
                    gap: 8px;
                }
                .addr-type {
                    background: #f1f5f9;
                    color: #64748b;
                    font-size: 11px;
                    text-transform: uppercase;
                    font-weight: 700;
                    padding: 4px 8px;
                    border-radius: 4px;
                    letter-spacing: 0.5px;
                }
                .default-badge {
                    background: #dbeafe;
                    color: #1e40af;
                    font-size: 11px;
                    text-transform: uppercase;
                    font-weight: 700;
                    padding: 4px 8px;
                    border-radius: 4px;
                    letter-spacing: 0.5px;
                }

                .actions {
                    display: flex;
                    gap: 12px;
                }
                .action-btn {
                    background: none;
                    border: none;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 0;
                    transition: color 0.2s;
                }
                .text-blue { color: #2563eb; }
                .text-blue:hover { color: #1e40af; text-decoration: underline; }
                .text-red { color: #ef4444; }
                .text-red:hover { color: #b91c1c; }

                .card-body .name {
                    font-size: 18px;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 4px;
                }
                .card-body .phone {
                    font-size: 14px;
                    color: #64748b;
                    margin-bottom: 12px;
                    font-weight: 500;
                }
                .address-text {
                    font-size: 15px;
                    line-height: 1.5;
                    color: #334155;
                }

                .empty-state {
                    background: #fff;
                    border-radius: 20px;
                    padding: 60px;
                    text-align: center;
                    border: 1px dashed #cbd5e1;
                }
                .empty-icon {
                    width: 80px;
                    height: 80px;
                    background: #f1f5f9;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: #94a3b8;
                    font-size: 32px;
                }
                .empty-state h3 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 8px;
                }
                .empty-state p {
                    color: #64748b;
                    margin-bottom: 24px;
                }
                .btn-primary-soft {
                    display: inline-block;
                    padding: 12px 28px;
                    background: #eff6ff;
                    color: #2563eb;
                    font-weight: 600;
                    border-radius: 50px;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .btn-primary-soft:hover {
                    background: #dbeafe;
                }

                @media (max-width: 768px) {
                    .page-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                }
            `}</style>
        </div>
    );
};

export default AddressesPage;
