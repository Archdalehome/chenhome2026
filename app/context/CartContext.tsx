'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type CartItem = {
  id: string
  slug: string
  name: string
  price: number
  image_url: string
  quantity: number
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  updateQty: (id: string, qty: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
}

/** 购物车在浏览器中的存储键（品牌更名后保留对旧键的一次性迁移，避免用户丢购物车） */
const CART_STORAGE_KEY = 'chen_cart'
const LEGACY_CART_STORAGE_KEY = 'casa_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY) ?? localStorage.getItem(LEGACY_CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY)
    return Array.isArray(parsed) ? (parsed as CartItem[]) : []
  } catch {
    return []
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    setCart(loadCart())
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function addToCart(product: Omit<CartItem, 'quantity'>) {
    setCart(prev => {
      const exist = prev.find(i => i.id === product.id)
      if (exist) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      } else {
        return [...prev, { ...product, quantity: 1 }]
      }
    })
    setCartOpen(true)
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) return
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  function removeItem(id: string) {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  function clearCart() {
    setCart([])
  }

  return (
    <CartContext.Provider value={{
      cart, addToCart, updateQty, removeItem, clearCart,
      totalItems, totalPrice, cartOpen, setCartOpen
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
