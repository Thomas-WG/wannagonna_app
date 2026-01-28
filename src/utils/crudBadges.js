import { collection, getDocs, getDoc, doc, updateDoc, arrayUnion, arrayRemove, Timestamp, increment, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db, functions } from 'firebaseConfig';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from 'firebaseConfig';
import { logXpHistory } from './crudXpHistory';
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
      categoryId,
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
        categoryId,
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
      if (badgeDetails && badgeDetails.categoryId) {
        // Fetch image URL (will check cache first)
        const imageUrl = await getBadgeImageUrl(badgeDetails.categoryId, badgeId);
        return {
          id: badgeId,
          title: badgeDetails.title || badgeId,
          description: badgeDetails.description || '',
          categoryId: badgeDetails.categoryId,
          imageUrl: imageUrl || null,
        };
      }
      return null;
    });

    const results = await Promise.all(badgePromises);
    
    // Update cache with newly fetched URLs
    const urlMap = {};
    results.forEach(badge => {
      if (badge && badge.imageUrl) {
        urlMap[badge.id] = badge.imageUrl;
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
        if (!badge.categoryId) {
          return { badgeId: badge.id, url: null };
        }
        const url = await getBadgeImageUrl(badge.categoryId, badge.id);
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
export async function grantBadgeToUser(userId, badgeId) {
  try {
    const memberDoc = doc(db, 'members', userId);
    
    // Search for badge across all categories
    const badgeDetails = await findBadgeById(badgeId);
    console.log(`Badge details for ${badgeId}:`, badgeDetails);
    
    if (!badgeDetails) {
      console.error(`Badge document ${badgeId} not found in Firestore`);
      return null;
    }
    
    const badgeXP = badgeDetails.xp || 0;
    console.log(`XP value from badge ${badgeId}: ${badgeXP}`);
    
    // Check if user already has this badge
    const memberSnap = await getDoc(memberDoc);
    if (!memberSnap.exists()) {
      console.error(`Member document ${userId} does not exist`);
      return null;
    }
    
    const memberData = memberSnap.data();
    const existingBadges = memberData.badges || [];
    
    // Check if badge already exists
    const badgeExists = existingBadges.some(badge => badge.id === badgeId);
    if (badgeExists) {
      console.log(`User ${userId} already has badge ${badgeId} - skipping XP grant`);
      return null;
    }
    
    // Prepare update data
    const updateData = {
      badges: arrayUnion({
        id: badgeId,
        earnedDate: Timestamp.now()
      })
    };
    
    // Add XP increment if badge has XP value
    if (badgeXP > 0) {
      updateData.xp = increment(badgeXP);
      console.log(`Adding ${badgeXP} XP for badge ${badgeId}`);
    } else {
      console.warn(`Badge ${badgeId} has no XP value (xp field missing or 0)`);
    }
    
    console.log(`Update data:`, updateData);
    await updateDoc(memberDoc, updateData);
    
    console.log(`Badge ${badgeId} granted to user ${userId}${badgeXP > 0 ? ` with ${badgeXP} XP` : ''}`);
    
    // Log XP history if XP was awarded (always log badge earning, even if XP is 0)
    const historyTitle = `Badge Earned: ${badgeDetails.title}`;
    if (badgeXP > 0) {
      await logXpHistory(userId, historyTitle, badgeXP, 'badge');
    } else {
      // Log badge earning even without XP for tracking purposes
      await logXpHistory(userId, historyTitle, 0, 'badge');
    }
    
    // Send notification to user (in-app and/or push based on preferences)
    try {
      const notifyFn = httpsCallable(functions, 'notifyBadgeEarned');
      await notifyFn({
        userId,
        badgeTitle: badgeDetails.title,
        badgeXP,
        badgeId
      });
    } catch (notifyError) {
      console.error(`Failed to send badge notification for ${badgeId}:`, notifyError);
      // Don't fail the badge grant if notification fails
    }
    
    // Return badge details for animation/display
    return {
      id: badgeId,
      title: badgeDetails.title,
      description: badgeDetails.description,
      xp: badgeXP
    };
  } catch (error) {
    console.error(`Error granting badge ${badgeId} to user ${userId}:`, error);
    return null;
  }
}

/**
 * Remove a badge from a user
 * @param {string} userId - The user's ID
 * @param {string} badgeId - The badge ID to remove
 * @returns {Promise<Object|null>} Badge details object if successful, null otherwise
 */
export async function removeBadgeFromUser(userId, badgeId) {
  try {
    const memberDoc = doc(db, 'members', userId);
    
    // Get current member data to find the badge object
    const memberSnap = await getDoc(memberDoc);
    if (!memberSnap.exists()) {
      console.error(`Member document ${userId} does not exist`);
      return null;
    }
    
    const memberData = memberSnap.data();
    const existingBadges = memberData.badges || [];
    
    // Find the badge object to remove (need exact object for arrayRemove)
    const badgeToRemove = existingBadges.find(badge => badge.id === badgeId);
    if (!badgeToRemove) {
      console.log(`User ${userId} does not have badge ${badgeId}`);
      return null;
    }
    
    // Get badge details to check XP value
    const badgeDetails = await findBadgeById(badgeId);
    const badgeXP = badgeDetails?.xp || 0;
    
    // Remove the badge from the array
    await updateDoc(memberDoc, {
      badges: arrayRemove(badgeToRemove)
    });
    
    // Decrement XP if badge had XP value
    if (badgeXP > 0) {
      await updateDoc(memberDoc, {
        xp: increment(-badgeXP)
      });
      console.log(`Removed ${badgeXP} XP for badge ${badgeId}`);
    }
    
    console.log(`Badge ${badgeId} removed from user ${userId}`);
    
    return {
      id: badgeId,
      title: badgeDetails?.title || badgeId,
      description: badgeDetails?.description || '',
      xp: badgeXP
    };
  } catch (error) {
    console.error(`Error removing badge ${badgeId} from user ${userId}:`, error);
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
 * Award XP points to a user without granting a badge
 * @param {string} userId - The user's ID
 * @param {number} points - The number of XP points to award
 * @param {string} title - The title/description of the XP earning event
 * @param {string} type - The type of XP earning (e.g., "referral", "activity")
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function awardXpToUser(userId, points, title, type = 'unknown') {
  try {
    if (!userId || !points || points <= 0) {
      console.error('Invalid parameters for awardXpToUser:', { userId, points, title, type });
      return false;
    }

    const memberDoc = doc(db, 'members', userId);
    
    // Check if user exists
    const memberSnap = await getDoc(memberDoc);
    if (!memberSnap.exists()) {
      console.error(`Member document ${userId} does not exist`);
      return false;
    }

    // Increment XP using Firestore increment for atomic operation
    await updateDoc(memberDoc, {
      xp: increment(points)
    });

    console.log(`Awarded ${points} XP to user ${userId} for: ${title}`);

    // Log to XP history
    await logXpHistory(userId, title, points, type);

    return true;
  } catch (error) {
    console.error(`Error awarding XP to user ${userId}:`, error);
    return false;
  }
}

/**
 * Handle referral reward when a new user signs up with a referral code
 * Grants "buddyBuilder" badge on first referral, awards XP on subsequent referrals
 * @param {string} referralCode - The referral code used by the new user
 * @returns {Promise<void>}
 */
export async function handleReferralReward(referralCode) {
  console.log(`[handleReferralReward] Called with referral code: ${referralCode}`);
  try {
    if (!referralCode || referralCode.trim().length === 0) {
      console.log('No referral code provided, skipping referral reward');
      return;
    }

    // Find the referrer user by their code using Cloud Function
    console.log(`[handleReferralReward] Looking up referrer with code: ${referralCode}`);
    
    // Use Cloud Function to find user by code (secure backend lookup)
    let referrerId = null;
    try {
      if (!functions) {
        throw new Error('Firebase functions not initialized');
      }
      
      const findUserByCodeFn = httpsCallable(functions, 'findUserByCode');
      console.log(`[handleReferralReward] Calling Cloud Function findUserByCode with code: ${referralCode}`);
      
      const result = await findUserByCodeFn({ code: referralCode });
      console.log(`[handleReferralReward] Cloud Function response:`, result);
      
      const { user } = result.data || {};
      
      if (user && user.id) {
        referrerId = user.id;
        console.log(`[handleReferralReward] Found referrer: ${referrerId}`);
      } else {
        console.warn(`[handleReferralReward] Referrer not found for code: ${referralCode} - user data:`, user);
        return;
      }
    } catch (error) {
      console.error(`[handleReferralReward] Error finding referrer:`, error);
      console.error(`[handleReferralReward] Error details:`, {
        message: error?.message || String(error),
        code: error?.code || 'NO_CODE',
        details: error?.details || error?.toString() || 'No details',
        stack: error?.stack || 'No stack trace',
        errorType: error?.constructor?.name || typeof error,
        errorString: String(error),
        fullError: error
      });
      // Don't throw - referral reward failure shouldn't block account creation
      return;
    }
    const badgeId = 'buddyBuilder';
    console.log(`[handleReferralReward] Found referrer: ${referrerId}, checking for badge: ${badgeId}`);

    // Check if referrer already has the buddyBuilder badge
    const hasBadge = await userHasBadge(referrerId, badgeId);
    console.log(`[handleReferralReward] Referrer ${referrerId} has badge ${badgeId}: ${hasBadge}`);

    if (!hasBadge) {
      // First referral - grant the badge (which will award XP automatically)
      console.log(`Granting ${badgeId} badge to referrer ${referrerId} for first referral`);
      const badgeDetails = await grantBadgeToUser(referrerId, badgeId);
      if (badgeDetails) {
        // Notify referrer via Cloud Function (in-app + push)
        try {
          const notifyFn = httpsCallable(functions, 'notifyReferralReward');
          await notifyFn({
            referrerId,
            mode: 'first',
            badgeXP: badgeDetails.xp || 0,
            referralCode: referralCode.toUpperCase().trim(),
          });
        } catch (notifyError) {
          console.error('Failed to send referral notification (first):', notifyError);
        }
        console.log(`Badge ${badgeId} granted successfully to ${referrerId}`);
      } else {
        console.error(`Failed to grant badge ${badgeId} to ${referrerId}`);
      }
    } else {
      // Subsequent referral - award XP points from badge value without granting badge again
      console.log(`Referrer ${referrerId} already has ${badgeId} badge, awarding XP only`);
      
      // Get badge details to retrieve XP value
      console.log(`Searching for badge ${badgeId} to get XP value...`);
      const badgeDetails = await findBadgeById(badgeId);
      if (!badgeDetails) {
        console.error(`Badge ${badgeId} not found in Firestore - cannot award XP`);
        return;
      }

      console.log(`Found badge ${badgeId} with details:`, { 
        id: badgeDetails.id, 
        title: badgeDetails.title, 
        xp: badgeDetails.xp,
        categoryId: badgeDetails.categoryId 
      });

      const badgeXP = badgeDetails.xp || 0;
      console.log(`Badge XP value: ${badgeXP}`);
      
      if (badgeXP > 0) {
        const success = await awardXpToUser(
          referrerId,
          badgeXP,
          'Referred member',
          'referral'
        );
        if (success) {
          try {
            const notifyFn = httpsCallable(functions, 'notifyReferralReward');
            await notifyFn({
              referrerId,
              mode: 'xp',
              badgeXP,
              referralCode: referralCode.toUpperCase().trim(),
            });
          } catch (notifyError) {
            console.error('Failed to send referral notification (XP):', notifyError);
          }
        }
      } else {
        console.warn(`Badge ${badgeId} has no XP value (xp=${badgeXP}), nothing to award`);
      }
    }
  } catch (error) {
    // Log error but don't throw - account creation should succeed even if reward fails
    console.error('[handleReferralReward] Error handling referral reward:', error);
    console.error('[handleReferralReward] Error details:', {
      message: error?.message || 'Unknown error',
      code: error?.code || 'NO_CODE',
      details: error?.details || 'No details',
      stack: error?.stack || 'No stack trace',
      errorType: error?.constructor?.name || typeof error,
      referralCode: referralCode,
      fullError: error
    });
  }
}

/**
 * Grant activity completion badges to a user
 * This function grants: SDG badge, continent badge, and activity type badge (firstLocal, firstOnline, firstEvent)
 * Should be called whenever an activity is completed/validated (via QR code or manually)
 * @param {string} userId - The user's ID
 * @param {Object} activity - The activity object with all activity details
 * @returns {Promise<Array>} Array of granted badge details
 */
export async function grantActivityCompletionBadges(userId, activity) {
  const grantedBadges = [];
  
  try {
    if (!userId || !activity) {
      console.error('Invalid parameters for grantActivityCompletionBadges:', { userId, activity });
      return grantedBadges;
    }

    // Import dependencies dynamically to avoid circular dependencies
    const { fetchOrganizationById } = await import('./crudOrganizations');
    const { getContinentFromCountry } = await import('./continentMapping');

    // Grant SDG badge if activity has SDG and user doesn't have it
    if (activity.sdg) {
      const sdgBadgeId = activity.sdg.toString();
      const hasSdgBadge = await userHasBadge(userId, sdgBadgeId);
      
      if (!hasSdgBadge) {
        const badgeResult = await grantBadgeToUser(userId, sdgBadgeId);
        if (badgeResult) {
          grantedBadges.push(badgeResult);
          console.log(`SDG badge ${sdgBadgeId} granted to user ${userId}`);
        }
      }
    }

    // Grant continent badge if organization has country
    if (activity.organizationId) {
      try {
        const organization = await fetchOrganizationById(activity.organizationId);
        if (organization && organization.country) {
          const continentId = getContinentFromCountry(organization.country);
          
          if (continentId) {
            const hasContinentBadge = await userHasBadge(userId, continentId);
            
            if (!hasContinentBadge) {
              const badgeResult = await grantBadgeToUser(userId, continentId);
              if (badgeResult) {
                grantedBadges.push(badgeResult);
                console.log(`Continent badge ${continentId} granted to user ${userId}`);
              }
            }
          }
        }
      } catch (orgError) {
        console.error('Error fetching organization for continent badge:', orgError);
        // Continue even if organization fetch fails
      }
    }

    // Grant activity type badge (firstOnline, firstLocal, or firstEvent)
    let activityTypeBadgeId = null;
    if (activity.type === "online") {
      activityTypeBadgeId = "firstOnline";
    } else if (activity.type === "local") {
      activityTypeBadgeId = "firstLocal";
    } else if (activity.type === "event") {
      activityTypeBadgeId = "firstEvent";
    }

    if (activityTypeBadgeId) {
      const hasActivityTypeBadge = await userHasBadge(userId, activityTypeBadgeId);

      if (!hasActivityTypeBadge) {
        const badgeResult = await grantBadgeToUser(userId, activityTypeBadgeId);
        if (badgeResult) {
          grantedBadges.push(badgeResult);
          console.log(`Activity type badge ${activityTypeBadgeId} granted to user ${userId}`);
        }
      }
    }

    return grantedBadges;
  } catch (error) {
    console.error(`Error granting activity completion badges to user ${userId}:`, error);
    return grantedBadges; // Return what we've granted so far
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
    await setDoc(badgeDoc, {
      title: badgeData.title || badgeId,
      description: badgeData.description || '',
      xp: badgeData.xp || 0,
      ...badgeData
    });
    
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
    
    // Update badge document
    await updateDoc(badgeDoc, badgeData);
    
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

