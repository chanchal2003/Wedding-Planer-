// The banner photo of a wedding. The browser shrinks it to about 300 KB first. The server
// checks it again, because the browser is never trusted.

// Below the 1 MB check of the database (1,048,576 bytes), with room to spare.
export const MAX_BANNER_BYTES = 1_000_000;

export type BannerType = "image/jpeg" | "image/png" | "image/webp";

// Looks at the first bytes of the file (the "magic bytes"), not at the name or the type that
// the browser says. A file called photo.jpg that is not a picture is refused. SVG is refused on
// purpose: an SVG file can carry scripts.
export function detectImageType(bytes: Uint8Array): BannerType | null {
  const startsWith = (...values: number[]) => values.every((value, i) => bytes[i] === value);
  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  // WebP: "RIFF", 4 bytes of size, then "WEBP".
  if (startsWith(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return "image/webp";
  }
  return null;
}
