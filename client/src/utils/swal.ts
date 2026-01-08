import Swal from 'sweetalert2';

// 기본 SweetAlert 설정
const defaultConfig = {
  confirmButtonColor: '#3b82f6', // blue-500
  cancelButtonColor: '#6b7280', // gray-500
  confirmButtonText: '확인',
  cancelButtonText: '취소',
};

// 성공 알림
export const showSuccess = (message: string, title: string = '성공') => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'success',
    title,
    text: message,
  });
};

// 에러 알림
export const showError = (message: string, title: string = '오류') => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'error',
    title,
    text: message,
  });
};

// 정보 알림
export const showInfo = (message: string, title: string = '알림') => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'info',
    title,
    text: message,
  });
};

// 경고 알림
export const showWarning = (message: string, title: string = '경고') => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'warning',
    title,
    text: message,
  });
};

// 확인 다이얼로그 (confirm 대체)
export const showConfirm = (
  message: string,
  title: string = '확인',
  confirmText: string = '확인',
  cancelText: string = '취소',
): Promise<boolean> => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  }).then((result) => {
    return result.isConfirmed;
  });
};

// 기본 알림 (alert 대체)
export const showAlert = (message: string, title: string = '알림') => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'info',
    title,
    text: message,
  });
};
