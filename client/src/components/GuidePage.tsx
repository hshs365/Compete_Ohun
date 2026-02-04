import React from 'react';
import FootballStatsRadar from './FootballStatsRadar';

const APP_NAME = '오운';

/** 이미지 캡처 삽입용 플레이스홀더 */
const ImagePlaceholder: React.FC<{
  caption: string;
  aspect?: 'video' | 'square' | 'wide';
}> = ({ caption, aspect = 'video' }) => {
  const ratio = aspect === 'video' ? 'aspect-video' : aspect === 'square' ? 'aspect-square' : 'aspect-[21/9]';
  return (
    <div className="my-6">
      <div
        className={`w-full ${ratio} rounded-xl border-2 border-dashed border-[var(--color-border-card)] bg-[var(--color-bg-secondary)]/50 flex items-center justify-center`}
      >
        <span className="text-sm text-[var(--color-text-secondary)]">[캡처 이미지: {caption}]</span>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] mt-2 text-center">{caption}</p>
    </div>
  );
};

const GuidePage = () => {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-8">
      {/* 빠른 이동 */}
      <nav className="mb-10 p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-card)]">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3">빠른 이동</p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'welcome', label: '서비스 소개' },
            { id: 'booking', label: '가계약' },
            { id: 'career', label: '랭킹·명예의전당' },
            { id: 'economy', label: '포인트' },
            { id: 'conduct', label: '페어플레이 에티켓' },
          ].map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-blue-primary)]/20 text-sm text-[var(--color-text-primary)] transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* 히어로: 레이더 차트 */}
      <section className="mb-16">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            당신은 어떤 유형의 선수인가요?
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            오운은 동료들의 리뷰로만 스텟이 쌓여요. 본인 입력 불가 = 진짜 실력.
          </p>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6 md:p-8 flex flex-col items-center">
          <FootballStatsRadar
            stats={{
              멘탈: 8,
              수비: 6,
              공격: 9,
              피지컬: 5,
              스피드: 7,
              테크닉: 8,
            }}
            height={280}
            theme="dark"
            fill="var(--color-blue-primary)"
          />
          <p className="text-sm text-[var(--color-text-secondary)] mt-4">
            * 매치 참가 후 동료들이 뽑아주는 항목별 실력. 매너가 곧 실력이다.
          </p>
        </div>
      </section>

      {/* 1. Welcome to the Field */}
      <section className="mb-16 scroll-mt-20" id="welcome">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">⚽</span>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
              1. Welcome to the Field
            </h2>
            <p className="text-[var(--color-blue-primary)] font-semibold">
              단순한 운동 모임? 아니다. 여기서부터 당신의 스포츠 커리어가 시작된다.
            </p>
          </div>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-card)] p-6 space-y-6">
          <p className="text-[var(--color-text-primary)] leading-relaxed">
            {APP_NAME}는 동네 운동 모임을 넘어, 당신이 진짜 실력을 증명하고 커리어를 쌓는 플랫폼이에요.
            어떤 매치에 참여할지에 따라 당신의 기록이 달라집니다.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]">
              <h3 className="font-bold text-[var(--color-text-primary)] mb-2">일반매치 · 교류</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                편하게 만나서 즐기는 운동. 매치장이 진행하고, 실력 증명보다는 즐김에 집중. 처음 오운에 왔다면 여기서 스타트!
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]">
              <h3 className="font-bold text-[var(--color-text-primary)] mb-2">랭크매치 · 증명</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                심판이 승패를 기록하고, 오운 랭크 점수가 올라가는 진지한 경기. 여기서 점수를 쌓아야 명예의 전당에 이름을 올릴 수 있어요.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]">
              <h3 className="font-bold text-[var(--color-text-primary)] mb-2">이벤트매치 · 보상</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                사업자 등록 회원이 주최하는 특별 매치. 경품·행사가 있을 수 있어요. 주의: 경품 사행성·배송 책임은 생성자(주최자)에게 있음.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>이벤트 매치 참고:</strong> 사업자등록 회원만 이벤트 매치를 생성할 수 있습니다. 경품의 사행성 여부나 배송·환불 책임은 생성자에게 있으며, 플랫폼은 중개 역할만 수행합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 2. The Smart Booking */}
      <section className="mb-16 scroll-mt-20" id="booking">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">📋</span>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
              2. The Smart Booking: 가계약 시스템
            </h2>
            <p className="text-[var(--color-blue-primary)] font-semibold">
              원하는 구장을 놓치지 않는 법
            </p>
          </div>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-card)] p-6 space-y-6">
          <p className="text-[var(--color-text-primary)] leading-relaxed">
            인기 구장은 예약 전쟁. 매치 생성 시 1·2·3순위 시설을 미리 고르면, 인원이 차는 순간 자동으로 예약을 시도해요. 1순위 실패하면 2순위, 2순위 실패하면 3순위로. 놓칠 일 없음.
          </p>
          <ImagePlaceholder
            caption="가계약 흐름도: 인원 모집중 → 1순위 시도(성공/실패) → 2·3순위 자동 전환"
            aspect="wide"
          />
          <div className="space-y-3 text-[var(--color-text-secondary)] text-sm">
            <p><strong className="text-[var(--color-text-primary)]">Step 1.</strong> 매치 생성 시 원하는 구장 1·2·3순위로 선택</p>
            <p><strong className="text-[var(--color-text-primary)]">Step 2.</strong> 최소 인원 달성 시 1순위 시설 예약 시도</p>
            <p><strong className="text-[var(--color-text-primary)]">Step 3.</strong> 1순위 실패 시 2순위 자동 시도 → 3순위</p>
            <p><strong className="text-[var(--color-text-primary)]">Step 4.</strong> 확정된 시설이 매치장 캘린더에 표시됨</p>
          </div>
        </div>
      </section>

      {/* 3. Build Your Career */}
      <section className="mb-16 scroll-mt-20" id="career">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🏆</span>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
              3. Build Your Career: 랭킹 & 명예의 전당
            </h2>
            <p className="text-[var(--color-blue-primary)] font-semibold">
              승패가 아닌 평판. 랭크 점수로 증명한다.
            </p>
          </div>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-card)] p-6 space-y-6">
          <p className="text-[var(--color-text-primary)] leading-relaxed">
            랭크매치에서 승리하면 점수를 얻고, 종목별로 순위가 매겨져요. 매년 갱신되는 명예의 전당에 이름을 올리고 싶다면, 랭크매치에 도전하세요. 레이더 차트 스텟은 <strong>동료들이 리뷰로 뽑아준 항목</strong>만 반영돼요. 본인은 입력 못 함 = 신뢰할 수 있는 데이터.
          </p>
          <ImagePlaceholder
            caption="명예의 전당 프리뷰: 1위 유저 황금 배지 프로필 예시"
            aspect="video"
          />
          <div className="p-4 rounded-lg bg-[var(--color-blue-primary)]/10 border border-[var(--color-blue-primary)]/30">
            <p className="text-sm text-[var(--color-text-primary)]">
              <strong>평판 시스템의 공정성:</strong> 스텟은 본인이 직접 입력할 수 없고, 매치 참가 후 동료들이 각 항목(테크닉, 스피드, 공격 등)에 뽑아준 결과만 반영됩니다. 그래서 믿을 만한 데이터예요.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Economy of Sports */}
      <section className="mb-16 scroll-mt-20" id="economy">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">💰</span>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
              4. Economy of Sports: 포인트 & 리워드
            </h2>
            <p className="text-[var(--color-blue-primary)] font-semibold">
              운동만 해도 포인트가 쌓인다
            </p>
          </div>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-card)] p-6 space-y-6">
          <p className="text-[var(--color-text-primary)] leading-relaxed">
            매치 참가는 포인트로, 포인트는 활동으로. 선수 리뷰·시설 리뷰 작성, 이벤트 참여, 앱 내 활동으로 적립할 수 있어요. 현금 충전도 가능.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-bold text-[var(--color-text-primary)] mb-2">획득 경로</h4>
              <ul className="text-sm text-[var(--color-text-secondary)] space-y-1 list-disc list-inside">
                <li>선수 리뷰 작성: 500P</li>
                <li>시설 리뷰 작성: 500P</li>
                <li>이벤트 매치 참여 및 보상</li>
                <li>앱 내 기타 활동</li>
                <li>현금 충전</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[var(--color-text-primary)] mb-2">사용처</h4>
              <ul className="text-sm text-[var(--color-text-secondary)] space-y-1 list-disc list-inside">
                <li>매치 참가비 (축구: 10,000P / 전일 이전 8,000P)</li>
                <li>스포츠 용품 등 앱 내 결제</li>
              </ul>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]">
            <p className="text-xs text-[var(--color-text-secondary)]">
              포인트 사용 시 전자상거래법에 따른 환불·이의 제기 등은 이용약관 및 플랫폼 정책을 따릅니다. 구매 전 유의해 주세요.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Code of Conduct */}
      <section className="mb-16 scroll-mt-20" id="conduct">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🤝</span>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
              5. Code of Conduct: 페어플레이 에티켓
            </h2>
            <p className="text-[var(--color-blue-primary)] font-semibold">
              스포츠인으로서의 품격
            </p>
          </div>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-card)] p-6 space-y-6">
          <p className="text-[var(--color-text-primary)] leading-relaxed">
            함께하는 경기가 즐거워지려면, 최소한의 규칙이 필요해요. 아래 5가지만 지키면 당신은 이미 상위권 선수.
          </p>
          <ol className="space-y-4">
            {[
              { n: 1, title: '노쇼 금지', desc: '예약하고 안 나오면? 다음부터 신뢰 잃음. 취소는 미리.' },
              { n: 2, title: '폭언·비매너 금지', desc: '심판 판정, 팀원 실수에 폭발하지 마세요. 매너가 곧 실력이다.' },
              { n: 3, title: '결과 승복', desc: '졌으면 졌다. 이기면 겸손하게. 다음 매치에서 만나요.' },
              { n: 4, title: '시간 준수', desc: '시작 시간 10분 전까지 도착. 모두가 기다리고 있어요.' },
              { n: 5, title: '서로 존중', desc: '실력 차이, 체형, 나이... 다양성을 인정하고 같이 즐겨요.' },
            ].map(({ n, title, desc }) => (
              <li key={n} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-blue-primary)] text-white flex items-center justify-center font-bold text-sm">
                  {n}
                </span>
                <div>
                  <h4 className="font-bold text-[var(--color-text-primary)]">{title}</h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]">
            <h4 className="font-bold text-[var(--color-text-primary)] mb-2">팔로우로 나만의 팀 만들기</h4>
            <p className="text-sm text-[var(--color-text-secondary)]">
              마음에 드는 선수를 팔로우하고, 함께한 사람들과 소통하세요. 나만의 라이벌, 파트너를 찾으면 오운이 더 재밌어져요.
            </p>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <div className="text-center py-8 border-t border-[var(--color-border-card)]">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {APP_NAME}와 함께라면, 오늘의 경기가 내일의 커리어가 됩니다.
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-2">
          © {APP_NAME}. 본 가이드는 추후 업데이트될 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default GuidePage;
