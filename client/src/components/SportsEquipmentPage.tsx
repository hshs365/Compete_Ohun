import React, { useState } from 'react';
import {
  ShoppingBagIcon,
  StarIcon,
  ShoppingCartIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { showSuccess } from '../utils/swal';

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image?: string;
  category: string;
  description?: string;
  discount?: number;
}

const SportsEquipmentPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'rating'>('popular');

  // 샘플 데이터
  const products: Product[] = [
    {
      id: 1,
      name: '나이키 에어맥스 270',
      brand: 'Nike',
      price: 159000,
      originalPrice: 199000,
      rating: 4.5,
      reviewCount: 128,
      category: '운동화',
      discount: 20,
    },
    {
      id: 2,
      name: '아디다스 프레데터 축구공',
      brand: 'Adidas',
      price: 45000,
      rating: 4.8,
      reviewCount: 89,
      category: '축구용품',
    },
    {
      id: 3,
      name: '요넥스 배드민턴 라켓',
      brand: 'Yonex',
      price: 89000,
      originalPrice: 120000,
      rating: 4.6,
      reviewCount: 156,
      category: '배드민턴용품',
      discount: 26,
    },
    {
      id: 4,
      name: '언더아머 운동복 세트',
      brand: 'Under Armour',
      price: 129000,
      rating: 4.4,
      reviewCount: 203,
      category: '운동복',
    },
    {
      id: 5,
      name: '윌슨 테니스 라켓',
      brand: 'Wilson',
      price: 189000,
      originalPrice: 250000,
      rating: 4.7,
      reviewCount: 67,
      category: '테니스용품',
      discount: 24,
    },
    {
      id: 6,
      name: '아식스 러닝화',
      brand: 'ASICS',
      price: 139000,
      rating: 4.5,
      reviewCount: 145,
      category: '운동화',
    },
  ];

  const categories = ['전체', '운동화', '운동복', '축구용품', '배드민턴용품', '테니스용품', '기타'];

  const filteredProducts = products.filter(
    (product) => selectedCategory === '전체' || product.category === selectedCategory
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarSolidIcon key={i} className="w-4 h-4 text-yellow-400" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<StarIcon key={i} className="w-4 h-4 text-gray-300" />);
    }
    return stars;
  };

  const handleAddToCart = async (productId: number) => {
    // TODO: 장바구니에 추가 API 호출
    console.log('장바구니 추가:', productId);
    await showSuccess('장바구니에 추가되었습니다.', '장바구니');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full pb-12">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          스포츠 용품
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          다양한 스포츠 용품을 만나보세요
        </p>
      </div>

      {/* 필터 및 정렬 */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-4 md:p-6 mb-6">
        {/* 카테고리 필터 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            <FunnelIcon className="w-4 h-4 inline mr-1" />
            카테고리
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-[var(--color-blue-primary)] text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 정렬 옵션 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            정렬
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('popular')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'popular'
                  ? 'bg-[var(--color-blue-primary)] text-white'
                  : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              인기순
            </button>
            <button
              onClick={() => setSortBy('price-low')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'price-low'
                  ? 'bg-[var(--color-blue-primary)] text-white'
                  : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              낮은 가격순
            </button>
            <button
              onClick={() => setSortBy('price-high')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'price-high'
                  ? 'bg-[var(--color-blue-primary)] text-white'
                  : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              높은 가격순
            </button>
            <button
              onClick={() => setSortBy('rating')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'rating'
                  ? 'bg-[var(--color-blue-primary)] text-white'
                  : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              평점순
            </button>
          </div>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {sortedProducts.map((product) => (
          <div
            key={product.id}
            className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* 상품 이미지 */}
            <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBagIcon className="w-24 h-24 text-white opacity-50" />
              )}
              {product.discount && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {product.discount}%
                </div>
              )}
            </div>

            {/* 상품 정보 */}
            <div className="p-4 md:p-6">
              <div className="mb-2">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">{product.brand}</p>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                  {product.name}
                </h3>
              </div>

              {/* 평점 */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">{renderStars(product.rating)}</div>
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {product.rating}
                </span>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  ({product.reviewCount})
                </span>
              </div>

              {/* 가격 */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-[var(--color-blue-primary)]">
                    {product.price.toLocaleString()}원
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-[var(--color-text-secondary)] line-through">
                      {product.originalPrice.toLocaleString()}원
                    </span>
                  )}
                </div>
              </div>

              {/* 장바구니 버튼 */}
              <button
                onClick={() => handleAddToCart(product.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                <ShoppingCartIcon className="w-5 h-5" />
                <span>장바구니 담기</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SportsEquipmentPage;

