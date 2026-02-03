import React, { useState, useRef } from 'react';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../utils/api';
import { showError, showSuccess, showWarning } from '../../utils/swal';

interface Step5BusinessVerificationProps {
  /** 앞서 인증한 실명 (Step 4). OCR 대표자명과 일치해야 검증 통과 */
  realName: string;
  isBusinessNumberVerified: boolean;
  onBusinessNumberVerified: (verified: boolean) => void;
  /** 검증 성공 시 OCR에서 추출한 사업자번호를 폼에 반영 */
  onBusinessNumberFromDocument: (businessNumber: string) => void;
}

const Step5BusinessVerification: React.FC<Step5BusinessVerificationProps> = ({
  realName,
  isBusinessNumberVerified,
  onBusinessNumberVerified,
  onBusinessNumberFromDocument,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerify = async () => {
    if (!realName?.trim()) {
      await showWarning('이전 단계에서 실명을 입력해 주세요.', '실명 필요');
      return;
    }
    if (!documentFile) {
      await showWarning(
        '사업자등록증 이미지 파일을 첨부해 주세요. 문서에서 추출한 대표자명과 앞서 인증한 실명이 일치하는지 확인합니다.',
        '문서 필요',
      );
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(documentFile.type)) {
      await showWarning(
        '사업자등록증은 이미지 파일만 업로드 가능합니다. (jpg, png 등)',
        '파일 형식 오류',
      );
      return;
    }

    setIsVerifying(true);
    onBusinessNumberVerified(false);
    try {
      const formData = new FormData();
      formData.append('document', documentFile);
      formData.append('realName', realName.trim());

      const res = await api.request<{
        verified: boolean;
        message?: string;
        businessNumber?: string;
      }>('/api/auth/verify-business-with-document', {
        method: 'POST',
        body: formData,
      });

      if (res?.verified && res?.businessNumber) {
        onBusinessNumberFromDocument(res.businessNumber);
        onBusinessNumberVerified(true);
        await showSuccess(
          '사업자등록증의 대표자명과 인증한 실명이 일치하여 검증이 완료되었습니다. 다음 단계로 진행해 주세요.',
          '검증 완료',
        );
      } else {
        await showError(
          res?.message || '사업자등록증 검증에 실패했습니다. 본인 명의의 사업자등록증을 올려 주세요.',
          '검증 실패',
        );
      }
    } catch (error: unknown) {
      console.error('사업자등록증 검증 실패:', error);
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      const message =
        err?.response?.data?.message ||
        (err?.message as string) ||
        '사업자등록증 검증에 실패했습니다. 대표자명과 실명이 일치하는 본인 명의의 문서인지 확인해 주세요.';
      await showError(message, '검증 실패');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentFile(file);
      onBusinessNumberVerified(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
          <BuildingOfficeIcon className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          사업자등록증 검증
        </h2>
        <p className="text-base text-[var(--color-text-secondary)]">
          사업자등록증 이미지를 올리시면, OCR로 문서에서 데이터를 추출한 뒤{' '}
          <strong>앞서 인증한 실명(대표자명)</strong>과 일치하는지 확인합니다. 일치하면 다음
          단계로 진행할 수 있습니다.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            사업자등록증 이미지 <span className="text-red-500">*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusinessNumberVerified}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-blue-primary)] hover:text-[var(--color-blue-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {documentFile ? (
              <>
                <DocumentArrowUpIcon className="w-6 h-6" />
                <span>{documentFile.name}</span>
              </>
            ) : (
              <>
                <PhotoIcon className="w-6 h-6" />
                <span>사업자등록증 이미지 선택 (jpg, png 등)</span>
              </>
            )}
          </button>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            OCR로 문서 내용을 추출한 뒤, 앞서 인증한 실명과 일치하는지 확인합니다.
          </p>
        </div>

        {!isBusinessNumberVerified && (
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || !documentFile}
            className="w-full px-6 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying
              ? 'OCR을 이용하여 사업자등록증에서 데이터를 추출하고 있습니다...'
              : '검증하기'}
          </button>
        )}

        {isBusinessNumberVerified && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              검증이 완료되었습니다. 다음 단계로 진행하실 수 있습니다.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step5BusinessVerification;
