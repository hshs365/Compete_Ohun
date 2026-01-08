/**
 * 알림을 표시하는 유틸리티 함수
 * 
 * 사용 예시:
 * import { showNotification } from '../utils/notification';
 * 
 * // 기본 알림 (5초 후 자동 닫기)
 * showNotification('모임이 성공적으로 생성되었습니다!', 'success');
 * 
 * // 수동으로만 닫기
 * showNotification('중요한 알림입니다.', 'warning', 0);
 * 
 * // 10초 후 자동 닫기
 * showNotification('10초 후 자동으로 닫힙니다.', 'info', 10000);
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationOptions {
  type?: NotificationType;
  duration?: number; // 자동 닫기 시간 (ms), 0이면 수동으로만 닫기, 기본값: 5000
}

/**
 * 알림을 표시합니다.
 * @param message 알림 메시지
 * @param type 알림 타입 (기본값: 'info')
 * @param duration 자동 닫기 시간 (ms), 0이면 수동으로만 닫기 (기본값: 5000)
 */
export const showNotification = (
  message: string,
  type: NotificationType = 'info',
  duration: number = 5000
): void => {
  const event = new CustomEvent('addNotification', {
    detail: {
      message,
      type,
      duration,
    },
  });
  window.dispatchEvent(event);
};

/**
 * 정보 알림을 표시합니다.
 */
export const showInfo = (message: string, duration: number = 5000): void => {
  showNotification(message, 'info', duration);
};

/**
 * 성공 알림을 표시합니다.
 */
export const showSuccess = (message: string, duration: number = 5000): void => {
  showNotification(message, 'success', duration);
};

/**
 * 경고 알림을 표시합니다.
 */
export const showWarning = (message: string, duration: number = 5000): void => {
  showNotification(message, 'warning', duration);
};

/**
 * 오류 알림을 표시합니다.
 */
export const showError = (message: string, duration: number = 5000): void => {
  showNotification(message, 'error', duration);
};

