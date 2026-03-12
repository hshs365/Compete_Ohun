/**
 * API/HTTP 에러 코드를 사용자에게 보여줄 친화적 메시지로 변환합니다.
 * 502, Bad Gateway, 네트워크 오류 등이 그대로 노출되지 않도록 합니다.
 */

const FRIENDLY_MESSAGES: Record<number, string> = {
  400: '요청 내용을 확인해 주세요. 입력한 정보가 올바른지 검토 후 다시 시도해 주세요.',
  401: '로그인이 필요합니다. 로그인 후 다시 이용해 주세요.',
  403: '이 작업을 수행할 권한이 없습니다.',
  404: '요청한 내용을 찾을 수 없습니다. 주소를 확인하거나 새로고침 후 다시 시도해 주세요.',
  408: '요청 시간이 초과되었습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
  409: '요청 내용이 현재 상태와 충돌합니다. 새로고침 후 다시 시도해 주세요.',
  413: '전송한 파일이 너무 큽니다. 용량을 줄인 후 다시 시도해 주세요.',
  422: '입력한 내용을 처리할 수 없습니다. 입력 값을 확인해 주세요.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  500: '서버에서 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  502: '서버에 일시적으로 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  503: '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  504: '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.',
};

/** 네트워크 에러(연결 실패, CORS 등) 시 사용할 메시지 */
export const NETWORK_ERROR_MESSAGE =
  '서버에 연결할 수 없습니다. 인터넷 연결을 확인한 뒤 잠시 후 다시 시도해 주세요.';

/**
 * HTTP 상태 코드에 맞는 친화적 메시지를 반환합니다.
 * 서버에서 내려준 message가 이미 사용자용 문구라면 우선 사용하고,
 * 그렇지 않으면 코드별 기본 메시지를 반환합니다.
 */
export function getFriendlyApiMessage(
  status: number,
  serverMessage?: string | null
): string {
  // 서버 메시지가 에러 코드/영문 기술 메시지처럼 보이면 무시하고 친화적 메시지 사용
  const isTechnical = !serverMessage || isTechnicalErrorMessage(serverMessage);
  if (!isTechnical && serverMessage.trim().length > 0) {
    return serverMessage.trim();
  }
  return FRIENDLY_MESSAGES[status] ?? '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

/** 기술적인 에러 문구(코드, 영문 등)인지 판별 */
function isTechnicalErrorMessage(msg: string): boolean {
  const t = msg.trim();
  if (t.length > 80) return false; // 긴 문구는 서버가 보낸 설명일 수 있음
  // 숫자만 있거나, HTTP/영문 키워드 포함 시 기술 메시지로 간주
  if (/^\d{3}$/.test(t)) return true;
  if (/bad\s+request|gateway|timeout|internal\s+server|unauthorized|forbidden|not\s+found/i.test(t)) return true;
  if (/^HTTP\s+\d{3}/i.test(t)) return true;
  if (/^[\d\s\-:]+$/.test(t)) return true;
  return false;
}

/** 에러 페이지 제목용 짧은 라벨 (예: "연결 불가") */
export function getErrorPageTitle(status: number): string {
  const titles: Record<number, string> = {
    400: '잘못된 요청',
    401: '로그인 필요',
    403: '접근 권한 없음',
    404: '페이지를 찾을 수 없음',
    408: '요청 시간 초과',
    500: '서버 오류',
    502: '서버 연결 불가',
    503: '서비스 일시 중단',
    504: '응답 대기 시간 초과',
  };
  return titles[status] ?? '일시적인 오류';
}
