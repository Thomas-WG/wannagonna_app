import { collection, getDocs, getDoc, doc, updateDoc, arrayUnion, Timestamp, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db, functions } from 'firebaseConfig';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from 'firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { uploadFile } from './storage';

/**
 * Fetch all badge categories (sdg, geography, general, etc.)
 * @returns {Promise<Array>} Array of category objects with id, title, description
 */
export async function fetchBadgeCategories() {
  try {
    const categoriesCollection = collection(db, 'badges');
    const snapshot = await getDocs(categoriesCollection);
    
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort categories by a default order (can be customized with an order field)
    return categories.sort((a, b) => {
      // If categories have an order field, use it
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // Otherwise sort alphabetically
      return a.id.localeCompare(b.id);
    });
  } catch (error) {
    console.error('Error fetching badge categories:', error);
    return [];
  }
}

/**
 * Fetch all badges from a specific category
 * @param {string} categoryId - The category ID (e.g., 'sdg', 'geography', 'general')
 * @returns {Promise<Array>} Array of badge objects with id, title, description
 */
export async function fetchBadgesByCategory(categoryId) {
  try {
    const categoryDoc = doc(db, 'badges', categoryId);
    const badgesCollection = collection(categoryDoc, 'badges');
    const snapshot = await getDocs(badgesCollection);
    
    const badges = snapshot.docs.map((doc) => ({
      id: doc.id,
      category_id: categoryId,
      ...doc.data()
    }));
    
    return badges;
  } catch (error) {
    console.error(`Error fetching badges for category ${categoryId}:`, error);
    return [];
  }
}

/**
 * Fetch all badges from all categories
 * @returns {Promise<Array>} Array of badge objects with id, title, description, categoryId
 */
export async function fetchAllBadges() {
  try {
    const categories = await fetchBadgeCategories();
    const allBadgesPromises = categories.map(category => 
      fetchBadgesByCategory(category.id)
    );
    
    const badgesByCategory = await Promise.all(allBadgesPromises);
    const allBadges = badgesByCategory.flat();
    
    return allBadges;
  } catch (error) {
    console.error('Error fetching all badges:', error);
    return [];
  }
}

/**
 * Fetch a specific badge by ID and category
 * @param {string} categoryId - The category ID
 * @param {string} badgeId - The badge ID
 * @returns {Promise<Object|null>} Badge object or null if not found
 */
