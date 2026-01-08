'use client';

import React, { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import Scrollbar from '@/components/scrollbar/scrollbar';
import { useCart } from '@/contexts/CartContext';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';
import Image from 'next/image';

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const { cart, getSubtotal, getTax, getShipping, getTotal, clearCart, createOrder } = useCart();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    phone: '',
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  if (cart.length === 0) {
    router.push('/cart');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear payment error when user starts typing
    if (paymentError) {
      setPaymentError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      // Process payment
      setIsProcessing(true);
      setPaymentError(null);

      try {
        const order = await createOrder(
          {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
            country: formData.country,
            phone: formData.phone,
          },
          formData.paymentMethod
        );

        // Clear cart on successful order
        clearCart();
        
        // Redirect to order confirmation
        router.push(`/order-confirmation/${order.orderId}`);
      } catch (error) {
        setPaymentError(error instanceof Error ? error.message : 'Payment processing failed. Please try again.');
        setIsProcessing(false);
      }
    }
  };

  return (
    <Fragment>
      <div className='body_wrap sco_agency'>
        <Header />
        <main className="page_content">
          <section className="service pt-140 pb-140">
            <div className="container">
              <div className="row mb-40">
                <div className="col-12">
                  <Fade direction="up" triggerOnce duration={1000}>
                    <h1 className="title">Checkout</h1>
                  </Fade>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="row mb-50">
                <div className="col-12">
                  <div className="checkout-steps" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '50px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: step >= 1 ? 'var(--color-primary-two)' : 'var(--color-default)',
                      fontWeight: step >= 1 ? '700' : '400'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: step >= 1 ? 'var(--color-primary-two)' : '#e7e8ec',
                        color: step >= 1 ? '#fff' : 'var(--color-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700'
                      }}>
                        1
                      </div>
                      <span>Shipping</span>
                    </div>
                    <div style={{ width: '50px', height: '2px', backgroundColor: step >= 2 ? 'var(--color-primary-two)' : '#e7e8ec' }}></div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: step >= 2 ? 'var(--color-primary-two)' : 'var(--color-default)',
                      fontWeight: step >= 2 ? '700' : '400'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: step >= 2 ? 'var(--color-primary-two)' : '#e7e8ec',
                        color: step >= 2 ? '#fff' : 'var(--color-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700'
                      }}>
                        2
                      </div>
                      <span>Payment</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-8">
                  <Fade direction="left" triggerOnce duration={1000}>
                    <form onSubmit={handleSubmit}>
                      {step === 1 && (
                        <div className="checkout-form" style={{
                          padding: '40px',
                          backgroundColor: '#fff',
                          borderRadius: '15px',
                          border: '1px solid #e7e8ec'
                        }}>
                          <h3 className="mb-30" style={{ fontSize: '24px', marginBottom: '30px' }}>
                            Shipping Information
                          </h3>

                          <div className="row">
                            <div className="col-md-6 mb-20">
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                Email Address *
                              </label>
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                style={{
                                  width: '100%',
                                  padding: '12px 20px',
                                  borderRadius: '7px',
                                  border: '1px solid #e7e8ec',
                                  fontSize: '16px',
                                  fontFamily: 'var(--font-body)'
                                }}
                              />
                            </div>
                            <div className="col-md-6 mb-20">
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                                style={{
                                  width: '100%',
                                  padding: '12px 20px',
                                  borderRadius: '7px',
                                  border: '1px solid #e7e8ec',
                                  fontSize: '16px',
                                  fontFamily: 'var(--font-body)'
                                }}
                              />
                            </div>
                            <div className="col-md-6 mb-20">
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                First Name *
                              </label>
                              <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                                style={{
                                  width: '100%',
                                  padding: '12px 20px',
                                  borderRadius: '7px',
                                  border: '1px solid #e7e8ec',
                                  fontSize: '16px',
                                  fontFamily: 'var(--font-body)'
                                }}
                              />
                            </div>
                            <div className="col-md-6 mb-20">
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                Last Name *
                              </label>
                              <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                required
                                style={{
                                  width: '100%',
                                  padding: '12px 20px',
                                  borderRadius: '7px',
                                  border: '1px solid #e7e8ec',
                                  fontSize: '16px',
                                  fontFamily: 'var(--font-body)'
                                }}
                              />
                            </div>
                            <div className="col-12 mb-20">
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                Street Address *
                              </label>
                              <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                required
                                style={{
                                  width: '100%',
                                  padding: '12px 20px',
                                  borderRadius: '7px',
                                  border: '1px solid #e7e8ec',
                                  fontSize: '16px',
                                  fontFamily: 'var(--font-body)'
                                }}
                              />
                            </div>
                            <div className="col-md-6 mb-20">
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                City *
                              </label>
                              <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                required
                                style={{
                                  width: '100%',
                                  padding: '12px 20px',
                                  borderRadius: '7px',
                                  border: '1px solid #e7e8ec',
                                  fontSize: '16px',
                                  fontFamily: 'var(--font-body)'
                                }}
                              />
                            </div>
                            <div className="col-md-6 mb-20">
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                ZIP Code *
                              </label>
                              <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                                required
                                style={{
                                  width: '100%',
                                  padding: '12px 20px',
                                  borderRadius: '7px',
                                  border: '1px solid #e7e8ec',
                                  fontSize: '16px',
                                  fontFamily: 'var(--font-body)'
                                }}
                              />
                            </div>
                            <div className="col-12 mb-30">
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                Country *
                              </label>
                              <select
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                required
                                style={{
                                  width: '100%',
                                  padding: '12px 20px',
                                  borderRadius: '7px',
                                  border: '1px solid #e7e8ec',
                                  fontSize: '16px',
                                  fontFamily: 'var(--font-body)',
                                  backgroundColor: '#fff'
                                }}
                              >
                                <option value="">Select Country</option>
                                <option value="US">United States</option>
                                <option value="UK">United Kingdom</option>
                                <option value="CA">Canada</option>
                                <option value="AU">Australia</option>
                                <option value="DE">Germany</option>
                                <option value="FR">France</option>
                              </select>
                            </div>
                          </div>

                          <div className="checkout-actions" style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                            <Link href="/cart" className="thm-btn thm-btn--border">
                              Back to Cart
                            </Link>
                            <button type="submit" className="thm-btn thm-btn--aso thm-btn--aso_yellow">
                              Continue to Payment
                            </button>
                          </div>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="checkout-form" style={{
                          padding: '40px',
                          backgroundColor: '#fff',
                          borderRadius: '15px',
                          border: '1px solid #e7e8ec'
                        }}>
                          <h3 className="mb-30" style={{ fontSize: '24px', marginBottom: '30px' }}>
                            Payment Method
                          </h3>

                          <div className="payment-methods mb-30">
                            <div style={{
                              padding: '20px',
                              border: '2px solid var(--color-primary-two)',
                              borderRadius: '10px',
                              marginBottom: '15px',
                              backgroundColor: '#f6f6f8'
                            }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="card"
                                  checked={formData.paymentMethod === 'card'}
                                  onChange={handleInputChange}
                                  style={{ width: '20px', height: '20px' }}
                                />
                                <span style={{ fontWeight: '600' }}>Credit/Debit Card</span>
                              </label>
                            </div>
                            <div style={{
                              padding: '20px',
                              border: '1px solid #e7e8ec',
                              borderRadius: '10px',
                              marginBottom: '15px'
                            }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="paypal"
                                  checked={formData.paymentMethod === 'paypal'}
                                  onChange={handleInputChange}
                                  style={{ width: '20px', height: '20px' }}
                                />
                                <span style={{ fontWeight: '600' }}>PayPal</span>
                              </label>
                            </div>
                            <div style={{
                              padding: '20px',
                              border: '1px solid #e7e8ec',
                              borderRadius: '10px'
                            }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="bank"
                                  checked={formData.paymentMethod === 'bank'}
                                  onChange={handleInputChange}
                                  style={{ width: '20px', height: '20px' }}
                                />
                                <span style={{ fontWeight: '600' }}>Bank Transfer</span>
                              </label>
                            </div>
                          </div>

                          {formData.paymentMethod === 'card' && (
                            <div className="card-details">
                              <div className="mb-20">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                  Card Number *
                                </label>
                                <input
                                  type="text"
                                  placeholder="1234 5678 9012 3456"
                                  required
                                  style={{
                                    width: '100%',
                                    padding: '12px 20px',
                                    borderRadius: '7px',
                                    border: '1px solid #e7e8ec',
                                    fontSize: '16px',
                                    fontFamily: 'var(--font-body)'
                                  }}
                                />
                              </div>
                              <div className="row">
                                <div className="col-md-6 mb-20">
                                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                    Expiry Date *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="MM/YY"
                                    required
                                    style={{
                                      width: '100%',
                                      padding: '12px 20px',
                                      borderRadius: '7px',
                                      border: '1px solid #e7e8ec',
                                      fontSize: '16px',
                                      fontFamily: 'var(--font-body)'
                                    }}
                                  />
                                </div>
                                <div className="col-md-6 mb-20">
                                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                    CVV *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="123"
                                    required
                                    style={{
                                      width: '100%',
                                      padding: '12px 20px',
                                      borderRadius: '7px',
                                      border: '1px solid #e7e8ec',
                                      fontSize: '16px',
                                      fontFamily: 'var(--font-body)'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="checkout-actions" style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
                            <button
                              type="button"
                              onClick={() => setStep(1)}
                              className="thm-btn thm-btn--border"
                              disabled={isProcessing}
                            >
                              Back
                            </button>
                            <button 
                              type="submit" 
                              className="thm-btn thm-btn--aso thm-btn--aso_yellow"
                              disabled={isProcessing}
                              style={{ opacity: isProcessing ? 0.6 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                            >
                              {isProcessing ? 'Processing...' : 'Place Order'}
                            </button>
                          </div>
                        </div>
                      )}
                    </form>
                  </Fade>
                </div>

                <div className="col-lg-4">
                  <Fade direction="right" triggerOnce duration={1000}>
                    <div className="order-summary" style={{
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

                      <div className="order-items mb-30" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {cart.map((item) => {
                          const mainImage = typeof item.images[0] === 'string'
                            ? item.images[0]
                            : item.images[0].src || item.images[0];

                          return (
                            <div key={item.Id} style={{
                              display: 'flex',
                              gap: '15px',
                              marginBottom: '20px',
                              paddingBottom: '20px',
                              borderBottom: '1px solid #e7e8ec'
                            }}>
                              <div style={{
                                position: 'relative',
                                width: '60px',
                                height: '60px',
                                borderRadius: '8px',
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
                              <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '14px', marginBottom: '5px', fontWeight: '600' }}>
                                  {item.title}
                                </h4>
                                <p style={{ fontSize: '12px', color: 'var(--color-default)', marginBottom: '5px' }}>
                                  Qty: {item.quantity}
                                </p>
                                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-primary-two)' }}>
                                  ${(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="summary-totals">
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '15px',
                          paddingBottom: '15px',
                          borderBottom: '1px solid #e7e8ec'
                        }}>
                          <span>Subtotal:</span>
                          <span style={{ fontWeight: '600' }}>${getSubtotal().toFixed(2)}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '15px',
                          paddingBottom: '15px',
                          borderBottom: '1px solid #e7e8ec'
                        }}>
                          <span>Shipping:</span>
                          <span style={{ fontWeight: '600' }}>Free</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '20px',
                          fontSize: '20px',
                          fontWeight: '700',
                          color: 'var(--color-heading)'
                        }}>
                          <span>Total:</span>
                          <span style={{ color: 'var(--color-primary-two)' }}>
                            ${getSubtotal().toFixed(2)}
                          </span>
                        </div>
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

export default CheckoutPage;


