/**
 * Check if a user profile is complete
 * A profile is considered complete if it has:
 * - display_name (not empty)
 * - bio (not empty)
 * - cause (not empty)
 * - hobbies (not empty)
 * - country (not empty)
 * - at least one language
 * - profile_picture (not empty)
 * - at least one time_commitment option selected
 * - at least one availability option selected
 * @param {Object} profileData - The profile data object
 * @returns {boolean} True if profile is complete, false otherwise
 */
export function isProfileComplete(profileData) {
  if (!profileData) {
    return false;
  }
  
  // Check display_name
  if (!profileData.display_name || profileData.display_name.trim() === '') {
    return false;
  }
  
  // Check bio
  if (!profileData.bio || profileData.bio.trim() === '') {
    return false;
  }
  
  // Check cause
  if (!profileData.cause || profileData.cause.trim() === '') {
    return false;
  }
  
  // Check hobbies
  if (!profileData.hobbies || profileData.hobbies.trim() === '') {
    return false;
  }
  
  // Check country
  if (!profileData.country || profileData.country.trim() === '') {
    return false;
  }
  
  // Check languages (must have at least one)
  if (!profileData.languages || !Array.isArray(profileData.languages) || profileData.languages.length === 0) {
    return false;
  }
  
  // Check profile_picture (must be present and not empty)
  if (!profileData.profile_picture || profileData.profile_picture.trim() === '') {
    return false;
  }
  
  const tc = profileData.time_commitment;
  if (!tc || typeof tc !== 'object') {
    return false;
  }
  const time_commitment_values = Object.values(tc);
  const has_time_commitment = time_commitment_values.some(value => value === true);
  if (!has_time_commitment) {
    return false;
  }
  
  // Check availabilities (must have at least one selected)
  if (!profileData.availabilities || typeof profileData.availabilities !== 'object') {
    return false;
  }
  const availabilityValues = Object.values(profileData.availabilities);
  const hasAvailability = availabilityValues.some(value => value === true);
  if (!hasAvailability) {
    return false;
  }
  
  return true;
}

