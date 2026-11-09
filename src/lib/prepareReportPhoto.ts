import {
  MAX_ENCODED_PHOTO_BYTES,
  MAX_PHOTO_DIMENSION,
  MAX_SOURCE_PHOTO_BYTES,
} from "./reportValidation";

export type PhotoPreparationCode = "too-large" | "invalid-type";

export class PhotoPreparationError extends Error {
  code: PhotoPreparationCode;

  constructor(code: PhotoPreparationCode) {
    super(code);
    this.name = "PhotoPreparationError";
    this.code = code;
  }
}

function fitSize(width: number, height: number, max: number) {
  if (width <= max && height <= max) {
    return { width, height };
  }

  const scale = max / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new PhotoPreparationError("invalid-type"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function prepareReportPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new PhotoPreparationError("invalid-type");
  }

  if (file.size > MAX_SOURCE_PHOTO_BYTES) {
    throw new PhotoPreparationError("too-large");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new PhotoPreparationError("invalid-type");
  }

  try {
    if (bitmap.width < 1 || bitmap.height < 1) {
      throw new PhotoPreparationError("invalid-type");
    }

    const { width, height } = fitSize(
      bitmap.width,
      bitmap.height,
      MAX_PHOTO_DIMENSION,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new PhotoPreparationError("invalid-type");
    }

    context.drawImage(bitmap, 0, 0, width, height);

    let blob = await canvasToJpeg(canvas, 0.85);
    if (blob.size > MAX_ENCODED_PHOTO_BYTES) {
      blob = await canvasToJpeg(canvas, 0.7);
    }
    if (blob.size > MAX_ENCODED_PHOTO_BYTES) {
      throw new PhotoPreparationError("too-large");
    }

    return blob;
  } finally {
    bitmap.close();
  }
}
