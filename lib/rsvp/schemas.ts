import { z } from "zod";
import { cleaned } from "@/lib/text";

// What a guest types in the search box (FR-28): at least 3 letters, extra spaces removed.
export const MIN_SEARCH_LETTERS = 3;
export const MAX_MATCHES = 10;

export const searchTextSchema = cleaned(
  z
    .string()
    .trim()
    .transform((text) => text.replace(/\s+/g, " "))
    .pipe(z.string().min(MIN_SEARCH_LETTERS, "Type at least 3 letters.").max(40, "Use at most 40 letters.")),
);
