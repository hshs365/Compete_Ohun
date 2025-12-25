import React, { useState } from 'react';
import ToggleSwitch from './ToggleSwitch';
import { useTheme } from '../App';
import {
  BellIcon,
  ChatBubbleLeftEllipsisIcon,
  MapPinIcon,
  SignalIcon,
  ShieldCheckIcon,
  EyeIcon,
  LockClosedIcon,
  MusicalNoteIcon,
  CameraIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

interface SettingItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  isOn: boolean;
  onToggle: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon: Icon, label, description, isOn, onToggle }) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-card)] last:border-b-0">
      <div className="flex items-center space-x-3 flex-1">
        <div className="p-2 bg-[var(--color-bg-secondary)] rounded-lg">
          <Icon className="w-5 h-5 text-[var(--color-text-primary)]" />
        </div>
        <div className="flex-1">
          <div className="text-[var(--color-text-primary)] font-medium">{label}</div>
          {description && (
            <div className="text-sm text-[var(--color-text-secondary)] mt-0.5">{description}</div>
          )}
        </div>
      </div>
      <ToggleSwitch isOn={isOn} handleToggle={onToggle} label="" />
    </div>
  );
};

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  
  // 알림 및 통신 설정
  const [pushNotifications, setPushNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  
  // 위치 및 프라이버시 설정
  const [locationSharing, setLocationSharing] = useState(true);
  const [locationTracking, setLocationTracking] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  
  // 보안 설정
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(false);
  
  // 기타 설정
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraAccess, setCameraAccess] = useState(true);

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto w-full space-y-6 pb-12">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">앱 설정</h1>

      {/* 화면 표시 설정 */}
      <div className="bg-[var(--color-bg-card)] rounded-xl shadow-md p-4 md:p-6 border border-[var(--color-border-card)]">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">화면 표시</h2>
        <div className="space-y-0">
          <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-card)] last:border-b-0">
            <div className="flex items-center space-x-3 flex-1">
              <div className="p-2 bg-[var(--color-bg-secondary)] rounded-lg">
                {theme === 'dark' ? (
                  <MoonIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
                ) : (
                  <SunIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-[var(--color-text-primary)] font-medium">다크 모드</div>
                <div className="text-sm text-[var(--color-text-secondary)] mt-0.5">어두운 테마로 화면 표시</div>
              </div>
            </div>
            <ToggleSwitch isOn={theme === 'dark'} handleToggle={handleThemeToggle} label="" />
          </div>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="bg-[var(--color-bg-card)] rounded-xl shadow-md p-4 md:p-6 border border-[var(--color-border-card)]">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">알림 설정</h2>
        <div className="space-y-0">
          <SettingItem
            icon={BellIcon}
            label="푸시 알림"
            description="앱에서 발생하는 알림 받기"
            isOn={pushNotifications}
            onToggle={() => setPushNotifications(!pushNotifications)}
          />
          <SettingItem
            icon={ChatBubbleLeftEllipsisIcon}
            label="채팅 알림"
            description="새로운 메시지 알림 받기"
            isOn={chatNotifications}
            onToggle={() => setChatNotifications(!chatNotifications)}
          />
          <SettingItem
            icon={BellIcon}
            label="이메일 알림"
            description="이메일로 알림 받기"
            isOn={emailNotifications}
            onToggle={() => setEmailNotifications(!emailNotifications)}
          />
          <SettingItem
            icon={MusicalNoteIcon}
            label="알림 소리"
            description="알림 시 소리 재생"
            isOn={soundEnabled}
            onToggle={() => setSoundEnabled(!soundEnabled)}
          />
        </div>
      </div>

      {/* 통신 및 채팅 설정 */}
      <div className="bg-[var(--color-bg-card)] rounded-xl shadow-md p-4 md:p-6 border border-[var(--color-border-card)]">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">통신 및 채팅</h2>
        <div className="space-y-0">
          <SettingItem
            icon={ChatBubbleLeftEllipsisIcon}
            label="채팅 기능"
            description="채팅 서비스 이용"
            isOn={chatEnabled}
            onToggle={() => setChatEnabled(!chatEnabled)}
          />
          <SettingItem
            icon={SignalIcon}
            label="온라인 상태 표시"
            description="다른 사용자에게 접속 상태 공개"
            isOn={showOnlineStatus}
            onToggle={() => setShowOnlineStatus(!showOnlineStatus)}
          />
        </div>
      </div>

      {/* 위치 정보 설정 */}
      <div className="bg-[var(--color-bg-card)] rounded-xl shadow-md p-4 md:p-6 border border-[var(--color-border-card)]">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">위치 정보</h2>
        <div className="space-y-0">
          <SettingItem
            icon={MapPinIcon}
            label="위치 정보 동의"
            description="위치 기반 서비스 이용"
            isOn={locationSharing}
            onToggle={() => setLocationSharing(!locationSharing)}
          />
          <SettingItem
            icon={MapPinIcon}
            label="위치 추적"
            description="실시간 위치 추적 허용"
            isOn={locationTracking}
            onToggle={() => setLocationTracking(!locationTracking)}
          />
        </div>
      </div>

      {/* 프라이버시 설정 */}
      <div className="bg-[var(--color-bg-card)] rounded-xl shadow-md p-4 md:p-6 border border-[var(--color-border-card)]">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">프라이버시</h2>
        <div className="space-y-0">
          <SettingItem
            icon={EyeIcon}
            label="프로필 공개"
            description="다른 사용자에게 프로필 보이기"
            isOn={profileVisibility}
            onToggle={() => setProfileVisibility(!profileVisibility)}
          />
        </div>
      </div>

      {/* 보안 설정 */}
      <div className="bg-[var(--color-bg-card)] rounded-xl shadow-md p-4 md:p-6 border border-[var(--color-border-card)]">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">보안</h2>
        <div className="space-y-0">
          <SettingItem
            icon={ShieldCheckIcon}
            label="2단계 인증"
            description="추가 보안 계층 활성화"
            isOn={twoFactorAuth}
            onToggle={() => setTwoFactorAuth(!twoFactorAuth)}
          />
          <SettingItem
            icon={LockClosedIcon}
            label="생체 인증"
            description="지문 또는 Face ID 사용"
            isOn={biometricAuth}
            onToggle={() => setBiometricAuth(!biometricAuth)}
          />
        </div>
      </div>

      {/* 권한 설정 */}
      <div className="bg-[var(--color-bg-card)] rounded-xl shadow-md p-4 md:p-6 border border-[var(--color-border-card)]">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">권한</h2>
        <div className="space-y-0">
          <SettingItem
            icon={CameraIcon}
            label="카메라 접근"
            description="사진 및 비디오 촬영 권한"
            isOn={cameraAccess}
            onToggle={() => setCameraAccess(!cameraAccess)}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
