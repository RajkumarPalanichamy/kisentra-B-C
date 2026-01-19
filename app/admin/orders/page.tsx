'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Fade } from 'react-awesome-reveal';
import Image from 'next/image';
import Link from 'next/link';

interface OrderItem {
  id: string;
  product_id: string;
  product_title: string;
  quantity: number;
  price: number;
  image_url: string | null;
}

interface Order {
  id: string;
  user_id: string;
  address_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
  address?: {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    pincode: string;
  };
  user?: {
    email: string;
  };
}

const AdminOrdersPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/admin/login';
      return;
    }
  }, [isAuthenticated, isLoading]);

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

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const controller = new AbortController();
    loadOrders(controller.signal);
    
    return () => controller.abort();
  }, [isAuthenticated, selectedStatus]);

  const loadOrders = async (signal?: AbortSignal) => {
    if (signal?.aborted) return;
    
    setLoading(true);
    let loadingTimeout: NodeJS.Timeout | null = null;
    
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      // Check Supabase session (RLS requires authentication)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No Supabase session found. Admin may need to be logged in as a Supabase user to view orders.');
        // Continue anyway - RLS might allow it or we'll get a proper error
      }

      // Set a timeout to prevent infinite loading
      loadingTimeout = setTimeout(() => {
        if (!signal?.aborted) {
          console.warn('Orders query is taking too long, this might indicate a connection or RLS policy issue');
          setLoading(false);
          setOrders([]);
          alert('Loading orders is taking too long. Please check:\n1. Your internet connection\n2. Supabase RLS policies\n3. Browser console for errors');
        }
      }, 10000); // 10 second timeout

      console.log('Fetching orders from Supabase...');
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      
      // Clear timeout if query completes
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }

      if (signal?.aborted) return;

      if (error) {
        console.error('Supabase query failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Check if it's an authentication/RLS issue
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('RLS')) {
          throw new Error('Permission denied. Admin users need to be authenticated in Supabase to view orders. Please log in as a Supabase user or adjust RLS policies.');
        }
        
        throw error;
      }

      if (!data || data.length === 0) {
        if (loadingTimeout) clearTimeout(loadingTimeout);
        setOrders([]);
        setLoading(false);
        return;
      }

      if (signal?.aborted) return;

      // Collect unique address IDs
      const addressIds = [...new Set(
        data
          .map((order: any) => order.address_id)
          .filter((id: string | null) => id !== null)
      )];

      // Fetch all addresses in one query (much faster!)
      let addressesMap: Record<string, any> = {};
      if (addressIds.length > 0) {
        try {
          const { data: addressesData, error: addressesError } = await supabase
            .from('addresses')
            .select('*')
            .in('id', addressIds);

          if (signal?.aborted) return;

          if (!addressesError && addressesData) {
            // Create a map for quick lookup
            addressesMap = addressesData.reduce((acc: Record<string, any>, addr: any) => {
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

      if (signal?.aborted) {
        if (loadingTimeout) clearTimeout(loadingTimeout);
        return;
      }

      // Map addresses to orders
      const ordersWithDetails: Order[] = data.map((order: any) => ({
        ...order,
        address: order.address_id ? addressesMap[order.address_id] : undefined
      }));

      console.log(`Loaded ${ordersWithDetails.length} orders successfully`);
      setOrders(ordersWithDetails);
      setLoading(false);
    } catch (error: any) {
      // Clear timeout on error
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      // Ignore AbortError from hot reload
      if (error?.name === 'AbortError' || 
          error?.message?.includes('aborted') || 
          error?.code === '20' ||
          signal?.aborted) {
        return;
      }
      
      // Extract detailed error message before logging
      let errorMessage = 'Unknown error occurred';
      let errorDetails: any = {};
      
      if (error) {
        errorDetails = {
          name: error.name,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        };

        if (error.message) {
          errorMessage = error.message;
        } else if (error.code === 'PGRST116' || error.code === '42P01') {
          errorMessage = 'Orders table not found. Please run the SQL script in Supabase.';
        } else if (error.code === '42501') {
          errorMessage = 'Permission denied. Check your RLS policies.';
        } else if (error.code) {
          errorMessage = `Database error (${error.code}): ${error.message || error.details || 'Unknown error'}`;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.details) {
          errorMessage = error.details;
        } else {
          try {
            errorMessage = JSON.stringify(error, null, 2);
          } catch {
            errorMessage = String(error);
          }
        }
      }
      
      console.error('Error loading orders:', errorDetails);
      
      // Only show alert if it's a real error (not abort)
      if (!error?.message?.includes('aborted') && error?.code !== '20') {
        alert('Failed to load orders:\n\n' + errorMessage);
      }
      
      // Always reset loading state on error
      setLoading(false);
      setOrders([]); // Set empty array so UI doesn't stay in loading state
    } finally {
      // Ensure loading is always reset
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingStatus(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      // Update selected order if it's the one being updated
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      alert('Order status updated successfully!');
    } catch (error: any) {
      console.error('Error updating order status:', error);
      
      // Extract detailed error message
      let errorMessage = 'Unknown error occurred';
      if (error) {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.code) {
          errorMessage = `Database error (${error.code}): ${error.message || error.details || 'Unknown error'}`;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          try {
            errorMessage = JSON.stringify(error, null, 2);
          } catch {
            errorMessage = String(error);
          }
        }
      }
      
      alert('Failed to update order status:\n\n' + errorMessage);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const viewOrderDetails = async (order: Order) => {
    try {
      // If address or user not loaded, fetch them
      if (!order.address && order.address_id) {
        const { data: addressData, error: addressError } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', order.address_id)
          .single();
        
        if (!addressError && addressData) {
          order.address = addressData;
        } else if (addressError) {
          console.warn('Error fetching address:', addressError);
          // Continue without address - not critical
        }
      }

      // Note: User email fetching requires admin API (service role key)
      // This would need to be done via a server-side API route
      // For now, we'll skip this

      setSelectedOrder(order);
      setShowDetails(true);
    } catch (error: any) {
      console.error('Error loading order details:', error);
      // Still show the order even if address fetch fails
      setSelectedOrder(order);
      setShowDetails(true);
    }
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    pending: { bg: '#fff3cd', color: '#856404' },
    processing: { bg: '#cfe2ff', color: '#084298' },
    shipped: { bg: '#d1e7dd', color: '#0f5132' },
    delivered: { bg: '#d4edda', color: '#155724' },
    cancelled: { bg: '#f8d7da', color: '#721c24' }
  };

  const statusIcons: Record<string, string> = {
    pending: 'fa-clock',
    processing: 'fa-spinner',
    shipped: 'fa-shipping-fast',
    delivered: 'fa-check-circle',
    cancelled: 'fa-times-circle'
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="body_wrap sco_agency">
      <main className="page_content">
        <section className="service pt-140 pb-140">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '24px'
                    }}>
                      <i className="fas fa-shopping-cart"></i>
                    </div>
                    <div>
                      <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#1e293b' }}>
                        Order Management
                      </h1>
                      <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '16px' }}>
                        View and manage all customer orders
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filter */}
                <div style={{ 
                  marginBottom: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-filter" style={{ color: '#64748b', fontSize: '16px' }}></i>
                    <label style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                      Filter by Status:
                    </label>
                  </div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{
                      padding: '10px 40px 10px 15px',
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: '#fff',
                      color: '#1e293b',
                      transition: 'all 0.2s',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '40px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {orders.length > 0 && (
                    <div style={{
                      padding: '8px 16px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#475569'
                    }}>
                      {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                    </div>
                  )}
                </div>

                {loading ? (
                  <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '80px 40px',
                    textAlign: 'center',
                    border: '1px solid #e7e8ec'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      border: '4px solid #f1f5f9',
                      borderTop: '4px solid #2563eb',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500', margin: 0 }}>
                      Loading orders...
                    </p>
                    <style jsx>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '80px 40px',
                    textAlign: 'center',
                    border: '1px solid #e7e8ec'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      fontSize: '36px',
                      color: '#94a3b8'
                    }}>
                      <i className="fas fa-inbox"></i>
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>
                      No orders found
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                      {selectedStatus === 'all' 
                        ? 'There are no orders yet.' 
                        : `No orders with status "${selectedStatus}" found.`}
                    </p>
                  </div>
                ) : (
                  <div className="orders-table" style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ 
                            backgroundColor: '#f8fafc', 
                            borderBottom: '2px solid #e2e8f0'
                          }}>
                            <th style={{ 
                              padding: '18px 20px', 
                              textAlign: 'left', 
                              fontWeight: '700',
                              fontSize: '13px',
                              color: '#475569',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              <i className="fas fa-hashtag" style={{ marginRight: '8px', opacity: 0.6 }}></i>
                              Order ID
                            </th>
                            <th style={{ 
                              padding: '18px 20px', 
                              textAlign: 'left', 
                              fontWeight: '700',
                              fontSize: '13px',
                              color: '#475569',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              <i className="far fa-calendar" style={{ marginRight: '8px', opacity: 0.6 }}></i>
                              Date
                            </th>
                            <th style={{ 
                              padding: '18px 20px', 
                              textAlign: 'left', 
                              fontWeight: '700',
                              fontSize: '13px',
                              color: '#475569',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              <i className="far fa-user" style={{ marginRight: '8px', opacity: 0.6 }}></i>
                              Customer
                            </th>
                            <th style={{ 
                              padding: '18px 20px', 
                              textAlign: 'left', 
                              fontWeight: '700',
                              fontSize: '13px',
                              color: '#475569',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              <i className="fas fa-box" style={{ marginRight: '8px', opacity: 0.6 }}></i>
                              Items
                            </th>
                            <th style={{ 
                              padding: '18px 20px', 
                              textAlign: 'left', 
                              fontWeight: '700',
                              fontSize: '13px',
                              color: '#475569',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              <i className="fas fa-rupee-sign" style={{ marginRight: '8px', opacity: 0.6 }}></i>
                              Total
                            </th>
                            <th style={{ 
                              padding: '18px 20px', 
                              textAlign: 'left', 
                              fontWeight: '700',
                              fontSize: '13px',
                              color: '#475569',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              <i className="fas fa-info-circle" style={{ marginRight: '8px', opacity: 0.6 }}></i>
                              Status
                            </th>
                            <th style={{ 
                              padding: '18px 20px', 
                              textAlign: 'left', 
                              fontWeight: '700',
                              fontSize: '13px',
                              color: '#475569',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              <i className="fas fa-cog" style={{ marginRight: '8px', opacity: 0.6 }}></i>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order, index) => {
                            const statusColor = statusColors[order.status] || statusColors.pending;
                            const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            });

                            return (
                              <tr 
                                key={order.id} 
                                style={{ 
                                  borderBottom: '1px solid #f1f5f9',
                                  backgroundColor: index % 2 === 0 ? '#fff' : '#fafbfc',
                                  transition: 'all 0.2s',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f8fafc';
                                  e.currentTarget.style.transform = 'scale(1.001)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#fafbfc';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                <td style={{ padding: '18px 20px' }}>
                                  <code style={{ 
                                    fontSize: '12px', 
                                    color: '#64748b',
                                    fontFamily: 'monospace',
                                    backgroundColor: '#f1f5f9',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontWeight: '600'
                                  }}>
                                    {order.id.substring(0, 8)}...
                                  </code>
                                </td>
                                <td style={{ padding: '18px 20px', color: '#475569', fontSize: '14px' }}>
                                  {orderDate}
                                </td>
                                <td style={{ padding: '18px 20px', color: '#475569', fontSize: '14px' }}>
                                  {order.user?.email || (
                                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>N/A</span>
                                  )}
                                </td>
                                <td style={{ padding: '18px 20px', color: '#475569', fontSize: '14px' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: '#f1f5f9',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontWeight: '600'
                                  }}>
                                    <i className="fas fa-box" style={{ fontSize: '10px' }}></i>
                                    {order.order_items?.length || 0}
                                  </span>
                                </td>
                                <td style={{ padding: '18px 20px', fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>
                                  ₹{order.total_amount.toFixed(2)}
                                </td>
                                <td style={{ padding: '18px 20px' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    backgroundColor: statusColor.bg,
                                    color: statusColor.color,
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                  }}>
                                    <i className={`fas ${statusIcons[order.status] || 'fa-circle'}`} style={{ fontSize: '10px' }}></i>
                                    {order.status}
                                  </span>
                                </td>
                                <td style={{ padding: '18px 20px' }}>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                      onClick={() => viewOrderDetails(order)}
                                      style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#1d4ed8';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.3)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#2563eb';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(37, 99, 235, 0.2)';
                                      }}
                                    >
                                      <i className="far fa-eye"></i>
                                      View
                                    </button>
                                    <select
                                      value={order.status}
                                      onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                                      disabled={updatingStatus === order.id}
                                      style={{
                                        padding: '8px 32px 8px 12px',
                                        borderRadius: '8px',
                                        border: '2px solid #e2e8f0',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: updatingStatus === order.id ? 'not-allowed' : 'pointer',
                                        opacity: updatingStatus === order.id ? 0.6 : 1,
                                        backgroundColor: '#fff',
                                        color: '#1e293b',
                                        transition: 'all 0.2s',
                                        appearance: 'none',
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 10px center'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.borderColor = '#2563eb';
                                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.boxShadow = 'none';
                                      }}
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="processing">Processing</option>
                                      <option value="shipped">Shipped</option>
                                      <option value="delivered">Delivered</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setShowDetails(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '20px',
              padding: '0',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '30px 40px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  <i className="fas fa-receipt"></i>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>
                    Order Details
                  </h2>
                  <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                    Order #{selectedOrder.id.substring(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'none',
                  border: '2px solid #e2e8f0',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              padding: '40px',
              maxHeight: 'calc(90vh - 120px)',
              overflowY: 'auto'
            }}>

              {/* Order Info Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '30px'
              }}>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Order ID
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '700', fontFamily: 'monospace' }}>
                    {selectedOrder.id.substring(0, 8)}...
                  </div>
                </div>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Date
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                    {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {new Date(selectedOrder.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status
                  </div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    backgroundColor: statusColors[selectedOrder.status].bg,
                    color: statusColors[selectedOrder.status].color,
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    <i className={`fas ${statusIcons[selectedOrder.status] || 'fa-circle'}`} style={{ fontSize: '10px' }}></i>
                    {selectedOrder.status}
                  </span>
                </div>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Payment
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600', textTransform: 'uppercase' }}>
                    {selectedOrder.payment_method}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    fontSize: '18px'
                  }}>
                    <i className="fas fa-box"></i>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                    Order Items
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#475569'
                  }}>
                    {selectedOrder.order_items?.length || 0} items
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {selectedOrder.order_items?.map((item) => {
                    const imageUrl = item.image_url || '/placeholder-product.png';
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          gap: '20px',
                          padding: '20px',
                          backgroundColor: '#fafbfc',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fafbfc';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{
                          position: 'relative',
                          width: '100px',
                          height: '100px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0'
                        }}>
                          <Image
                            src={imageUrl}
                            alt={item.product_title}
                            fill
                            style={{ objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-product.png';
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <h4 style={{ 
                              fontSize: '16px', 
                              marginBottom: '8px', 
                              fontWeight: '700',
                              color: '#1e293b'
                            }}>
                              {item.product_title}
                            </h4>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '14px',
                                color: '#64748b',
                                backgroundColor: '#f1f5f9',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontWeight: '600'
                              }}>
                                <i className="fas fa-layer-group" style={{ fontSize: '10px' }}></i>
                                Qty: {item.quantity}
                              </span>
                              <span style={{
                                fontSize: '14px',
                                color: '#64748b'
                              }}>
                                ₹{item.price.toFixed(2)} each
                              </span>
                            </div>
                          </div>
                          <div style={{
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px solid #e2e8f0'
                          }}>
                            <span style={{ 
                              fontSize: '18px', 
                              fontWeight: '800', 
                              color: '#2563eb'
                            }}>
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.address && (
                <div style={{ marginBottom: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      fontSize: '18px'
                    }}>
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                      Shipping Address
                    </h3>
                  </div>
                  <div style={{
                    padding: '24px',
                    backgroundColor: '#fafbfc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                      {selectedOrder.address.full_name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.8', marginBottom: '8px' }}>
                      {selectedOrder.address.address_line1}
                      {selectedOrder.address.address_line2 && `, ${selectedOrder.address.address_line2}`}
                    </div>
                    <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.8', marginBottom: '8px' }}>
                      {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: '#475569',
                      marginTop: '12px',
                      padding: '8px 12px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '8px'
                    }}>
                      <i className="fas fa-phone" style={{ fontSize: '12px' }}></i>
                      {selectedOrder.address.phone}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer with Total and Status Update */}
              <div style={{
                padding: '24px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Amount
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb' }}>
                    ₹{selectedOrder.total_amount.toFixed(2)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                    Update Status:
                  </label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value as Order['status'])}
                    disabled={updatingStatus === selectedOrder.id}
                    style={{
                      padding: '10px 40px 10px 15px',
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: updatingStatus === selectedOrder.id ? 'not-allowed' : 'pointer',
                      backgroundColor: '#fff',
                      color: '#1e293b',
                      transition: 'all 0.2s',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      opacity: updatingStatus === selectedOrder.id ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <style jsx>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slideUp {
                from {
                  transform: translateY(20px);
                  opacity: 0;
                }
                to {
                  transform: translateY(0);
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
