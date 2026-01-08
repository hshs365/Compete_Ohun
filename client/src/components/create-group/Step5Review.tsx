import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { isTeamSport } from '../../constants/sports';

interface Step5ReviewProps {
  category: string;
  name: string;
  location: string;
  meetingDate: string;
  meetingTime: string;
  maxParticipants: string;
  minParticipants: string;
  genderRestriction: 'male' | 'female' | null;
  hasFee: boolean;
  feeAmount: string;
  selectedFacility: { id: number; name: string; address: string } | null;
  description: string;
  selectedEquipment: string[];
  gameType: 'team' | 'individual';
  teamSettings: {
    positions: string[];
    balanceByExperience: boolean;
    balanceByRank: boolean;
    minPlayersPerTeam: number;
  };
}

const Step5Review: React.FC<Step5ReviewProps> = ({
  category,
  name,
  location,
  meetingDate,
  meetingTime,
  maxParticipants,
  minParticipants,
  genderRestriction,
  hasFee,
  feeAmount,
  selectedFacility,
  description,
  selectedEquipment,
  gameType,
  teamSettings,
}) => {
  const isTeam = isTeamSport(category);

  return (
    <div className="space-y-6">
      {/* 안내 문구 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          매치 정보 확인
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          입력하신 정보를 확인하세요. 생성 후에는 일부 정보만 수정할 수 있습니다.
        </p>
      </div>

      {/* 정보 요약 */}
      <div className="space-y-4">
        {/* 기본 정보 */}
        <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
          <h4 className="font-semibold text-[var(--color-text-primary)] mb-3">기본 정보</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">운동 종류:</span>
              <span className="text-[var(--color-text-primary)] font-medium">{category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">매치 이름:</span>
              <span className="text-[var(--color-text-primary)] font-medium">{name || '(미입력)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">위치:</span>
              <span className="text-[var(--color-text-primary)] font-medium">{location || '(미입력)'}</span>
            </div>
          </div>
        </div>

        {/* 게임 설정 */}
        {isTeam && (
          <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-3">게임 설정</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">매치 진행 방식:</span>
                <span className="text-[var(--color-text-primary)] font-medium">
                  {gameType === 'team' ? '포지션 지정 매치' : '자유 매칭'}
                </span>
              </div>
              {gameType === 'team' && (
                <>
                  {teamSettings.positions.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">모집 포지션:</span>
                      <span className="text-[var(--color-text-primary)] font-medium">
                        {teamSettings.positions.join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">팀당 최소 인원:</span>
                    <span className="text-[var(--color-text-primary)] font-medium">
                      {teamSettings.minPlayersPerTeam}명
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">선수 출신 고려:</span>
                    <span className="text-[var(--color-text-primary)] font-medium">
                      {teamSettings.balanceByExperience ? '예' : '아니오'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">랭커 고려:</span>
                    <span className="text-[var(--color-text-primary)] font-medium">
                      {teamSettings.balanceByRank ? '예' : '아니오'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 일정 및 인원 */}
        <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
          <h4 className="font-semibold text-[var(--color-text-primary)] mb-3">일정 및 인원</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">매치 일정:</span>
              <span className="text-[var(--color-text-primary)] font-medium">
                {meetingDate && meetingTime 
                  ? `${meetingDate} ${meetingTime}`
                  : '(미설정)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">최소 참여자 수:</span>
              <span className="text-[var(--color-text-primary)] font-medium">
                {minParticipants ? `${minParticipants}명` : '(제한 없음)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">최대 참여자 수:</span>
              <span className="text-[var(--color-text-primary)] font-medium">
                {maxParticipants ? `${maxParticipants}명` : '(제한 없음)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">성별 제한:</span>
              <span className="text-[var(--color-text-primary)] font-medium">
                {genderRestriction === 'male' ? '남자만' : genderRestriction === 'female' ? '여자만' : '(제한 없음)'}
              </span>
            </div>
          </div>
        </div>

        {/* 참가비 및 시설 정보 */}
        {(hasFee || selectedFacility) && (
          <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-3">참가비 및 시설</h4>
            <div className="space-y-2 text-sm">
              {selectedFacility && (
                <div>
                  <span className="text-[var(--color-text-secondary)]">시설:</span>
                  <div className="mt-1">
                    <div className="text-[var(--color-text-primary)] font-medium">
                      {selectedFacility.name}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {selectedFacility.address}
                    </div>
                  </div>
                </div>
              )}
              {hasFee && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">참가비:</span>
                  <span className="text-[var(--color-text-primary)] font-medium">
                    {feeAmount ? `${parseInt(feeAmount, 10).toLocaleString()}원` : '(금액 미입력)'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 준비물 및 설명 */}
        <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
          <h4 className="font-semibold text-[var(--color-text-primary)] mb-3">준비물 및 설명</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-[var(--color-text-secondary)]">준비물: </span>
              <span className="text-[var(--color-text-primary)] font-medium">
                {selectedEquipment.length > 0 
                  ? selectedEquipment.join(', ')
                  : '(없음)'}
              </span>
            </div>
            {description && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border-card)]">
                <p className="text-[var(--color-text-secondary)] mb-1">설명:</p>
                <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">{description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 확인 메시지 */}
      <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <CheckCircleIcon className="w-5 h-5 text-[var(--color-blue-primary)] flex-shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          모든 정보를 확인하셨다면 '매치 만들기' 버튼을 클릭하여 매치를 생성하세요.
        </p>
      </div>
    </div>
  );
};

export default Step5Review;
