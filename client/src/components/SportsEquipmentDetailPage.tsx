import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBagIcon, StarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { getProductById, SPORTS_EQUIPMENT_PRODUCTS, type Product } from '../data/sportsEquipmentProducts';
import { api } from '../utils/api';
import { showSuccess } from '../utils/swal';

const RECOMMEND_LIMIT = 6;

const toDisplayProduct = (res: any): Product => {
  const images = res.images?.length ? res.images : res.image ? [res.image] : [];
  return {
    id: res.id,
    name: res.name,
    brand: res.brand,
    price: Number(res.price),
    originalPrice: res.originalPrice != null ? Number(res.originalPrice) : undefined,
    rating: res.rating != null ? Number(res.rating) : 0,
    reviewCount: res.reviewCount ?? 0,
    category: res.category,
    sport: res.sport ?? undefined,
    description: res.description ?? undefined,
    image: res.image ?? (images[0] as string | undefined),
    images: images.length ? images : undefined,
  };
};

const SportsEquipmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const localProduct = id != null ? getProductById(Number(id)) : undefined;
  const [apiProduct, setApiProduct] = useState<Product | null | undefined>(undefined);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [recommendByBrand, setRecommendByBrand] = useState<Product[]>([]);
  const [recommendByCategory, setRecommendByCategory] = useState<Product[]>([]);

  useEffect(() => {
    if (id == null || localProduct != null) {
      setApiProduct(null);
      return;
    }
    api.get(`/api/products/${id}`).then((res: any) => {
      if (res?.id != null) {
        setApiProduct(toDisplayProduct(res));
      } else {
        setApiProduct(null);
      }
    }).catch(() => setApiProduct(null));
  }, [id, localProduct]);

  const product = localProduct ?? (apiProduct ?? undefined);

  useEffect(() => {
    if (!product) {
      setRecommendByBrand([]);
      setRecommendByCategory([]);
      return;
    }
    const currentId = product.id;
    if (localProduct != null) {
      const byBrand = SPORTS_EQUIPMENT_PRODUCTS.filter((p) => p.id !== currentId && p.brand === product.brand).slice(0, RECOMMEND_LIMIT);
      const byCategory = SPORTS_EQUIPMENT_PRODUCTS.filter((p) => p.id !== currentId && p.category === product.category).slice(0, RECOMMEND_LIMIT);
      setRecommendByBrand(byBrand);
      setRecommendByCategory(byCategory);
      return;
    }
    const brandQuery = new URLSearchParams({ brand: product.brand, limit: String(RECOMMEND_LIMIT + 1) });
    const categoryQuery = new URLSearchParams({ category: product.category, limit: String(RECOMMEND_LIMIT + 1) });
    Promise.all([
      api.get<{ products: any[] }>(`/api/products?${brandQuery}`),
      api.get<{ products: any[] }>(`/api/products?${categoryQuery}`),
    ]).then(([brandRes, categoryRes]) => {
      const brandList = (brandRes?.products ?? [])
        .filter((p: any) => p.id !== currentId)
        .slice(0, RECOMMEND_LIMIT)
        .map(toDisplayProduct);
      const categoryList = (categoryRes?.products ?? [])
        .filter((p: any) => p.id !== currentId)
        .slice(0, RECOMMEND_LIMIT)
        .map(toDisplayProduct);
      setRecommendByBrand(brandList);
      setRecommendByCategory(categoryList);
    }).catch(() => {
      setRecommendByBrand([]);
      setRecommendByCategory([]);
    });
  }, [product, localProduct]);
  const displayImages = product?.images?.length ? product.images : product?.image ? [product.image] : [];
  const mainImageUrl = displayImages[selectedImageIndex] ?? product?.image;

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [id]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < Math.floor(rating); i++) stars.push(<StarSolidIcon key={i} className="w-5 h-5 text-yellow-400" />);
    for (let i = stars.length; i < 5; i++) stars.push(<StarIcon key={i} className="w-5 h-5 text-gray-400" />);
    return stars;
  };

  const handleAddToCart = async () => {
    if (!product) return;
    await showSuccess('장바구니에 추가되었습니다.', '장바구니');
  };

  if (product == null) {
    const isLoading = id != null && localProduct == null && apiProduct === undefined;
    return (
      <div className="flex flex-col flex-1 w-full min-h-0 bg-[var(--color-bg-primary)]">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 text-center">
          {isLoading ? (
            <p className="text-[var(--color-text-secondary)] mb-6">상품 정보를 불러오는 중...</p>
          ) : (
            <>
              <p className="text-[var(--color-text-secondary)] mb-6">상품을 찾을 수 없습니다.</p>
              <Link
                to="/sports-equipment"
                className="inline-flex items-center gap-2 text-[var(--color-blue-primary)] font-medium hover:underline"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                스포츠 용품 목록으로
              </Link>
            </>
          )}
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

        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-card)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                {mainImageUrl ? (
                  <img src={mainImageUrl.startsWith('http') ? mainImageUrl : (import.meta.env.VITE_API_BASE_URL || '') + mainImageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBagIcon className="w-32 h-32 text-white/30" />
                )}
              </div>
              {displayImages.length > 1 && (
                <div className="flex gap-2 p-2 overflow-x-auto border-t border-[var(--color-border-card)] bg-[var(--color-bg-secondary)]">
                  {displayImages.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImageIndex(i)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === selectedImageIndex
                          ? 'border-[var(--color-blue-primary)] ring-1 ring-[var(--color-blue-primary)]'
                          : 'border-transparent hover:border-[var(--color-border-card)]'
                      }`}
                    >
                      <img src={url.startsWith('http') ? url : (import.meta.env.VITE_API_BASE_URL || '') + url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {product.tag && (
                <span
                  className={`absolute top-4 left-4 px-3 py-1 rounded text-sm font-bold ${
                    product.tag === 'new'
                      ? 'bg-black text-white'
                      : product.tag === 'sale'
                      ? 'bg-red-500 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {product.tag === 'new' ? '신제품' : product.tag === 'sale' ? '할인' : '재생 소재'}
                </span>
              )}
            </div>
            <div className="p-6 md:p-8 flex flex-col">
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">{product.brand}</p>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">{product.name}</h1>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">{product.category}</p>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">{renderStars(product.rating)}</div>
                <span className="text-sm text-[var(--color-text-secondary)]">({product.reviewCount}개 리뷰)</span>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {product.price.toLocaleString()}원
                </span>
                {product.originalPrice != null && (
                  <span className="text-base text-[var(--color-text-secondary)] line-through">
                    {product.originalPrice.toLocaleString()}원
                  </span>
                )}
                {product.discount != null && (
                  <span className="text-sm font-medium text-red-500">{product.discount}% 할인</span>
                )}
              </div>
              {product.description && (
                <p className="text-[var(--color-text-secondary)] mb-6 flex-1">{product.description}</p>
              )}
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3 rounded-lg bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 transition-opacity"
              >
                장바구니 담기
              </button>
            </div>
          </div>
        </div>

        {(recommendByBrand.length > 0 || recommendByCategory.length > 0) && (
          <div className="mt-10 space-y-8">
            {recommendByBrand.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                  {product.brand} 추천 상품
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                  {recommendByBrand.map((p) => (
                    <Link
                      key={p.id}
                      to={`/sports-equipment/${p.id}`}
                      className="flex-shrink-0 w-40 rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] overflow-hidden hover:border-[var(--color-blue-primary)]/50 hover:shadow-md transition-all"
                    >
                      <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        {p.image ? (
                          <img
                            src={p.image.startsWith('http') ? p.image : (import.meta.env.VITE_API_BASE_URL || '') + p.image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBagIcon className="w-12 h-12 text-white/30" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{p.name}</p>
                        <p className="text-sm font-bold text-[var(--color-text-primary)] mt-1">
                          {p.price.toLocaleString()}원
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {recommendByCategory.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                  {product.category} 추천 상품
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                  {recommendByCategory.map((p) => (
                    <Link
                      key={p.id}
                      to={`/sports-equipment/${p.id}`}
                      className="flex-shrink-0 w-40 rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] overflow-hidden hover:border-[var(--color-blue-primary)]/50 hover:shadow-md transition-all"
                    >
                      <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        {p.image ? (
                          <img
                            src={p.image.startsWith('http') ? p.image : (import.meta.env.VITE_API_BASE_URL || '') + p.image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBagIcon className="w-12 h-12 text-white/30" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{p.name}</p>
                        <p className="text-sm font-bold text-[var(--color-text-primary)] mt-1">
                          {p.price.toLocaleString()}원
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SportsEquipmentDetailPage;
