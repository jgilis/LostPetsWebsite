import type { Language } from "./config";
import { en } from "./en";
import { nl } from "./nl";
import { fr } from "./fr";
import type { TranslationKey } from "./types";

export const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  en,
  nl,
  fr,
};
