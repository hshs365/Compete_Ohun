import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBagIcon,
  StarIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { showSuccess } from '../utils/swal';
import { SPORTS_EQUIPMENT_PRODUCTS, type Product } from '../data/sportsEquipmentProducts';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// 상단 드롭다운: 운동 선택
const SPORTS = [
  { value: '전체', label: '전체' },
  { value: '축구', label: '축구' },
  { value: '풋살', label: '풋살' },
  { value: '농구', label: '농구' },
  { value: '배드민턴', label: '배드민턴' },
  { value: '테니스', label: '테니스' },
  { value: '러닝', label: '러닝' },
  { value: '기타', label: '기타' },
] as const;

// 운동별로 사이드바에 노출할 스포츠용품 카테고리 (공통 카테고리 + 여기 항목만 추가)
const SPORT_SPECIFIC_CATEGORIES: Record<string, string[]> = {
  전체: ['축구용품', '배드민턴용품', '테니스용품', '농구용품', '풋살용품'],
  축구: ['축구용품'],
  풋살: ['풋살용품', '축구용품'],
  농구: ['농구용품'],
  배드민턴: ['배드민턴용품'],
  테니스: ['테니스용품'],
  러닝: [],
  기타: [],
};

const SORT_OPTIONS = [
  { value: 'popular', label: '인기순' },
  { value: 'price-low', label: '낮은 가격순' },
  { value: 'price-high', label: '높은 가격순' },
  { value: 'rating', label: '평점순' },
  { value: 'new', label: '신제품순' },
] as const;

// 공통 카테고리만 (스포츠별 용품 제외). 사이드바는 여기 + 선택 운동용 용품만 노출
const COMMON_SIDEBAR_ENTRIES: { value: string; label: string; sub?: string[] }[] = [
  { value: '전체', label: '전체' },
  { value: '신발', label: '신발', sub: ['운동화', '러닝화'] },
  { value: '운동화', label: '운동화' },
  { value: '러닝화', label: '러닝화' },
  { value: '탑 & 티셔츠', label: '탑 & 티셔츠' },
  { value: '운동복', label: '운동복' },
  { value: '쇼츠', label: '쇼츠' },
  { value: '스포츠브라', label: '스포츠 브라' },
  { value: '후디 & 크루', label: '후디 & 크루' },
  { value: '팬츠 & 레깅스', label: '팬츠 & 레깅스' },
  { value: '재킷', label: '재킷' },
  { value: '양말', label: '양말' },
  { value: '헤어밴드', label: '헤어밴드' },
  { value: '땀밴드', label: '땀밴드' },
  { value: '보호대', label: '보호대', sub: ['무릎보호대'] },
  { value: '무릎보호대', label: '무릎보호대' },
  { value: '스포츠가방', label: '스포츠가방' },
  { value: '수건', label: '수건' },
  { value: '보틀', label: '보틀' },
  { value: '용품', label: '용품' },
  { value: '기타', label: '기타' },
];

// API 상품 응답을 클라이언트 Product 타입으로 변환
function mapApiProductToProduct(p: {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number | null;
  category: string;
  sport?: string | null;
  description?: string | null;
  image?: string | null;
  images?: string[] | null;
  rating?: number;
  reviewCount?: number;
}): Product {
  const images = p.images?.length ? p.images : p.image ? [p.image] : undefined;
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: typeof p.price === 'number' ? p.price : Number(p.price),
    originalPrice: p.originalPrice != null ? Number(p.originalPrice) : undefined,
    rating: p.rating != null ? Number(p.rating) : 0,
    reviewCount: p.reviewCount ?? 0,
    category: p.category,
    sport: p.sport ?? undefined,
    description: p.description ?? undefined,
    image: p.image ?? (images?.[0] as string | undefined),
    images,
  };
}

