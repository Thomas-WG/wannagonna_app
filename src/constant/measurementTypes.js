/**
 * Measurement type taxonomy for impact parameters.
 * Aligns with UN/UNV Toolbox on Measuring Volunteering for the 2030 Agenda.
 */

/** @typedef {'output'|'reach'|'duration'|'environmental_output'|'organizational_capacity'} MeasurementTypeId */

/** Keys are relative to impact_export namespace (use with useTranslations('impact_export')). */
export const MEASUREMENT_TYPES = [
  {
    id: 'output',
    labelKey: 'measurementType.output',
    descriptionKey: 'measurementType.outputDesc',
    exampleKey: 'measurementType.outputExample',
  },
  {
    id: 'reach',
    labelKey: 'measurementType.reach',
    descriptionKey: 'measurementType.reachDesc',
    exampleKey: 'measurementType.reachExample',
  },
  {
    id: 'duration',
    labelKey: 'measurementType.duration',
    descriptionKey: 'measurementType.durationDesc',
    exampleKey: 'measurementType.durationExample',
  },
  {
    id: 'environmental_output',
    labelKey: 'measurementType.environmental_output',
    descriptionKey: 'measurementType.environmentalOutputDesc',
    exampleKey: 'measurementType.environmentalOutputExample',
  },
  {
    id: 'organizational_capacity',
    labelKey: 'measurementType.organizational_capacity',
    descriptionKey: 'measurementType.organizationalCapacityDesc',
    exampleKey: 'measurementType.organizationalCapacityExample',
  },
];

/** Activity category -> default measurement type. Primary type for categories that recommend multiple. */
const CATEGORY_TO_MEASUREMENT_TYPE = {
  // Online
  website: 'organizational_capacity',
  logo: 'organizational_capacity',
  translation: 'organizational_capacity',
  flyer: 'organizational_capacity',
  consulting: 'organizational_capacity',
  architecture: 'organizational_capacity',
  dataentry: 'organizational_capacity',
  photovideo: 'organizational_capacity',
  sns: 'organizational_capacity',
  onlinesupport: 'duration',
  education: 'duration',
  fundraising: 'organizational_capacity',
  explainer: 'organizational_capacity',
  // Local
  cleaning: 'environmental_output',
  teaching: 'duration',
  food_distribution: 'output',
  elderly_support: 'duration',
  animal_care: 'output',
  environment: 'environmental_output',
  community_events: 'reach',
  childcare: 'duration',
  manual_labor: 'output',
  administrative: 'organizational_capacity',
};

/**
 * Get default measurement type for an activity category.
 * @param {string} activityCategory - Category ID (e.g. 'website', 'cleaning')
 * @returns {MeasurementTypeId|null}
 */
export function getDefaultMeasurementTypeForCategory(activityCategory) {
  if (!activityCategory) return null;
  return CATEGORY_TO_MEASUREMENT_TYPE[activityCategory] ?? null;
}

/**
 * Suggest measurement type from unit string (fallback when no category mapping).
 * @param {string} unit - Unit string (e.g. 'people', 'kg', 'hours')
 * @returns {MeasurementTypeId}
 */
export function suggestMeasurementTypeFromUnit(unit) {
  if (!unit || typeof unit !== 'string') return 'output';
  const u = unit.toLowerCase();
  if (u.includes('people') || u.includes('person')) return 'reach';
  if (u.includes('kg') || u.includes('m²') || u.includes('km') || u.includes('m2')) return 'environmental_output';
  if (u.includes('hour')) return 'duration';
  return 'output';
}
