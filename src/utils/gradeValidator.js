const LETTER_GRADES = new Set([
  "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F",
]);

/**
 * Returns true if the value is a valid grade:
 * - A recognised letter grade (A, A-, B+, B, B-, C+, C, C-, D+, D, F)
 * - An integer string between 0 and 100 inclusive
 */
export function isValidGrade(value) {
  if (typeof value !== "string" || value.trim() === "") return false;
  if (LETTER_GRADES.has(value.trim())) return true;
  const num = Number(value.trim());
  return Number.isInteger(num) && num >= 0 && num <= 100;
}
