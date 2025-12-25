import React, { useState } from 'react';
import { XMarkIcon, MapPinIcon, UsersIcon, TagIcon, CalendarIcon, PhoneIcon } from '@heroicons/react/24/outline';
import type { SelectedGroup } from './MapPanel';
import { SPORTS_LIST } from '../constants/sports';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupData: Omit<SelectedGroup, 'id'>) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    coordinates: [37.5665, 126.9780] as [number, number],
    memberCount: 1,
    category: '배드민턴',
    description: '',
    meetingTime: '',
    contact: '',
  });

  const categories = SPORTS_LIST;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // 폼 초기화
    setFormData({
      name: '',
      location: '',
      coordinates: [37.5665, 126.9780],
      memberCount: 1,
      category: '배드민턴',
      description: '',
      meetingTime: '',
      contact: '',
    });
    onClose();
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--color-border-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] p-4 md:p-6 flex items-center justify-between z-10">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">새 모임 만들기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
          </button>
        </div>

        {/* 폼 내용 */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
          {/* 모임 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              모임 이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="예: 강남 배드민턴 클럽"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <TagIcon className="w-4 h-4 inline mr-1" />
              카테고리 <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 위치 */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <MapPinIcon className="w-4 h-4 inline mr-1" />
              위치 <span className="text-red-500">*</span>
            </label>
            <input
              id="location"
              type="text"
              required
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="예: 서울시 강남구"
            />
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              정확한 주소를 입력해주세요. 지도에서 마커 위치를 조정할 수 있습니다.
            </p>
          </div>

          {/* 모임 시간 */}
          <div>
            <label htmlFor="meetingTime" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              모임 시간
            </label>
            <input
              id="meetingTime"
              type="text"
              value={formData.meetingTime}
              onChange={(e) => handleChange('meetingTime', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="예: 매주 토요일 10:00"
            />
          </div>

          {/* 연락처 */}
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <PhoneIcon className="w-4 h-4 inline mr-1" />
              연락처
            </label>
            <input
              id="contact"
              type="tel"
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="예: 010-1234-5678"
            />
          </div>

          {/* 모임 설명 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              모임 설명
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] resize-none"
              placeholder="모임에 대한 간단한 설명을 작성해주세요..."
            />
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4 border-t border-[var(--color-border-card)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:opacity-80 transition-opacity"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              모임 만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;


