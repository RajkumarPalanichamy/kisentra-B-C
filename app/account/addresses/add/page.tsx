'use client';

import React, { useState } from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';

const AddAddressPage: React.FC = () => {
    const { user } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Strict number-only validation for phone and pincode
        if (name === 'phone' || name === 'pincode') {
            // Only allow digits, reject anything else
            if (!/^\d*$/.test(value)) return;
        }

        setForm({ ...form, [name]: value });
    };

    const validateForm = () => {
        if (!/^\d{10}$/.test(form.phone)) {
            setError('Phone number must be exactly 10 digits.');
            return false;
        }
        if (!/^\d{6}$/.test(form.pincode)) {
            setError('Pincode must be exactly 6 digits.');
            return false;
        }
        if (form.full_name.trim().length < 3) {
            setError('Please enter a valid full name.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        if (!user) {
            router.push('/auth');
            return;
        }

        try {
            // Check if this is the first address, if so make it default
            const check = await supabase
                .from('addresses')
                .select('id')
                .eq('user_id', user.id)
                .limit(1);

            const isFirst = !check.data || check.data.length === 0;

            const { error: insertError } = await supabase
                .from('addresses')
                .insert({
                    user_id: user.id,
                    ...form,
                    is_default: isFirst
                });

            if (insertError) throw insertError;

            router.push('/account/addresses');

        } catch (err: any) {
            setError(err.message || 'Failed to save address');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="body_wrap">
            <Header />
            <main className="account-container">
                <div className="container" style={{ maxWidth: '600px', margin: '0 auto', padding: '140px 20px 80px' }}>
                    <div className="form-card">
                        <div className="form-header">
                            <h2>Add New Address</h2>
                            <Link href="/account/addresses" className="close-btn">
                                <i className="fas fa-times"></i>
                            </Link>
                        </div>

                        {error && (
                            <div className="error-alert">
                                <i className="fas fa-exclamation-circle"></i> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={form.full_name}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                    placeholder="Number will be used for delivery contact"
                                    maxLength={10}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Pincode</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={form.pincode}
                                        onChange={handleChange}
                                        required
                                        className="form-input"
                                        placeholder="6 digit pincode"
                                        maxLength={6}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={form.state}
                                        onChange={handleChange}
                                        required
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Address Line 1</label>
                                <input
                                    type="text"
                                    name="address_line1"
                                    value={form.address_line1}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                    placeholder="House No., Building Name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Address Line 2 (Optional)</label>
                                <input
                                    type="text"
                                    name="address_line2"
                                    value={form.address_line2}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Road Name, Area, Colony"
                                />
                            </div>

                            <button type="submit" disabled={loading} className="submit-btn">
                                {loading ? 'Saving...' : 'Save Address'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
            <Scrollbar />

            <style jsx>{`
                .account-container {
                    background-color: #f3f4f6;
                    min-height: 100vh;
                }
                .form-card {
                    background: #fff;
                    border-radius: 24px;
                    padding: 40px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .form-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 20px;
                }
                .form-header h2 {
                    font-size: 24px;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0;
                }
                .close-btn {
                    color: #94a3b8;
                    font-size: 20px;
                    transition: color 0.2s;
                }
                .close-btn:hover {
                    color: #64748b;
                }

                .form-group {
                    margin-bottom: 24px;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                
                label {
                    display: block;
                    font-size: 14px;
                    font-weight: 600;
                    color: #475569;
                    margin-bottom: 8px;
                }
                .form-input {
                    width: 100%;
                    padding: 14px 16px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    font-size: 15px;
                    color: #1e293b;
                    transition: all 0.2s;
                    background: #f8fafc;
                }
                .form-input:focus {
                    outline: none;
                    background: #fff;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                ::placeholder {
                    color: #cbd5e1;
                }

                .submit-btn {
                    width: 100%;
                    padding: 16px;
                    background: #2563eb;
                    color: #fff;
                    border: none;
                    border-radius: 50px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 10px;
                    transition: background 0.2s;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
                }
                .submit-btn:hover {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                }
                .submit-btn:disabled {
                    background: #94a3b8;
                    cursor: not-allowed;
                    transform: none;
                }

                .error-alert {
                    background: #fef2f2;
                    color: #b91c1c;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                @media (max-width: 600px) {
                    .form-card { padding: 24px; }
                    .form-row { grid-template-columns: 1fr; gap: 0; }
                }
            `}</style>
        </div>
    );
};

export default AddAddressPage;
