/**
 * Profile completion (badge + progress UI) vs partial saves:
 * - Form validation (profileSchema) allows saving incomplete profiles.
 * - isProfileComplete / getProfileCompletionState encode what "done" means for the badge and progress bar.
 */

const MIN_DISPLAY_NAME_LEN = 2;
const MIN_TEXT_SECTION_LEN = 10;

/** Single source of truth for progress labels and completion rules (kept in sync with isProfileComplete). */
export const PROFILE_COMPLETION_FIELDS = [
  {
    key: 'display_name',
    label: 'Display Name',
    isComplete: (profileData) =>
      typeof profileData.display_name === 'string' &&
      profileData.display_name.trim().length >= MIN_DISPLAY_NAME_LEN,
  },
  {
    key: 'bio',
    label: 'Bio',
    isComplete: (profileData) =>
      typeof profileData.bio === 'string' && profileData.bio.trim().length >= MIN_TEXT_SECTION_LEN,
  },
  {
    key: 'cause',
    label: 'Cause',
    isComplete: (profileData) =>
      typeof profileData.cause === 'string' && profileData.cause.trim().length >= MIN_TEXT_SECTION_LEN,
  },
  {
    key: 'hobbies',
    label: 'Hobbies',
    isComplete: (profileData) =>
      typeof profileData.hobbies === 'string' && profileData.hobbies.trim().length >= MIN_TEXT_SECTION_LEN,
  },
  {
    key: 'country',
    label: 'Country',
    isComplete: (profileData) =>
      typeof profileData.country === 'string' && profileData.country.trim() !== '',
  },
  {
    key: 'languages',
    label: 'Languages',
    isComplete: (profileData) =>
      Array.isArray(profileData.languages) && profileData.languages.length > 0,
  },
  {
    key: 'profile_picture',
    label: 'Profile Picture',
    isComplete: (profileData) =>
      typeof profileData.profile_picture === 'string' && profileData.profile_picture.trim() !== '',
  },
  {
    key: 'time_commitment',
    label: 'Time Commitment',
    isComplete: (profileData) => {
      const tc = profileData.time_commitment;
      if (!tc || typeof tc !== 'object') return false;
      return Object.values(tc).some((v) => v === true);
    },
  },
  {
    key: 'availabilities',
    label: 'Availability',
    isComplete: (profileData) => {
      const av = profileData.availabilities;
      if (!av || typeof av !== 'object') return false;
      return Object.values(av).some((v) => v === true);
    },
  },
];

/**
 * @param {Object} profileData
 * @returns {{ percentage: number, completedFields: number, totalFields: number, missingFields: string[], isComplete: boolean }}
 */
export function getProfileCompletionState(profileData) {
  if (!profileData) {
    return {
      percentage: 0,
      completedFields: 0,
      totalFields: PROFILE_COMPLETION_FIELDS.length,
      missingFields: PROFILE_COMPLETION_FIELDS.map((f) => f.label),
      isComplete: false,
    };
  }

  const missingFields = [];
  let completed = 0;
  const total = PROFILE_COMPLETION_FIELDS.length;

  for (const field of PROFILE_COMPLETION_FIELDS) {
    if (field.isComplete(profileData)) {
      completed++;
    } else {
      missingFields.push(field.label);
    }
  }

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    percentage,
    completedFields: completed,
    totalFields: total,
    missingFields,
    isComplete: missingFields.length === 0,
  };
}

/**
 * Whether the user qualifies for the complete profile badge (all sections filled to the same bar as the progress UI).
 * @param {Object} profileData - The profile data object
 * @returns {boolean}
 */
export function isProfileComplete(profileData) {
  return getProfileCompletionState(profileData).isComplete;
}
