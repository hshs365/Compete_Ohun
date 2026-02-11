const CART_STORAGE_KEY = 'sports-equipment-cart';

export interface CartItem {
  productId: number;
  quantity: number;
}

export function getCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x: unknown) => x && typeof (x as any).productId === 'number' && typeof (x as any).quantity === 'number')
      : [];
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function addToCart(productId: number, quantity = 1): CartItem[] {
  const cart = getCart();
  const existing = cart.find((x) => x.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  setCart(cart);
  return cart;
}

export function updateCartQuantity(productId: number, quantity: number): CartItem[] {
  const cart = getCart();
  const item = cart.find((x) => x.productId === productId);
  if (!item) return cart;
  if (quantity <= 0) {
    setCart(cart.filter((x) => x.productId !== productId));
    return getCart();
  }
  item.quantity = quantity;
  setCart(cart);
  return cart;
}

export function removeFromCart(productId: number): CartItem[] {
  setCart(getCart().filter((x) => x.productId !== productId));
  return getCart();
}

export function getCartCount(): number {
  return getCart().reduce((sum, x) => sum + x.quantity, 0);
}
