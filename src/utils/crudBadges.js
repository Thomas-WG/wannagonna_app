import { collection, getDocs, getDoc, doc, updateDoc, arrayUnion, Timestamp, increment } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from 'firebaseConfig';

/**
 * Fetch all badges from the badges collection
 * @returns {Promise<Array>} Array of badge objects with id, title, description
 */
export async function fetchAllBadges() {
  try {
    const badgesCollection = collection(db, 'badges');
    const snapshot = await getDocs(badgesCollection);
    
    const badges = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return badges;
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
}

/**
 * Fetch a specific badge by ID
 * @param {string} badgeId - The ID of the badge
 * @returns {Promise<Object|null>} Badge object or null if not found
 */
export async function fetchBadgeById(badgeId) {
  try {
    const badgeDoc = doc(db, 'badges', badgeId);
    const badgeSnap = await getDoc(badgeDoc);
    
    if (badgeSnap.exists()) {
      return {
        id: badgeSnap.id,
        ...badgeSnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching badge ${badgeId}:`, error);
    return null;
  }
}

/**
 * Get the download URL for a badge image from Firebase Storage
 * @param {string} badgeId - The ID of the badge (filename without extension)
 * @returns {Promise<string|null>} Download URL or null if error
 */
export async function getBadgeImageUrl(badgeId) {
  try {
    // Try common image extensions
    const extensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    
    // Generate possible filename variations
    // Try the badgeId first (most common case - badgeId matches filename)
    // Then try variations for backwards compatibility
    const variations = [
      badgeId, // Original: exact match (e.g., "completeProfile")
      // For snake_case IDs like "profile_complete" -> try camelCase variations
      ...(badgeId.includes('_') ? [
        badgeId.split('_').reverse().join(''), // Reversed: "complete_profile" -> "completeprofile"
        badgeId.split('_').map((word, index) => 
          index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        ).join(''), // CamelCase: "profile_complete" -> "profileComplete"
        badgeId.split('_').reverse().map((word, index) => 
          index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        ).join(''), // Reversed CamelCase: "completeProfile"
        badgeId.replace(/_/g, ''), // No underscores: "profilecomplete"
        badgeId.split('_').reverse().join('').replace(/_/g, ''), // Reversed no underscores: "completeprofile"
      ] : [])
    ];
    
    // Remove duplicates
    const uniqueVariations = [...new Set(variations)];
    
    // Try each variation with each extension
    for (const variation of uniqueVariations) {
      for (const ext of extensions) {
        try {
          const imageRef = ref(storage, `badges/${variation}${ext}`);
          const url = await getDownloadURL(imageRef);
          console.log(`Found badge image: badges/${variation}${ext}`);
          return url;
        } catch (error) {
          // Continue to next variation/extension if this one fails
          continue;
        }
      }
    }
    
    console.warn(`Could not find badge image for ${badgeId} (tried variations: ${uniqueVariations.join(', ')})`);
    return null;
  } catch (error) {
    console.error(`Error getting badge image URL for ${badgeId}:`, error);
    return null;
  }
}

/**
 * Grant a badge to a user
 * @param {string} userId - The user's ID
 * @param {string} badgeId - The badge ID to grant
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function grantBadgeToUser(userId, badgeId) {
  try {
    const memberDoc = doc(db, 'members', userId);
    
    // Fetch badge document first to get XP value
    const badgeDetails = await fetchBadgeById(badgeId);
    console.log(`Badge details for ${badgeId}:`, badgeDetails);
    
    if (!badgeDetails) {
      console.error(`Badge document ${badgeId} not found in Firestore`);
      return false;
    }
    
    const badgeXP = badgeDetails.xp || 0;
    console.log(`XP value from badge ${badgeId}: ${badgeXP}`);
    
    // Check if user already has this badge
    const memberSnap = await getDoc(memberDoc);
    if (!memberSnap.exists()) {
      console.error(`Member document ${userId} does not exist`);
      return false;
    }
    
    const memberData = memberSnap.data();
    const existingBadges = memberData.badges || [];
    
    // Check if badge already exists
    const badgeExists = existingBadges.some(badge => badge.id === badgeId);
    if (badgeExists) {
      console.log(`User ${userId} already has badge ${badgeId} - skipping XP grant`);
      return false;
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
    return true;
  } catch (error) {
    console.error(`Error granting badge ${badgeId} to user ${userId}:`, error);
    return false;
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
        const badgeDetails = await fetchBadgeById(userBadge.id);
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

