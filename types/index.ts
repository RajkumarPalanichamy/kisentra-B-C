export interface Address {
    id: string;
    user_id: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    is_default: boolean;
    created_at: string;
}

export interface Order {
    id: string;
    user_id: string;
    address_id: string;
    total_amount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_method: string;
    created_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    product_title: string;
    quantity: number;
    price: number;
    image_url?: string;
}
