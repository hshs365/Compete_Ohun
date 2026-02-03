import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeftIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  PhoneIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import { showSuccess, showError } from '../utils/swal';
import { TEAM_PAGE_SPORTS } from '../constants/sports';
import { KOREAN_CITIES, getRegionDisplayName } from '../utils/locationUtils';

interface FollowerUser {
  id: number;
  nickname: string;
  tag?: string;
  profileImageUrl?: string;
}

const CreateTeamPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSportFromQuery = searchParams.get('sport') || '';

  const [teamName, setTeamName] = useState('');
  const [sport, setSport] = useState(initialSportFromQuery || TEAM_PAGE_SPORTS[0]);
  const [region, setRegion] = useState('');
  const [description, setDescription] = useState('');
  const [coach, setCoach] = useState('');
  const [assistantCoach, setAssistantCoach] = useState('');
  const [contact, setContact] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [invitees, setInvitees] = useState<FollowerUser[]>([]);
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<Set<number>>(new Set());
  const [followerSearch, setFollowerSearch] = useState('');
  const [followersLoading, setFollowersLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const regionOptions = KOREAN_CITIES.filter((c) => c !== '전체');

  useEffect(() => {
    if (initialSportFromQuery && TEAM_PAGE_SPORTS.includes(initialSportFromQuery)) {
      setSport(initialSportFromQuery);
    }
  }, [initialSportFromQuery]);

  useEffect(() => {
    const loadUsers = async () => {
      setFollowersLoading(true);
      try {
        if (followerSearch.trim()) {
          const data = await api.get<FollowerUser[]>(`/api/users/search?q=${encodeURIComponent(followerSearch.trim())}`);
          setInvitees(data || []);
        } else {
          const data = await api.get<FollowerUser[]>('/api/users/following');
          setInvitees(data || []);
        }
      } catch {
        setInvitees([]);
      } finally {
        setFollowersLoading(false);
      }
    };
    loadUsers();
  }, [followerSearch]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        showError('이미지 파일만 등록할 수 있습니다.', '파일 오류');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showError('로고는 2MB 이하로 등록해주세요.', '파일 크기 초과');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const toggleInvitee = (id: number) => {
    setSelectedInviteeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoFile) {
      await showError('팀 로고를 등록해주세요.', '입력 필요');
      return;
    }
    if (!teamName.trim()) {
      await showError('팀명을 입력해주세요.', '입력 필요');
      return;
    }
    if (!region) {
      await showError('팀 소재지를 선택해주세요.', '입력 필요');
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('teamName', teamName.trim());
      formData.append('sport', sport);
      formData.append('region', region);
      if (description.trim()) formData.append('description', description.trim());
      if (coach.trim()) formData.append('coach', coach.trim());
      if (assistantCoach.trim()) formData.append('assistantCoach', assistantCoach.trim());
      if (contact.trim()) formData.append('contact', contact.trim());
      formData.append('logo', logoFile);
      if (selectedInviteeIds.size > 0) {
        formData.append('inviteeIds', JSON.stringify([...selectedInviteeIds]));
      }

      const team = await api.post<{ id: number }>('/api/teams', formData);
      await showSuccess('팀이 생성되었습니다.', '팀 생성 완료');
      navigate(team?.id ? `/teams/${team.id}` : '/teams');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '팀 생성에 실패했습니다.';
      await showError(message, '팀 생성 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full min-h-0">
      {/* 히어로: 무게감 있는 헤더 */}
      <header className="flex-shrink-0 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <Link
            to="/teams"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            팀 목록으로
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            팀 만들기
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            팀 정보를 입력하고 함께할 멤버를 초대하세요. 생성하시는 분이 팀장이 됩니다.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 pb-24">
          {/* 섹션 1: 기본 정보 */}
          <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-[var(--color-blue-primary)]" />
              기본 정보
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              팀을 대표하는 이름과 로고, 종목·소재지를 입력하세요.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  팀 로고 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-[var(--color-border-card)] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[var(--color-blue-primary)] transition-colors shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="로고 미리보기" className="w-full h-full object-contain" />
                    ) : (
                      <UserGroupIcon className="w-12 h-12 text-[var(--color-text-secondary)]" />
                    )}
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleLogoChange} />
                  </label>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    <p>클릭하여 로고 등록</p>
                    <p className="mt-1">JPG, PNG, GIF, WEBP (최대 2MB)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  팀명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="팀 이름을 입력하세요"
                  maxLength={50}
                  className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    종목 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  >
                    {TEAM_PAGE_SPORTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    팀 소재지 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  >
                    <option value="">지역 선택</option>
                    {regionOptions.map((c) => (
                      <option key={c} value={c}>{getRegionDisplayName(c)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)]">
                <ShieldCheckIcon className="w-5 h-5 shrink-0" />
                <span>생성하시는 분이 팀장이 됩니다.</span>
              </div>
            </div>
          </section>

          {/* 섹션 2: 팀 구성 */}
          <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-[var(--color-blue-primary)]" />
              팀 구성
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              감독, 코치, 연락처를 입력하면 팀원들이 연락하기 편합니다.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">감독</label>
                <input
                  type="text"
                  value={coach}
                  onChange={(e) => setCoach(e.target.value)}
                  placeholder="감독 이름 (선택)"
                  maxLength={50}
                  className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">코치</label>
                <input
                  type="text"
                  value={assistantCoach}
                  onChange={(e) => setAssistantCoach(e.target.value)}
                  placeholder="코치 이름 (선택)"
                  maxLength={50}
                  className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2 flex items-center gap-1.5">
                  <PhoneIcon className="w-4 h-4" />
                  연락처
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="팀 대표 연락처 (선택)"
                  maxLength={50}
                  className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                />
              </div>
            </div>
          </section>

          {/* 섹션 3: 팀 소개 */}
          <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-[var(--color-blue-primary)]" />
              팀 소개
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              팀의 성격, 목표, 활동 방식을 간단히 소개해주세요.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="팀 소개를 입력하세요 (선택)"
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] resize-none"
            />
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{description.length}/500</p>
          </section>

          {/* 섹션 4: 팀원 초대 */}
          <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
              <UserPlusIcon className="w-5 h-5 text-[var(--color-blue-primary)]" />
              팀원 초대
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              팔로우 중인 유저를 검색해 팀 생성과 함께 초대할 수 있습니다.
            </p>

            <div className="space-y-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
                <input
                  type="text"
                  value={followerSearch}
                  onChange={(e) => setFollowerSearch(e.target.value)}
                  placeholder="닉네임, 태그로 검색..."
                  className="w-full py-3 pl-10 pr-4 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                />
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--color-border-card)] divide-y divide-[var(--color-border-card)]">
                {followersLoading ? (
                  <div className="p-4 text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
                ) : invitees.length === 0 ? (
                  <div className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {followerSearch.trim() ? '검색 결과가 없습니다.' : '팔로잉한 유저가 없습니다.'}
                  </div>
                ) : (
                  invitees.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedInviteeIds.has(u.id)}
                        onChange={() => toggleInvitee(u.id)}
                        className="rounded border-[var(--color-border-card)]"
                      />
                      <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden shrink-0">
                        {u.profileImageUrl ? (
                          <img src={u.profileImageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserGroupIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                        )}
                      </div>
                      <span className="text-sm text-[var(--color-text-primary)]">
                        {u.nickname}
                        {u.tag && <span className="text-[var(--color-text-secondary)] ml-1">{u.tag}</span>}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {selectedInviteeIds.size > 0 && (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {selectedInviteeIds.size}명 초대 예정
                </p>
              )}
            </div>
          </section>

          {/* 하단 액션 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              to="/teams"
              className="flex-1 py-4 rounded-xl font-semibold text-center text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border-card)] transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-[2] py-4 rounded-xl font-semibold text-white bg-[var(--color-blue-primary)] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity shadow-lg"
            >
              {isSubmitting ? '생성 중...' : '팀 만들기'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateTeamPage;
