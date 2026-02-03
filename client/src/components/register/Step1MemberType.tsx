import React from 'react';
import { BuildingOfficeIcon, UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Step1MemberTypeProps {
  memberType: 'individual' | 'business';
  onMemberTypeChange: (type: 'individual' | 'business') => void;
}

const Step1MemberType: React.FC<Step1MemberTypeProps> = ({ memberType, onMemberTypeChange }) => {
  return (
    <div className="space-y-6">
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
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
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
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step1MemberType;
