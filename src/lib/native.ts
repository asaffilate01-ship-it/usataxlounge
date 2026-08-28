import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export const isNativeApp = () => Capacitor.isNativePlatform();

export const takeNativeDocumentPhoto = async (): Promise<File | null> => {
  if (!isNativeApp()) return null;

  const photo = await Camera.getPhoto({
    source: CameraSource.Camera,
    resultType: CameraResultType.Uri,
    quality: 90,
    correctOrientation: true,
    saveToGallery: false,
  });

  if (!photo.webPath) throw new Error("The camera did not return a photo.");
  const response = await fetch(photo.webPath);
  if (!response.ok) throw new Error("The captured photo could not be read.");
  const blob = await response.blob();
  const mimeType = blob.type || `image/${photo.format || "jpeg"}`;
  return new File([blob], `receipt-${Date.now()}.${photo.format || "jpeg"}`, { type: mimeType });
};
