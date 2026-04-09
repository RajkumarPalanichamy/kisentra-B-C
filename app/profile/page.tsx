'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import { Fade } from 'react-awesome-reveal';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';
import { Address } from '@/types';
import Link from 'next/link';

interface SupabaseOrderItem {
  id: string;
  product_id: string;
  product_title: string;
  quantity: number;
  price: number;
  image_url: string | null;
}

interface SupabaseOrder {
  id: string;
  user_id: string;
  address_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  created_at: string;
  order_items: SupabaseOrderItem[];
  address?: Address;
}

const ProfilePageContent: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading, signOut } = useUser();
    const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'settings' | 'cart' | 'addresses'>('info');
    const { cart, addToCart } = useCart();

    // Address State
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Orders State (from Supabase)
    const [supabaseOrders, setSupabaseOrders] = useState<SupabaseOrder[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Handle unhandled AbortErrors from Turbopack hot reload
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            if (event.reason?.name === 'AbortError' || 
                event.reason?.message?.includes('aborted') ||
                event.reason?.message?.includes('signal is aborted')) {
                event.preventDefault();
                // Silently ignore AbortErrors from hot reload
                return;
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    // Handle URL parameter for tab
    useEffect(() => {
        const tab = searchParams?.get('tab');
        if (tab && ['info', 'orders', 'settings', 'cart', 'addresses'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [isLoading, user, router]);

    // Fetch addresses when tab changes to 'addresses' or 'info'
    useEffect(() => {
        if ((activeTab === 'addresses' || activeTab === 'info') && user) {
            fetchAddresses();
        }
    }, [activeTab, user]);

    // Fetch orders from Supabase when tab changes to 'orders'
    useEffect(() => {
        if (!user || activeTab !== 'orders') return;
        
        const controller = new AbortController();
        let isMounted = true;
        
        const fetchOrders = async () => {
            setLoadingOrders(true);
            try {
                // Fetch orders with order items
                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        order_items (*)
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (controller.signal.aborted || !isMounted) return;

                if (ordersError) {
                    // Ignore abort errors
                    if (ordersError.message?.includes('aborted') || ordersError.code === '20') {
                        return;
                    }
                    console.error('Error fetching orders:', ordersError);
                    throw ordersError;
                }

                if (!ordersData || ordersData.length === 0) {
                    setSupabaseOrders([]);
                    setLoadingOrders(false);
                    return;
                }

                // Collect unique address IDs
                const addressIds = [...new Set(
                    ordersData
                        .map((order: any) => order.address_id)
                        .filter((id: string | null) => id !== null)
                )];

                // Fetch all addresses in one query (much faster!)
                let addressesMap: Record<string, Address> = {};
                if (addressIds.length > 0) {
                    try {
                        const { data: addressesData, error: addressesError } = await supabase
                            .from('addresses')
                            .select('*')
                            .in('id', addressIds);

                        if (controller.signal.aborted || !isMounted) return;

                        if (!addressesError && addressesData) {
                            // Create a map for quick lookup
                            addressesMap = addressesData.reduce((acc: Record<string, Address>, addr: Address) => {
                                acc[addr.id] = addr;
                                return acc;
                            }, {});
                        }
                    } catch (addrErr: any) {
                        // Ignore abort errors
                        if (!addrErr?.message?.includes('aborted') && addrErr?.code !== '20') {
                            console.warn('Error fetching addresses:', addrErr);
                        }
                    }
                }

                if (controller.signal.aborted || !isMounted) return;

                // Map addresses to orders
                const ordersWithDetails: SupabaseOrder[] = ordersData.map((order: any) => ({
                    ...order,
                    address: order.address_id ? addressesMap[order.address_id] : undefined
                }));

                setSupabaseOrders(ordersWithDetails);
            } catch (error: any) {
                // Ignore AbortError and aborted signals
                if (error?.name === 'AbortError' || 
                    error?.message?.includes('aborted') || 
                    error?.code === '20' ||
                    controller.signal.aborted ||
                    !isMounted) {
                    return;
                }
                console.error('Error loading orders:', error);
                // Set empty array on error so UI doesn't stay in loading state
                if (isMounted) {
                    setSupabaseOrders([]);
                }
            } finally {
                if (!controller.signal.aborted && isMounted) {
                    setLoadingOrders(false);
                }
            }
        };

        fetchOrders();

        return () => {
            controller.abort();
            isMounted = false;
        };
    }, [activeTab, user]);

    // Add Address Form State
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [addAddressError, setAddAddressError] = useState('');
    const [addAddressLoading, setAddAddressLoading] = useState(false);
    const [addressForm, setAddressForm] = useState({
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
    });

    const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'phone' || name === 'pincode') {
            if (!/^\d*$/.test(value)) return;
        }
        setAddressForm({ ...addressForm, [name]: value });
    };

    const validateAddressForm = () => {
        if (!/^\d{10}$/.test(addressForm.phone)) {
            setAddAddressError('Phone number must be exactly 10 digits.');
            return false;
        }
        if (!/^\d{6}$/.test(addressForm.pincode)) {
            setAddAddressError('Pincode must be exactly 6 digits.');
            return false;
        }
        if (addressForm.full_name.trim().length < 3) {
            setAddAddressError('Please enter a valid full name.');
            return false;
        }
        return true;
    };

    const handleEditClick = (address: Address) => {
        setAddressForm({
            full_name: address.full_name,
            phone: address.phone,
            address_line1: address.address_line1,
            address_line2: address.address_line2 || '',
            city: address.city,
            state: address.state,
            pincode: address.pincode,
        });
        setEditingAddressId(address.id);
        setIsAddingAddress(true);
    };

    const handleCloseForm = () => {
        setIsAddingAddress(false);
        setEditingAddressId(null);
        setAddressForm({
            full_name: '',
            phone: '',
            address_line1: '',
            address_line2: '',
            city: '',
            state: '',
            pincode: '',
        });
        setAddAddressError('');
    };

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddAddressError('');

        if (!validateAddressForm()) return;

        setAddAddressLoading(true);

        try {
            if (editingAddressId) {
                // Update Existing Address
                const { error: updateError } = await supabase
                    .from('addresses')
                    .update({
                        ...addressForm
                    })
                    .eq('id', editingAddressId)
                    .eq('user_id', user!.id);

                if (updateError) throw updateError;
            } else {
                // Insert New Address
                const check = await supabase
                    .from('addresses')
                    .select('id')
                    .eq('user_id', user!.id)
                    .limit(1);

                const isFirst = !check.data || check.data.length === 0;

                const { error: insertError } = await supabase
                    .from('addresses')
                    .insert({
                        user_id: user!.id,
                        ...addressForm,
                        is_default: isFirst
                    });

                if (insertError) throw insertError;
            }

            // Success: Reset form and go back to list
            handleCloseForm();
            fetchAddresses(); // Refresh list

        } catch (err: any) {
            setAddAddressError(err.message || 'Failed to save address');
        } finally {
            setAddAddressLoading(false);
        }
    };

    const fetchAddresses = async () => {
        setLoadingAddresses(true);
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user!.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching addresses:', error);
        } else {
            setAddresses(data || []);
        }
        setLoadingAddresses(false);
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
                                            onClick={() => setActiveTab('addresses')}
                                            className={`nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
                                        >
                                            <i className="far fa-map-marker-alt"></i> <span>My Addresses</span>
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
                                                <div className="info-card">
                                                    <div className="icon-wrapper">
                                                        <i className="far fa-map-marker-alt"></i>
                                                    </div>
                                                    <div className="info-details">
                                                        <label>Default Address</label>
                                                        <div className="value" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                                            {addresses.length > 0 ? (
                                                                (() => {
                                                                    const addr = addresses.find(a => a.is_default) || addresses[0];
                                                                    return (
                                                                        <>
                                                                            {addr.address_line1}, {addr.city}<br />
                                                                            {addr.state} - {addr.pincode}
                                                                        </>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <span style={{ color: '#94a3b8' }}>No address set</span>
                                                            )}
                                                        </div>
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

                                            {loadingOrders ? (
                                                <div className="empty-state">
                                                    <div className="empty-icon">
                                                        <i className="far fa-spinner fa-spin"></i>
                                                    </div>
                                                    <p>Loading orders...</p>
                                                </div>
                                            ) : supabaseOrders.length === 0 ? (
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
                                                    {supabaseOrders.map((order) => (
                                                        <div key={order.id} className="order-card">
                                                            <div className="order-header">
                                                                <div className="order-id">
                                                                    <span className="label">Order #</span>
                                                                    <span className="id">{order.id.substring(0, 8)}...</span>
                                                                </div>
                                                                <div className={`order-status status-${order.status}`}>
                                                                    {order.status}
                                                                </div>
                                                            </div>
                                                            <div className="order-body">
                                                                <div className="order-meta">
                                                                    <div className="meta-item">
                                                                        <i className="far fa-calendar"></i>
                                                                        {new Date(order.created_at).toLocaleDateString()}
                                                                    </div>
                                                                    <div className="meta-item">
                                                                        <i className="far fa-credit-card"></i>
                                                                        ₹{order.total_amount.toFixed(2)}
                                                                    </div>
                                                                    <div className="meta-item">
                                                                        <i className="far fa-money-bill"></i>
                                                                        {order.payment_method.toUpperCase()}
                                                                    </div>
                                                                </div>
                                                                <div className="order-items">
                                                                    {order.order_items?.map((item) => (
                                                                        <div key={item.id} className="order-item-row">
                                                                            <div className="d-flex align-items-center gap-2 flex-grow-1">
                                                                                <span className="item-name">{item.product_title}</span>
                                                                            </div>
                                                                            <span className="item-qty">x{item.quantity}</span>
                                                                            <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e7e8ec' }}>
                                                                    <Link 
                                                                        href={`/order-confirmation/${order.id}`}
                                                                        className="thm-btn thm-btn--border"
                                                                        style={{ fontSize: '14px', padding: '8px 16px' }}
                                                                    >
                                                                        View Details
                                                                    </Link>
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
                                                                            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>₹{item.price.toFixed(2)} x {item.quantity}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-end">
                                                                        <span style={{ fontWeight: '600', color: 'var(--color-primary-two)' }}>
                                                                            ₹{(item.price * item.quantity).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="cart-summary p-4 bg-light rounded-3 mb-4">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Subtotal</span>
                                                            <strong>₹{cart.reduce((t, i) => t + i.price * i.quantity, 0).toFixed(2)}</strong>
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

                                    {activeTab === 'addresses' && (
                                        <div className="content-section animation-fade">
                                            {!isAddingAddress ? (
                                                <>
                                                    <div className="section-header">
                                                        <h3>My Addresses</h3>
                                                        <p>Manage your delivery addresses</p>
                                                    </div>
                                                    <div className="text-end mb-4">
                                                        <button
                                                            onClick={() => setIsAddingAddress(true)}
                                                            className="thm-btn thm-btn--aso thm-btn--header-black"
                                                        >
                                                            + Add New Address
                                                        </button>
                                                    </div>

                                                    {loadingAddresses ? (
                                                        <div style={{ textAlign: 'center', padding: '40px' }}><i className="fas fa-circle-notch fa-spin fa-2x"></i></div>
                                                    ) : addresses.length === 0 ? (
                                                        <div className="empty-state">
                                                            <div className="empty-icon">
                                                                <i className="fas fa-map-marker-alt"></i>
                                                            </div>
                                                            <h4>No Addresses Found</h4>
                                                            <p>Add a new address to speed up checkout.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="address-grid">
                                                            {addresses.map((addr) => (
                                                                <div key={addr.id} className={`address-card ${addr.is_default ? 'default-card' : ''}`}>
                                                                    <div className="card-header">
                                                                        <div className="badge-group">
                                                                            <span className="addr-type">Home</span>
                                                                            {addr.is_default && <span className="default-badge">Default</span>}
                                                                        </div>
                                                                        <div className="actions">
                                                                            <button
                                                                                onClick={() => handleEditClick(addr)}
                                                                                className="action-btn text-blue"
                                                                                title="Edit Address"
                                                                            >
                                                                                <i className="fas fa-edit"></i>
                                                                            </button>
                                                                            {!addr.is_default && (
                                                                                <button
                                                                                    onClick={() => handleSetDefault(addr.id)}
                                                                                    disabled={actionLoading === addr.id}
                                                                                    className="action-btn text-blue"
                                                                                    title="Set as Default"
                                                                                >
                                                                                    {actionLoading === addr.id ? '...' : <i className="fas fa-check-circle"></i>}
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={() => handleDelete(addr.id)}
                                                                                className="action-btn text-red"
                                                                                title="Delete Address"
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
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="add-address-form-container animation-fade">
                                                    <div className="section-header d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <h3>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                                                            <p>{editingAddressId ? 'Update your delivery details' : 'Enter your delivery details below'}</p>
                                                        </div>
                                                        <button
                                                            onClick={handleCloseForm}
                                                            className="btn-close-custom"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>

                                                    {addAddressError && (
                                                        <div className="alert alert-danger mb-4">
                                                            <i className="fas fa-exclamation-circle me-2"></i> {addAddressError}
                                                        </div>
                                                    )}

                                                    <form onSubmit={handleAddressSubmit}>
                                                        <div className="form-group mb-3">
                                                            <label>Full Name</label>
                                                            <input
                                                                type="text"
                                                                name="full_name"
                                                                value={addressForm.full_name}
                                                                onChange={handleAddressFormChange}
                                                                className="form-control-custom"
                                                                placeholder="John Doe"
                                                            />
                                                        </div>
                                                        <div className="form-group mb-3">
                                                            <label>Phone Number</label>
                                                            <input
                                                                type="tel"
                                                                name="phone"
                                                                value={addressForm.phone}
                                                                onChange={handleAddressFormChange}
                                                                className="form-control-custom"
                                                                placeholder="10 digit number"
                                                                maxLength={10}
                                                            />
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-md-6 mb-3">
                                                                <label>Pincode</label>
                                                                <input
                                                                    type="text"
                                                                    name="pincode"
                                                                    value={addressForm.pincode}
                                                                    onChange={handleAddressFormChange}
                                                                    className="form-control-custom"
                                                                    placeholder="6 digit code"
                                                                    maxLength={6}
                                                                />
                                                            </div>
                                                            <div className="col-md-6 mb-3">
                                                                <label>State</label>
                                                                <input
                                                                    type="text"
                                                                    name="state"
                                                                    value={addressForm.state}
                                                                    onChange={handleAddressFormChange}
                                                                    className="form-control-custom"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="mb-3">
                                                            <label>City</label>
                                                            <input
                                                                type="text"
                                                                name="city"
                                                                value={addressForm.city}
                                                                onChange={handleAddressFormChange}
                                                                className="form-control-custom"
                                                            />
                                                        </div>
                                                        <div className="mb-3">
                                                            <label>Address Line 1</label>
                                                            <input
                                                                type="text"
                                                                name="address_line1"
                                                                value={addressForm.address_line1}
                                                                onChange={handleAddressFormChange}
                                                                className="form-control-custom"
                                                                placeholder="House No., Building Name"
                                                            />
                                                        </div>
                                                        <div className="mb-4">
                                                            <label>Address Line 2 (Optional)</label>
                                                            <input
                                                                type="text"
                                                                name="address_line2"
                                                                value={addressForm.address_line2}
                                                                onChange={handleAddressFormChange}
                                                                className="form-control-custom"
                                                                placeholder="Road Name, Area, Colony"
                                                            />
                                                        </div>
                                                        <div className="d-flex gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={handleCloseForm}
                                                                className="thm-btn thm-btn--border flex-grow-1"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="submit"
                                                                disabled={addAddressLoading}
                                                                className="thm-btn thm-btn--aso thm-btn--header-black flex-grow-1"
                                                            >
                                                                {addAddressLoading ? 'Saving...' : 'Save Address'}
                                                            </button>
                                                        </div>
                                                    </form>
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

                /* Address Styles for Profile Tab */
                .address-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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

                /* Add Address Form Styles */
                .form-control-custom {
                    width: 100%;
                    padding: 12px 16px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    font-size: 15px;
                    color: #1e293b;
                    transition: all 0.2s;
                    background: #f8fafc;
                }
                .form-control-custom:focus {
                    outline: none;
                    background: #fff;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                .btn-close-custom {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 20px;
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .btn-close-custom:hover {
                    color: #64748b;
                }
                .alert-danger {
                    color: #b91c1c;
                    background-color: #fef2f2;
                    border: 1px solid #fecaca;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 14px;
                }
                form label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    margin-bottom: 6px;
                }
            `}</style>
        </div>
    );
};

const ProfilePage: React.FC = () => {
    return (
        <Suspense fallback={
            <div className="body_wrap sco_agency">
                <Header />
                <main className="page_content">
                    <section className="service pt-140 pb-140">
                        <div className="container">
                            <div className="row">
                                <div className="col-12 text-center">
                                    <p className="content">Loading profile...</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
                <Scrollbar />
            </div>
        }>
            <ProfilePageContent />
        </Suspense>
    );
};

export default ProfilePage;
