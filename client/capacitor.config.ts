import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.allcourtplay.app',
  appName: '올코트플레이',
  webDir: 'dist',
  // 앱이 실제 API 서버와 통신하도록 (배포 시 서비스 URL 사용)
  // server: { url: 'https://allcourtplay.com', cleartext: true },
};

export default config;
