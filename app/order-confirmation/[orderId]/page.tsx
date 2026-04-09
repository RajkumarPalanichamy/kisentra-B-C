'use client';

import React, { Fragment, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';

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
}

const OrderConfirmationPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const orderId = params?.orderId as string;
      if (!orderId) {
        setError('Order ID not found');
        setLoading(false);
        return;
      }

      try {
        // Fetch order with items
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        // Check if user owns this order (unless admin)
        if (user && orderData.user_id !== user.id) {
          // For now, allow viewing (admin check can be added later)
          // setError('You do not have permission to view this order');
          // setLoading(false);
          // return;
        }

        // Fetch address details
        if (orderData.address_id) {
          const { data: addressData, error: addressError } = await supabase
            .from('addresses')
            .select('*')
            .eq('id', orderData.address_id)
            .single();

          if (!addressError && addressData) {
            orderData.address = addressData;
          }
        }

        setOrder(orderData as Order);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params, user]);

  if (loading) {
    return (
      <Fragment>
        <div className='body_wrap sco_agency'>
          <Header />
          <main className="page_content">
            <section className="service pt-140 pb-140">
              <div className="container">
                <div className="row">
                  <div className="col-12 text-center">
                    <p className="content">Loading order details...</p>
                  </div>
                </div>
              </div>
            </section>
          </main>
          <Footer />
          <Scrollbar />
        </div>
      </Fragment>
    );
  }

  if (error || !order) {
    return (
      <Fragment>
        <div className='body_wrap sco_agency'>
          <Header />
          <main className="page_content">
            <section className="service pt-140 pb-140">
              <div className="container">
                <div className="row">
                  <div className="col-12 text-center">
                    <h1 className="title mb-20">Order Not Found</h1>
                    <p className="content">{error || 'The order you are looking for does not exist.'}</p>
                    <Link href="/profile?tab=orders" className="thm-btn thm-btn--aso thm-btn--aso_yellow" style={{ marginTop: '20px' }}>
                      View My Orders
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </main>
          <Footer />
          <Scrollbar />
        </div>
      </Fragment>
    );
  }

  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const statusColors: Record<string, { bg: string; color: string }> = {
    pending: { bg: '#fff3cd', color: '#856404' },
    processing: { bg: '#cfe2ff', color: '#084298' },
    shipped: { bg: '#d1e7dd', color: '#0f5132' },
    delivered: { bg: '#d4edda', color: '#155724' },
    cancelled: { bg: '#f8d7da', color: '#721c24' }
  };

  const statusColor = statusColors[order.status] || statusColors.pending;
  const subtotal = order.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping: number = 0; // Free shipping
  const tax: number = 0;
  const total = order.total_amount;

  return (
    <Fragment>
      <div className='body_wrap sco_agency'>
        <Header />
        <main className="page_content">
          <section className="service pt-140 pb-140">
            <div className="container">
              <div className="row">
                <div className="col-12">
                  <Fade direction="up" triggerOnce duration={1000}>
                    <div className="text-center mb-60">
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: statusColor.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 30px',
                        fontSize: '40px',
                        color: statusColor.color
                      }}>
                        <i className="fas fa-check"></i>
                      </div>
                      <h1 className="title mb-20">Order Confirmed!</h1>
                      <p className="content" style={{ fontSize: '18px' }}>
                        Thank you for your purchase. Your order has been successfully placed.
                      </p>
                    </div>
                  </Fade>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-8">
                  <Fade direction="left" triggerOnce duration={1000}>
                    <div className="order-details-card" style={{
                      padding: '40px',
                      backgroundColor: '#fff',
                      borderRadius: '15px',
                      border: '1px solid #e7e8ec',
                      marginBottom: '30px'
                    }}>
                      <h3 className="mb-30" style={{ fontSize: '24px', marginBottom: '30px' }}>
                        Order Details
                      </h3>

                      <div className="order-info mb-30">
                        <div style={{ marginBottom: '20px' }}>
                          <strong>Order ID:</strong> {order.id}
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                          <strong>Order Date:</strong> {orderDate}
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                          <strong>Status:</strong>{' '}
                          <span style={{
                            padding: '5px 15px',
                            borderRadius: '5px',
                            backgroundColor: statusColor.bg,
                            color: statusColor.color,
                            fontSize: '14px',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="order-items mb-30">
                        <h4 className="mb-20" style={{ fontSize: '20px', marginBottom: '20px' }}>
                          Items Ordered
                        </h4>
                        {order.order_items.map((item) => {
                          const imageUrl = item.image_url || '/placeholder-product.png';

                          return (
                            <div key={item.id} style={{
                              display: 'flex',
                              gap: '20px',
                              marginBottom: '20px',
                              paddingBottom: '20px',
                              borderBottom: '1px solid #e7e8ec'
                            }}>
                              <div style={{
                                position: 'relative',
                                width: '80px',
                                height: '80px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                backgroundColor: '#f6f6f8'
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
                              <div style={{ flex: 1 }}>
                                <h5 style={{ fontSize: '16px', marginBottom: '5px', fontWeight: '600' }}>
                                  {item.product_title}
                                </h5>
                                <p style={{ fontSize: '14px', color: 'var(--color-default)', marginBottom: '5px' }}>
                                  Quantity: {item.quantity}
                                </p>
                                <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-primary-two)' }}>
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {order.address && (
                        <div className="shipping-info">
                          <h4 className="mb-20" style={{ fontSize: '20px', marginBottom: '20px' }}>
                            Shipping Address
                          </h4>
                          <p style={{ lineHeight: '1.8' }}>
                            {order.address.full_name}<br />
                            {order.address.address_line1}, {order.address.address_line2}<br />
                            {order.address.city}, {order.address.state} - {order.address.pincode}<br />
                            Phone: {order.address.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </Fade>
                </div>

                <div className="col-lg-4">
                  <Fade direction="right" triggerOnce duration={1000}>
                    <div className="order-summary-card" style={{
                      padding: '30px',
                      backgroundColor: '#fff',
                      borderRadius: '15px',
                      border: '1px solid #e7e8ec',
                      position: 'sticky',
                      top: '100px'
                    }}>
                      <h3 className="mb-30" style={{ fontSize: '24px', marginBottom: '30px' }}>
                        Order Summary
                      </h3>

                      <div className="summary-row mb-15" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '15px'
                      }}>
                        <span>Subtotal:</span>
                        <span style={{ fontWeight: '600' }}>₹{subtotal.toFixed(2)}</span>
                      </div>

                      <div className="summary-row mb-15" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '15px'
                      }}>
                        <span>Tax:</span>
                        <span style={{ fontWeight: '600' }}>₹{tax.toFixed(2)}</span>
                      </div>

                      <div className="summary-row mb-15" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '15px'
                      }}>
                        <span>Shipping:</span>
                        <span style={{ fontWeight: '600' }}>
                          {shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}
                        </span>
                      </div>

                      <div className="summary-row mb-30" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: '2px solid #e7e8ec',
                        fontSize: '20px',
                        fontWeight: '700',
                        color: 'var(--color-heading)'
                      }}>
                        <span>Total:</span>
                        <span style={{ color: 'var(--color-primary-two)' }}>
                          ₹{total.toFixed(2)}
                        </span>
                      </div>

                      <div className="payment-method mb-30" style={{ marginBottom: '30px' }}>
                        <strong>Payment Method:</strong>{' '}
                        <span style={{ textTransform: 'capitalize' }}>{order.payment_method}</span>
                      </div>

                      <div className="order-actions" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <Link
                          href="/products"
                          className="thm-btn thm-btn--aso thm-btn--aso_yellow"
                          style={{ width: '100%', textAlign: 'center' }}
                        >
                          Continue Shopping
                        </Link>
                        <Link
                          href="/profile?tab=orders"
                          className="thm-btn thm-btn--border"
                          style={{ width: '100%', textAlign: 'center' }}
                        >
                          View All Orders
                        </Link>
                      </div>
                    </div>
                  </Fade>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
        <Scrollbar />
      </div>
    </Fragment>
  );
};

export default OrderConfirmationPage;
