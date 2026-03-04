/**
 * OCR 등 업로드 전 이미지 압축·리사이즈
 * - 목표: maxSizeBytes(기본 10MB) 이하로 조정
 * - 리사이즈: 긴 변 최대 maxDimension(기본 2560px)
 * - JPEG 품질로 압축, 필요 시 품질 낮춰가며 재시도
 */

const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_DIMENSION = 2560;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.1;

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

function isImageType(mime: string): boolean {
  return ALLOWED_TYPES.some((t) => t === mime);
}

/**
 * File을 Canvas로 그린 뒤 리사이즈·JPEG 압축하여 10MB 이하 File로 반환
 * PNG/GIF/WebP는 JPEG로 변환. 이미 10MB 이하면 리사이즈만 하거나 원본 유지
 */
export function compressImageForOcr(
  file: File,
  maxSizeBytes: number = DEFAULT_MAX_SIZE_BYTES,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
): Promise<File> {
  if (!isImageType(file.type)) {
    return Promise.reject(new Error('지원하는 이미지 형식이 아닙니다. (jpg, png, gif, webp)'));
  }
  if (file.size <= maxSizeBytes) {
    // 리사이즈만 필요할 수 있음 (해상도가 너무 크면 OCR/전송 부담)
    return resizeAndCompress(file, maxSizeBytes, maxDimension);
  }
  return resizeAndCompress(file, maxSizeBytes, maxDimension);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 불러올 수 없습니다.'));
    };
    img.src = url;
  });
}

function drawToCanvas(
  img: HTMLImageElement,
  maxDimension: number,
): { canvas: HTMLCanvasElement; width: number; height: number } {
  let { width, height } = img;
  if (width <= maxDimension && height <= maxDimension) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0);
    return { canvas, width, height };
  }
  if (width > height) {
    height = Math.round((height * maxDimension) / width);
    width = maxDimension;
  } else {
    width = Math.round((width * maxDimension) / height);
    height = maxDimension;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, width, height);
  return { canvas, width, height };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('압축 실패'))),
      'image/jpeg',
      quality,
    );
  });
}

async function resizeAndCompress(
  file: File,
  maxSizeBytes: number,
  maxDimension: number,
): Promise<File> {
  const img = await loadImage(file);
  const { canvas } = drawToCanvas(img, maxDimension);

  let quality = 0.92;
  let blob: Blob = await canvasToBlob(canvas, quality);

  while (blob.size > maxSizeBytes && quality >= MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > maxSizeBytes) {
    const lower = Math.max(400, Math.floor(maxDimension * 0.7));
    const { canvas: c2 } = drawToCanvas(img, lower);
    blob = await canvasToBlob(c2, MIN_QUALITY);
    if (blob.size > maxSizeBytes) {
      throw new Error(`이미지 용량을 ${maxSizeBytes / 1024 / 1024}MB 이하로 줄일 수 없습니다. 더 작은 이미지를 선택해 주세요.`);
    }
  }

  const name = file.name.replace(/\.[^.]+$/i, '') + '_compressed.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}
