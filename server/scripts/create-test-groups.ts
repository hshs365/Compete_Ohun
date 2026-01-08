import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// 테스트 사용자 정보 (기존 사용자 또는 새로 생성)
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test1234!',
};

// 지역별 좌표
const LOCATIONS = {
  서울: {
    coordinates: [
      { name: '서울 강남구 테헤란로 152', lat: 37.5010, lng: 127.0394 }, // 강남역
      { name: '서울 종로구 세종대로 209', lat: 37.5665, lng: 126.9780 }, // 서울 시청
      { name: '서울 마포구 월드컵북로 396', lat: 37.5563, lng: 126.7958 }, // 상암동
      { name: '서울 송파구 올림픽로 300', lat: 37.5219, lng: 127.1265 }, // 잠실
      { name: '서울 강동구 천호대로 1007', lat: 37.5384, lng: 127.1238 }, // 천호동
      { name: '서울 서초구 서초대로 396', lat: 37.4837, lng: 127.0324 }, // 서초동
      { name: '서울 용산구 한강대로 405', lat: 37.5326, lng: 126.9903 }, // 용산
      { name: '서울 영등포구 여의대로 108', lat: 37.5264, lng: 126.9249 }, // 여의도
    ],
  },
  대전: {
    coordinates: [
      { name: '대전 서구 대덕대로112번길 10', lat: 36.3431, lng: 127.3750 }, // 둔원초등학교
      { name: '대전 유성구 대학로 291', lat: 36.3733, lng: 127.3600 }, // KAIST
      { name: '대전 중구 중앙로 101', lat: 36.3250, lng: 127.4186 }, // 중구청
      { name: '대전 동구 동서대로 1684', lat: 36.3511, lng: 127.3847 }, // 동구청
      { name: '대전 대덕구 한밭대로 1234', lat: 36.3520, lng: 127.4290 }, // 대덕구청
      { name: '대전 유성구 엑스포로 1', lat: 36.3745, lng: 127.3845 }, // 엑스포과학공원
      { name: '대전 서구 계룡로 635', lat: 36.3350, lng: 127.3900 }, // 서구청
      { name: '대전 중구 선화로 21', lat: 36.3280, lng: 127.4200 }, // 중앙시장
    ],
  },
  부산: {
    coordinates: [
      { name: '부산 해운대구 해운대해변로 264', lat: 35.1631, lng: 129.1636 }, // 해운대
      { name: '부산 중구 중앙대로 26', lat: 35.1028, lng: 129.0333 }, // 중앙동
      { name: '부산 사하구 낙동남로 1240', lat: 35.1047, lng: 128.9660 }, // 사하구청
      { name: '부산 금정구 중앙대로 1777', lat: 35.2431, lng: 129.0922 }, // 금정구청
      { name: '부산 연제구 중앙대로 1001', lat: 35.1764, lng: 129.0800 }, // 연제구청
      { name: '부산 수영구 광안해변로 219', lat: 35.1530, lng: 129.1186 }, // 광안리
      { name: '부산 북구 금곡대로 123', lat: 35.1975, lng: 129.0100 }, // 북구청
      { name: '부산 강서구 가락대로 1393', lat: 35.2125, lng: 128.9800 }, // 강서구청
    ],
  },
};

