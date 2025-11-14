import { collection, getDocs, getDoc, doc, updateDoc, arrayUnion, Timestamp, increment, setDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from 'firebaseConfig';

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

    // Since images are SVG and match document ID, try .svg first
    // Path format: badges/{category}/{badgeId}.svg
    const extensions = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
    
    // Try each extension with the category-specific path
    for (const ext of extensions) {
      try {
        const imagePath = `badges/${categoryId}/${badgeId}${ext}`;
        const imageRef = ref(storage, imagePath);
        const url = await getDownloadURL(imageRef);
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
    if (Date.now() - timestamp > CACHE_DURATION) {
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

