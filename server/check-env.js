// .env 파일 내용 확인 스크립트
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('=== .env 파일 확인 ===');
console.log('파일 경로:', envPath);
console.log('파일 존재:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  console.log('\n=== .env 파일 내용 ===');
  
  // 비밀번호는 마스킹해서 표시
  const masked = content.replace(/DB_PASSWORD=(.*)/g, (match, pwd) => {
    return `DB_PASSWORD=${'*'.repeat(Math.min(pwd.length, 10))}`;
  });
  console.log(masked);
  
  // 실제 값 확인 (개발 환경이므로)
  const lines = content.split('\n');
  const dbConfig = {};
  lines.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key.startsWith('DB_')) {
        dbConfig[key] = value;
      }
    }
  });
  
  console.log('\n=== 데이터베이스 설정 값 ===');
  console.log('DB_HOST:', dbConfig.DB_HOST || '(없음)');
  console.log('DB_PORT:', dbConfig.DB_PORT || '(없음)');
  console.log('DB_USERNAME:', dbConfig.DB_USERNAME || '(없음)');
  console.log('DB_PASSWORD:', dbConfig.DB_PASSWORD ? `${dbConfig.DB_PASSWORD.substring(0, 3)}...` : '(없음)');
  console.log('DB_NAME:', dbConfig.DB_NAME || '(없음)');
} else {
  console.log('\n❌ .env 파일이 존재하지 않습니다!');
  console.log('server/.env 파일을 생성하고 설정을 추가하세요.');
}


