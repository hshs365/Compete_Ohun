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

interface Step5AdditionalInfoProps {
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

const Step5AdditionalInfo: React.FC<Step5AdditionalInfoProps> = ({
  nickname,
  gender,
  residenceSido,
  residenceSigungu,
  selectedAddress,
  onNicknameChange,
  onGenderChange,
  onResidenceChange,
}) => {
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameCheckError, setNicknameCheckError] = useState<string | null>(null);

  const checkNickname = React.useCallback(async (nickToCheck: string) => {
    if (nickToCheck.length < 2) return;
    setNicknameChecking(true);
    setNicknameCheckError(null);
    try {
      const result = await api.get<{ available: boolean }>(
        `/api/auth/check-nickname?nickname=${encodeURIComponent(nickToCheck)}`
      );
      setNicknameAvailable(result.available);
    } catch (error) {
      setNicknameAvailable(null);
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error && (error.message === 'Failed to fetch' || error.message.includes('NetworkError')));
      setNicknameCheckError(
        isNetworkError
          ? '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
          : '확인할 수 없습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setNicknameChecking(false);
    }
  }, []);

  // 닉네임 중복 검사 (디바운스)
  React.useEffect(() => {
    if (nickname.length < 2) {
      setNicknameAvailable(null);
      setNicknameCheckError(null);
      return;
    }

    const timer = setTimeout(() => {
      checkNickname(nickname);
    }, 500);

    return () => clearTimeout(timer);
  }, [nickname, checkNickname]);

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
        <input
          type="text"
          value={nickname}
          onChange={(e) => onNicknameChange(e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] ${
            nicknameAvailable === true
              ? 'border-green-500'
              : nicknameAvailable === false
              ? 'border-red-500'
              : 'border-[var(--color-border-card)]'
          }`}
          placeholder="닉네임을 입력하세요 (2자 이상)"
        />
        {nicknameChecking && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">확인 중...</p>
        )}
        {nicknameAvailable === true && (
          <p className="mt-1 text-sm text-green-500">사용 가능한 닉네임입니다.</p>
        )}
        {nicknameAvailable === false && nickname.length >= 2 && (
          <p className="mt-1 text-sm text-red-500">이미 사용 중인 닉네임입니다.</p>
        )}
        {nicknameCheckError && nickname.length >= 2 && !nicknameChecking && (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-amber-500">{nicknameCheckError}</p>
            <button
              type="button"
              onClick={() => checkNickname(nickname)}
              className="text-sm font-medium text-[var(--color-blue-primary)] hover:underline"
            >
              다시 확인
            </button>
          </div>
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

export default Step5AdditionalInfo;
