'use client';

import React, { Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import { useCart } from '@/contexts/CartContext';
import { Fade } from 'react-awesome-reveal';

const CartPage: React.FC = () => {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, getSubtotal, getTax, getShipping, getTotal, clearCart, getTotalItems } = useCart();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    updateQuantity(productId, newQuantity);
  };

  if (cart.length === 0) {
    return (
      <Fragment>
        <div className='body_wrap sco_agency'>
          <Header />
          <main className="page_content">
            <section className="service pt-140 pb-140">
              <div className="container">
                <div className="row">
                  <div className="col-12 text-center">
                    <Fade direction="up" triggerOnce duration={1000}>
                      <h2 className="title mb-30">Your Cart is Empty</h2>
                      <p className="content mb-40">
                        Looks like you haven't added any items to your cart yet.
                      </p>
                      <Link href="/products" className="thm-btn thm-btn--aso thm-btn--aso_yellow">
                        Continue Shopping
                      </Link>
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
  }

  return (
    <Fragment>
      <div className='body_wrap sco_agency'>
        <Header />
        <main className="page_content">
          <section className="service pt-140 pb-140">
            <div className="container">
              {/* Breadcrumb Navigation */}
              <div className="row mb-20">
                <div className="col-12">
                  <nav aria-label="breadcrumb" style={{
                    marginBottom: '20px',
                    fontSize: '14px'
                  }}>
                    <ol style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <li>
                        <Link href="/" style={{
                          color: 'var(--color-default)',
                          textDecoration: 'none',
                          transition: 'color 0.2s'
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-two)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-default)'}>
                          Home
                        </Link>
                      </li>
                      <li style={{ color: 'var(--color-default)' }}>/</li>
                      <li>
                        <Link href="/products" style={{
                          color: 'var(--color-default)',
                          textDecoration: 'none',
                          transition: 'color 0.2s'
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-two)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-default)'}>
                          Shop
                        </Link>
                      </li>
                      <li style={{ color: 'var(--color-default)' }}>/</li>
                      <li style={{ color: 'var(--color-heading)', fontWeight: '500' }}>
                        Shopping Cart
                      </li>
                    </ol>
                  </nav>
                </div>
              </div>
              <div className="row mb-40">
                <div className="col-12">
                  <Fade direction="up" triggerOnce duration={1000}>
                    <h1 className="title">Shopping Cart</h1>
                  </Fade>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-8">
                  <Fade direction="left" triggerOnce duration={1000}>
                    <div className="cart-items">
                      {cart.map((item) => {
                        const mainImage = typeof item.images[0] === 'string'
                          ? item.images[0]
                          : item.images[0].src || item.images[0];

                        return (
                          <div
                            key={item.Id}
                            className="cart-item mb-30"
                            style={{
                              padding: '30px',
                              backgroundColor: '#fff',
                              borderRadius: '15px',
                              border: '1px solid #e7e8ec',
                              display: 'flex',
                              gap: '20px',
                              alignItems: 'center'
                            }}
                          >
                            <div className="cart-item-image" style={{
                              position: 'relative',
                              width: '120px',
                              height: '120px',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              backgroundColor: '#f6f6f8'
                            }}>
                              <Image
                                src={mainImage}
                                alt={item.title}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            </div>

                            <div className="cart-item-details" style={{ flex: 1 }}>
                              <h3 className="mb-10" style={{ fontSize: '20px', marginBottom: '10px' }}>
                                <Link href={`/products/${item.slug}`} style={{ color: 'var(--color-heading)', textDecoration: 'none' }}>
                                  {item.title}
                                </Link>
                              </h3>
                              <p className="content mb-15" style={{ fontSize: '14px', marginBottom: '15px' }}>
                                {item.description}
                              </p>
                              <div className="cart-item-price" style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: 'var(--color-primary-two)'
                              }}>
                                ₹{item.price}
                              </div>
                            </div>

                            <div className="cart-item-quantity" style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                border: '1px solid #e7e8ec',
                                borderRadius: '7px',
                                overflow: 'hidden'
                              }}>
                                <button
                                  onClick={() => handleQuantityChange(item.Id, item.quantity - 1)}
                                  style={{
                                    padding: '8px 15px',
                                    border: 'none',
                                    backgroundColor: '#f6f6f8',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                  }}
                                >
                                  -
                                </button>
                                <span style={{
                                  padding: '8px 20px',
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  minWidth: '50px',
                                  textAlign: 'center'
                                }}>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item.Id, item.quantity + 1)}
                                  style={{
                                    padding: '8px 15px',
                                    border: 'none',
                                    backgroundColor: '#f6f6f8',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                  }}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.Id)}
                                style={{
                                  padding: '5px 15px',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  color: 'red',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  textDecoration: 'underline'
                                }}
                              >
                                Remove
                              </button>
                            </div>

                            <div className="cart-item-total" style={{
                              fontSize: '20px',
                              fontWeight: '700',
                              color: 'var(--color-heading)',
                              minWidth: '100px',
                              textAlign: 'right'
                            }}>
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Fade>
                </div>

                <div className="col-lg-4">
                  <Fade direction="right" triggerOnce duration={1000}>
                    <div className="cart-summary" style={{
                      padding: '30px',
                      backgroundColor: '#fff',
                      borderRadius: '15px',
                      border: '1px solid #e7e8ec',
                      position: 'sticky',
                      top: '100px'
                    }}>
                      <h3 className="mb-30" style={{ fontSize: '24px', marginBottom: '30px' }}>
                        Price Details
                      </h3>

                      <div className="summary-row mb-20" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '15px',
                        paddingBottom: '15px',
                        borderBottom: '1px solid #e7e8ec'
                      }}>
                        <span>Price ({getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''}):</span>
                        <span style={{ fontWeight: '600' }}>₹{getSubtotal().toFixed(2)}</span>
                      </div>

                      <div className="summary-row mb-20" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '15px',
                        paddingBottom: '15px',
                        borderBottom: '1px solid #e7e8ec'
                      }}>
                        <span>Delivery Charges:</span>
                        <span style={{ fontWeight: '600', color: getShipping() === 0 ? 'green' : 'inherit' }}>
                          {getShipping() === 0 ? (
                            <>
                              <span style={{ textDecoration: 'line-through', color: 'var(--color-default)', marginRight: '5px' }}>
                                ₹10.00
                              </span>
                              <span style={{ color: 'green' }}>FREE</span>
                            </>
                          ) : (
                            `₹${getShipping().toFixed(2)}`
                          )}
                        </span>
                      </div>

                      {getSubtotal() < 499 && (
                        <div style={{
                          padding: '10px',
                          backgroundColor: '#fff3cd',
                          borderRadius: '7px',
                          marginBottom: '15px',
                          fontSize: '14px',
                          color: '#856404',
                          border: '1px solid #ffeaa7'
                        }}>
                          <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                          Add ₹{(499 - getSubtotal()).toFixed(2)} more for FREE delivery
                        </div>
                      )}

                      <div className="summary-row mb-20" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '15px',
                        paddingBottom: '15px',
                        borderBottom: '1px solid #e7e8ec'
                      }}>
                        <span>Tax:</span>
                        <span style={{ fontWeight: '600' }}>₹{getTax().toFixed(2)}</span>
                      </div>

                      <div className="summary-row mb-30" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '30px',
                        paddingTop: '15px',
                        fontSize: '20px',
                        fontWeight: '700',
                        color: 'var(--color-heading)',
                        borderTop: '2px solid #e7e8ec'
                      }}>
                        <span>Total Amount:</span>
                        <span style={{ color: 'var(--color-primary-two)' }}>
                          ₹{getTotal().toFixed(2)}
                        </span>
                      </div>

                      <div style={{
                        padding: '15px',
                        backgroundColor: '#d4edda',
                        borderRadius: '7px',
                        marginBottom: '20px',
                        fontSize: '14px',
                        color: '#155724',
                        border: '1px solid #c3e6cb'
                      }}>
                        <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                        You will save ₹{(getTax()).toFixed(2)} on this order
                      </div>

                      <div className="cart-actions" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button
                          onClick={async () => {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) {
                              router.push('/auth');
                            } else {
                              router.push('/checkout');
                            }
                          }}
                          className="thm-btn thm-btn--aso thm-btn--aso_yellow"
                          style={{ width: '100%', textAlign: 'center', cursor: 'pointer', border: 'none' }}
                        >
                          Place Order
                        </button>
                        <Link
                          href="/products"
                          className="thm-btn thm-btn--border"
                          style={{ width: '100%', textAlign: 'center' }}
                        >
                          Continue Shopping
                        </Link>
                        <button
                          onClick={clearCart}
                          style={{
                            padding: '12px 20px',
                            border: '1px solid #e7e8ec',
                            backgroundColor: 'transparent',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            color: 'var(--color-default)',
                            fontSize: '14px'
                          }}
                        >
                          Clear Cart
                        </button>
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

export default CartPage;



