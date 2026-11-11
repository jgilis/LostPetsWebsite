import { SPECIES_MARKUP } from "./speciesGlyphs";
import {
  speciesColor,
  type ThemeAnimalType,
} from "@/src/lib/theme/colors";

type SpeciesGlyphProps = {
  animalType: string;
  className?: string;
  size?: number;
  color?: string;
};

function asAnimal(animalType: string): ThemeAnimalType {
  if (animalType in SPECIES_MARKUP) return animalType as ThemeAnimalType;
  return "other";
}

export default function SpeciesGlyph({
  animalType,
  className,
  size = 18,
  color,
}: SpeciesGlyphProps) {
  const kind = asAnimal(animalType);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={color ?? speciesColor(kind)}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: SPECIES_MARKUP[kind] }}
    />
  );
}
