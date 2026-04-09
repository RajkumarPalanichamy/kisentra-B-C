# 08 — React Contexts

Three React Context providers manage global state. They are all mounted in the root layout ([app/layout.tsx](../app/layout.tsx)):

```tsx
<UserProvider>
  <CartProvider>
    {children}
  </CartProvider>
</UserProvider>
```

---

## UserContext

**File:** [contexts/UserContext.tsx](../contexts/UserContext.tsx)

Manages authentication state for the entire app.

### Provided Values

| Value | Type | Description |
|---|---|---|
| `user` | `User \| null` | Supabase `User` object (has `.id`, `.email`, `.user_metadata`) |
| `session` | `Session \| null` | Full Supabase session (includes `access_token`) |
| `isLoading` | `boolean` | `true` during initial session hydration |
| `signOut` | `() => Promise<void>` | Signs out the current user |

### Usage

```tsx
'use client'
import { useUser } from '@/contexts/UserContext'

function MyComponent() {
  const { user, isLoading, signOut } = useUser()

  if (isLoading) return <Spinner />
  if (!user) return <p>Not logged in</p>

  return (
    <div>
      <p>Hello, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### How It Works

1. On mount: calls `supabase.auth.getSession()` to restore existing session
2. Registers `supabase.auth.onAuthStateChange()` to react to login/logout
3. `signOut()` calls `supabase.auth.signOut()` — the listener clears state automatically

---

## CartContext

**File:** [contexts/CartContext.tsx](../contexts/CartContext.tsx)

Manages shopping cart state with dual persistence (Supabase for logged-in users, `localStorage` for guests).

### Provided Values

| Value | Type | Description |
|---|---|---|
| `cartItems` | `CartItem[]` | Current items in cart |
| `cartCount` | `number` | Total quantity of all items |
| `subtotal` | `number` | Sum of (price × qty) |
| `tax` | `number` | 8% of subtotal |
| `shipping` | `number` | $10, or $0 if subtotal ≥ $100 |
| `total` | `number` | subtotal + tax + shipping |
| `isLoading` | `boolean` | While syncing with Supabase |
| `addToCart` | `(product, qty?) => void` | Add or increment item |
| `removeFromCart` | `(productId) => void` | Remove item entirely |
| `updateQuantity` | `(productId, qty) => void` | Set specific quantity |
| `clearCart` | `() => void` | Empty the cart |
| `createOrder` | `() => Promise<string>` | Submit order, returns order ID |

### CartItem Shape

```ts
{
  id: string          // product id
  title: string
  price: number
  image: string
  quantity: number
  slug: string
}
```

### Usage

```tsx
'use client'
import { useCart } from '@/contexts/CartContext'

function AddToCartButton({ product }) {
  const { addToCart, cartCount } = useCart()

  return (
    <button onClick={() => addToCart(product, 1)}>
      Add to Cart ({cartCount})
    </button>
  )
}
```

### Persistence Strategy

```
Is user logged in?
      │
      ├── YES → read/write Supabase `cart_items` table
      │         On login: merges localStorage cart into Supabase
      │
      └── NO  → read/write localStorage key `cart`
```

---

## AdminContext

**File:** [contexts/AdminContext.tsx](../contexts/AdminContext.tsx)

Minimal admin context, currently a placeholder for future admin-specific state (permissions, dashboard data, etc.).

Applied only to `app/admin/` via `app/admin/layout.tsx`.

### Usage

```tsx
import { useAdmin } from '@/contexts/AdminContext'

const { } = useAdmin()  // extend as admin features are built
```

---

## Rules for Using Contexts

- Always add `'use client'` to components that consume a context
- Contexts are available anywhere inside the root layout — no need to re-wrap
- Never access `supabase` directly in components when the context already provides the data (e.g. use `useUser()` instead of calling `supabase.auth.getUser()` yourself)
