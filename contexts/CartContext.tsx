'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/api/products';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import {
  getCartFromSupabase,
  syncCartItemToSupabase,
  removeCartItemFromSupabase,
  clearSupabaseCart,
  mergeLocalCart
} from '@/api/cart-supabase';

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  orderId: string;
  orderDate: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface CartContextType {
  cart: CartItem[];
  orders: Order[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getShipping: () => number;
  getTotal: () => number;
  getTotalItems: () => number;
  createOrder: (customerInfo: Order['customerInfo'], paymentMethod: string) => Promise<Order>;
  getOrderById: (orderId: string) => Order | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // Initialize cart and auth listeners
  useEffect(() => {
    let isMounted = true;

    const initializeCart = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.warn("Supabase session check warning:", error.message);
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Check for local cart to merge before loading remote
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            try {
              const localCart = JSON.parse(savedCart);
              if (Array.isArray(localCart) && localCart.length > 0) {
                await mergeLocalCart(currentUser.id, localCart);
                localStorage.removeItem('cart');
              }
            } catch (e) {
              console.error('Error parsing local cart for merge', e);
            }
          }

          // Load from Supabase
          try {
            const remoteCart = await getCartFromSupabase(currentUser.id);
            if (isMounted && Array.isArray(remoteCart)) {
              setCart(remoteCart);
            }
          } catch (error) {
            console.error('Error loading cart from Supabase:', error);
            // Fallback to localStorage if Supabase fails
            const savedCart = localStorage.getItem('cart');
            if (isMounted && savedCart) {
              try {
                setCart(JSON.parse(savedCart));
              } catch (e) {
                console.error('Error loading cart from localStorage fallback:', e);
              }
            }
          }
        } else {
          // Load from local storage for non-authenticated users
          const savedCart = localStorage.getItem('cart');
          if (isMounted && savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart);
              if (Array.isArray(parsedCart)) {
                setCart(parsedCart);
              }
            } catch (error) {
              console.error('Error loading cart from localStorage:', error);
            }
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          // Ignore abort errors from Supabase client
          return;
        }
        console.error('Error initializing cart:', error);
        // Fallback to localStorage
        const savedCart = localStorage.getItem('cart');
        if (isMounted && savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart);
            if (Array.isArray(parsedCart)) {
              setCart(parsedCart);
            }
          } catch (e) {
            console.error('Error loading cart from localStorage fallback:', e);
          }
        }
      }
    };

    initializeCart();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_IN' && currentUser) {
        // Merge local cart if exists
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          try {
            const localCart = JSON.parse(savedCart);
            if (localCart.length > 0) {
              await mergeLocalCart(currentUser.id, localCart);
              localStorage.removeItem('cart');
            }
          } catch (e) { }
        }
        const remoteCart = await getCartFromSupabase(currentUser.id);
        setCart(remoteCart);
      } else if (event === 'SIGNED_OUT') {
        setCart([]); // Clear cart to avoid showing user's cart to basic session, or load local?
        // Usually logout means clear user specific data.
      }
    });

    // Load orders
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (error) {
        console.error('Error loading orders from localStorage:', error);
      }
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Save cart to localStorage ONLY if no user (or as backup)
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    } else {
      // Also save to localStorage as backup even when user is logged in
      try {
        localStorage.setItem('cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart backup to localStorage:', error);
      }
    }
  }, [cart, user]);

  // Save orders to localStorage (keep independent for now)
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  const addToCart = async (product: Product, quantity: number = 1) => {
    let finalQuantity = quantity;
    const existingItem = cart.find((item) => item.Id === product.Id);

    if (existingItem) {
      finalQuantity = existingItem.quantity + quantity;
    }

    console.log('Adding to cart:', { product: product.title, quantity: finalQuantity, user: user?.id || 'not logged in' });

    // Update local state immediately for better UX
    setCart((prevCart) => {
      const itemExists = prevCart.find((item) => item.Id === product.Id);
      if (itemExists) {
        return prevCart.map((item) =>
          item.Id === product.Id
            ? { ...item, quantity: finalQuantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: finalQuantity }];
    });

    // Sync to Supabase if user is logged in (don't await to avoid blocking UI)
    if (user) {
      console.log('User is authenticated, syncing to Supabase...');
      try {
        await syncCartItemToSupabase(user.id, product, finalQuantity);
        console.log('Successfully synced cart item to Supabase');
      } catch (error) {
        console.error('Error syncing cart item to Supabase:', error);
        // Keep item in local state even if sync fails
      }
    } else {
      console.log('User not authenticated, saving to localStorage only');
    }
    // If no user, localStorage will be updated by the useEffect hook
  };

  const removeFromCart = async (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.Id !== productId));
    if (user) {
      await removeCartItemFromSupabase(user.id, productId);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.Id === productId ? { ...item, quantity } : item
      )
    );

    if (user) {
      const item = cart.find(i => i.Id === productId);
      if (item) {
        await syncCartItemToSupabase(user.id, item, quantity);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (user) {
      await clearSupabaseCart(user.id);
    } else {
      localStorage.removeItem('cart');
    }
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTax = () => {
    // 8% tax rate
    return getSubtotal() * 0.08;
  };

  const getShipping = () => {
    // Free shipping for orders over ₹499, otherwise ₹10
    return getSubtotal() >= 499 ? 0 : 10;
  };

  const getTotal = () => {
    return getSubtotal() + getTax() + getShipping();
  };

  // Legacy method for backward compatibility
  const getTotalPrice = () => {
    return getSubtotal();
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const createOrder = async (customerInfo: Order['customerInfo'], paymentMethod: string): Promise<Order> => {
    return new Promise((resolve, reject) => {
      // Simulate payment processing delay
      setTimeout(() => {
        const subtotal = getSubtotal();
        const tax = getTax();
        const shipping = getShipping();
        const total = subtotal + tax + shipping;

        // Generate unique order ID
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const newOrder: Order = {
          orderId,
          orderDate: new Date().toISOString(),
          items: [...cart],
          subtotal,
          tax,
          shipping,
          total,
          customerInfo,
          paymentMethod,
          status: 'completed', // In real app, this would be determined by payment gateway
        };

        // Simulate 5% payment failure rate
        const paymentSuccess = Math.random() > 0.05;

        if (paymentSuccess) {
          setOrders((prevOrders) => [newOrder, ...prevOrders]);
          resolve(newOrder);
        } else {
          const failedOrder: Order = {
            ...newOrder,
            status: 'failed',
          };
          setOrders((prevOrders) => [failedOrder, ...prevOrders]);
          reject(new Error('Payment processing failed. Please try again.'));
        }
      }, 2000); // 2 second delay to simulate payment processing
    });
  };

  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find((order) => order.orderId === orderId);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        orders,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getSubtotal,
        getTax,
        getShipping,
        getTotal,
        getTotalItems,
        createOrder,
        getOrderById,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};



