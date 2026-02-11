import React, { useState, useEffect, useRef } from 'react';
import {
  MapPinIcon,
  TrophyIcon,
  HeartIcon,
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckCircleIcon,
  ListBulletIcon,
  MapIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { SPORTS_LIST } from '../constants/sports';
import { SPORTS_WITH_POSITIONS, getPositionsBySport, getPositionLabel } from '../constants/positions';
import { useNavigate } from 'react-router-dom';
import { showWarning, showError } from '../utils/swal';

interface WelcomeGuideProps {
  onClose: () => void;
}

interface HighlightTarget {
  selector: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onClose }) => {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [highlightTarget, setHighlightTarget] = useState<HighlightTarget | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 가이드 데이터
  const [location, setLocation] = useState<{ address: string } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isAthlete, setIsAthlete] = useState<boolean>(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [sportPositions, setSportPositions] = useState<{ sport: string; positions: string[] }[]>([]);

  // SPORTS_LIST를 그대로 사용 (정렬 순서 통일)
  const sortedSports = SPORTS_LIST;

  // 총 단계 수: 환영, UI 가이드(매치목록), 위치, 종목선택, 선수출신, 프로필사진
  const totalSteps = 6;

  // 요소 하이라이트 효과
  useEffect(() => {
    if (highlightTarget) {
      let attempts = 0;
      const maxAttempts = 20;
      const checkInterval = setInterval(() => {
        attempts++;
        const element = document.querySelector(highlightTarget.selector);
        if (element || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          if (element) {
            const rect = element.getBoundingClientRect();
            const overlay = overlayRef.current;
            const tooltip = tooltipRef.current;
            
            if (overlay && tooltip) {
              const highlightStyle = {
                position: 'fixed' as const,
                top: `${rect.top}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                zIndex: 10000,
                pointerEvents: 'none' as const,
                boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 0 4px rgba(59, 130, 246, 0.9), 0 0 30px rgba(59, 130, 246, 0.6)`,
                borderRadius: '12px',
                transition: 'all 0.3s ease',
              };
              
              Object.assign(overlay.style, highlightStyle);
              
              const position = highlightTarget.position || 'right';
              let tooltipTop = 0;
              let tooltipLeft = 0;
              
              switch (position) {
                case 'top':
                  tooltipTop = rect.top - 10;
                  tooltipLeft = rect.left + rect.width / 2;
                  break;
                case 'bottom':
                  tooltipTop = rect.bottom + 20;
                  tooltipLeft = rect.left + rect.width / 2;
                  break;
                case 'left':
                  tooltipTop = rect.top + rect.height / 2;
                  tooltipLeft = rect.left - 10;
                  break;
                case 'right':
                  tooltipTop = rect.top + rect.height / 2;
                  tooltipLeft = rect.right + 20;
                  break;
              }
              
              tooltip.style.top = `${tooltipTop}px`;
              tooltip.style.left = `${tooltipLeft}px`;
              tooltip.style.transform = position === 'left' || position === 'right' 
                ? `translateY(-50%)` 
                : `translateX(-50%)`;
            }
            
            element.classList.add('guide-highlight');
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          } else {
            setHighlightTarget(null);
          }
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    } else {
      const highlighted = document.querySelector('.guide-highlight');
      if (highlighted) {
        highlighted.classList.remove('guide-highlight');
      }
    }
  }, [highlightTarget]);

  // 주소 검색으로 위치 등록
  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

    const openPostcode = () => {
      if (typeof window !== 'undefined' && (window as any).daum) {
        new (window as any).daum.Postcode({
          oncomplete: async (data: any) => {
            const fullAddress = data.address;
            const locationData = { address: fullAddress };
            setLocation(locationData);
            const locationKey = user?.id ? `userLocation_${user.id}` : 'userLocation';
            localStorage.setItem(locationKey, JSON.stringify(locationData));
            window.dispatchEvent(new CustomEvent('userLocationUpdated', {
              detail: locationData,
            }));
            await checkAuth();
            setIsGettingLocation(false);
          },
          width: '100%',
          height: '100%',
        }).open();
      }
    };

    if (typeof window !== 'undefined' && (window as any).daum) {
      openPostcode();
    } else {
      script.onload = () => {
        openPostcode();
      };
      document.head.appendChild(script);
    }
  };

  // 다음 단계로
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setHighlightTarget(null);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        if (currentStep + 1 === 1) {
          setTimeout(() => {
            setHighlightTarget({
              selector: '[data-guide="group-list-panel"]',
              title: '좌측 매치 목록',
              description: '여기서 지역별, 카테고리별로 매치를 검색하고 필터링할 수 있어요.',
              position: 'right',
            });
          }, 300);
        }
      }, 200);
    } else {
      handleComplete();
    }
  };

  // 이전 단계로
  const handlePrev = () => {
    if (currentStep > 0) {
      setHighlightTarget(null);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        if (currentStep - 1 === 1) {
          setTimeout(() => {
            setHighlightTarget({
              selector: '[data-guide="group-list-panel"]',
              title: '좌측 매치 목록',
              description: '여기서 지역별, 카테고리별로 매치를 검색하고 필터링할 수 있어요.',
              position: 'right',
            });
          }, 300);
        }
      }, 200);
    }
  };

  // 가이드 완료 및 데이터 저장
  const handleComplete = async () => {
    if (!user) return;

    setIsSaving(true);
    setHighlightTarget(null);
    
    try {
      const updateData: any = {};

      if (location) {
        const locationKey = user?.id ? `userLocation_${user.id}` : 'userLocation';
        localStorage.setItem(locationKey, JSON.stringify({
          address: location.address,
        }));
        
        window.dispatchEvent(new CustomEvent('userLocationUpdated', {
          detail: {
            address: location.address,
          },
        }));
      }

      updateData.skillLevel = isAthlete ? 'advanced' : 'beginner';

      if (selectedSports.length > 0) {
        updateData.interestedSports = selectedSports;
      }
      if (sportPositions.length > 0) {
        updateData.sportPositions = sportPositions;
      }

      if (Object.keys(updateData).length > 0) {
        await api.put('/api/auth/me', updateData);
        await checkAuth();
      }

      localStorage.setItem('welcome_guide_completed', 'true');
      onClose();
    } catch (error) {
      console.error('가이드 정보 저장 실패:', error);
      await showError('정보 저장에 실패했습니다. 나중에 내 정보 페이지에서 수정할 수 있습니다.', '저장 실패');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // 종목 선택 토글
  const toggleSport = (sport: string) => {
    setSelectedSports((prev) => {
      const next = prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport];
      if (!next.includes(sport)) {
        setSportPositions((pos) => pos.filter((p) => p.sport !== sport));
      }
      return next;
    });
  };

  // 포지션 토글 (종목별)
  const togglePosition = (sport: string, position: string) => {
    setSportPositions((prev) => {
      const entry = prev.find((p) => p.sport === sport);
      const current = entry?.positions ?? [];
      const nextPos = current.includes(position)
        ? current.filter((p) => p !== position)
        : [...current, position];
      const rest = prev.filter((p) => p.sport !== sport);
      return nextPos.length > 0 ? [...rest, { sport, positions: nextPos }] : rest;
    });
  };

  // 단계별 렌더링
  const renderStep = () => {
    switch (currentStep) {
      case 0: // 환영 메시지
        return (
          <div className="text-center space-y-8 relative overflow-hidden py-8">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(60)].map((_, i) => {
                const angle = (i / 60) * Math.PI * 2;
                const distance = 80 + Math.random() * 40;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const delay = Math.random() * 0.3;
                const duration = 1.2 + Math.random() * 0.4;
                
                return (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full firework-particle"
                    style={{
                      left: '50%',
                      top: '25%',
                      backgroundColor: color,
                      boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
                      animationDelay: `${delay}s`,
                      animationDuration: `${duration}s`,
                      '--firework-x': `${x}px`,
                      '--firework-y': `${y}px`,
                    } as React.CSSProperties & { '--firework-x': string; '--firework-y': string }}
                  />
                );
              })}
            </div>
            
            <div className="relative z-10">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-8 animate-bounce shadow-2xl">
                <CheckCircleIcon className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-5xl font-bold text-[var(--color-text-primary)] mb-4">
                환영합니다! 🎉
              </h2>
              <p className="text-2xl text-[var(--color-text-secondary)] mb-8">
                {user?.nickname || '회원'}님, 올코트플레이에 오신 것을 환영합니다!
              </p>
              <div className="max-w-xl mx-auto">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                  <p className="text-lg text-[var(--color-text-primary)] leading-relaxed font-medium">
                    간단한 설정을 통해 더 나은 경험을 제공받으세요.<br />
                    다음 단계에서 올코트플레이의 주요 기능들을 안내해드릴게요!
                  </p>
                </div>
              </div>
            </div>
            
            <style>{`
              @keyframes firework {
                0% {
                  transform: translate(0, 0) scale(1);
                  opacity: 1;
                }
                50% {
                  opacity: 1;
                }
                100% {
                  transform: translate(var(--firework-x), var(--firework-y)) scale(0);
                  opacity: 0;
                }
              }
              
              .firework-particle {
                animation: firework ease-out forwards;
              }
            `}</style>
          </div>
        );

      case 1: // UI 가이드 - 매치 목록 (네이버 클라우드 플랫폼 스타일)
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">
                올코트플레이 콘솔 안내
              </h2>
              <p className="text-base text-[var(--color-text-secondary)]">
                올코트플레이의 주요 기능을 간단히 안내해드립니다.
              </p>
            </div>

            {/* 정보 카드들 - 네이버 클라우드 플랫폼 스타일 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ① 매치 목록 */}
              <div className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">①</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                      매치 목록
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3">
                      좌측 패널에서 지역별, 카테고리별로 매치를 검색하고 필터링할 수 있습니다.
                    </p>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-3">
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                        💡 현재 위치 기준으로 <strong>1주일 이내</strong>의 매치만 확인 가능합니다.
                      </p>
                    </div>
                    <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                      <div className="flex items-center gap-2">
                        <MagnifyingGlassIcon className="w-4 h-4" />
                        <span>매치 이름으로 검색</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FunnelIcon className="w-4 h-4" />
                        <span>지역 및 종목별 필터링</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ListBulletIcon className="w-4 h-4" />
                        <span>매치 클릭 시 상세 정보 확인</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ② 지도 연동 */}
              <div className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">②</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                      지도 연동
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3">
                      매치 목록과 지도가 실시간으로 연동됩니다.
                    </p>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-3">
                      <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                        💡 현재 내 위치를 기준으로 도시가 자동으로 지정됩니다.
                      </p>
                    </div>
                    <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                      <div className="flex items-center gap-2">
                        <MapIcon className="w-4 h-4" />
                        <span>매치 선택 시 지도에 위치 표시</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4" />
                        <span>지도 마커 클릭 시 매치 정보 표시</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ③ 매치 상세 정보 */}
              <div className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">③</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                      매치 상세 정보
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      매치를 클릭하면 참가자 정보, 일정, 위치 등 상세 정보를 확인할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* ④ 매치 참가 */}
              <div className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">④</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                      매치 참가
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      관심 있는 매치에 참가하여 함께 운동할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // 위치 등록
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                <MapPinIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                내 위치 등록
              </h2>
              <p className="text-base text-[var(--color-text-secondary)]">
                위치를 등록하면 가까운 매치를 쉽게 찾을 수 있어요
              </p>
            </div>

            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                    올코트플레이의 매치 목록 안내
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                    올코트플레이에서는 현재 위치 기준으로 <strong>1주일 이내</strong>의 지역 매치만 볼 수 있어요. 
                    위치를 등록하시면 더 정확한 매치 추천을 받으실 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {location ? (
              <div className="p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl max-w-2xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    위치가 등록되었습니다
                  </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">{location.address}</p>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl mx-auto">
                <button
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isGettingLocation ? '위치 가져오는 중...' : '현재 위치 가져오기'}
                </button>
                <p className="text-xs text-center text-[var(--color-text-secondary)]">
                  위치 정보는 매치 추천에만 사용됩니다 (선택사항)
                </p>
                <button
                  onClick={handleNext}
                  className="w-full px-6 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-xl font-medium hover:opacity-80 transition-opacity border border-[var(--color-border-card)]"
                >
                  건너뛰기
                </button>
              </div>
            )}
          </div>
        );

      case 3: // 좋아하는 종목 선택
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center mb-4 shadow-lg">
                <HeartIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                좋아하는 종목을 선택해주세요
              </h2>
              <p className="text-base text-[var(--color-text-secondary)]">
                여러 개 선택 가능해요 (선택사항)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-h-72 overflow-y-auto p-3 mb-6">
              {sortedSports.map((sport) => (
                <button
                  key={sport}
                  onClick={() => toggleSport(sport)}
                  className={`px-4 py-4 rounded-xl font-semibold text-sm transition-all ${
                    selectedSports.includes(sport)
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:opacity-80 hover:scale-105 border border-[var(--color-border-card)]'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>

            {selectedSports.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl max-w-2xl mx-auto border border-blue-200 dark:border-blue-800 mt-6">
                <p className="text-sm text-[var(--color-text-primary)] font-medium">
                  선택한 종목: {selectedSports.join(', ')}
                </p>
              </div>
            )}

            {/* 포지션 선택 (축구·풋살 선택 시) */}
            {selectedSports.some((s) => SPORTS_WITH_POSITIONS.includes(s)) && (
              <div className="mt-6 p-4 bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl max-w-2xl mx-auto">
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">포지션 (선택사항)</p>
                {selectedSports
                  .filter((s) => SPORTS_WITH_POSITIONS.includes(s))
                  .map((sport) => {
                    const positions = getPositionsBySport(sport);
                    const selected = sportPositions.find((p) => p.sport === sport)?.positions ?? [];
                    return (
                      <div key={sport} className="mb-4 last:mb-0">
                        <p className="text-xs text-[var(--color-text-secondary)] mb-2">{sport}</p>
                        <div className="flex flex-wrap gap-2">
                          {positions.map((pos) => (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => togglePosition(sport, pos)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                selected.includes(pos)
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:opacity-80'
                              }`}
                            >
                              {getPositionLabel(sport, pos)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );

      case 4: // 선수 출신 여부
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg">
                <TrophyIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                선수 출신이신가요?
              </h2>
              <p className="text-base text-[var(--color-text-secondary)]">
                선수 출신 여부에 따라 맞춤 매치를 추천해드려요
              </p>
            </div>

            <div className="space-y-3 max-w-2xl mx-auto">
              <button
                onClick={() => setIsAthlete(true)}
                className={`w-full px-6 py-5 rounded-xl font-semibold text-lg transition-all ${
                  isAthlete === true
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:opacity-80 border border-[var(--color-border-card)]'
                }`}
              >
                네, 선수 출신입니다
              </button>
              <button
                onClick={() => setIsAthlete(false)}
                className={`w-full px-6 py-5 rounded-xl font-semibold text-lg transition-all ${
                  isAthlete === false
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:opacity-80 border border-[var(--color-border-card)]'
                }`}
              >
                아니요, 일반인입니다
              </button>
            </div>

            {isAthlete && (
              <div className="p-5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <TrophyIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                      선수 출신이시군요! 🏆
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 leading-relaxed">
                      나중에 내 정보 페이지에서 수상이력이나 구력을 입력하실 수 있어요. 
                      이를 통해 더 나은 매치 매칭을 받으실 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5: // 프로필 사진 등록 안내
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                <UserCircleIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                프로필 사진 등록
              </h2>
              <p className="text-base text-[var(--color-text-secondary)]">
                프로필 사진을 등록하면 다른 사용자들에게 더 잘 보여요
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 max-w-2xl mx-auto shadow-lg">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-[var(--color-bg-primary)] flex items-center justify-center border-4 border-indigo-300 dark:border-indigo-700 flex-shrink-0">
                  <UserCircleIcon className="w-16 h-16 text-[var(--color-text-secondary)]" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xl text-[var(--color-text-primary)] mb-2">
                    프로필 사진이 없으신가요?
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    지금 등록하러 가시겠습니까?
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/my-info');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg"
                  >
                    내 정보로 이동
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl max-w-2xl mx-auto">
              <p className="text-xs text-blue-600 dark:text-blue-400 text-center leading-relaxed">
                나중에 내 정보 페이지에서 언제든지 등록할 수 있어요
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* 하이라이트 오버레이 */}
      {highlightTarget && (
        <>
          <div
            ref={overlayRef}
            className="fixed z-[9999] pointer-events-none"
          />
          <div
            ref={tooltipRef}
            className="fixed z-[10000] bg-[var(--color-bg-card)] rounded-xl shadow-2xl border-2 border-[var(--color-blue-primary)] p-5 max-w-sm pointer-events-auto"
            style={{ transform: 'translateX(-50%)' }}
          >
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
              {highlightTarget.title}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3">
              {highlightTarget.description}
            </p>
            <button
              onClick={() => setHighlightTarget(null)}
              className="w-full px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              확인
            </button>
          </div>
        </>
      )}

      {/* 메인 모달 */}
      <div className="fixed inset-0 bg-black/75 z-[9998] flex items-center justify-center p-4">
        <div className="bg-[var(--color-bg-card)] rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border-2 border-[var(--color-border-card)] flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b-2 border-[var(--color-border-card)] bg-[var(--color-bg-secondary)]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[var(--color-blue-primary)] animate-pulse" />
              <span className="text-base font-semibold text-[var(--color-text-secondary)]">
                {currentStep + 1} / {totalSteps}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-2 hover:bg-[var(--color-bg-primary)] rounded-lg"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* 내용 */}
          <div className="flex-1 p-10 overflow-y-auto">
            {renderStep()}
          </div>

          {/* 하단 버튼 */}
          <div className="flex items-center justify-between p-6 border-t-2 border-[var(--color-border-card)] bg-[var(--color-bg-secondary)]">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-6 py-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              이전
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-[var(--color-blue-primary)] w-8'
                      : index < currentStep
                      ? 'bg-green-500 w-2'
                      : 'bg-[var(--color-border-card)] w-2'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={isSaving}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {isSaving ? (
                '저장 중...'
              ) : currentStep === totalSteps - 1 ? (
                '완료'
              ) : (
                <>
                  다음
                  <ChevronRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 하이라이트 스타일 */}
      <style>{`
        .guide-highlight {
          position: relative;
          z-index: 10001 !important;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
};

export default WelcomeGuide;
