import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AppLogo from './AppLogo';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            로그인으로 돌아가기
          </Link>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            올코트플레이 약관 및 정책 / 서비스 이용약관
          </p>
        </div>

        <div className="text-center mb-10">
          <AppLogo className="h-16 w-auto max-w-[160px] mx-auto object-contain mb-4" />
          <h1 className="text-2xl font-bold">서비스 이용약관</h1>
        </div>

        <article className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-2">제1조 (목적)</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              이 약관은 올코트플레이(이하 회사)가 제공하는 스포츠 매치·시설 예약 등 서비스의 이용과 관련하여
              회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">제2조 (약관의 게시와 효력, 개정)</h2>
            <ol className="list-decimal list-inside space-y-2 text-[var(--color-text-secondary)] leading-relaxed">
              <li>회사는 서비스 가입 절차에서 이용자가 약관 내용을 확인할 수 있도록 게시합니다.</li>
              <li>회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있습니다.</li>
              <li>개정된 약관에 동의하지 않는 이용자는 회원 탈퇴를 요청할 수 있으며, 개정 공지 후 7일 이내에 이의를 제기하지 않으면 개정 약관에 동의한 것으로 봅니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">제3조 (약관의 해석과 예외 준칙)</h2>
            <ol className="list-decimal list-inside space-y-2 text-[var(--color-text-secondary)] leading-relaxed">
              <li>개별 서비스에 별도 약관이 있는 경우, 해당 서비스 이용 시 그 약관이 우선 적용됩니다.</li>
              <li>이 약관에 명시되지 않은 사항은 관련 법령 및 회사가 정한 서비스 이용 안내에 따릅니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">제4조 (용어의 정의)</h2>
            <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)] leading-relaxed">
              <li>서비스: 회사가 제공하는 웹/앱 기반의 매치 모집, 시설 예약, 커뮤니티 등 일체의 서비스를 말합니다.</li>
              <li>이용자: 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결한 회원 및 비회원을 말합니다.</li>
              <li>회원: 회사에 개인정보를 제공하여 회원등록을 한 자로서, 서비스를 계속 이용하는 자를 말합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">제5조 (이용계약의 성립)</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              이용계약은 이용자가 회원가입 신청 후 회사가 이를 승낙함으로써 성립합니다. 회사는 신청 내용이 허위이거나 이용요건을 충족하지 못한 경우 승낙을 거부하거나 유보할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">제6조 (서비스의 제공 및 변경)</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              회사는 연중무휴, 1일 24시간 서비스를 제공하는 것을 원칙으로 합니다. 단, 시스템 점검·장애 등 부득이한 사유로 일시 중단할 수 있으며, 이 경우 사전 또는 사후에 이용자에게 공지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">제7조 (개인정보 보호)</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              회사는 이용자의 개인정보 수집·이용에 대해 개인정보 처리방침을 수립하여 공개하고, 이에 따라 개인정보를 보호합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">부칙</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              이 약관은 2025년 1월 1일부터 시행합니다.
            </p>
          </section>
        </article>

        <div className="mt-12 pt-6 border-t border-[var(--color-border-card)] text-center">
          <Link to="/login" className="text-[var(--color-blue-primary)] hover:underline text-sm">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