// 운동 종목별 데이터
const SPORTS = {
  배드민턴: {
    descriptions: [
      '매주 주말 배드민턴 모임입니다. 초보자도 환영합니다!',
      '실력 향상을 위한 배드민턴 모임입니다.',
      '건강한 운동을 함께할 분들을 모집합니다.',
      '배드민턴으로 즐겁게 운동해요!',
      '주 2회 정기 배드민턴 모임입니다.',
      '배드민턴 동호회 모집 중입니다.',
      '초보자부터 고수까지 함께하는 배드민턴 모임',
      '배드민턴으로 스트레스 해소하세요!',
    ],
    equipment: ['라켓', '셔틀콕', '운동화', '수건', '물'],
    meetingTimes: [
      '매주 토요일 10:00',
      '매주 일요일 14:00',
      '매주 수요일 19:00',
      '매주 금요일 20:00',
      '매주 화요일, 목요일 19:00',
      '매주 주말 09:00',
      '매주 월요일, 수요일 18:00',
      '매주 토요일 15:00',
    ],
  },
  축구: {
    descriptions: [
      '주말 축구 모임입니다. 함께 뛰어요!',
      '축구로 건강을 챙기는 모임입니다.',
      '축구 동호회 모집 중입니다.',
      '초보자도 환영하는 축구 모임',
      '정기 축구 모임입니다.',
      '축구로 친목을 다지는 모임',
      '주 1회 축구 모임입니다.',
      '축구로 스트레스를 날려버리세요!',
    ],
    equipment: ['축구화', '운동복', '물', '수건'],
    meetingTimes: [
      '매주 토요일 09:00',
      '매주 일요일 10:00',
      '매주 수요일 19:00',
      '매주 금요일 20:00',
      '매주 주말 08:00',
      '매주 토요일 14:00',
      '매주 일요일 15:00',
      '매주 화요일 18:00',
    ],
  },
  농구: {
    descriptions: [
      '농구 동호회 모집 중입니다.',
      '주말 농구 모임입니다.',
      '농구로 건강을 챙기는 모임',
      '초보자도 환영하는 농구 모임',
      '정기 농구 모임입니다.',
      '농구로 친목을 다지는 모임',
      '주 2회 농구 모임입니다.',
      '농구로 스트레스를 날려버리세요!',
    ],
    equipment: ['농구화', '운동복', '물', '수건'],
    meetingTimes: [
      '매주 토요일 10:00',
      '매주 일요일 11:00',
      '매주 수요일 19:00',
      '매주 금요일 20:00',
      '매주 화요일, 목요일 19:00',
      '매주 주말 09:00',
      '매주 월요일, 수요일 18:00',
      '매주 토요일 15:00',
    ],
  },
  테니스: {
    descriptions: [
      '테니스 동호회 모집 중입니다.',
      '주말 테니스 모임입니다.',
      '테니스로 건강을 챙기는 모임',
      '초보자도 환영하는 테니스 모임',
      '정기 테니스 모임입니다.',
      '테니스로 친목을 다지는 모임',
      '주 2회 테니스 모임입니다.',
      '테니스로 스트레스를 날려버리세요!',
    ],
    equipment: ['라켓', '테니스공', '운동화', '수건', '물'],
    meetingTimes: [
      '매주 토요일 09:00',
      '매주 일요일 10:00',
      '매주 수요일 19:00',
      '매주 금요일 20:00',
      '매주 화요일, 목요일 19:00',
      '매주 주말 08:00',
      '매주 월요일, 수요일 18:00',
      '매주 토요일 14:00',
    ],
  },
  등산: {
    descriptions: [
      '등산 동호회 모집 중입니다.',
      '주말 등산 모임입니다.',
      '등산으로 건강을 챙기는 모임',
      '초보자도 환영하는 등산 모임',
      '정기 등산 모임입니다.',
      '등산으로 친목을 다지는 모임',
      '주 1회 등산 모임입니다.',
      '등산으로 자연을 만나요!',
    ],
    equipment: ['등산화', '등산복', '배낭', '물', '간식'],
    meetingTimes: [
      '매주 토요일 07:00',
      '매주 일요일 08:00',
      '매주 토요일 06:00',
      '매주 일요일 07:00',
      '매주 주말 06:00',
      '매주 토요일 08:00',
      '매주 일요일 09:00',
      '매주 토요일 05:00',
    ],
  },
  야구: {
    descriptions: [
      '야구 동호회 모집 중입니다.',
      '주말 야구 모임입니다.',
      '야구로 건강을 챙기는 모임',
      '초보자도 환영하는 야구 모임',
      '정기 야구 모임입니다.',
      '야구로 친목을 다지는 모임',
      '주 1회 야구 모임입니다.',
      '야구로 스트레스를 날려버리세요!',
    ],
    equipment: ['야구화', '야구복', '글러브', '물', '수건'],
    meetingTimes: [
      '매주 토요일 10:00',
      '매주 일요일 11:00',
      '매주 수요일 19:00',
      '매주 금요일 20:00',
      '매주 주말 09:00',
      '매주 토요일 14:00',
      '매주 일요일 15:00',
      '매주 화요일 18:00',
    ],
  },
  배구: {
    descriptions: [
      '배구 동호회 모집 중입니다.',
      '주말 배구 모임입니다.',
      '배구로 건강을 챙기는 모임',
      '초보자도 환영하는 배구 모임',
      '정기 배구 모임입니다.',
      '배구로 친목을 다지는 모임',
      '주 2회 배구 모임입니다.',
      '배구로 스트레스를 날려버리세요!',
    ],
    equipment: ['운동화', '운동복', '물', '수건'],
    meetingTimes: [
      '매주 토요일 10:00',
      '매주 일요일 11:00',
      '매주 수요일 19:00',
      '매주 금요일 20:00',
      '매주 화요일, 목요일 19:00',
      '매주 주말 09:00',
      '매주 월요일, 수요일 18:00',
      '매주 토요일 15:00',
    ],
  },
  탁구: {
    descriptions: [
      '탁구 동호회 모집 중입니다.',
      '주말 탁구 모임입니다.',
      '탁구로 건강을 챙기는 모임',
      '초보자도 환영하는 탁구 모임',
      '정기 탁구 모임입니다.',
      '탁구로 친목을 다지는 모임',
      '주 2회 탁구 모임입니다.',
      '탁구로 스트레스를 날려버리세요!',
    ],
    equipment: ['라켓', '탁구공', '운동화', '수건', '물'],
    meetingTimes: [
      '매주 토요일 10:00',
      '매주 일요일 11:00',
      '매주 수요일 19:00',
      '매주 금요일 20:00',
      '매주 화요일, 목요일 19:00',
      '매주 주말 09:00',
      '매주 월요일, 수요일 18:00',
      '매주 토요일 15:00',
    ],
  },
  골프: {
    descriptions: [
      '골프 동호회 모집 중입니다.',
      '주말 골프 모임입니다.',
      '골프로 건강을 챙기는 모임',
      '초보자도 환영하는 골프 모임',
      '정기 골프 모임입니다.',
      '골프로 친목을 다지는 모임',
      '주 1회 골프 모임입니다.',
      '골프로 스트레스를 날려버리세요!',
    ],
    equipment: ['골프채', '골프공', '골프화', '골프백'],
    meetingTimes: [
      '매주 토요일 07:00',
      '매주 일요일 08:00',
      '매주 토요일 06:00',
      '매주 일요일 07:00',
      '매주 주말 06:00',
      '매주 토요일 08:00',
      '매주 일요일 09:00',
      '매주 토요일 05:00',
    ],
  },
  클라이밍: {
    descriptions: [
      '클라이밍 동호회 모집 중입니다.',
      '주말 클라이밍 모임입니다.',
      '클라이밍으로 건강을 챙기는 모임',
      '초보자도 환영하는 클라이밍 모임',
      '정기 클라이밍 모임입니다.',
      '클라이밍으로 친목을 다지는 모임',
      '주 2회 클라이밍 모임입니다.',
      '클라이밍으로 스트레스를 날려버리세요!',
    ],
    equipment: ['클라이밍화', '초크백', '물', '수건'],
    meetingTimes: [
      '매주 토요일 10:00',
      '매주 일요일 11:00',
      '매주 수요일 19:00',
      '매주 금요일 20:00',
      '매주 화요일, 목요일 19:00',
      '매주 주말 09:00',
      '매주 월요일, 수요일 18:00',
      '매주 토요일 15:00',
    ],
  },
  러닝: {
    descriptions: [
      '러닝 동호회 모집 중입니다.',
      '주말 러닝 모임입니다.',
      '러닝으로 건강을 챙기는 모임',
      '초보자도 환영하는 러닝 모임',
      '정기 러닝 모임입니다.',
      '러닝으로 친목을 다지는 모임',
      '주 3회 러닝 모임입니다.',
      '러닝으로 스트레스를 날려버리세요!',
    ],
    equipment: ['러닝화', '운동복', '물', '수건'],
    meetingTimes: [
      '매주 월요일, 수요일, 금요일 06:00',
      '매주 화요일, 목요일 19:00',
      '매주 토요일 07:00',
      '매주 일요일 08:00',
      '매주 평일 06:00',
      '매주 주말 07:00',
      '매주 월요일, 수요일 18:00',
      '매주 화요일, 목요일 06:00',
    ],
  },
};

