/** 스포츠 용품 목록/상세 공용 타입 및 목 데이터 */
export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image?: string;
  /** 다중 이미지 (정면·측면 등). 없으면 image 사용 */
  images?: string[];
  category: string;
  description?: string;
  discount?: number;
  tag?: 'new' | 'sale' | 'recycled';
  sport?: string;
}

export const SPORTS_EQUIPMENT_PRODUCTS: Product[] = [
  { id: 1, name: '나이키 에어맥스 270', brand: 'Nike', price: 159000, originalPrice: 199000, rating: 4.5, reviewCount: 128, category: '운동화', discount: 20, tag: 'sale' },
  { id: 2, name: '아디다스 프레데터 축구공', brand: 'Adidas', price: 45000, rating: 4.8, reviewCount: 89, category: '축구용품', sport: '축구' },
  { id: 3, name: '요넥스 배드민턴 라켓', brand: 'Yonex', price: 89000, originalPrice: 120000, rating: 4.6, reviewCount: 156, category: '배드민턴용품', discount: 26, tag: 'sale', sport: '배드민턴', description: '초보자부터 중급자까지 추천하는 밸런스형 라켓입니다. 가벼운 스윙과 안정적인 컨트롤이 특징입니다.' },
  { id: 4, name: '언더아머 운동복 세트', brand: 'Under Armour', price: 129000, rating: 4.4, reviewCount: 203, category: '운동복', tag: 'new' },
  { id: 5, name: '윌슨 테니스 라켓', brand: 'Wilson', price: 189000, originalPrice: 250000, rating: 4.7, reviewCount: 67, category: '테니스용품', discount: 24, tag: 'recycled', sport: '테니스' },
  { id: 6, name: '아식스 러닝화', brand: 'ASICS', price: 139000, rating: 4.5, reviewCount: 145, category: '러닝화', sport: '러닝' },
  { id: 7, name: '나이키 스포츠브라', brand: 'Nike', price: 49000, rating: 4.6, reviewCount: 312, category: '스포츠브라', tag: 'new' },
  { id: 8, name: '헤드 헤어밴드 3팩', brand: 'Head', price: 15000, rating: 4.3, reviewCount: 89, category: '헤어밴드' },
  { id: 9, name: '스포츠 양말 5족 세트', brand: 'Adidas', price: 25000, rating: 4.5, reviewCount: 201, category: '양말' },
  { id: 10, name: '무릎 보호대 블랙', brand: 'LP', price: 35000, rating: 4.7, reviewCount: 156, category: '무릎보호대' },
  { id: 11, name: '스포츠 보틀 750ml', brand: 'Hydro Flask', price: 42000, rating: 4.8, reviewCount: 445, category: '보틀', tag: 'recycled' },
  { id: 12, name: '쿨타올 스포츠 수건', brand: 'Mizuno', price: 12000, rating: 4.4, reviewCount: 178, category: '수건' },
];

export function getProductById(id: number): Product | undefined {
  return SPORTS_EQUIPMENT_PRODUCTS.find((p) => p.id === id);
}
