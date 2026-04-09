# 03 — Project Structure

```
kisentra-B-C/
├── app/                        # Next.js App Router (pages + layouts)
│   ├── layout.tsx              # Root layout — wraps entire app
│   ├── page.tsx                # Default home page (/)
│   ├── not-found.tsx           # Global 404 handler
│   ├── api/
│   │   └── hello.js            # Example API route
│   ├── auth/
│   │   └── page.tsx            # Login / Sign-up page
│   ├── auth/callback/
│   │   └── route.ts            # OAuth callback handler
│   ├── home/ … home-6/         # 6 homepage template variants
│   ├── products/               # Product listing page
│   ├── cart/                   # Shopping cart page
│   ├── checkout/               # Checkout page
│   ├── order-confirmation/     # Post-purchase confirmation
│   ├── profile/                # User profile page
│   ├── admin/                  # Admin area (own layout)
│   ├── blog/                   # Blog listing
│   ├── blog-single/            # Individual blog post
│   ├── about/                  # About us page
│   ├── service/                # Services listing
│   ├── service-single/         # Individual service detail
│   ├── contact/                # Contact page
│   ├── career/                 # Careers listing
│   ├── career-details/         # Individual job detail
│   ├── pricing/                # Pricing page
│   ├── team/                   # Team page
│   ├── casestudy/              # Case studies listing
│   ├── casestudy-details/      # Individual case study
│   ├── privacy-policy/         # Privacy policy
│   ├── terms-conditions/       # Terms of service
│   └── 404/                    # Custom 404 page
│
├── api/                        # Static / mock data layer
│   ├── products.tsx            # Default product catalogue (mock data)
│   ├── products-supabase.ts    # Supabase product fetching with fallback
│   ├── cart-supabase.ts        # Cart CRUD against Supabase
│   ├── categories.ts           # Product category definitions
│   ├── blogs.tsx               # Blog post content
│   ├── banners.ts              # Banner / promotional data
│   ├── team.tsx                # Team member data
│   ├── service.tsx             # Service offering data
│   ├── case.tsx                # Case study data
│   └── project.tsx             # Portfolio project data
│
├── components/                 # 47 reusable UI components
│   ├── header/                 # Default site header
│   ├── header2-6/              # Header variants for home-2 … home-6
│   ├── footer/                 # Site footer
│   ├── MobileMenu/             # Off-canvas mobile menu
│   ├── MobileBottomNav/        # Bottom nav bar (mobile)
│   ├── hero/                   # Default hero section
│   ├── hero2-6/                # Hero variants
│   ├── FeaturesSection/        # Feature highlight block
│   ├── FeaturedProducts/       # Product showcase carousel
│   ├── ProductCard/            # Individual product card
│   ├── ProductCarousel/        # Product carousel wrapper
│   ├── IndustrieSection/       # Industry verticals block
│   ├── ProjectSection/         # Portfolio/project grid
│   ├── ServiceSection/         # Services overview
│   ├── TeamSection/            # Team members grid
│   ├── Testimonial/            # Customer testimonials
│   ├── BlogSection/            # Blog preview block
│   ├── BlogList/               # Full blog listing
│   ├── BlogDetails/            # Blog post body
│   ├── BlogSidebar/            # Blog sidebar (categories, tags)
│   ├── CtaSection/             # Call-to-action banners
│   ├── FaqSection/             # FAQ accordion
│   ├── FunFact/                # Animated stat counters
│   ├── PartnerSection/         # Partner/client logos marquee
│   ├── WorkProcess/            # Step-by-step process block
│   ├── ContactFrom/            # Contact form
│   ├── ContactSection/         # Contact section wrapper
│   ├── FloatingIcons/          # Floating action buttons container
│   ├── WhatsAppFloatingButton/ # Floating WhatsApp link
│   ├── MailFloatingButton/     # Floating email link
│   ├── scrollbar/              # Custom scrollbar component
│   ├── Cloud-devops-components/
│   ├── Cyber-Security-Components/
│   ├── It-Services-Components/
│   ├── Help-Desk-Components/
│   └── data-solutions-components/
│
├── contexts/                   # React Context providers
│   ├── CartContext.tsx         # Cart state + Supabase sync
│   ├── UserContext.tsx         # Auth state (session, user)
│   └── AdminContext.tsx        # Admin context (minimal)
│
├── lib/                        # Shared utilities
│   ├── supabase.ts             # Supabase client singleton
│   ├── helpers.ts              # Generic helper functions
│   ├── shopify.js              # Shopify storefront client
│   └── shopifyBuy.js           # Shopify Buy SDK wrapper
│
├── styles/                     # Global CSS / SCSS
│   ├── main.css                # Primary compiled stylesheet
│   ├── ecommerce.css           # Cart/product-specific styles
│   ├── animate.css             # Animation utilities
│   ├── fontawesome.css         # FontAwesome icons
│   ├── themify-icons.css       # Themify icon font
│   ├── custom-font.css         # Custom typeface declarations
│   ├── cursor.css              # Custom cursor
│   ├── premium-animations.css  # Advanced animation classes
│   └── sass/                   # SCSS source files
│
├── public/                     # Static assets served at /
├── fonts/                      # Custom font files
├── docs/                       # Project documentation (this folder)
├── .env.local                  # Local environment variables (git-ignored)
├── next.config.mjs             # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
└── supabase_banners.sql        # SQL for banners table seed
```

---

## Naming Conventions

| Pattern | Meaning |
|---|---|
| `app/[feature]/page.tsx` | A routable page |
| `app/[feature]/layout.tsx` | Nested layout for that route segment |
| `app/[feature]/route.ts` | API route handler |
| `components/FeatureName/index.tsx` | Default export component |
| `api/*.ts` | Data access / mock-data files (not API routes) |
| `contexts/*Context.tsx` | React context + provider |