export async function fetchBadgeById(categoryId, badgeId) {
  try {
    const categoryDoc = doc(db, 'badges', categoryId);
    const badgeDoc = doc(collection(categoryDoc, 'badges'), badgeId);
    const badgeSnap = await getDoc(badgeDoc);
    
    if (badgeSnap.exists()) {
      return {
        id: badgeSnap.id,
        category_id: categoryId,
        ...badgeSnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching badge ${badgeId} from category ${categoryId}:`, error);
    return null;
  }
}

/**
 * Search for a badge across all categories (for backward compatibility)
 * @param {string} badgeId - The badge ID to search for
 * @returns {Promise<Object|null>} Badge object with categoryId, or null if not found
 */
export async function findBadgeById(badgeId) {
  try {
    const categories = await fetchBadgeCategories();
    
    // Search through all categories
    for (const category of categories) {
      const badge = await fetchBadgeById(category.id, badgeId);
      if (badge) {
        return badge;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding badge ${badgeId}:`, error);
    return null;
  }
}

/**
 * Fetch multiple badge details by their IDs
 * @param {string[]} badgeIds - Array of badge IDs to fetch
 * @returns {Promise<Array>} Array of badge objects with id, title, description, categoryId, and imageUrl
 */
export async function fetchBadgeDetailsByIds(badgeIds) {
  if (!badgeIds || badgeIds.length === 0) {
    return [];
  }

  try {
    // Fetch all badge details in parallel
    const badgePromises = badgeIds.map(async (badgeId) => {
      const badgeDetails = await findBadgeById(badgeId);
      if (badgeDetails && badgeDetails.category_id) {
        const imageUrl = await getBadgeImageUrl(badgeDetails.category_id, badgeId);
        return {
          id: badgeId,
          title: badgeDetails.title || badgeId,
          description: badgeDetails.description || '',
          category_id: badgeDetails.category_id,
          imageUrl: imageUrl || null,
        };
      }
      return null;
    });

    const results = await Promise.all(badgePromises);
    
    // Update cache with newly fetched URLs
    const urlMap = {};
    results.forEach(badge => {
      if (badge && (badge.image_url)) {
        urlMap[badge.id] = badge.image_url;
      }
    });
    if (Object.keys(urlMap).length > 0) {
      // Merge with existing cache
      const existingCache = getCachedBadgeUrls() || {};
      setCachedBadgeUrls({ ...existingCache, ...urlMap });
    }
    
    // Filter out null results (badges that weren't found)
    return results.filter(badge => badge !== null);
  } catch (error) {
    console.error('Error fetching badge details by IDs:', error);
    return [];
  }
}

/**
 * Get the download URL for a badge image from Firebase Storage
 * Optimized: Since images are SVG and match document ID, try .svg first
 * @param {string} categoryId - The category ID (e.g., 'sdg', 'geography', 'general')
 * @param {string} badgeId - The ID of the badge (filename without extension)
 * @returns {Promise<string|null>} Download URL or null if error
 */
export async function getBadgeImageUrl(categoryId, badgeId) {
  try {
    if (!categoryId || !badgeId) {
      return null;
    }

    // Check cache first
    const cachedUrls = getCachedBadgeUrls();
    if (cachedUrls && cachedUrls[badgeId]) {
      return cachedUrls[badgeId];
    }
    // Since images are SVG and match document ID, try .svg first
    // Path format: badges/{category}/{badgeId}.svg
    const extensions = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
    
    // Try each extension with the category-specific path
    for (const ext of extensions) {
      try {
        const imagePath = `badges/${categoryId}/${badgeId}${ext}`;
        const imageRef = ref(storage, imagePath);
        
        // Add timeout to prevent hanging indefinitely (30 seconds max)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: getDownloadURL took longer than 30 seconds')), 30000);
        });
        
        const url = await Promise.race([
          getDownloadURL(imageRef),
          timeoutPromise
        ]);
        
        return url;
      } catch (error) {
        // Continue to next extension if not found
        continue;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Cache management for badge image URLs
 */
const BADGE_URL_CACHE_KEY = 'badge_image_urls';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached badge image URLs from localStorage
 * @returns {Object|null} Map of badgeId to imageUrl, or null if cache expired/missing
 */
export function getCachedBadgeUrls() {
  try {
    const cached = localStorage.getItem(BADGE_URL_CACHE_KEY);
    if (!cached) return null;
    
    const { urls, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    if (age > CACHE_DURATION) {
      localStorage.removeItem(BADGE_URL_CACHE_KEY);
      return null;
    }
    
    return urls;
  } catch (error) {
    console.error('Error reading badge URL cache:', error);
    return null;
  }
}

/**
 * Cache badge image URLs to localStorage
 * @param {Object} urls - Map of badgeId to imageUrl
 */
export function setCachedBadgeUrls(urls) {
  try {
    localStorage.setItem(BADGE_URL_CACHE_KEY, JSON.stringify({
      urls,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error caching badge URLs:', error);
    // If storage is full, try to clear old cache and retry
    try {
      localStorage.removeItem(BADGE_URL_CACHE_KEY);
      localStorage.setItem(BADGE_URL_CACHE_KEY, JSON.stringify({
        urls,
        timestamp: Date.now()
      }));
    } catch (retryError) {
      console.error('Failed to cache badge URLs after retry:', retryError);
    }
  }
}

/**
 * Batch load badge image URLs for multiple badges
 * Loads URLs in parallel with batching to avoid overwhelming the network
 * @param {Array} badges - Array of badge objects with id and categoryId properties
 * @param {number} batchSize - Number of badges to load in parallel (default: 10)
 * @returns {Promise<Object>} Map of badgeId to imageUrl
 */
export async function batchLoadBadgeImageUrls(badges, batchSize = 10) {
  const urlMap = {};
  
  // Process badges in batches
  for (let i = 0; i < badges.length; i += batchSize) {
    const batch = badges.slice(i, i + batchSize);
    const promises = batch.map(async (badge) => {
      try {
        if (!badge.category_id) {
          return { badgeId: badge.id, url: null };
        }
        const url = await getBadgeImageUrl(badge.category_id, badge.id);
        return { badgeId: badge.id, url };
      } catch (error) {
        return { badgeId: badge.id, url: null };
      }
    });
    
    const results = await Promise.all(promises);
    results.forEach(({ badgeId, url }) => {
      urlMap[badgeId] = url;
    });
  }
  
  return urlMap;
}

/**
 * Grant a badge to a user
 * @param {string} userId - The user's ID
 * @param {string} badgeId - The badge ID to grant
 * @returns {Promise<Object|null>} Badge details object if successful, null otherwise
 * Returns { id, title, description, xp } if badge was granted, null if already exists or error
 */
/**
 * Grant a badge to a user using Cloud Function (bypasses Firestore rules)
 * This function now uses a Cloud Function to grant badges, which allows
 * cross-user operations and bypasses Firestore security rules.
 * 
 * @param {string} userId - The user's ID
 * @param {string} badgeId - The badge ID to grant
 * @returns {Promise<Object|null>} Badge details object if successful, null otherwise
 */
export async function grantBadgeToUser(userId, badgeId) {
  try {
    if (!functions) {
      console.error('Firebase functions not initialized');
      return null;
    }

    console.log(`[grantBadgeToUser] Calling Cloud Function to grant badge ${badgeId} to user ${userId}`);
    
    // Use Cloud Function to grant badge (bypasses Firestore rules)
    const grantBadgeFn = httpsCallable(functions, 'grantBadgeToUser');
    const result = await grantBadgeFn({ userId, badgeId });
    
    if (result.data?.success) {
      const badge = result.data.badge;
      console.log(`[grantBadgeToUser] Badge ${badgeId} granted successfully to user ${userId}`);
      
      // Return badge details in the same format as before for compatibility
      return {
        id: badge.id,
        title: badge.title,
        description: badge.description,
        xp: badge.xp || 0
      };
    } else {
      const errorMsg = result.data?.error || 'Unknown error';
      console.error(`[grantBadgeToUser] Failed to grant badge: ${errorMsg}`);
      
      // Return null if user already has badge (maintains backward compatibility)
      if (errorMsg.includes('already has')) {
        return null;
      }
      
      return null;
    }
  } catch (error) {
    console.error(`[grantBadgeToUser] Error calling Cloud Function:`, error);
    console.error(`[grantBadgeToUser] Error details:`, {
      code: error.code,
      message: error.message,
      details: error.details
    });
    return null;
  }
}

/**
 * Admin only: remove a badge via Cloud Function (Admin SDK).
 * @param {string} userId - Target member uid
 * @param {string} badgeId - Badge ID to remove
 * @returns {Promise<Object|null>} Badge details if successful
 */
export async function adminRemoveBadgeFromUser(userId, badgeId) {
  try {
    if (!functions) {
      console.error('Firebase functions not initialized');
      return null;
    }
    const fn = httpsCallable(functions, 'adminRemoveBadgeFromUser');
    const result = await fn({ userId, badgeId });
    const data = result.data;
    if (data?.success && data.badge) {
      return {
        id: data.badge.id,
        title: data.badge.title,
        description: data.badge.description || '',
        xp: data.badge.xp || 0,
      };
    }
    console.warn('[adminRemoveBadgeFromUser]', data?.error || 'failed');
    return null;
  } catch (error) {
    console.error('[adminRemoveBadgeFromUser]', error);
    return null;
  }
}

/**
 * Check if user has a specific badge
 * @param {string} userId - The user's ID
 * @param {string} badgeId - The badge ID to check
 * @returns {Promise<boolean>} True if user has the badge, false otherwise
 */
export async function userHasBadge(userId, badgeId) {
  try {
    const memberDoc = doc(db, 'members', userId);
    const memberSnap = await getDoc(memberDoc);
    
    if (!memberSnap.exists()) {
      return false;
    }
    
    const memberData = memberSnap.data();
    const badges = memberData.badges || [];
    
    return badges.some(badge => badge.id === badgeId);
  } catch (error) {
    console.error(`Error checking badge for user ${userId}:`, error);
    return false;
  }
}

/**
 * Fetch user badge IDs only (optimized for performance)
 * @param {string} userId - The user's ID
 * @returns {Promise<Set>} Set of badge IDs the user has earned
 */
export async function fetchUserBadgeIds(userId) {
  try {
    const memberDoc = doc(db, 'members', userId);
    const memberSnap = await getDoc(memberDoc);
    
    if (!memberSnap.exists()) {
      return new Set();
    }
    
    const memberData = memberSnap.data();
    const userBadges = memberData.badges || [];
    
    // Return just the badge IDs as a Set for fast lookup
    return new Set(userBadges.map(badge => badge.id));
  } catch (error) {
    console.error(`Error fetching user badge IDs for ${userId}:`, error);
    return new Set();
  }
}

/**
 * Fetch user badges with full badge details
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of badge objects with full details including earnedDate
 */
export async function fetchUserBadges(userId) {
  try {
    const memberDoc = doc(db, 'members', userId);
    const memberSnap = await getDoc(memberDoc);
    
    if (!memberSnap.exists()) {
      return [];
    }
    
    const memberData = memberSnap.data();
    const userBadges = memberData.badges || [];
    
    console.log(`User ${userId} has ${userBadges.length} badges in profile:`, userBadges);
    
    if (userBadges.length === 0) {
      return [];
    }
    
    // Fetch full badge details for each badge
    const badgesWithDetails = await Promise.all(
      userBadges.map(async (userBadge) => {
        console.log(`Fetching badge details for: ${userBadge.id}`);
        const badgeDetails = await findBadgeById(userBadge.id);
        console.log(`Badge details for ${userBadge.id}:`, badgeDetails);
        
        if (badgeDetails) {
          // Badge document exists, use full details
          return {
            ...badgeDetails,
            earnedDate: userBadge.earnedDate
          };
        } else {
          // Badge document doesn't exist, use fallback with just ID
          // This allows badges to display even if the badge document hasn't been created yet
          console.warn(`Badge ${userBadge.id} not found in badges collection, using fallback`);
          
          // Generate a readable title from badge ID
          // Handle both camelCase (completeProfile) and snake_case (profile_complete)
          let readableTitle = userBadge.id;
          if (userBadge.id.includes('_')) {
            // Snake case: "profile_complete" -> "Profile Complete"
            readableTitle = userBadge.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          } else {
            // Camel case: "completeProfile" -> "Complete Profile"
            readableTitle = userBadge.id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
          }
          
          return {
            id: userBadge.id,
            title: readableTitle,
            description: `You earned the ${readableTitle} badge!`,
            earnedDate: userBadge.earnedDate
          };
        }
      })
    );
    
    // All badges should be valid now (either with full details or fallback)
    console.log(`Returning ${badgesWithDetails.length} badges`);
    return badgesWithDetails;
  } catch (error) {
    console.error(`Error fetching user badges for ${userId}:`, error);
    return [];
  }
}

/**
 * Post-signup referral reward (server reads `referred_by`, optional code hint).
 * Does not throw; logs on failure.
 * @param {string} [referralCodeFromSignup] Validated signup code; fills doc if missing
 * @returns {Promise<Object|undefined>}
 */
export async function handleReferralReward(referralCodeFromSignup) {
  try {
    if (!functions) {
      console.error('[handleReferralReward] Firebase functions not initialized');
      return undefined;
    }
    const normalized = referralCodeFromSignup
      ? String(referralCodeFromSignup).toUpperCase().trim()
      : '';
    const processFn = httpsCallable(functions, 'processReferralRewardOnSignup');
    const result = await processFn(
      normalized ? { referral_code: normalized } : {},
    );
    const data = result?.data || {};
    if (data.success === false && data.error) {
      console.warn('[handleReferralReward]', data.error);
    }
    return data;
  } catch (error) {
    console.error('[handleReferralReward] Error:', error);
    return undefined;
  }
}

/**
 * Create a new badge category
 * @param {string} categoryId - The category ID
 * @param {Object} categoryData - Category data (title, description, order)
 * @returns {Promise<boolean>} True if successful
 */
export async function createBadgeCategory(categoryId, categoryData) {
  try {
    const categoryDoc = doc(db, 'badges', categoryId);
    await setDoc(categoryDoc, {
      title: categoryData.title || categoryId,
      description: categoryData.description || '',
      order: categoryData.order || 0,
      ...categoryData
    });
    console.log(`Category ${categoryId} created successfully`);
    return true;
  } catch (error) {
    console.error(`Error creating category ${categoryId}:`, error);
    throw error;
  }
}

/**
 * Delete a badge category
 * @param {string} categoryId - The category ID to delete
 * @returns {Promise<boolean>} True if successful
 */
export async function deleteBadgeCategory(categoryId) {
  try {
    // First, delete all badges in the category
    const badges = await fetchBadgesByCategory(categoryId);
    for (const badge of badges) {
      await deleteBadge(categoryId, badge.id);
    }
    
    // Then delete the category document
    const categoryDoc = doc(db, 'badges', categoryId);
    await deleteDoc(categoryDoc);
    console.log(`Category ${categoryId} deleted successfully`);
    return true;
  } catch (error) {
    console.error(`Error deleting category ${categoryId}:`, error);
    throw error;
  }
}

/**
 * Create a new badge
 * @param {string} categoryId - The category ID
 * @param {string} badgeId - The badge ID (will be used as document ID)
 * @param {Object} badgeData - Badge data (title, description, xp)
 * @param {File} imageFile - Optional image file to upload
 * @returns {Promise<boolean>} True if successful
 */
export async function createBadge(categoryId, badgeId, badgeData, imageFile = null) {
  try {
    const categoryDoc = doc(db, 'badges', categoryId);
    const badgesCollection = collection(categoryDoc, 'badges');
    const badgeDoc = doc(badgesCollection, badgeId);
    
    // Create badge document
    const { imageUrl, measurementType, ...restBadgeData } = badgeData;
    const firestorePayload = {
      title: badgeData.title || badgeId,
      description: badgeData.description || '',
      xp: badgeData.xp || 0,
      ...restBadgeData,
    };
    if (imageUrl != null) firestorePayload.image_url = imageUrl;
    if (measurementType != null) firestorePayload.measurement_type = measurementType;
    await setDoc(badgeDoc, firestorePayload);
    
    // Upload image if provided
    if (imageFile) {
      // Use badgeId for image name (should match document ID)
      // Get file extension
      const fileExtension = imageFile.name.split('.').pop();
      const imagePath = `badges/${categoryId}/${badgeId}.${fileExtension}`;
      
      await uploadFile(imageFile, imagePath);
      console.log(`Badge image uploaded to ${imagePath}`);
    }
    
    console.log(`Badge ${badgeId} created in category ${categoryId}`);
    return true;
  } catch (error) {
    console.error(`Error creating badge ${badgeId}:`, error);
    throw error;
  }
}

/**
 * Update an existing badge
 * @param {string} categoryId - The category ID
 * @param {string} badgeId - The badge ID
 * @param {Object} badgeData - Updated badge data
 * @param {File} imageFile - Optional new image file to upload
 * @returns {Promise<boolean>} True if successful
 */
export async function updateBadge(categoryId, badgeId, badgeData, imageFile = null) {
  try {
    const categoryDoc = doc(db, 'badges', categoryId);
    const badgeDoc = doc(collection(categoryDoc, 'badges'), badgeId);
    
    const { imageUrl, measurementType, ...rest } = badgeData;
    const payload = { ...rest };
    if (imageUrl !== undefined) payload.image_url = imageUrl;
    if (measurementType !== undefined) payload.measurement_type = measurementType;
    await updateDoc(badgeDoc, payload);
    
    // Upload new image if provided
    if (imageFile) {
      // Use badgeId for image name (should match document ID)
      const fileExtension = imageFile.name.split('.').pop();
      const imagePath = `badges/${categoryId}/${badgeId}.${fileExtension}`;
      
      await uploadFile(imageFile, imagePath);
      console.log(`Badge image updated at ${imagePath}`);
    }
    
    console.log(`Badge ${badgeId} updated in category ${categoryId}`);
    return true;
  } catch (error) {
    console.error(`Error updating badge ${badgeId}:`, error);
    throw error;
  }
}

/**
 * Delete a badge
 * @param {string} categoryId - The category ID
 * @param {string} badgeId - The badge ID to delete
 * @returns {Promise<boolean>} True if successful
 */
export async function deleteBadge(categoryId, badgeId) {
  try {
    // Delete badge document
    const categoryDoc = doc(db, 'badges', categoryId);
    const badgeDoc = doc(collection(categoryDoc, 'badges'), badgeId);
    await deleteDoc(badgeDoc);
    
    // Try to delete badge image (may not exist, so catch errors)
    const extensions = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
    for (const ext of extensions) {
      try {
        const imagePath = `badges/${categoryId}/${badgeId}${ext}`;
        const imageRef = ref(storage, imagePath);
        await deleteObject(imageRef);
        console.log(`Badge image deleted: ${imagePath}`);
        break; // If one extension works, stop trying others
      } catch (error) {
        // Continue to next extension if not found
        continue;
      }
    }
    
    console.log(`Badge ${badgeId} deleted from category ${categoryId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting badge ${badgeId}:`, error);
    throw error;
  }
}

