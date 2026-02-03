import React from 'react';
import { BuildingOfficeIcon, UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Step1MemberTypeProps {
  memberType: 'individual' | 'business';
  onMemberTypeChange: (type: 'individual' | 'business') => void;
}

const Step1MemberType: React.FC<Step1MemberTypeProps> = ({ memberType, onMemberTypeChange }) => {
  return (
    <div className="space-y-6">
      {/* 안내 문구 */}
      <div className="mb-6">
        <p className="text-sm text-[var(--color-text-secondary)]">
          회원 유형에 따라 제공되는 서비스가 달라질 수 있습니다. 가입 후에는 변경이 불가합니다.
        </p>
      </div>

      {/* 회원 유형 선택 */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
          회원 유형
        </label>
        <div className="grid grid-cols-2 gap-4">
          {/* 개인 회원 */}
          <button
            type="button"
            onClick={() => onMemberTypeChange('individual')}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              memberType === 'individual'
                ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20'
                : 'border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-blue-primary)]/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                memberType === 'individual'
                  ? 'bg-[var(--color-blue-primary)]'
                  : 'bg-[var(--color-bg-primary)]'
              }`}>
                <UserIcon className={`w-6 h-6 ${
                  memberType === 'individual' ? 'text-white' : 'text-[var(--color-text-secondary)]'
                }`} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold text-lg ${
                    memberType === 'individual'
                      ? 'text-[var(--color-blue-primary)]'
                      : 'text-[var(--color-text-primary)]'
                  }`}>
                    개인 회원
                  </span>
                  {memberType === 'individual' && (
                    <CheckCircleIcon className="w-5 h-5 text-[var(--color-blue-primary)]" />
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  일반 사용자를 위한 회원 유형입니다.
                </p>
              </div>
            </div>
          </button>

          {/* 사업자 회원 */}
          <button
            type="button"
            onClick={() => onMemberTypeChange('business')}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              memberType === 'business'
                ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20'
                : 'border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-blue-primary)]/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                memberType === 'business'
                  ? 'bg-[var(--color-blue-primary)]'
                  : 'bg-[var(--color-bg-primary)]'
              }`}>
                <BuildingOfficeIcon className={`w-6 h-6 ${
                  memberType === 'business' ? 'text-white' : 'text-[var(--color-text-secondary)]'
                }`} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold text-lg ${
                    memberType === 'business'
                      ? 'text-[var(--color-blue-primary)]'
                      : 'text-[var(--color-text-primary)]'
                  }`}>
                    사업자 회원
                  </span>
                  {memberType === 'business' && (
                    <CheckCircleIcon className="w-5 h-5 text-[var(--color-blue-primary)]" />
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  체육센터 운영자 및 사업자를 위한 회원 유형입니다.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 추가 안내 */}
      {memberType === 'business' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            사업자 회원은 가입 과정에서 사업자등록번호를 API로 인증받고 가입합니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step1MemberType;
