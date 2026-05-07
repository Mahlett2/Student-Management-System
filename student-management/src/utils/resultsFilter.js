/**
 * Filters a results array by search text and/or period.
 * @param {Array} results - full results list
 * @param {string} search - partial match against studentName or subject (case-insensitive)
 * @param {string} period - exact match against period; empty string = no filter
 * @returns {Array} filtered subset
 */
export function filterResults(results, search = "", period = "") {
  const q = search.trim().toLowerCase();
  return results.filter((r) => {
    const matchesSearch =
      q === "" ||
      r.studentName.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q);
    const matchesPeriod = period === "" || r.period === period;
    return matchesSearch && matchesPeriod;
  });
}
