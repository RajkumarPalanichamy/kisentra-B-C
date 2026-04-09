// products.tsx
import type { StaticImageData } from 'next/image'

import productImg01 from '@/public/images/service/service-img01.jpg'
import productImg02 from '@/public/images/service/service-img02.jpg'
import productImg03 from '@/public/images/service/service-img03.jpg'
import productImg04 from '@/public/images/service/service-img04.jpg'
import productImg05 from '@/public/images/hero/hero-img02.png'
import productImg06 from '@/public/images/hero/hero-img03.png'

export interface Product {
  Id: string
  title: string
  slug: string
  price: number
  originalPrice?: number
  description: string
  longDescription?: string
  category: string
  images: (string | StaticImageData)[]
  inStock: boolean
  rating?: number
  reviews?: number
  features?: string[]
  tags?: string[]
  highlights?: { [key: string]: string } // Key-value pairs for product highlights/specifications
  visible?: boolean // For admin to enable/disable products
}

// Synchronous version for client-side (to avoid hydration issues)
// This is used for initial render to prevent hydration mismatch
export const getProducts = (): Product[] => {
  if (typeof window !== 'undefined') {
    const savedProducts = localStorage.getItem('adminProducts');
    if (savedProducts) {
      try {
        return JSON.parse(savedProducts);
      } catch (error) {
        console.error('Error parsing saved products:', error);
      }
    }
  }
  return Products;
};

// Async version to load from Supabase (called after mount)
export const getProductsFromSupabaseAsync = async (signal?: AbortSignal): Promise<Product[] | null> => {
  if (signal?.aborted) return null;
  if (typeof window === 'undefined') return null;

  try {
    if (signal?.aborted) return null;
    const { isSupabaseConfigured } = await import('@/lib/supabase');
    if (isSupabaseConfigured()) {
      const { getProductsFromSupabase } = await import('./products-supabase');
      if (signal?.aborted) return null;
      return await getProductsFromSupabase();
    }
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('signal is aborted')) {
      return null;
    }
    console.error('Error loading from Supabase:', error);
  }
  return null;
};

// Function to save products to Supabase or localStorage
export const saveProducts = async (products: Product[]): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminProducts', JSON.stringify(products));

    // Try to sync to Supabase if configured (in background)
    getProductsFromSupabaseAsync().then(() => {
      import('./products-supabase').then(({ saveProductToSupabase }) => {
        products.forEach(product => {
          saveProductToSupabase(product).catch(err => {
            console.error('Error syncing product to Supabase:', err);
          });
        });
      }).catch(() => { });
    }).catch(() => { });
  }
};

