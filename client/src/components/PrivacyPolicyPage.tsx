import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AppLogo from './AppLogo';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 상단: 뒤로가기 + 브레드크럼 */}
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            로그인으로 돌아가기
          </Link>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            올코트플레이 약관 및 정책 / 개인정보 처리방침
          </p>
        </div>

        {/* 로고 + 제목 */}
        <div className="text-center mb-10">
          <AppLogo className="h-16 w-auto max-w-[160px] mx-auto object-contain mb-4" />
          <h1 className="text-2xl font-bold">개인정보 처리방침</h1>
        </div>

        {/* 본문 */}
        <article className="space-y-8 text-[var(--color-text-primary)]">
          <section>
            <h2 className="text-lg font-semibold mb-4">개인정보의 수집 목적, 수집 항목, 보유 및 이용기간</h2>
            <p className="text-[var(--color-text-secondary)] mb-4 leading-relaxed">
              1. 회사는 다음과 같이 정보주체의 개인정보를 처리합니다.
            </p>
            <div className="overflow-x-auto rounded-lg border border-[var(--color-border-card)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-card)]">
                    <th className="text-left py-3 px-4 font-semibold text-[var(--color-text-primary)]">수집 목적</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--color-text-primary)]">수집 항목</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--color-text-primary)]">보유 및 이용기간</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--color-text-secondary)]">
                  <tr className="border-b border-[var(--color-border-card)]">
                    <td className="py-3 px-4 align-top">회원 가입 및 관리</td>
                    <td className="py-3 px-4 align-top">
                      [필수] 이메일, 비밀번호, 이름, 휴대폰 번호, 성별, 생년월일 (소셜 가입 시 해당 제공 항목)
                    </td>
                    <td className="py-3 px-4 align-top">회원 탈퇴 시까지 (관련 법령에 따라 보존할 경우 해당 기간)</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border-card)]">
                    <td className="py-3 px-4 align-top">서비스 제공 및 예약 관리</td>
                    <td className="py-3 px-4 align-top">
                      [필수] 예약 일시, 이용 시설·매치 정보, 결제 내역
                    </td>
                    <td className="py-3 px-4 align-top">회원 탈퇴 또는 5년 (전자상거래법 등)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 align-top">고객 문의 및 분쟁 처리</td>
                    <td className="py-3 px-4 align-top">[필수] 문의 내용, 연락처</td>
                    <td className="py-3 px-4 align-top">처리 완료 후 3년</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">개인정보의 파기 절차 및 방법</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              회사는 보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구 불가한 방법으로 삭제하고, 종이 문서는 분쇄 또는 소각합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">개인정보의 안전성 확보조치</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              회사는 개인정보의 안전한 처리와 유출·훼손 방지를 위해 접근 권한 관리, 암호화, 접속 기록 보관 등 필요한 기술적·관리적 조치를 시행합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">개인정보 보호책임자 및 열람청구</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              개인정보 보호 관련 문의 및 열람·정정·삭제·처리정지 요청은 서비스 내 고객센터 또는 개인정보보호 담당자에게 연락하시면 됩니다. 이용자는 개인정보보호법에 따라 권리를 행사할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">개인정보 처리방침의 변경</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              이 방침은 법령·정책 또는 보안 기술 변경에 따라 내용이 추가·삭제 또는 수정될 수 있으며, 변경 시 서비스 공지사항 등을 통해 공지합니다.
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

export default PrivacyPolicyPage;
