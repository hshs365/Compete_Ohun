import React, { useState, useCallback } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, convertToPixelCrop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
function getCroppedImageBlob(image: HTMLImageElement, crop: PixelCrop, mimeType: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas not supported'));

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const x = crop.x * scaleX;
  const y = crop.y * scaleY;
  const w = crop.width * scaleX;
  const h = crop.height * scaleY;

  canvas.width = Math.round(w);
  canvas.height = Math.round(h);
  ctx.drawImage(image, x, y, w, h, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, mimeType, 0.92);
  });
}

interface ProfileImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 선택된 이미지 파일 */
  imageFile: File | null;
  /** 크롭 완료 시 전달 (blob, 원본 파일명) */
  onConfirm: (blob: Blob, fileName: string) => void;
}

const ProfileImageCropModal: React.FC<ProfileImageCropModalProps> = ({
  isOpen,
  onClose,
  imageFile,
  onConfirm,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // 파일이 바뀌면 새로 로드
  React.useEffect(() => {
    if (!imageFile || !isOpen) {
      setImageSrc(null);
      setCrop(undefined);
      setCompletedCrop(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(imageFile);
  }, [imageFile, isOpen]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const percentCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
      width,
      height
    );
    setCrop(percentCrop);
    const pixelCrop = convertToPixelCrop(percentCrop, width, height);
    setCompletedCrop(pixelCrop);
  }, []);

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop || !imageFile) return;
    setSaving(true);
    try {
      const mimeType = imageFile.type || 'image/jpeg';
      const blob = await getCroppedImageBlob(imgRef.current, completedCrop, mimeType);
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const fileName = `profile.${ext}`;
      onConfirm(blob, fileName);
      onClose();
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-xl border border-[var(--color-border-card)] w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-card)]">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">사진 수정</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !completedCrop}
              className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white font-medium disabled:opacity-50"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
        <div className="p-4">
          {imageSrc && (
            <div className="max-h-[70vh] overflow-auto rounded-lg bg-[var(--color-bg-primary)]">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                aspect={1}
                circularCrop
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="크롭할 이미지"
                  onLoad={onImageLoad}
                  className="max-w-full h-auto block"
                  style={{ maxHeight: '70vh' }}
                />
              </ReactCrop>
            </div>
          )}
          <p className="text-sm text-[var(--color-text-secondary)] mt-3 text-center">
            드래그하여 위치를 조정해주세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileImageCropModal;
