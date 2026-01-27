import { join } from 'path';

export const uploadConfig = {
  // 파일 저장 경로
  uploadDir: process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'),
  
  // 프로필 이미지 저장 경로
  profileImageDir: join(process.cwd(), 'uploads', 'profile'),
  
  // 모임 이미지 저장 경로
  groupImageDir: join(process.cwd(), 'uploads', 'groups'),
  
  // 최대 파일 크기 (5MB)
  maxFileSize: 5 * 1024 * 1024,
  
  // 허용된 이미지 타입
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  
  // 파일 URL 경로 (정적 파일 서빙용)
  publicPath: '/uploads',
};
