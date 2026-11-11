export const SPECIES_COLORS = {
  dog: "#C56B4A",
  cat: "#D9A441",
  bird: "#6A8F6E",
  rodent: "#B5836A",
  other: "#7A7168",
} as const;

export const STATUS_COLORS = {
  lost: "#C45C4A",
  found: "#4F8F82",
  reunited: "#5F8A68",
} as const;

export type ThemeAnimalType = keyof typeof SPECIES_COLORS;

export function speciesColor(
  animalType: string | null | undefined,
): string {
  if (animalType && animalType in SPECIES_COLORS) {
    return SPECIES_COLORS[animalType as ThemeAnimalType];
  }
  return SPECIES_COLORS.other;
}
