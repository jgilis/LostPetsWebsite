import type { ThemeAnimalType } from "@/src/lib/theme/colors";

/**
 * 24×24 filled silhouettes. Overlapping shapes of the same fill
 * read as one pictogram at map-marker size.
 */
export const SPECIES_MARKUP: Record<ThemeAnimalType, string> = {
  dog: [
    '<rect x="6.1" y="15.6" width="2.2" height="5.4" rx="1.05"/>',
    '<rect x="8.9" y="15.6" width="2.2" height="5.4" rx="1.05"/>',
    '<rect x="13.4" y="15.6" width="2.2" height="5.4" rx="1.05"/>',
    '<rect x="16.2" y="15.6" width="2.2" height="5.4" rx="1.05"/>',
    '<ellipse cx="12.1" cy="13.7" rx="7.5" ry="4.35"/>',
    '<path d="M5.2 13.2C2.6 12.6 1.8 8.8 4.2 7.4c.2 2 1.2 3.6 2.8 4.8z"/>',
    '<ellipse cx="18.1" cy="10.1" rx="3.7" ry="3.45"/>',
    '<ellipse cx="21.5" cy="11.15" rx="2.7" ry="1.75"/>',
    '<ellipse cx="16.5" cy="6.9" rx="1.75" ry="2.9" transform="rotate(-30 16.5 6.9)"/>',
  ].join(""),
  cat: [
    '<path d="M16.6 15.4c3.6.5 5.6-2.2 5.2-4.6-.1 2.2-2 3.8-4.4 4.2z"/>',
    '<ellipse cx="11.5" cy="16.6" rx="6.5" ry="5.15"/>',
    '<circle cx="12" cy="9.55" r="4.55"/>',
    '<path d="M7.2 8.6 7.7 2.8 11.7 7.5z"/>',
    '<path d="M12.3 7.5 16.5 2.6 16.9 8.6z"/>',
  ].join(""),
  bird: [
    '<path d="M1.6 9.2 7.8 12.4 2 12.8z"/>',
    '<path d="M2 13.2 7.8 13.1 2.2 17.6z"/>',
    '<ellipse cx="12.5" cy="13.5" rx="5.35" ry="4.45"/>',
    '<circle cx="17.7" cy="9" r="3.25"/>',
    '<path d="M20.5 8 24 9.7 20.5 11.3z"/>',
    '<ellipse cx="11.6" cy="13.3" rx="3.3" ry="2" transform="rotate(-28 11.6 13.3)"/>',
  ].join(""),
  rodent: [
    '<circle cx="8.1" cy="7.2" r="3.15"/>',
    '<ellipse cx="12" cy="13.9" rx="7.35" ry="6.35"/>',
    '<circle cx="17.7" cy="14.35" r="3.7"/>',
    '<ellipse cx="20.7" cy="13.35" rx="2.05" ry="1.55"/>',
    '<path d="M4.8 16.6c-2.2.6-2.6 3.1-.2 3.5 1.4-1 1.8-2.2 1.6-3.4z"/>',
  ].join(""),
  other: [
    '<ellipse cx="7.15" cy="7.7" rx="2.2" ry="2.65"/>',
    '<ellipse cx="12" cy="6.05" rx="2.25" ry="2.75"/>',
    '<ellipse cx="16.85" cy="7.7" rx="2.2" ry="2.65"/>',
    '<ellipse cx="19.35" cy="11.15" rx="1.85" ry="2.2"/>',
    '<path d="M6.4 13.4c0-1.15 1.15-2.35 3.35-2.5 1.15-.08 2.1.45 3.25.45s2.1-.53 3.25-.45c2.2.15 3.35 1.35 3.35 2.5 0 3.35-2.85 6.45-6.6 6.45s-6.6-3.1-6.6-6.45z"/>',
  ].join(""),
};

export function speciesGlyphSvg(
  animalType: ThemeAnimalType,
  fill = "currentColor",
  size = 18,
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" aria-hidden="true">${SPECIES_MARKUP[animalType]}</svg>`;
}
