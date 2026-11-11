import { isReportType, isValidLatitude, isValidLongitude } from "./reportValidation";

export const REPORT_DRAFT_STORAGE_KEY = "lostpets.reportDraft.v1";
/** Long enough for a magic-link email; not a permanent stash. */
export const REPORT_DRAFT_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const MAX_PHOTO_DATA_URL_CHARS = 2_000_000;
const DEFAULT_LATITUDE = 51.0206;
const DEFAULT_LONGITUDE = 4.4756;

export type ReportDraft = {
  type: "lost" | "found";
  animalType: string;
  animalName: string;
  description: string;
  latitude: number;
  longitude: number;
  consent: boolean;
  photoName: string | null;
  photoDataUrl: string | null;
  savedAt: number;
};

export type ReportDraftInput = {
  type: "lost" | "found";
  animalType: string;
  animalName: string;
  description: string;
  latitude: number;
  longitude: number;
  consent: boolean;
  photo: File | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseReportDraft(
  raw: string | null,
  now = Date.now(),
): ReportDraft | null {
  if (!raw) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(value) || !isReportType(String(value.type ?? ""))) {
    return null;
  }
  if (typeof value.savedAt !== "number" || !Number.isFinite(value.savedAt)) {
    return null;
  }
  if (now - value.savedAt > REPORT_DRAFT_MAX_AGE_MS || value.savedAt > now + 60_000) {
    return null;
  }
  if (
    typeof value.latitude !== "number" ||
    typeof value.longitude !== "number" ||
    !isValidLatitude(value.latitude) ||
    !isValidLongitude(value.longitude)
  ) {
    return null;
  }

  const photoDataUrl =
    typeof value.photoDataUrl === "string" &&
    value.photoDataUrl.startsWith("data:image/") &&
    value.photoDataUrl.length <= MAX_PHOTO_DATA_URL_CHARS
      ? value.photoDataUrl
      : null;
  const photoName =
    typeof value.photoName === "string" && value.photoName.trim()
      ? value.photoName
      : null;

  return {
    type: value.type,
    animalType: typeof value.animalType === "string" ? value.animalType : "",
    animalName: typeof value.animalName === "string" ? value.animalName : "",
    description: typeof value.description === "string" ? value.description : "",
    latitude: value.latitude,
    longitude: value.longitude,
    consent: value.consent === true,
    photoName,
    photoDataUrl,
    savedAt: value.savedAt,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read photo"));
    };
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.readAsDataURL(file);
  });
}

export function dataUrlToFile(
  dataUrl: string,
  name: string | null,
): File | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;

  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], name?.trim() || "photo.jpg", { type: match[1] });
  } catch {
    return null;
  }
}

function hasDraftContent(draft: {
  animalType: string;
  animalName: string;
  description: string;
  consent: boolean;
  latitude: number;
  longitude: number;
  photoDataUrl?: string | null;
  photo?: File | null;
}): boolean {
  return Boolean(
    draft.animalType ||
      draft.animalName.trim() ||
      draft.description.trim() ||
      draft.consent ||
      draft.photoDataUrl ||
      draft.photo ||
      draft.latitude !== DEFAULT_LATITUDE ||
      draft.longitude !== DEFAULT_LONGITUDE,
  );
}

export function readReportDraft(now = Date.now()): ReportDraft | null {
  try {
    const draft = parseReportDraft(
      localStorage.getItem(REPORT_DRAFT_STORAGE_KEY),
      now,
    );
    if (!draft || !hasDraftContent(draft)) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearReportDraft(): void {
  try {
    localStorage.removeItem(REPORT_DRAFT_STORAGE_KEY);
  } catch {
    // private mode / quota
  }
}

function writeDraftRecord(draft: ReportDraft): void {
  const payload = JSON.stringify(draft);
  try {
    localStorage.setItem(REPORT_DRAFT_STORAGE_KEY, payload);
  } catch {
    const withoutPhoto = JSON.stringify({
      ...draft,
      photoDataUrl: null,
      photoName: null,
    });
    try {
      localStorage.setItem(REPORT_DRAFT_STORAGE_KEY, withoutPhoto);
    } catch {
      // give up
    }
  }
}

export async function writeReportDraft(input: ReportDraftInput): Promise<void> {
  if (!hasDraftContent(input)) return;

  let photoDataUrl: string | null = null;
  let photoName: string | null = null;

  if (input.photo) {
    photoName = input.photo.name || "photo.jpg";
    try {
      const dataUrl = await fileToDataUrl(input.photo);
      if (
        dataUrl.startsWith("data:image/") &&
        dataUrl.length <= MAX_PHOTO_DATA_URL_CHARS
      ) {
        photoDataUrl = dataUrl;
      }
    } catch {
      photoDataUrl = null;
    }
  }

  writeDraftRecord({
    type: input.type,
    animalType: input.animalType,
    animalName: input.animalName,
    description: input.description,
    latitude: input.latitude,
    longitude: input.longitude,
    consent: input.consent,
    photoName,
    photoDataUrl,
    savedAt: Date.now(),
  });
}
