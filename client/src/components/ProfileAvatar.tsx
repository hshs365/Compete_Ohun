import React, { useState } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '../utils/api';

interface ProfileAvatarProps {
  /** 프로필 이미지 URL (null/undefined면 기본 아이콘) */
  profileImageUrl?: string | null;
  alt?: string;
  className?: string;
  /** 이미지 래퍼 div에 줄 추가 클래스 (원형 컨테이너 등) */
  containerClassName?: string;
  /** 기본 아이콘 크기 (tailwind 클래스, 예: w-12 h-12) */
  iconClassName?: string;
}

/**
 * 프로필 이미지를 표시한다. URL이 없거나 로드 실패(깨진 이미지) 시 기본 아이콘을 보여준다.
 * 탈퇴 후 재가입 등으로 인해 서버에 없는 경로가 올 때 깨진 이미지 대신 기본 아이콘이 나오도록 한다.
 */
const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  profileImageUrl,
  alt = '프로필',
  className = 'w-full h-full object-cover',
  containerClassName = '',
  iconClassName = 'w-12 h-12 text-[var(--color-text-secondary)]',
}) => {
  const [imageError, setImageError] = useState(false);
  const resolvedUrl = profileImageUrl ? getImageUrl(profileImageUrl) : '';
  const showImage = resolvedUrl && !imageError;
  // URL이 바뀌면 이전 로드 실패 상태 초기화 (업로드 직후 등)
  const urlKey = profileImageUrl ?? '';

  return (
    <>
      {showImage ? (
        <img
          key={urlKey}
          src={resolvedUrl}
          alt={alt}
          className={className}
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={`flex items-center justify-center ${containerClassName}`}>
          <UserCircleIcon className={iconClassName} aria-hidden />
        </span>
      )}
    </>
  );
};

export default ProfileAvatar;