// Save a single product
export const saveProduct = async (product: Product): Promise<void> => {
  if (typeof window !== 'undefined') {
    // Update local storage
    const savedProducts = localStorage.getItem('adminProducts');
    let products: Product[] = savedProducts ? JSON.parse(savedProducts) : Products;

    const index = products.findIndex(p => p.Id === product.Id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem('adminProducts', JSON.stringify(products));

    // Sync to Supabase
    const { isSupabaseConfigured } = await import('@/lib/supabase');
    if (isSupabaseConfigured()) {
      import('./products-supabase').then(({ saveProductToSupabase }) => {
        saveProductToSupabase(product).then((success) => {
          if (!success) {
            console.error('❌ Failed to save product to Supabase:', {
              productTitle: product.title,
              productSlug: product.slug,
              productId: product.Id
            });
          }
        }).catch((error) => {
          console.error('❌ Exception while saving product to Supabase:', {
            productTitle: product.title,
            productSlug: product.slug,
            error: error?.message || error,
            stack: error?.stack
          });
        });
      }).catch((error) => {
        console.error('❌ Failed to import products-supabase:', error);
      });
    }
  }
};

// Delete a product
export const deleteProduct = async (productId: string): Promise<void> => {
  if (typeof window !== 'undefined') {
    // Update local storage
    const savedProducts = localStorage.getItem('adminProducts');
    if (savedProducts) {
      const products: Product[] = JSON.parse(savedProducts);
      const updatedProducts = products.filter(p => p.Id !== productId);
      localStorage.setItem('adminProducts', JSON.stringify(updatedProducts));
    }

    // Sync to Supabase
    const { isSupabaseConfigured } = await import('@/lib/supabase');
    if (isSupabaseConfigured()) {
      import('./products-supabase').then(({ deleteProductFromSupabase }) => {
        deleteProductFromSupabase(productId).then((success) => {
          if (!success) console.error('Failed to delete product from Supabase');
        });
      });
    }
  }
};

const Products: Product[] = [
  {
    Id: '1',
    title: 'Premium SEO Toolkit',
    slug: 'premium-seo-toolkit',
    price: 299,
    originalPrice: 399,
    description: 'Complete SEO solution with advanced analytics and reporting tools.',
    longDescription: 'Transform your SEO strategy with our comprehensive toolkit. Includes keyword research, competitor analysis, backlink tracking, and automated reporting. Perfect for agencies and businesses looking to scale their organic growth.',
    category: 'SEO Tools',
    images: [productImg01, productImg02],
    inStock: true,
    rating: 4.8,
    reviews: 124,
    features: [
      'Advanced keyword research',
      'Competitor analysis',
      'Backlink tracking',
      'Automated reporting',
      'White-label options'
    ],
    tags: ['SEO', 'Analytics', 'Marketing']
  },
  {
    Id: '2',
    title: 'Enterprise Analytics Suite',
    slug: 'enterprise-analytics-suite',
    price: 599,
    originalPrice: 799,
    description: 'Powerful analytics platform for data-driven decision making.',
    longDescription: 'Get comprehensive insights into your business performance with real-time analytics, custom dashboards, and AI-powered recommendations. Integrates seamlessly with all major platforms.',
    category: 'Analytics',
    images: [productImg02, productImg03],
    inStock: true,
    rating: 4.9,
    reviews: 89,
    features: [
      'Real-time analytics',
      'Custom dashboards',
      'AI recommendations',
      'Multi-platform integration',
      'Advanced reporting'
    ],
    tags: ['Analytics', 'Data', 'Business Intelligence']
  },
  {
    Id: '3',
    title: 'Cloud Infrastructure Package',
    slug: 'cloud-infrastructure-package',
    price: 1299,
    description: 'Scalable cloud infrastructure with 24/7 monitoring and support.',
    longDescription: 'Deploy and manage your cloud infrastructure with ease. Includes automated scaling, security monitoring, backup solutions, and dedicated support team.',
    category: 'Cloud Services',
    images: [productImg03, productImg04],
    inStock: true,
    rating: 4.7,
    reviews: 156,
    features: [
      'Automated scaling',
      'Security monitoring',
      'Backup solutions',
      '24/7 support',
      '99.9% uptime SLA'
    ],
    tags: ['Cloud', 'Infrastructure', 'DevOps']
  },
  {
    Id: '4',
    title: 'Cybersecurity Essentials',
    slug: 'cybersecurity-essentials',
    price: 449,
    originalPrice: 599,
    description: 'Complete cybersecurity solution for small to medium businesses.',
    longDescription: 'Protect your business with enterprise-grade security. Includes firewall protection, threat detection, vulnerability scanning, and security training for your team.',
    category: 'Security',
    images: [productImg04, productImg01],
    inStock: true,
    rating: 4.8,
    reviews: 203,
    features: [
      'Firewall protection',
      'Threat detection',
      'Vulnerability scanning',
      'Security training',
      'Compliance support'
    ],
    tags: ['Security', 'Cybersecurity', 'Protection']
  },
  {
    Id: '5',
    title: 'AI Marketing Automation',
    slug: 'ai-marketing-automation',
    price: 799,
    description: 'AI-powered marketing automation platform for personalized campaigns.',
    longDescription: 'Automate your marketing workflows with AI that learns and adapts. Create personalized campaigns, optimize send times, and increase engagement rates automatically.',
    category: 'Marketing',
    images: [productImg05, productImg06],
    inStock: true,
    rating: 4.9,
    reviews: 167,
    features: [
      'AI-powered personalization',
      'Automated workflows',
      'Send time optimization',
      'A/B testing',
      'Advanced segmentation'
    ],
    tags: ['AI', 'Marketing', 'Automation']
  },
  {
    Id: '6',
    title: 'Data Solutions Platform',
    slug: 'data-solutions-platform',
    price: 999,
    originalPrice: 1299,
    description: 'Comprehensive data management and analytics platform.',
    longDescription: 'Unlock the power of your data with our all-in-one platform. Includes data warehousing, ETL pipelines, visualization tools, and machine learning capabilities.',
    category: 'Data Solutions',
    images: [productImg06, productImg02],
    inStock: true,
    rating: 4.7,
    reviews: 98,
    features: [
      'Data warehousing',
      'ETL pipelines',
      'Visualization tools',
      'ML capabilities',
      'Real-time processing'
    ],
    tags: ['Data', 'Analytics', 'Machine Learning']
  },
  {
    Id: '7',
    title: 'Website Development Package',
    slug: 'website-development-package',
    price: 2499,
    description: 'Custom website development with modern design and optimization.',
    longDescription: 'Get a professionally designed, fully optimized website that converts. Includes responsive design, SEO optimization, performance tuning, and ongoing maintenance.',
    category: 'Development',
    images: [productImg01, productImg05],
    inStock: true,
    rating: 5.0,
    reviews: 234,
    features: [
      'Custom design',
      'SEO optimization',
      'Performance tuning',
      'Responsive layout',
      'Ongoing maintenance'
    ],
    tags: ['Web Development', 'Design', 'SEO']
  },
  {
    Id: '8',
    title: 'IT Management Suite',
    slug: 'it-management-suite',
    price: 699,
    description: 'Complete IT management solution for modern businesses.',
    longDescription: 'Streamline your IT operations with our comprehensive management suite. Includes asset tracking, help desk, network monitoring, and IT documentation.',
    category: 'IT Services',
    images: [productImg02, productImg04],
    inStock: true,
    rating: 4.6,
    reviews: 145,
    features: [
      'Asset tracking',
      'Help desk system',
      'Network monitoring',
      'IT documentation',
      'Remote support'
    ],
    tags: ['IT', 'Management', 'Support']
  },
  {
    Id: '9',
    title: 'Digital Transformation Consulting',
    slug: 'digital-transformation-consulting',
    price: 1999,
    description: 'Expert consulting for digital transformation initiatives.',
    longDescription: 'Navigate your digital transformation journey with expert guidance. Includes strategy development, technology assessment, implementation planning, and change management.',
    category: 'Consulting',
    images: [productImg03, productImg06],
    inStock: true,
    rating: 4.9,
    reviews: 67,
    features: [
      'Strategy development',
      'Technology assessment',
      'Implementation planning',
      'Change management',
      'Ongoing support'
    ],
    tags: ['Consulting', 'Transformation', 'Strategy']
  },
  {
    Id: '10',
    title: 'Performance Optimization Service',
    slug: 'performance-optimization-service',
    price: 399,
    originalPrice: 549,
    description: 'Boost your website and application performance significantly.',
    longDescription: 'Improve load times, reduce bounce rates, and enhance user experience. Our optimization service includes code analysis, image optimization, caching strategies, and CDN setup.',
    category: 'Optimization',
    images: [productImg04, productImg01],
    inStock: true,
    rating: 4.8,
    reviews: 189,
    features: [
      'Code analysis',
      'Image optimization',
      'Caching strategies',
      'CDN setup',
      'Performance monitoring'
    ],
    tags: ['Performance', 'Optimization', 'Speed']
  },
  {
    Id: '11',
    title: 'Mobile App Development',
    slug: 'mobile-app-development',
    price: 3499,
    description: 'Native and cross-platform mobile app development services.',
    longDescription: 'Build powerful mobile applications for iOS and Android. Includes UI/UX design, native development, testing, and app store submission support.',
    category: 'Development',
    images: [productImg05, productImg03],
    inStock: true,
    rating: 4.9,
    reviews: 112,
    features: [
      'UI/UX design',
      'Native development',
      'Cross-platform support',
      'Testing & QA',
      'App store submission'
    ],
    tags: ['Mobile', 'Development', 'Apps']
  },
  {
    Id: '12',
    title: 'E-commerce Platform Setup',
    slug: 'ecommerce-platform-setup',
    price: 1799,
    originalPrice: 2299,
    description: 'Complete e-commerce platform setup with payment integration.',
    longDescription: 'Launch your online store with a fully configured e-commerce platform. Includes product management, payment gateway integration, inventory management, and order processing.',
    category: 'E-commerce',
    images: [productImg06, productImg02],
    inStock: true,
    rating: 4.7,
    reviews: 201,
    features: [
      'Product management',
      'Payment integration',
      'Inventory management',
      'Order processing',
      'Analytics dashboard'
    ],
    tags: ['E-commerce', 'Platform', 'Online Store']
  }
]

// Export default for backward compatibility
export default Products

// Functions are already exported above (getProducts, saveProducts)



