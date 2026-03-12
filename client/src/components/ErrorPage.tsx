import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon, HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getFriendlyApiMessage, getErrorPageTitle, NETWORK_ERROR_MESSAGE } from '../utils/apiErrorMessages';

/**
 * HTTP 에러 코드나 네트워크 오류 시 전용으로 보여주는 페이지.
 * URL: /error?code=502 또는 /error (기본 500)
 * 502, Bad Request 등 기술 문구 대신 친화적 메시지를 표시합니다.
 */
const ErrorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const codeParam = searchParams.get('code');
  const status = codeParam ? parseInt(codeParam, 10) : 500;
  const isNetworkError = status === 0 || searchParams.get('network') === '1';

  const title = isNetworkError ? '연결할 수 없음' : getErrorPageTitle(isNaN(status) ? 500 : status);
  const message = isNetworkError
    ? NETWORK_ERROR_MESSAGE
    : getFriendlyApiMessage(isNaN(status) ? 500 : status, null);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500" aria-hidden />
          </div>
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          {title}
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium bg-[var(--color-blue-primary)] text-white hover:opacity-90 transition-opacity"
          >
            <ArrowPathIcon className="w-5 h-5" />
            다시 시도
          </button>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
