import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import { getCart, removeFromCart, updateCartQuantity, type CartItem } from '../utils/sportsEquipmentCart';

interface ProductInfo {
  id: number;
  name: string;
  brand: string;
  price: number;
  image?: string | null;
}

const SportsEquipmentCartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Record<number, ProductInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCart(getCart());
  }, []);

  useEffect(() => {
    const ids = cart.map((x) => x.productId);
    if (ids.length === 0) {
      setProducts({});
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<{ products?: unknown[] }>('/api/products?limit=500')
      .then((res) => {
        const list = Array.isArray(res?.products) ? res.products : [];
        const map: Record<number, ProductInfo> = {};
        list.forEach((p: any) => {
          if (ids.includes(Number(p.id))) {
            map[Number(p.id)] = {
              id: p.id,
              name: p.name ?? '',
              brand: p.brand ?? '',
              price: Number(p.price ?? 0),
              image: p.image ?? p.images?.[0],
            };
          }
        });
        setProducts(map);
      })
      .catch(() => setProducts({}))
      .finally(() => setLoading(false));
  }, [cart]);

  const handleRemove = (productId: number) => {
    setCart(removeFromCart(productId));
  };

  const handleQuantityChange = (productId: number, delta: number) => {
    const item = cart.find((x) => x.productId === productId);
    if (!item) return;
    const next = Math.max(1, item.quantity + delta);
    setCart(updateCartQuantity(productId, next));
  };

  const totalPrice = cart.reduce((sum, item) => {
    const p = products[item.productId];
    return sum + (p ? p.price * item.quantity : 0);
  }, 0);

  if (cart.length === 0 && !loading) {
    return (
      <div className="flex flex-col flex-1 w-full min-h-0 bg-[var(--color-bg-primary)]">
        <div className="max-w-2xl mx-auto w-full px-4 md:px-6 py-12 text-center">
          <ShoppingCartIcon className="w-16 h-16 mx-auto text-[var(--color-text-secondary)] mb-4 opacity-60" />
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">장바구니가 비어 있습니다</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">스포츠 용품을 담아 보세요.</p>
          <button
            type="button"
            onClick={() => navigate('/sports-equipment')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-[var(--color-blue-primary)] text-white hover:opacity-90 transition-opacity"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            스포츠 용품 둘러보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 bg-[var(--color-bg-primary)]">
      <div className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6">
        <Link
          to="/sports-equipment"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-blue-primary)] mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          스포츠 용품 목록으로
        </Link>

        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
          <ShoppingCartIcon className="w-8 h-8" />
          장바구니
        </h1>

        {loading ? (
          <p className="text-[var(--color-text-secondary)]">장바구니를 불러오는 중...</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => {
              const p = products[item.productId];
              return (
                <div
                  key={item.productId}
                  className="flex gap-4 p-4 rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)]"
                >
                  <Link
                    to={`/sports-equipment/${item.productId}`}
                    className="flex-shrink-0 w-24 h-24 rounded-lg bg-[var(--color-bg-secondary)] overflow-hidden flex items-center justify-center"
                  >
                    {p?.image ? (
                      <img
                        src={p.image.startsWith('http') ? p.image : (import.meta.env.VITE_API_BASE_URL || '') + p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingCartIcon className="w-10 h-10 text-[var(--color-text-secondary)]" />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/sports-equipment/${item.productId}`}
                      className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-blue-primary)] line-clamp-2"
                    >
                      {p ? `${p.brand} ${p.name}` : `상품 #${item.productId}`}
                    </Link>
                    <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">
                      {p ? `${p.price.toLocaleString()}원` : '-'} × {item.quantity}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.productId, -1)}
                        className="w-8 h-8 rounded-lg border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] text-sm font-medium"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-[var(--color-text-primary)]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.productId, 1)}
                        className="w-8 h-8 rounded-lg border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] text-sm font-medium"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.productId)}
                        className="ml-auto p-2 text-[var(--color-text-secondary)] hover:text-red-500 rounded-lg hover:bg-[var(--color-bg-secondary)]"
                        title="삭제"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right font-semibold text-[var(--color-text-primary)]">
                    {p ? (p.price * item.quantity).toLocaleString() : '-'}원
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end border-t border-[var(--color-border-card)] pt-4 mt-6">
              <div className="text-lg font-bold text-[var(--color-text-primary)]">
                총 결제 예정 금액 <span className="text-[var(--color-blue-primary)]">{totalPrice.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SportsEquipmentCartPage;
