import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserGroupIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';
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

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialSport?: string;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialSport = '',
}) => {
  const [teamName, setTeamName] = useState('');
  const [sport, setSport] = useState(initialSport || TEAM_PAGE_SPORTS[0]);
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

  // 팔로잉 + 검색 결과 로드
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, followerSearch]);

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
      if (logoFile) formData.append('logo', logoFile);
      if (selectedInviteeIds.size > 0) {
        formData.append('inviteeIds', JSON.stringify([...selectedInviteeIds]));
      }

      await api.post('/api/teams', formData);
      await showSuccess('팀이 생성되었습니다.', '팀 생성 완료');
      setTeamName('');
      setDescription('');
      setCoach('');
      setAssistantCoach('');
      setContact('');
      setLogoFile(null);
      setLogoPreview(null);
      setSelectedInviteeIds(new Set());
      onSuccess?.();
      onClose();
    } catch (err: any) {
      await showError(err?.message || '팀 생성에 실패했습니다.', '팀 생성 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} aria-hidden />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border-card)] shadow-xl"
        role="dialog"
        aria-labelledby="create-team-title"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-card)] bg-[var(--color-bg-primary)]">
          <h2 id="create-team-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
            팀 생성
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 팀 로고 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">팀 로고</label>
            <div className="flex items-center gap-4">
              <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-[var(--color-border-card)] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[var(--color-blue-primary)] transition-colors shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="로고 미리보기" className="w-full h-full object-contain" />
                ) : (
                  <UserGroupIcon className="w-10 h-10 text-[var(--color-text-secondary)]" />
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
              className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              종목 <span className="text-red-500">*</span>
            </label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
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
              className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            >
              <option value="">지역 선택</option>
              {regionOptions.map((c) => (
                <option key={c} value={c}>{getRegionDisplayName(c)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)]">
            <UserGroupIcon className="w-5 h-5 shrink-0" />
            <span>생성자가 팀장이 됩니다.</span>
          </div>

          {/* 팔로워에서 찾아오기 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <UserPlusIcon className="w-4 h-4 inline mr-1" />
              팀원 초대 (팔로워에서 찾기)
            </label>
            <div className="relative mb-2">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
              <input
                type="text"
                value={followerSearch}
                onChange={(e) => setFollowerSearch(e.target.value)}
                placeholder="닉네임, 태그로 검색..."
                className="w-full py-2 pl-9 pr-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              />
            </div>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-[var(--color-border-card)] divide-y divide-[var(--color-border-card)]">
              {followersLoading ? (
                <div className="p-3 text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
              ) : invitees.length === 0 ? (
                <div className="p-3 text-sm text-[var(--color-text-secondary)]">
                  {followerSearch.trim() ? '검색 결과가 없습니다.' : '팔로잉한 유저가 없습니다.'}
                </div>
              ) : (
                invitees.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-[var(--color-bg-secondary)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInviteeIds.has(u.id)}
                      onChange={() => toggleInvitee(u.id)}
                      className="rounded"
                    />
                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden shrink-0">
                      {u.profileImageUrl ? (
                        <img src={u.profileImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserGroupIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                      )}
                    </div>
                    <span className="text-sm text-[var(--color-text-primary)]">
                      {u.nickname}
                      {u.tag && <span className="text-[var(--color-text-secondary)]">{u.tag}</span>}
                    </span>
                  </label>
                ))
              )}
            </div>
            {selectedInviteeIds.size > 0 && (
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {selectedInviteeIds.size}명 초대 예정
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">감독</label>
            <input
              type="text"
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
              placeholder="감독 이름 (선택)"
              maxLength={50}
              className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
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
              className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">연락처</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="팀 대표 연락처 (선택)"
              maxLength={50}
              className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">팀 소개</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="팀 소개를 입력하세요 (선택)"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 rounded-lg font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-card)] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-lg font-medium text-white bg-[var(--color-blue-primary)] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {isSubmitting ? '생성 중...' : '팀 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;
