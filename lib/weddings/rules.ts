import { addDays } from "@/lib/time";

// The date rules of the settings, in one place. The form uses them to grey out days, and the
// server uses them to refuse a wrong date (the browser is never trusted).
// The reply-by date can be at most 2 days before the wedding. The stay-by date must come before
// the reply-by date, so it can be at most 3 days before the wedding. Decided 2026-10-31.

export const REPLY_DAYS_BEFORE_WEDDING = 2;
export const STAY_DAYS_BEFORE_WEDDING = 3;

// weddingDate and the results are plain dates like "2027-01-15".
export const latestReplyDate = (weddingDate: string) => addDays(weddingDate, -REPLY_DAYS_BEFORE_WEDDING);
export const latestStayDate = (weddingDate: string) => addDays(weddingDate, -STAY_DAYS_BEFORE_WEDDING);

// The latest day the stay picker allows: the day before the reply date when it is set and allowed,
// otherwise the latest day that is possible at all.
export function latestStayDateFor(weddingDate: string, replyDate: string) {
  const replyAllowed = replyDate !== "" && replyDate <= latestReplyDate(weddingDate);
  return replyAllowed ? addDays(replyDate, -1) : latestStayDate(weddingDate);
}
