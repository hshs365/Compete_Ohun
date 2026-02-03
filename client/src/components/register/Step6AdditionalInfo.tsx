import React, { useState } from 'react';
import { UserIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { api } from '../../utils/api';
import { showWarning } from '../../utils/swal';

// Daum Postcode API 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string;
          addressType: string;
          bname: string;
          buildingName: string;
          zonecode: string;
          sido: string;
          sigungu: string;
        }) => void;
        width?: string;
        height?: string;
      }) => {
        open: () => void;
      };
    };
  }
}

interface Step6AdditionalInfoProps {
  nickname: string;
  gender: 'male' | 'female';
  residenceSido: string;
  residenceSigungu: string;
  selectedAddress: string;
  onNicknameChange: (nickname: string) => void;
  onGenderChange: (gender: 'male' | 'female') => void;
  onResidenceChange: (residence: {
    residenceSido: string;
    residenceSigungu: string;
    selectedAddress: string;
  }) => void;
}

const Step6AdditionalInfo: React.FC<Step6AdditionalInfoProps> = ({
  nickname,
  gender,
  residenceSido,
  residenceSigungu,
  selectedAddress,
  onNicknameChange,
  onGenderChange,
  onResidenceChange,
}) => {

  // Daum Postcode API 스크립트 로드
  React.useEffect(() => {
    if (!window.daum || !window.daum.Postcode) {
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // 주소 검색 열기
  const handleAddressSearch = async () => {
    if (!window.daum || !window.daum.Postcode) {
      await showWarning('주소 검색 서비스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.', '서비스 오류');
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        let addr = '';
        let extraAddr = '';

        if (data.addressType === 'R') {
          addr = data.roadAddress || data.address;
        } else {
          addr = data.jibunAddress || data.address;
        }

        if (data.addressType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddr += data.bname;
          }
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraAddr += extraAddr !== '' ? ', ' + data.buildingName : data.buildingName;
          }
          if (extraAddr !== '') {
            extraAddr = ' (' + extraAddr + ')';
          }
        }

        onResidenceChange({
          residenceSido: data.sido,
          residenceSigungu: (data.sigungu && data.sigungu.trim()) ? data.sigungu : data.sido,
          selectedAddress: addr + extraAddr,
        });
      },
      width: '100%',
      height: '100%',
    }).open();
  };

  return (
    <div className="space-y-6">
      {/* 닉네임 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
          <UserIcon className="w-4 h-4" />
          닉네임
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            className="flex-1 px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            placeholder="닉네임을 입력하세요"
          />
          {nickname && (
            <div className="px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] whitespace-nowrap">
              <span className="text-sm">#KR?</span>
            </div>
          )}
        </div>
        {nickname && (
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            회원가입 시 자동으로 고유 태그가 부여됩니다.
          </p>
        )}
      </div>

      {/* 성별 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          성별
        </label>
        <div className="flex gap-4">
          {(['male', 'female'] as const).map((g) => (
            <label
              key={g}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                gender === g
                  ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20'
                  : 'border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-blue-primary)]/50'
              }`}
            >
              <input
                type="radio"
                value={g}
                checked={gender === g}
                onChange={() => onGenderChange(g)}
                className="sr-only"
              />
              <span className={`font-medium ${
                gender === g
                  ? 'text-[var(--color-blue-primary)]'
                  : 'text-[var(--color-text-primary)]'
              }`}>
                {g === 'male' ? '남성' : '여성'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 거주 지역 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
          <MapPinIcon className="w-4 h-4" />
          거주 지역
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={selectedAddress}
            readOnly
            onClick={handleAddressSearch}
            className="flex-1 px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            placeholder="주소를 검색해주세요"
          />
          <button
            type="button"
            onClick={handleAddressSearch}
            className="px-6 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            주소 검색
          </button>
        </div>
        {selectedAddress && (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            선택된 주소: {selectedAddress}
          </p>
        )}
      </div>
    </div>
  );
};

export default Step6AdditionalInfo;