// 로그인하여 토큰 가져오기
async function login(): Promise<string> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    return response.data.token;
  } catch (error: any) {
    // 로그인 실패 시 회원가입 시도
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.log('테스트 사용자가 없습니다. 회원가입을 시도합니다...');
      try {
        await axios.post(`${API_BASE_URL}/api/auth/register`, {
          email: TEST_USER.email,
          password: TEST_USER.password,
          nickname: '테스트사용자',
          gender: 'MALE',
          residenceSido: '서울특별시',
          residenceSigungu: '강남구',
          termsServiceAgreed: true,
          termsPrivacyAgreed: true,
        });
        console.log('테스트 사용자 회원가입 완료. 로그인을 시도합니다...');
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: TEST_USER.email,
          password: TEST_USER.password,
        });
        return response.data.token;
      } catch (registerError: any) {
        console.error('회원가입 실패:', registerError.response?.data || registerError.message);
        throw registerError;
      }
    }
    throw error;
  }
}

// 모임 생성
async function createGroup(
  token: string,
  city: string,
  sport: string,
  locationData: { name: string; lat: number; lng: number },
  index: number,
): Promise<void> {
  const sportData = SPORTS[sport as keyof typeof SPORTS];
  const description = sportData.descriptions[index % sportData.descriptions.length];
  const meetingTime = sportData.meetingTimes[index % sportData.meetingTimes.length];
  const equipment = sportData.equipment;

  const groupData = {
    name: `${city} ${sport} 모임 ${index + 1}`,
    location: locationData.name,
    latitude: locationData.lat,
    longitude: locationData.lng,
    category: sport,
    description,
    meetingTime,
    equipment,
    contact: '010-1234-5678',
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/api/groups`, groupData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(`✅ 생성 완료: ${groupData.name}`);
  } catch (error: any) {
    console.error(`❌ 생성 실패: ${groupData.name}`, error.response?.data || error.message);
  }
}

// 메인 함수
async function main() {
  console.log('테스트 모임 데이터 생성 시작...\n');

  // 로그인
  let token: string;
  try {
    token = await login();
    console.log('✅ 로그인 성공\n');
  } catch (error: any) {
    console.error('❌ 로그인 실패:', error.response?.data || error.message);
    process.exit(1);
  }

  // 각 지역별로 운동 종목별 모임 생성
  const cities = ['서울', '대전', '부산'];
  const sports = Object.keys(SPORTS);

  for (const city of cities) {
    console.log(`\n📍 ${city} 지역 모임 생성 중...`);
    const cityLocations = LOCATIONS[city as keyof typeof LOCATIONS].coordinates;

    for (const sport of sports) {
      console.log(`  🏃 ${sport} 모임 생성 중...`);
      const count = Math.min(8, cityLocations.length); // 최대 8개

      for (let i = 0; i < count; i++) {
        await createGroup(token, city, sport, cityLocations[i], i);
        // API 부하 방지를 위한 짧은 지연
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  console.log('\n✅ 모든 테스트 모임 데이터 생성 완료!');
}

// 스크립트 실행
main().catch((error) => {
  console.error('스크립트 실행 중 오류:', error);
  process.exit(1);
});

