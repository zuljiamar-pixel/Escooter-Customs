export type ClassValue = string | false | null | undefined | 0;

/** Verbindet bedingte Klassennamen. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
