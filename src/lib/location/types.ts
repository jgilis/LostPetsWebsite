export interface LocationLabel {
  primary: string;
  secondary?: string;
  source: "geocoded" | "fallback";
}