const SportsEquipmentPage = () => {
  const { user } = useAuth();
  const [selectedSport, setSelectedSport] = useState<string>('전체');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]['value']>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'unisex'>('all');
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [userProfile, setUserProfile] = useState<{ businessNumberVerified?: boolean; isAdmin?: boolean } | null>(null);
  const [productsRefresh, setProductsRefresh] = useState(0);

  const navigate = useNavigate();

  // 사업자 여부 조회
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    api.get<{ businessNumberVerified?: boolean; isAdmin?: boolean }>('/api/auth/me').then(setUserProfile).catch(() => setUserProfile(null));
  }, [user]);

  // API 상품 목록 조회
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get<{ products: unknown[]; total: number }>('/api/products?limit=200');
        const list = Array.isArray(res?.products) ? res.products : [];
        setApiProducts(list.map((p: any) => mapApiProductToProduct(p)));
      } catch {
        setApiProducts([]);
      }
    };
    fetchProducts();
  }, [productsRefresh]);

  // API 상품이 있으면 API 사용, 없으면 로컬 목 데이터
  const products = apiProducts.length > 0 ? apiProducts : SPORTS_EQUIPMENT_PRODUCTS;

  // 전체 선택: 공통 카테고리만 (용품 포함, 운동별 전용 용품은 제외). 특정 운동 선택: 공통에서 '용품' 제외
  const sidebarCategories =
    selectedSport === '전체'
      ? COMMON_SIDEBAR_ENTRIES
      : COMMON_SIDEBAR_ENTRIES.filter((c) => c.value !== '용품');

  const categoryMatches = (productCategory: string) => {
    if (selectedCategory === '전체') return true;
    const item = sidebarCategories.find((c) => c.value === selectedCategory);
    if (!item) return productCategory === selectedCategory;
    if (item.sub && item.sub.includes(productCategory)) return true;
    return productCategory === selectedCategory;
  };

  // 운동 선택 시: 해당 운동 제품만 (sport 없으면 공용으로 전체에서 노출)
  const sportFilteredProducts =
    selectedSport === '전체'
      ? products
      : products.filter((p) => !p.sport || p.sport === selectedSport);

  const filteredProducts = sportFilteredProducts.filter((product) => {
    if (!categoryMatches(product.category)) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      product.name.toLowerCase().includes(q) ||
      product.brand.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q)
    );
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'new':
        return (b.tag === 'new' ? 1 : 0) - (a.tag === 'new' ? 1 : 0);
      default:
        return 0;
    }
  });

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < Math.floor(rating); i++) stars.push(<StarSolidIcon key={i} className="w-3.5 h-3.5 text-yellow-400" />);
    for (let i = stars.length; i < 5; i++) stars.push(<StarIcon key={i} className="w-3.5 h-3.5 text-gray-400" />);
    return stars;
  };

  const handleAddToCart = async (productId: number) => {
    await showSuccess('장바구니에 추가되었습니다.', '장바구니');
  };

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 bg-[var(--color-bg-primary)]">
      {/* 히어로 / 상단 배너 (나이키 스타일) */}
      <header className="flex-shrink-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
              스포츠 용품
            </h1>
            {(userProfile?.businessNumberVerified || userProfile?.isAdmin) && (
              <button
                type="button"
                onClick={() => navigate('/sports-equipment/register')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold transition-all border-2 border-[var(--color-blue-primary)] text-[var(--color-blue-primary)] bg-transparent hover:bg-[var(--color-blue-primary)] hover:text-white"
              >
                <PlusIcon className="w-5 h-5" />
                상품 등록
              </button>
            )}
          </div>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
            운동을 더 편하고 즐겁게. 의류, 신발, 용품까지 한곳에서 만나보세요.
          </p>
          {/* 운동 선택 드롭다운 */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">운동 종목</span>
            <select
              value={selectedSport}
              onChange={(e) => {
                setSelectedSport(e.target.value);
                setSelectedCategory('전체');
              }}
              className="py-2.5 pl-4 pr-10 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.75rem_center]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
            >
              {SPORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          {/* 검색 바 */}
          <div className="relative max-w-xl">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="상품명, 브랜드, 카테고리로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-12 pr-4 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
          </div>
        </div>
      </header>

      {/* 메인: 좌측 사이드바 + 상품 그리드 */}
      <div className="flex flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 md:px-6 py-6">
        {/* 좌측 필터 사이드바 (나이키 스타일) */}
        <aside
          className={`flex-shrink-0 border-r border-[var(--color-border-card)] pr-6 transition-all duration-200 ${
            sidebarOpen ? 'w-56 min-w-[14rem] md:w-64 md:min-w-[16rem]' : 'w-0 overflow-hidden pr-0 opacity-0'
          }`}
        >
          <div className="sticky top-4 space-y-6 min-w-0">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              스포츠 용품 <span className="text-[var(--color-text-secondary)] font-normal">({filteredProducts.length})</span>
            </h2>

            {/* 상품 유형 (선택한 운동에 따라 공통 + 해당 운동 용품만) */}
            <nav className="space-y-0.5 min-w-0">
              {sidebarCategories.filter((c) => !c.sub || c.value === c.label).map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`block w-full min-w-0 text-left py-2 px-0 text-sm rounded-lg transition-colors break-words whitespace-normal ${
                    selectedCategory === cat.value
                      ? 'font-semibold text-[var(--color-blue-primary)]'
                      : 'text-[var(--color-text-primary)] hover:text-[var(--color-blue-primary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </nav>

            {/* 성별 필터 (펼침/접힘 스타일) */}
            <div className="pt-4 border-t border-[var(--color-border-card)]">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">성별</p>
              <div className="space-y-2">
                {(['all', 'male', 'female', 'unisex'] as const).map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={genderFilter === g}
                      onChange={() => setGenderFilter(g)}
                      className="rounded-full border-[var(--color-border-card)] text-[var(--color-blue-primary)] focus:ring-[var(--color-blue-primary)]"
                    />
                    <span className="text-sm text-[var(--color-text-primary)]">
                      {g === 'all' ? '전체' : g === 'male' ? '남성' : g === 'female' ? '여성' : '남녀공용'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠: 툴바 + 상품 그리드 */}
        <main className="flex-1 min-w-0 pl-6">
          {/* 툴바: 필터 숨기기 / 정렬 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-blue-primary)] transition-colors"
            >
              {sidebarOpen ? (
                <>
                  <XMarkIcon className="w-4 h-4" />
                  필터 숨기기
                </>
              ) : (
                <>
                  <Bars3Icon className="w-4 h-4" />
                  필터 보기
                </>
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-text-secondary)]">정렬 기준:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as (typeof SORT_OPTIONS)[number]['value'])}
                className="py-2 pl-3 pr-8 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.5rem_center]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 상품 그리드 */}
          {sortedProducts.length === 0 ? (
            <div className="py-16 text-center text-[var(--color-text-secondary)]">
              {searchQuery.trim() ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/sports-equipment/${product.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/sports-equipment/${product.id}`)}
                  className="group bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-card)] overflow-hidden hover:shadow-lg hover:border-[var(--color-blue-primary)]/20 transition-all cursor-pointer"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBagIcon className="w-20 h-20 text-white/30 group-hover:scale-110 transition-transform" />
                    )}
                    {product.tag && (
                      <span
                        className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold ${
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
                    {product.discount && !product.tag && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                        {product.discount}%
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[var(--color-text-secondary)] mb-1">{product.brand}</p>
                    <h3 className="font-semibold text-[var(--color-text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--color-blue-primary)] transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex">{renderStars(product.rating)}</div>
                      <span className="text-xs text-[var(--color-text-secondary)]">({product.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-[var(--color-text-primary)]">
                        {product.price.toLocaleString()}원
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-[var(--color-text-secondary)] line-through">
                          {product.originalPrice.toLocaleString()}원
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product.id);
                      }}
                      className="w-full py-2.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-blue-primary)] hover:text-white hover:border-[var(--color-blue-primary)] transition-colors"
                    >
                      장바구니 담기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

    </div>
  );
};

export default SportsEquipmentPage;
