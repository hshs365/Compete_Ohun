import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PhotoIcon,
  DocumentPlusIcon,
  TableCellsIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import { showError, showSuccess } from '../utils/swal';

const CATEGORY_OPTIONS = [
  '운동화', '러닝화', '운동복', '쇼츠', '스포츠브라', '후디 & 크루', '팬츠 & 레깅스', '재킷', '양말',
  '헤어밴드', '땀밴드', '무릎보호대', '스포츠가방', '수건', '보틀', '축구용품', '풋살용품', '배드민턴용품', '테니스용품', '농구용품', '용품', '기타',
];

const SPORT_OPTIONS = ['', '축구', '풋살', '농구', '배드민턴', '테니스', '러닝', '기타'];

type TabType = 'single' | 'bulk' | 'excel';

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return 'http://localhost:3000';
  }
  return '';
};

const uploadProductImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  const base = getApiBaseUrl();
  const token = localStorage.getItem('remember_me') === 'true'
    ? localStorage.getItem('access_token')
    : sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
  const res = await fetch(`${base}/api/products/upload-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '이미지 업로드에 실패했습니다.');
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as string;
  } catch {
    return text.replace(/^"|"$/g, '');
  }
};

const singleProductEmpty = () => ({
  name: '',
  brand: '',
  price: '',
  originalPrice: '',
  category: '운동화',
  sport: '',
  description: '',
  imageUrls: [] as string[],
});

const ProductRegisterPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('single');
  const [singleForm, setSingleForm] = useState(singleProductEmpty());
  const [singleSubmitting, setSingleSubmitting] = useState(false);
  const [bulkRows, setBulkRows] = useState<ReturnType<typeof singleProductEmpty>[]>([singleProductEmpty()]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelSubmitting, setExcelSubmitting] = useState(false);
  const [excelResult, setExcelResult] = useState<{ created: number; errors: string[] } | null>(null);
  const [excelGuideOpen, setExcelGuideOpen] = useState(true);

  const [singleImageUploading, setSingleImageUploading] = useState(false);

  const handleSingleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setSingleImageUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadProductImage(files[i]);
        urls.push(url);
      }
      setSingleForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
    } catch (err: any) {
      await showError(err?.message || '이미지 업로드 실패', '업로드 실패');
    } finally {
      setSingleImageUploading(false);
      e.target.value = '';
    }
  };

  const removeSingleImage = (index: number) => {
    setSingleForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const moveSingleImage = (index: number, dir: 'left' | 'right') => {
    const next = index + (dir === 'left' ? -1 : 1);
    if (next < 0 || next >= singleForm.imageUrls.length) return;
    setSingleForm((prev) => {
      const arr = [...prev.imageUrls];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return { ...prev, imageUrls: arr };
    });
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.imageUrls.length) {
      await showError('이미지를 최소 1개 이상 등록해 주세요.', '입력 오류');
      return;
    }
    const priceNum = parseInt(singleForm.price, 10);
    if (isNaN(priceNum) || priceNum < 0) {
      await showError('가격을 올바르게 입력해 주세요.', '입력 오류');
      return;
    }
    let originalPriceNum: number | undefined;
    if (singleForm.originalPrice.trim()) {
      originalPriceNum = parseInt(singleForm.originalPrice, 10);
      if (isNaN(originalPriceNum!) || originalPriceNum! < 0) {
        await showError('정가를 올바르게 입력해 주세요.', '입력 오류');
        return;
      }
    }
    setSingleSubmitting(true);
    try {
      await api.post('/api/products', {
        name: singleForm.name.trim(),
        brand: singleForm.brand.trim(),
        price: priceNum,
        originalPrice: originalPriceNum,
        category: singleForm.category,
        sport: singleForm.sport || undefined,
        description: singleForm.description.trim() || undefined,
        images: singleForm.imageUrls,
      });
      await showSuccess('상품이 등록되었습니다.', '상품 등록');
      setSingleForm(singleProductEmpty());
    } catch (err: any) {
      await showError(err?.response?.data?.message || err?.message || '등록에 실패했습니다.', '등록 실패');
    } finally {
      setSingleSubmitting(false);
    }
  };

  const addBulkRow = () => {
    setBulkRows((prev) => [...prev, singleProductEmpty()]);
  };

  const removeBulkRow = (index: number) => {
    if (bulkRows.length <= 1) return;
    setBulkRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBulkRow = (index: number, field: string, value: string | string[] | File | null) => {
    setBulkRows((prev) => {
      const next = [...prev];
      if (field === 'imageUrls') {
        next[index] = { ...next[index], imageUrls: Array.isArray(value) ? value : value ? [value] : [] };
      } else {
        next[index] = { ...next[index], [field]: value as string };
      }
      return next;
    });
  };

  const handleBulkImageChange = async (rowIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadProductImage(file);
      setBulkRows((prev) => {
        const next = [...prev];
        next[rowIndex] = { ...next[rowIndex], imageUrls: [url] };
        return next;
      });
    } catch (err: any) {
      await showError(err?.message || '이미지 업로드 실패', '업로드 실패');
    }
    e.target.value = '';
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const products = bulkRows
      .map((r) => {
        const priceNum = parseInt(r.price, 10);
        const origNum = r.originalPrice.trim() ? parseInt(r.originalPrice, 10) : undefined;
        const images = r.imageUrls?.length ? r.imageUrls : r.imageUrl ? [r.imageUrl] : [];
        if (!r.name.trim() || !r.brand.trim() || !r.category || !images.length || Number.isNaN(priceNum) || priceNum < 0) return null;
        return {
          name: r.name.trim(),
          brand: r.brand.trim(),
          price: priceNum,
          originalPrice: Number.isNaN(origNum!) ? undefined : origNum,
          category: r.category,
          sport: r.sport || undefined,
          description: r.description.trim() || undefined,
          images,
        };
      })
      .filter(Boolean);
    if (products.length === 0) {
      await showError('최소 1개 상품의 필수 항목(상품명, 브랜드, 가격, 카테고리, 이미지)을 모두 입력해 주세요.', '입력 오류');
      return;
    }
    setBulkSubmitting(true);
    try {
      const res = await api.post<{ created: number; products: unknown[] }>('/api/products/bulk', { products });
      await showSuccess(`${res.created ?? products.length}개 상품이 등록되었습니다.`, '일괄 등록');
      setBulkRows([singleProductEmpty()]);
    } catch (err: any) {
      await showError(err?.response?.data?.message || err?.message || '일괄 등록에 실패했습니다.', '등록 실패');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleExcelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      await showError('엑셀 파일을 선택해 주세요.', '파일 선택');
      return;
    }
    setExcelSubmitting(true);
    setExcelResult(null);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      const base = getApiBaseUrl();
      const token = localStorage.getItem('remember_me') === 'true'
        ? localStorage.getItem('access_token')
        : sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const res = await fetch(`${base}/api/products/import-excel`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || '엑셀 업로드에 실패했습니다.');
      setExcelResult({ created: data.created ?? 0, errors: data.errors ?? [] });
      if ((data.created ?? 0) > 0) {
        await showSuccess(`${data.created}개 상품이 등록되었습니다.`, '엑셀 등록');
      }
      setExcelFile(null);
    } catch (err: any) {
      await showError(err?.message || '엑셀 등록에 실패했습니다.', '등록 실패');
    } finally {
      setExcelSubmitting(false);
    }
  };

  const downloadExcelTemplate = () => {
    const headers = ['상품명', '브랜드', '가격', '정가', '카테고리', '종목', '설명', '이미지URL'];
    const sample = ['나이키 에어맥스 270', 'Nike', '159000', '199000', '운동화', '러닝', '편안한 러닝화', 'https://example.com/image.jpg'];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '상품등록_양식.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'single', label: '단일 등록', icon: <DocumentPlusIcon className="w-5 h-5" /> },
    { id: 'bulk', label: '한번에 등록', icon: <TableCellsIcon className="w-5 h-5" /> },
    { id: 'excel', label: '엑셀로 등록', icon: <DocumentArrowDownIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 bg-[var(--color-bg-primary)]">
      <header className="flex-shrink-0 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <Link
            to="/sports-equipment"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-blue-primary)] mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            스포츠 용품 목록으로
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">상품 등록</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            단일 등록, 한번에 등록, 엑셀 업로드 중 원하는 방식을 선택하세요.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-[var(--color-blue-primary)] text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 md:px-6 py-6">
        {tab === 'single' && (
          <form onSubmit={handleSingleSubmit} className="space-y-6">
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">상품 정보</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">상품 이미지 *</label>
                  <div className="flex flex-wrap items-start gap-3">
                    {singleForm.imageUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative group">
                        <div className="w-28 h-28 rounded-xl overflow-hidden border border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] flex items-center justify-center">
                          <img
                            src={url.startsWith('http') ? url : getApiBaseUrl() + url}
                            alt={`상품 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-xs font-medium">
                          {index === 0 ? '대표' : index + 1}
                        </span>
                        <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => moveSingleImage(index, 'left')}
                            disabled={index === 0}
                            className="p-1 rounded bg-[var(--color-bg-card)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed"
                            title="왼쪽으로"
                          >
                            <ChevronLeftIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSingleImage(index, 'right')}
                            disabled={index === singleForm.imageUrls.length - 1}
                            className="p-1 rounded bg-[var(--color-bg-card)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed"
                            title="오른쪽으로"
                          >
                            <ChevronRightIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSingleImage(index)}
                            className="p-1 rounded bg-red-500/90 text-white hover:bg-red-600"
                            title="삭제"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-[var(--color-border-card)] rounded-xl cursor-pointer hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-blue-primary)]/50 transition-colors">
                      <PlusCircleIcon className="w-10 h-10 text-[var(--color-text-secondary)]" />
                      <span className="text-xs text-[var(--color-text-secondary)] mt-1">이미지 추가</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleSingleImageAdd}
                        disabled={singleImageUploading || singleSubmitting}
                      />
                      {singleImageUploading && <span className="text-xs text-amber-600 mt-0.5">업로드 중...</span>}
                    </label>
                  </div>
                  {singleForm.imageUrls.length > 0 && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{singleForm.imageUrls.length}장 등록됨</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">상품명 *</label>
                  <input type="text" required maxLength={200} value={singleForm.name} onChange={(e) => setSingleForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]" placeholder="예: 나이키 에어맥스 270" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">브랜드 *</label>
                  <input type="text" required maxLength={100} value={singleForm.brand} onChange={(e) => setSingleForm((p) => ({ ...p, brand: e.target.value }))} className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]" placeholder="예: Nike" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">판매가(원) *</label>
                    <input type="number" min={0} required value={singleForm.price} onChange={(e) => setSingleForm((p) => ({ ...p, price: e.target.value }))} className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">정가(원)</label>
                    <input type="number" min={0} value={singleForm.originalPrice} onChange={(e) => setSingleForm((p) => ({ ...p, originalPrice: e.target.value }))} className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]" placeholder="선택" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">카테고리 *</label>
                  <select required value={singleForm.category} onChange={(e) => setSingleForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">종목</label>
                  <select value={singleForm.sport} onChange={(e) => setSingleForm((p) => ({ ...p, sport: e.target.value }))} className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
                    {SPORT_OPTIONS.map((s) => (
                      <option key={s || 'all'} value={s}>{s || '선택 안 함'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">설명</label>
                  <textarea rows={3} value={singleForm.description} onChange={(e) => setSingleForm((p) => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] resize-none" placeholder="상품 설명 (선택)" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button type="submit" disabled={singleSubmitting || !singleForm.imageUrls.length} className="px-6 py-2.5 rounded-xl bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50">
                  {singleSubmitting ? '등록 중...' : '등록하기'}
                </button>
                <button type="button" onClick={() => navigate('/sports-equipment')} className="px-6 py-2.5 rounded-xl border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]">
                  취소
                </button>
              </div>
            </div>
          </form>
        )}

        {tab === 'bulk' && (
          <form onSubmit={handleBulkSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">한번에 등록 (최대 100개)</h2>
              <button type="button" onClick={addBulkRow} className="px-4 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]">
                + 상품 추가
              </button>
            </div>
            <div className="space-y-6">
              {bulkRows.map((row, index) => (
                <div key={index} className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium text-[var(--color-text-primary)]">상품 {index + 1}</span>
                    {bulkRows.length > 1 && (
                      <button type="button" onClick={() => removeBulkRow(index)} className="text-sm text-red-500 hover:underline">
                        삭제
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">이미지 *</label>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[var(--color-border-card)] rounded-lg cursor-pointer hover:bg-[var(--color-bg-secondary)]">
                        <PhotoIcon className="w-8 h-8 text-[var(--color-text-secondary)]" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleBulkImageChange(index, e)} />
                        {row.imageUrls?.length ? <span className="text-xs text-green-600">업로드 완료 ({row.imageUrls.length})</span> : <span className="text-xs text-[var(--color-text-secondary)]">클릭하여 선택</span>}
                      </label>
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <input type="text" placeholder="상품명 *" maxLength={200} value={row.name} onChange={(e) => updateBulkRow(index, 'name', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm" />
                      <input type="text" placeholder="브랜드 *" maxLength={100} value={row.brand} onChange={(e) => updateBulkRow(index, 'brand', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm" />
                      <div className="flex gap-2">
                        <input type="number" min={0} placeholder="가격 *" value={row.price} onChange={(e) => updateBulkRow(index, 'price', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm" />
                        <select value={row.category} onChange={(e) => updateBulkRow(index, 'category', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm">
                          {CATEGORY_OPTIONS.slice(0, 10).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={bulkSubmitting} className="px-6 py-2.5 rounded-xl bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50">
                {bulkSubmitting ? '등록 중...' : '일괄 등록'}
              </button>
              <button type="button" onClick={() => navigate('/sports-equipment')} className="px-6 py-2.5 rounded-xl border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]">
                취소
              </button>
            </div>
          </form>
        )}

        {tab === 'excel' && (
          <div className="space-y-6">
            <div
              className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-2xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExcelGuideOpen((o) => !o)}
                className="w-full flex items-center justify-between p-4 text-left font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
              >
                엑셀 등록 가이드 (필수 컬럼 및 양식)
                {excelGuideOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </button>
              {excelGuideOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-[var(--color-border-card)]">
                  <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--color-text-secondary)] mb-4">
                    <li>첫 번째 행은 반드시 <strong className="text-[var(--color-text-primary)]">헤더</strong>로 두세요.</li>
                    <li>필수 컬럼: <strong className="text-[var(--color-text-primary)]">상품명, 브랜드, 가격, 카테고리, 이미지URL</strong> (또는 이미지주소·이미지링크)</li>
                    <li>선택 컬럼: 정가, 종목, 설명</li>
                    <li>이미지URL에는 상품 이미지의 <strong className="text-[var(--color-text-primary)]">전체 URL</strong>을 입력하세요. (예: https://example.com/image.jpg)</li>
                    <li>가격·정가는 숫자만 입력하세요.</li>
                    <li>파일 형식: <strong className="text-[var(--color-text-primary)]">.xlsx 또는 .xls</strong></li>
                  </ol>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={downloadExcelTemplate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]">
                      <DocumentArrowDownIcon className="w-5 h-5" />
                      CSV 양식 다운로드 (엑셀에서 열어 .xlsx로 저장 후 사용)
                    </button>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm border border-[var(--color-border-card)]">
                      <thead>
                        <tr className="bg-[var(--color-bg-secondary)]">
                          <th className="border border-[var(--color-border-card)] px-2 py-1.5 text-left">상품명</th>
                          <th className="border border-[var(--color-border-card)] px-2 py-1.5 text-left">브랜드</th>
                          <th className="border border-[var(--color-border-card)] px-2 py-1.5 text-left">가격</th>
                          <th className="border border-[var(--color-border-card)] px-2 py-1.5 text-left">정가</th>
                          <th className="border border-[var(--color-border-card)] px-2 py-1.5 text-left">카테고리</th>
                          <th className="border border-[var(--color-border-card)] px-2 py-1.5 text-left">종목</th>
                          <th className="border border-[var(--color-border-card)] px-2 py-1.5 text-left">설명</th>
                          <th className="border border-[var(--color-border-card)] px-2 py-1.5 text-left">이미지URL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-[var(--color-border-card)] px-2 py-1.5">나이키 에어맥스 270</td>
                          <td className="border border-[var(--color-border-card)] px-2 py-1.5">Nike</td>
                          <td className="border border-[var(--color-border-card)] px-2 py-1.5">159000</td>
                          <td className="border border-[var(--color-border-card)] px-2 py-1.5">199000</td>
                          <td className="border border-[var(--color-border-card)] px-2 py-1.5">운동화</td>
                          <td className="border border-[var(--color-border-card)] px-2 py-1.5">러닝</td>
                          <td className="border border-[var(--color-border-card)] px-2 py-1.5">편안한 러닝화</td>
                          <td className="border border-[var(--color-border-card)] px-2 py-1.5 text-xs">https://...</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleExcelSubmit} className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">엑셀 파일 업로드</h2>
              <input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-[var(--color-text-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--color-blue-primary)] file:text-white file:font-medium"
              />
              {excelResult && (
                <div className="mt-4 p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)]">
                  <p className="font-medium text-[var(--color-text-primary)]">등록 완료: {excelResult.created}개</p>
                  {excelResult.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-amber-600 list-disc list-inside">
                      {excelResult.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {excelResult.errors.length > 10 && <li>외 {excelResult.errors.length - 10}건</li>}
                    </ul>
                  )}
                </div>
              )}
              <div className="mt-4 flex gap-3">
                <button type="submit" disabled={excelSubmitting || !excelFile} className="px-6 py-2.5 rounded-xl bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50">
                  {excelSubmitting ? '업로드 중...' : '엑셀 업로드'}
                </button>
                <button type="button" onClick={() => navigate('/sports-equipment')} className="px-6 py-2.5 rounded-xl border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]">
                  목록으로
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductRegisterPage;
