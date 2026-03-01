/**
 * Global impact parameters seed data.
 * Aligns with UN/UNV Toolbox and spec sections 5.1–5.10.
 * Used by admin UI to seed/update global parameters.
 */

/**
 * @typedef {Object} SeedParameter
 * @property {string} seedKey - Unique key for idempotent upsert
 * @property {string} label
 * @property {string} unit
 * @property {string} category
 * @property {string} measurementType
 * @property {number[]} sdg
 */

/** @type {SeedParameter[]} */
export const GLOBAL_PARAMETERS_SEED = [
  // 5.1 People & Social
  { seedKey: 'people-served', label: 'People served / beneficiaries reached', unit: 'count', category: 'people', measurementType: 'reach', sdg: [1, 10] },
  { seedKey: 'children-supported', label: 'Children supported', unit: 'count', category: 'people', measurementType: 'reach', sdg: [1, 4] },
  { seedKey: 'elderly-supported', label: 'Elderly people supported', unit: 'count', category: 'people', measurementType: 'reach', sdg: [3, 10] },
  { seedKey: 'refugees-assisted', label: 'Refugees/migrants assisted', unit: 'count', category: 'people', measurementType: 'reach', sdg: [10, 16] },
  { seedKey: 'people-trained', label: 'People trained / upskilled', unit: 'count', category: 'people', measurementType: 'reach', sdg: [4, 8] },
  { seedKey: 'mentoring-sessions', label: 'Mentoring sessions provided', unit: 'count', category: 'people', measurementType: 'output', sdg: [4, 8] },
  { seedKey: 'hours-mentoring', label: 'Hours of mentoring', unit: 'hours', category: 'people', measurementType: 'duration', sdg: [4, 8] },
  { seedKey: 'job-placements', label: 'Job placements supported', unit: 'count', category: 'livelihoods', measurementType: 'reach', sdg: [1, 8] },
  { seedKey: 'volunteers-mobilized', label: 'Volunteers mobilized', unit: 'count', category: 'people', measurementType: 'reach', sdg: [17] },
  { seedKey: 'community-members-engaged', label: 'Community members engaged', unit: 'count', category: 'people', measurementType: 'reach', sdg: [11, 17] },
  { seedKey: 'awareness-campaign-reach', label: 'Awareness campaign reach', unit: 'count', category: 'people', measurementType: 'reach', sdg: [4, 10, 13] },
  // 5.2 Food
  { seedKey: 'meals-distributed', label: 'Meals distributed', unit: 'count', category: 'food', measurementType: 'output', sdg: [1, 2] },
  { seedKey: 'food-distributed', label: 'Food distributed', unit: 'kg', category: 'food', measurementType: 'output', sdg: [1, 2] },
  { seedKey: 'people-fed', label: 'People fed', unit: 'count', category: 'food', measurementType: 'reach', sdg: [1, 2] },
  // 5.3 Environment
  { seedKey: 'waste-collected', label: 'Waste collected/recycled', unit: 'kg', category: 'environment', measurementType: 'environmental_output', sdg: [11, 12, 14] },
  { seedKey: 'trees-planted', label: 'Trees planted', unit: 'count', category: 'environment', measurementType: 'environmental_output', sdg: [13, 15] },
  { seedKey: 'area-cleaned', label: 'Area cleaned/restored', unit: 'm2', category: 'environment', measurementType: 'environmental_output', sdg: [11, 15] },
  { seedKey: 'plastic-removed', label: 'Plastic removed', unit: 'kg', category: 'environment', measurementType: 'environmental_output', sdg: [12, 14] },
  // 5.4 Education
  { seedKey: 'teaching-hours', label: 'Teaching/tutoring hours', unit: 'hours', category: 'education', measurementType: 'duration', sdg: [4] },
  { seedKey: 'students-reached', label: 'Students/trainees reached', unit: 'count', category: 'education', measurementType: 'reach', sdg: [4] },
  { seedKey: 'educational-materials', label: 'Educational materials created', unit: 'count', category: 'education', measurementType: 'organizational_capacity', sdg: [4] },
  { seedKey: 'books-distributed', label: 'Books/materials distributed', unit: 'count', category: 'education', measurementType: 'output', sdg: [4] },
  // 5.5 Health
  { seedKey: 'health-screenings', label: 'Health screenings conducted', unit: 'count', category: 'health', measurementType: 'output', sdg: [3] },
  { seedKey: 'blood-donations', label: 'Blood donations facilitated', unit: 'count', category: 'health', measurementType: 'output', sdg: [3] },
  { seedKey: 'mental-health-sessions', label: 'Mental health sessions', unit: 'count', category: 'health', measurementType: 'output', sdg: [3] },
  { seedKey: 'mental-health-hours', label: 'Mental health hours provided', unit: 'hours', category: 'health', measurementType: 'duration', sdg: [3] },
  { seedKey: 'people-care-access', label: 'People with improved access to care', unit: 'count', category: 'health', measurementType: 'reach', sdg: [3, 10] },
  // 5.6 Housing
  { seedKey: 'housing-units', label: 'Housing units improved/built', unit: 'count', category: 'housing', measurementType: 'output', sdg: [1, 11] },
  { seedKey: 'families-housed', label: 'Families housed', unit: 'count', category: 'housing', measurementType: 'reach', sdg: [1, 11] },
  // 5.7 Animals
  { seedKey: 'animals-sheltered', label: 'Animals sheltered/rescued', unit: 'count', category: 'animals', measurementType: 'output', sdg: [15] },
  { seedKey: 'animals-cared', label: 'Animals cared for', unit: 'count', category: 'animals', measurementType: 'output', sdg: [15] },
  // 5.8 Goods
  { seedKey: 'items-donated', label: 'Items donated/distributed', unit: 'count', category: 'goods', measurementType: 'output', sdg: [1, 12] },
  { seedKey: 'goods-redistributed', label: 'Goods redistributed', unit: 'kg', category: 'goods', measurementType: 'output', sdg: [12] },
  { seedKey: 'computers-donated', label: 'Computers/equipment donated', unit: 'count', category: 'goods', measurementType: 'output', sdg: [4, 9] },
  // 5.9 Culture & Community
  { seedKey: 'cultural-events', label: 'Cultural events organized', unit: 'count', category: 'culture', measurementType: 'output', sdg: [10, 11] },
  { seedKey: 'event-attendees', label: 'Event attendees', unit: 'count', category: 'culture', measurementType: 'reach', sdg: [11, 17] },
  // 5.10 Organizational Capacity (online/skills volunteering)
  { seedKey: 'websites-created', label: 'Websites or digital tools created', unit: 'count', category: 'digital', measurementType: 'organizational_capacity', sdg: [9, 17] },
  { seedKey: 'documents-translated', label: 'Documents translated', unit: 'count', category: 'communication', measurementType: 'organizational_capacity', sdg: [10, 17] },
  { seedKey: 'designs-produced', label: 'Designs produced (logo, flyer, video)', unit: 'count', category: 'communication', measurementType: 'organizational_capacity', sdg: [17] },
  { seedKey: 'consulting-hours', label: 'Hours of consulting / advisory support', unit: 'hours', category: 'consulting', measurementType: 'organizational_capacity', sdg: [17] },
  { seedKey: 'staff-training-sessions', label: 'Training sessions delivered to NPO staff', unit: 'count', category: 'people', measurementType: 'organizational_capacity', sdg: [4, 17] },
];
