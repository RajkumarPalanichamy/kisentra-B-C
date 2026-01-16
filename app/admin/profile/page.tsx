'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import { Fade } from 'react-awesome-reveal';

const AdminProfilePage: React.FC = () => {
    const router = useRouter();
    const { isAuthenticated, logout } = useAdmin();

    // Determine greeting based on time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

    if (!isAuthenticated) {
        if (typeof window !== 'undefined') router.push('/admin/login');
        return null;
    }

    return (
        <div>
            <Fade direction="up" triggerOnce duration={1000}>
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: 'var(--color-heading)',
                        marginBottom: '10px'
                    }}>
                        Your Profile
                    </h1>
                    <p style={{ color: 'var(--color-default)' }}>
                        Manage your admin account preferences.
                    </p>
                </div>
            </Fade>

            <Fade direction="up" triggerOnce duration={1000} delay={100}>
                <div className="row">
                    <div className="col-lg-4 mb-4">
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '15px',
                            padding: '40px 30px',
                            border: '1px solid #e7e8ec',
                            textAlign: 'center',
                            height: '100%'
                        }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                backgroundColor: '#1a1a1a',
                                color: '#fbcb04',
                                fontSize: '48px',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 25px',
                                border: '4px solid #fbcb04'
                            }}>
                                A
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '5px' }}>Administrator</h2>
                            <p style={{ color: '#777', marginBottom: '30px' }}>Super Admin</p>

                            <button
                                onClick={logout}
                                style={{
                                    padding: '12px 30px',
                                    borderRadius: '8px',
                                    border: '1px solid #ff4d4f',
                                    backgroundColor: '#fff',
                                    color: '#ff4d4f',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    width: '100%'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ff4d4f';
                                    e.currentTarget.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fff';
                                    e.currentTarget.style.color = '#ff4d4f';
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>

                    <div className="col-lg-8 mb-4">
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '15px',
                            padding: '40px',
                            border: '1px solid #e7e8ec',
                            height: '100%'
                        }}>
                            <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>Account Information</h3>
                                <p style={{ color: '#777', fontSize: '14px' }}>
                                    Basic details about your admin account.
                                </p>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-30">
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>Username</label>
                                    <div style={{
                                        padding: '12px 15px',
                                        backgroundColor: '#f9f9f9',
                                        borderRadius: '8px',
                                        color: '#555',
                                        border: '1px solid #eee'
                                    }}>
                                        admin
                                    </div>
                                </div>
                                <div className="col-md-6 mb-30">
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>Role</label>
                                    <div style={{
                                        padding: '12px 15px',
                                        backgroundColor: '#fff8e1',
                                        borderRadius: '8px',
                                        color: '#b78c00',
                                        border: '1px solid #ffeeba',
                                        fontWeight: '600'
                                    }}>
                                        <i className="fas fa-shield-alt mr-2"></i> Super Admin
                                    </div>
                                </div>
                                <div className="col-md-12 mb-30">
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>Last Activity</label>
                                    <div style={{
                                        padding: '12px 15px',
                                        backgroundColor: '#f9f9f9',
                                        borderRadius: '8px',
                                        color: '#555',
                                        border: '1px solid #eee'
                                    }}>
                                        {new Date().toLocaleString()} (Current Session)
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee', marginTop: '10px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>Security</h3>
                                <p style={{ color: '#777', fontSize: '14px' }}>
                                    Manage your security preferences.
                                </p>
                            </div>

                            <div style={{ padding: '20px', backgroundColor: '#f0f7ff', borderRadius: '10px', border: '1px solid #cce5ff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '5px', color: '#004085' }}>Password</h4>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#004085' }}>Last changed: Never (Default Credentials)</p>
                                    </div>
                                    <button
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '6px',
                                            backgroundColor: '#0056b3',
                                            color: '#fff',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                        onClick={() => alert('This is a demo setup. Password change is disabled.')}
                                    >
                                        Change Password
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </Fade>
        </div>
    );
};

export default AdminProfilePage;
