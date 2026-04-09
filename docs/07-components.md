# 07 — Component Library

All components live under [components/](../components/). Each component is a folder containing an `index.tsx` (default export).

---

## Layout Components

### Header / Header2–6
Site navigation bar. Variants 2–6 match the visual theme of their corresponding homepage.

```tsx
import Header from '@/components/header'
// or
import Header2 from '@/components/header2-6'
```

### Footer
```tsx
import Footer from '@/components/footer'
```

### MobileMenu
Off-canvas slide-in menu for mobile. Controlled by open/close state passed from Header.

### MobileBottomNav
Sticky 5-tab bottom navigation bar for mobile screens. Rendered globally in the root layout.

---

## Hero Sections

Each homepage variant ships its own hero:

| Component | Used in |
|---|---|
| `hero/` | `home/`, default |
| `hero2-6/` | `home-2` … `home-6` |

Heroes typically include an animated headline, subtitle, CTA buttons, and an illustration or product screenshot.

---

## E-Commerce Components

### ProductCard
Renders a single product tile: image, name, price, "Add to Cart" button.

```tsx
import ProductCard from '@/components/ProductCard'

<ProductCard product={product} />
```

### ProductCarousel
Wraps multiple `ProductCard` items in a Swiper carousel.

### FeaturedProducts
A section block containing a grid/carousel of highlighted products. Used on homepage variants.

---

## Marketing / Content Components

| Component | Description |
|---|---|
| `FeaturesSection` | Icon + text feature highlight grid |
| `IndustrieSection` | Industry verticals with icons |
| `ServiceSection` | Services overview cards |
| `ProjectSection` | Portfolio project grid |
| `TeamSection` | Team member cards with social links |
| `Testimonial` | Customer quote carousel |
| `BlogSection` | Blog preview cards (latest 3) |
| `BlogList` | Full paginated blog listing |
| `BlogDetails` | Rich blog post body |
| `BlogSidebar` | Categories, tags, recent posts |
| `CtaSection` | Full-width call-to-action banner |
| `FaqSection` | Accordion FAQ |
| `FunFact` | Animated counter stats (react-countup) |
| `PartnerSection` | Logo marquee (react-fast-marquee) |
| `WorkProcess` | Numbered step-by-step section |
| `ContactFrom` | Contact form with validation |
| `ContactSection` | Contact form + info block |

---

## Vertical Solution Components

These are feature-rich blocks for specific service pages:

| Folder | Service |
|---|---|
| `Cloud-devops-components/` | Cloud & DevOps page sections |
| `Cyber-Security-Components/` | Cyber security page sections |
| `It-Services-Components/` | IT services page sections |
| `Help-Desk-Components/` | Help desk / support page sections |
| `data-solutions-components/` | Data solutions page sections |

---

## Utility / UI Components

### FloatingIcons
Container that positions floating action buttons in the bottom-right corner.

### WhatsAppFloatingButton
Circular floating button that opens WhatsApp chat.

### MailFloatingButton
Circular floating button that opens the default mail client.

### scrollbar
Custom thin scrollbar overlay for content areas.

---

## Adding a New Component

1. Create `components/MyComponent/index.tsx`
2. Export a default React component
3. Import with the `@/` alias:

```tsx
import MyComponent from '@/components/MyComponent'
```

---

## Component Conventions

- All components are **client components** by default (`'use client'`)
- Props are typed with TypeScript interfaces defined at the top of each file
- Styles use a mix of Bootstrap utility classes + scoped CSS from `styles/main.css`
- Animation: use `Framer Motion` (`motion.div`) or AOS `data-aos` attributes
