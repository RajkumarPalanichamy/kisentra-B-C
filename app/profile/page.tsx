'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import { Fade } from 'react-awesome-reveal';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';

const ProfilePage: React.FC = () => {
    const router = useRouter();
    const { user, isLoading, signOut } = useUser();
    const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'settings' | 'cart'>('info');
    const { orders, cart, addToCart } = useCart();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [isLoading, user, router]);

    const handleLogout = async () => {
        await signOut();
        // Redirect handled in signOut
    };

    if (isLoading) {
        return (
            <div className="body_wrap">
                <Header />
                <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner">Starting...</div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="body_wrap">
            <Header />
            <main className="profile-main">
                <div className="container">
                    <Fade direction="up" triggerOnce>
                        <div className="row g-4">
                            {/* Sidebar */}
                            <div className="col-lg-3">
                                <div className="profile-sidebar">
                                    <div className="user-info-section">
                                        <div className="user-avatar">
                                            {user.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <h4 className="user-name">
                                            {user.email?.split('@')[0]}
                                        </h4>
                                        <p className="user-email">
                                            {user.email}
                                        </p>
                                    </div>

                                    <nav className="profile-nav">
                                        <button
                                            onClick={() => setActiveTab('info')}
                                            className={`nav-item ${activeTab === 'info' ? 'active' : ''}`}
                                        >
                                            <i className="far fa-user"></i> <span>Profile Info</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('orders')}
                                            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                                        >
                                            <i className="far fa-shopping-bag"></i> <span>My Orders</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('cart')}
                                            className={`nav-item ${activeTab === 'cart' ? 'active' : ''}`}
                                        >
                                            <i className="far fa-shopping-cart"></i> <span>My Cart</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('settings')}
                                            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                                        >
                                            <i className="far fa-cog"></i> <span>Settings</span>
                                        </button>
                                        <div className="nav-divider" />
                                        <button
                                            onClick={handleLogout}
                                            className="nav-item logout"
                                        >
                                            <i className="far fa-sign-out-alt"></i> <span>Logout</span>
                                        </button>
                                    </nav>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="col-lg-9">
                                <div className="profile-content-card">
                                    {activeTab === 'info' && (
                                        <div className="content-section animation-fade">
                                            <div className="section-header">
                                                <h3>Profile Information</h3>
                                                <p>View and manage your account details</p>
                                            </div>

                                            <div className="info-grid">
                                                <div className="info-card">
                                                    <div className="icon-wrapper">
                                                        <i className="far fa-envelope"></i>
                                                    </div>
                                                    <div className="info-details">
                                                        <label>Email Address</label>
                                                        <div className="value">{user.email}</div>
                                                    </div>
                                                </div>
                                                <div className="info-card">
                                                    <div className="icon-wrapper">
                                                        <i className="far fa-id-badge"></i>
                                                    </div>
                                                    <div className="info-details">
                                                        <label>User ID</label>
                                                        <div className="value monospace">{user.id}</div>
                                                    </div>
                                                </div>
                                                <div className="info-card">
                                                    <div className="icon-wrapper">
                                                        <i className="far fa-calendar-alt"></i>
                                                    </div>
                                                    <div className="info-details">
                                                        <label>Member Since</label>
                                                        <div className="value">{new Date(user.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="info-card">
                                                    <div className="icon-wrapper">
                                                        <i className="far fa-clock"></i>
                                                    </div>
                                                    <div className="info-details">
                                                        <label>Last Login</label>
                                                        <div className="value">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'orders' && (
                                        <div className="content-section animation-fade">
                                            <div className="section-header">
                                                <h3>Order History</h3>
                                                <p>Track and view your past purchases</p>
                                            </div>

                                            {orders.length === 0 ? (
                                                <div className="empty-state">
                                                    <div className="empty-icon">
                                                        <i className="far fa-shopping-basket"></i>
                                                    </div>
                                                    <h4>No orders yet</h4>
                                                    <p>Looks like you haven't placed any orders yet.</p>
                                                    <button onClick={() => router.push('/products')} className="thm-btn thm-btn--aso thm-btn--header-black mt-4">
                                                        Start Shopping
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="orders-container">
                                                    {orders.map((order) => (
                                                        <div key={order.orderId} className="order-card">
                                                            <div className="order-header">
                                                                <div className="order-id">
                                                                    <span className="label">Order #</span>
                                                                    <span className="id">{order.orderId}</span>
                                                                </div>
                                                                <div className={`order-status status-${order.status}`}>
                                                                    {order.status}
                                                                </div>
                                                            </div>
                                                            <div className="order-body">
                                                                <div className="order-meta">
                                                                    <div className="meta-item">
                                                                        <i className="far fa-calendar"></i>
                                                                        {new Date(order.orderDate).toLocaleDateString()}
                                                                    </div>
                                                                    <div className="meta-item">
                                                                        <i className="far fa-credit-card"></i>
                                                                        ${order.total.toFixed(2)}
                                                                    </div>
                                                                </div>
                                                                <div className="order-items">
                                                                    {order.items.map((item, idx) => (
                                                                        <div key={idx} className="order-item-row">
                                                                            <div className="d-flex align-items-center gap-2 flex-grow-1">
                                                                                <span className="item-name">{item.title}</span>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        addToCart(item, 1);
                                                                                        setActiveTab('cart');
                                                                                    }}
                                                                                    className="btn-link"
                                                                                    title="Buy Again"
                                                                                >
                                                                                    <i className="far fa-cart-plus"></i>
                                                                                </button>
                                                                            </div>
                                                                            <span className="item-qty">x{item.quantity}</span>
                                                                            <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'cart' && (
                                        <div className="content-section animation-fade">
                                            <div className="section-header">
                                                <h3>My Cart</h3>
                                                <p>Review items in your shopping cart</p>
                                            </div>

                                            {cart.length === 0 ? (
                                                <div className="empty-state">
                                                    <div className="empty-icon">
                                                        <i className="far fa-shopping-cart"></i>
                                                    </div>
                                                    <h4>Your cart is empty</h4>
                                                    <p>Looks like you haven't added anything to your cart yet.</p>
                                                    <button onClick={() => router.push('/products')} className="thm-btn thm-btn--aso thm-btn--header-black mt-4">
                                                        Start Shopping
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="cart-container">
                                                    <div className="cart-items-list mb-4">
                                                        {cart.map((item, idx) => (
                                                            <div key={`${item.Id}-${idx}`} className="cart-item-card">
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <div className="d-flex align-items-center gap-3">
                                                                        <div className="item-image" style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#f0f0f0' }}>
                                                                            <img src={`${item.images?.[0] || '/assets/img/no-image.jpg'}`} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        </div>
                                                                        <div>
                                                                            <h5 style={{ margin: 0, fontSize: '16px' }}>{item.title}</h5>
                                                                            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>${item.price.toFixed(2)} x {item.quantity}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-end">
                                                                        <span style={{ fontWeight: '600', color: 'var(--color-primary-two)' }}>
                                                                            ${(item.price * item.quantity).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="cart-summary p-4 bg-light rounded-3 mb-4">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Subtotal</span>
                                                            <strong>${cart.reduce((t, i) => t + i.price * i.quantity, 0).toFixed(2)}</strong>
                                                        </div>
                                                        <p className="text-muted small mb-0">Tax and shipping calculated at checkout.</p>
                                                    </div>

                                                    <div className="text-end">
                                                        <button
                                                            onClick={() => router.push('/checkout')}
                                                            className="thm-btn thm-btn--aso thm-btn--header-black"
                                                        >
                                                            Proceed to Checkout <i className="far fa-arrow-right ms-2"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'settings' && (
                                        <div className="content-section animation-fade">
                                            <div className="section-header">
                                                <h3>Account Settings</h3>
                                                <p>Manage your account preferences</p>
                                            </div>
                                            <div className="settings-alert">
                                                <i className="fas fa-info-circle"></i>
                                                <div>
                                                    <strong>Note:</strong> Currently, password changes and other rigorous account modifications are handled via secure email verification links.
                                                </div>
                                            </div>
                                            <div className="settings-actions">
                                                <button className="thm-btn thm-btn--border">
                                                    Request Password Reset
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Fade>
                </div>
            </main>
            <Footer />
            <Scrollbar />

            <style jsx>{`
                .profile-main {
                    background-color: #f8f9fc;
                    padding: 140px 0 100px;
                    min-height: 80vh;
                }
                
                /* Sidebar Styles */
                .profile-sidebar {
                    background: #fff;
                    border-radius: 16px;
                    padding: 30px 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.03);
                    border: 1px solid rgba(0,0,0,0.02);
                    height: 100%;
                }
                .user-info-section {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 30px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .user-avatar {
                    width: 90px;
                    height: 90px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--color-primary-two), #1d4ed8);
                    color: #fff;
                    font-size: 36px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 15px;
                    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2);
                }
                .user-name {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 5px;
                    color: var(--color-heading);
                }
                .user-email {
                    font-size: 14px;
                    color: #64748b;
                    margin: 0;
                }
                .profile-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 14px 20px;
                    border: none;
                    background: transparent;
                    border-radius: 10px;
                    color: #64748b;
                    font-weight: 500;
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                }
                .nav-item:hover {
                    background: #f1f5f9;
                    color: var(--color-heading);
                }
                .nav-item.active {
                    background: rgba(37, 99, 235, 0.08);
                    color: var(--color-primary-two);
                    font-weight: 600;
                }
                .nav-item i {
                    width: 20px;
                    text-align: center;
                }
                .nav-divider {
                    height: 1px;
                    background: #f0f0f0;
                    margin: 10px 0;
                }
                .nav-item.logout {
                    color: #ef4444;
                }
                .nav-item.logout:hover {
                    background: #fef2f2;
                }

                /* Main Content Styles */
                .profile-content-card {
                    background: #fff;
                    border-radius: 16px;
                    padding: 40px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.03);
                    border: 1px solid rgba(0,0,0,0.02);
                    min-height: 500px;
                }
                .section-header {
                    margin-bottom: 35px;
                }
                .section-header h3 {
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    color: var(--color-heading);
                }
                .section-header p {
                    color: #94a3b8;
                    font-size: 15px;
                }

                /* Info Grid */
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }
                .info-card {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    transition: transform 0.2s;
                }
                .info-card:hover {
                    transform: translateY(-2px);
                    background: #fff;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                }
                .icon-wrapper {
                    width: 45px;
                    height: 45px;
                    border-radius: 10px;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-primary-two);
                    font-size: 18px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .info-details label {
                    display: block;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #94a3b8;
                    margin-bottom: 4px;
                    font-weight: 600;
                }
                .info-details .value {
                    font-size: 16px;
                    font-weight: 500;
                    color: #334155;
                }
                .info-details .value.monospace {
                    font-family: monospace;
                    font-size: 14px;
                }

                /* Orders */
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                }
                .empty-icon {
                    font-size: 60px;
                    color: #cbd5e1;
                    margin-bottom: 20px;
                }
                .empty-state h4 {
                    font-size: 20px;
                    margin-bottom: 10px;
                }
                .empty-state p {
                    color: #64748b;
                }

                .orders-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .order-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                }
                .order-header {
                    background: #f8fafc;
                    padding: 15px 20px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .order-id .label {
                    color: #64748b;
                    font-size: 14px;
                    margin-right: 5px;
                }
                .order-id .id {
                    font-weight: 700;
                    color: var(--color-heading);
                }
                .order-status {
                    font-size: 12px;
                    font-weight: 600;
                    padding: 4px 10px;
                    border-radius: 20px;
                    text-transform: uppercase;
                }
                .status-completed { background: #dcfce7; color: #166534; }
                .status-pending { background: #fef9c3; color: #854d0e; }
                .status-failed { background: #fee2e2; color: #991b1b; }

                .order-body {
                    padding: 20px;
                }
                .order-meta {
                    display: flex;
                    gap: 20px;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #64748b;
                    font-size: 14px;
                }
                .meta-item i {
                    color: var(--color-primary-two);
                }
                .order-item-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                    margin-bottom: 8px;
                }
                .order-item-row:last-child { margin-bottom: 0; }
                .item-name { flex: 1; color: #334155; font-weight: 500; }
                .item-qty { color: #94a3b8; width: 50px; text-align: right; }
                .item-price { color: #334155; width: 80px; text-align: right; }

                /* Settings */
                .settings-alert {
                    display: flex;
                    gap: 15px;
                    background: #fefce8;
                    border: 1px solid #fef9c3;
                    padding: 20px;
                    border-radius: 8px;
                    color: #854d0e;
                    margin-bottom: 25px;
                }
                .settings-alert i {
                    font-size: 20px;
                    margin-top: 2px;
                }

                /* Animation */
                .animation-fade {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ProfilePage;
