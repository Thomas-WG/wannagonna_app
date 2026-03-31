/**
 * Leaderboard SDG (Sustainable Development Goals) mapping.
 * UN SDGs 1–17 with labels and dimension helpers.
 */

/** SDG number (1–17) -> display label */
export const SDG_LABELS = {
  "1": "No Poverty",
  "2": "Zero Hunger",
  "3": "Good Health and Well-being",
  "4": "Quality Education",
  "5": "Gender Equality",
  "6": "Clean Water and Sanitation",
  "7": "Affordable and Clean Energy",
  "8": "Decent Work and Economic Growth",
  "9": "Industry, Innovation and Infrastructure",
  "10": "Reduced Inequalities",
  "11": "Sustainable Cities and Communities",
  "12": "Responsible Consumption and Production",
  "13": "Climate Action",
  "14": "Life Below Water",
  "15": "Life on Land",
  "16": "Peace, Justice and Strong Institutions",
  "17": "Partnerships for the Goals",
};

/**
 * Normalize raw SDG input to canonical number string (1–17).
 * Handles: numbers, "1", "Goal-01", "Goal-1", "sdg_1", etc.
 * @param {string|number} raw - Raw SDG value
 * @return {string|null} SDG number as string (1–17) or null if invalid
 */
export function normalizeSdgId(raw) {
  if (raw == null) return null;
  let s;
  if (typeof raw === "number") {
    s = String(raw);
  } else if (typeof raw === "string") {
    s = raw
        .replace(/^Goal-/, "")
        .replace(/^sdg_/i, "")
        .replace(/^0+/, "")
        .trim();
  } else {
    return null;
  }
  const n = parseInt(s, 10);
  if (Number.isNaN(n) || n < 1 || n > 17) return null;
  return String(n);
}

/**
 * Get dimension ID for an SDG number (e.g. "sdg_1", "sdg_17").
 * @param {string|number} sdgNumber - SDG number (1–17)
 * @return {string|null} Dimension id like "sdg_1" or null if invalid
 */
export function sdgDimensionId(sdgNumber) {
  const n = normalizeSdgId(sdgNumber);
  return n ? `sdg_${n}` : null;
}
