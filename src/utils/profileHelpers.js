/**
 * Check if a user profile is complete
 * A profile is considered complete if it has:
 * - displayName (not empty)
 * - bio (not empty)
 * - cause (not empty)
 * - hobbies (not empty)
 * - country (not empty)
 * - at least one language
 * - profilePicture (not empty)
 * - at least one timeCommitment option selected
 * - at least one availability option selected
 * @param {Object} profileData - The profile data object
 * @returns {boolean} True if profile is complete, false otherwise
 */
export function isProfileComplete(profileData) {
  if (!profileData) {
    return false;
  }
  
  // Check displayName
  if (!profileData.displayName || profileData.displayName.trim() === '') {
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
  
  // Check profilePicture (must be present and not empty)
  if (!profileData.profilePicture || profileData.profilePicture.trim() === '') {
    return false;
  }
  
  // Check timeCommitment (must have at least one selected)
  if (!profileData.timeCommitment || typeof profileData.timeCommitment !== 'object') {
    return false;
  }
  const timeCommitmentValues = Object.values(profileData.timeCommitment);
  const hasTimeCommitment = timeCommitmentValues.some(value => value === true);
  if (!hasTimeCommitment) {
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

