import {db} from "../init.js";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {sendUserNotification} from "../notifications/notificationService.js";

/**
 * Continent mapping - matches client-side logic
 */
const countryToContinent = {
  // North America
  "US": "north-america",
  "CA": "north-america",
  "MX": "north-america",
  "GT": "north-america",
  "BZ": "north-america",
  "SV": "north-america",
  "HN": "north-america",
  "NI": "north-america",
  "CR": "north-america",
  "PA": "north-america",
  "CU": "north-america",
  "JM": "north-america",
  "HT": "north-america",
  "DO": "north-america",
  "BS": "north-america",
  "BB": "north-america",
  "TT": "north-america",
  "GD": "north-america",
  "LC": "north-america",
  "VC": "north-america",
  "AG": "north-america",
  "KN": "north-america",
  "DM": "north-america",
  // South America
  "BR": "south-america",
  "AR": "south-america",
  "CO": "south-america",
  "PE": "south-america",
  "VE": "south-america",
  "CL": "south-america",
  "EC": "south-america",
  "BO": "south-america",
  "PY": "south-america",
  "UY": "south-america",
  "GY": "south-america",
  "SR": "south-america",
  "GF": "south-america",
  "FK": "south-america",
  // Europe
  "GB": "europe",
  "FR": "europe",
  "DE": "europe",
  "IT": "europe",
  "ES": "europe",
  "PL": "europe",
  "NL": "europe",
  "BE": "europe",
  "GR": "europe",
  "PT": "europe",
  "CZ": "europe",
  "RO": "europe",
  "HU": "europe",
  "SE": "europe",
  "AT": "europe",
  "CH": "europe",
  "BG": "europe",
  "DK": "europe",
  "FI": "europe",
  "SK": "europe",
  "IE": "europe",
  "HR": "europe",
  "NO": "europe",
  "RS": "europe",
  "SI": "europe",
  "LT": "europe",
  "LV": "europe",
  "EE": "europe",
  "LU": "europe",
  "CY": "europe",
  "MT": "europe",
  "IS": "europe",
  "AL": "europe",
  "MK": "europe",
  "BA": "europe",
  "ME": "europe",
  "RU": "europe",
  "UA": "europe",
  "BY": "europe",
  "MD": "europe",
  "GE": "europe",
  "AM": "europe",
  "AZ": "europe",
  // Asia
  "CN": "asia",
  "IN": "asia",
  "ID": "asia",
  "PK": "asia",
  "BD": "asia",
  "JP": "asia",
  "PH": "asia",
  "VN": "asia",
  "TH": "asia",
  "MY": "asia",
  "MM": "asia",
  "KR": "asia",
  "KH": "asia",
  "LA": "asia",
  "SG": "asia",
  "TW": "asia",
  "HK": "asia",
  "MN": "asia",
  "NP": "asia",
  "LK": "asia",
  "AF": "asia",
  "KZ": "asia",
  "UZ": "asia",
  "SA": "asia",
  "IR": "asia",
  "IQ": "asia",
  "AE": "asia",
  "IL": "asia",
  "JO": "asia",
  "LB": "asia",
  "KW": "asia",
  "OM": "asia",
  "QA": "asia",
  "BH": "asia",
  "YE": "asia",
  "TR": "asia",
  "TM": "asia",
  "TJ": "asia",
  "KG": "asia",
  // Africa
  "NG": "africa",
  "ET": "africa",
  "EG": "africa",
  "CD": "africa",
  "TZ": "africa",
  "ZA": "africa",
  "KE": "africa",
  "UG": "africa",
  "SD": "africa",
  "DZ": "africa",
  "MA": "africa",
  "AO": "africa",
  "GH": "africa",
  "MZ": "africa",
  "MG": "africa",
  "CM": "africa",
  "CI": "africa",
  "NE": "africa",
  "BF": "africa",
  "ML": "africa",
  "MW": "africa",
  "ZM": "africa",
  "SN": "africa",
  "TD": "africa",
  "ZW": "africa",
  "GN": "africa",
  "RW": "africa",
  "BJ": "africa",
  "TN": "africa",
  "BI": "africa",
  "SS": "africa",
  "SO": "africa",
  "TG": "africa",
  "ER": "africa",
  "SL": "africa",
  "LY": "africa",
  "CG": "africa",
  "LR": "africa",
  "CF": "africa",
  "MR": "africa",
  "GM": "africa",
  "GW": "africa",
  "DJ": "africa",
  "BW": "africa",
  "LS": "africa",
  "GQ": "africa",
  "GA": "africa",
  "MU": "africa",
  "EH": "africa",
  "SC": "africa",
  "CV": "africa",
  "KM": "africa",
  "ST": "africa",
  "RE": "africa",
  "YT": "africa",
  "SH": "africa",
  // Oceania
  "AU": "oceania",
  "NZ": "oceania",
  "PG": "oceania",
  "FJ": "oceania",
  "SB": "oceania",
  "NC": "oceania",
  "PF": "oceania",
  "VU": "oceania",
  "KI": "oceania",
  "FM": "oceania",
  "TO": "oceania",
  "MH": "oceania",
  "PW": "oceania",
  "TV": "oceania",
  "NR": "oceania",
  "CK": "oceania",
  "NU": "oceania",
  "AS": "oceania",
  "GU": "oceania",
  "MP": "oceania",
};

/**
 * Get continent badge ID from country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @return {string|null} Continent badge ID or null if not found
 */
function getContinentFromCountry(countryCode) {
  if (!countryCode) {
    return null;
  }
  const upperCode = countryCode.toUpperCase();
  return countryToContinent[upperCode] || null;
}

/**
 * Get activity type badge ID
 * @param {string} activityType - Activity type (online, local, event)
 * @return {string|null} Activity type badge ID or null if not found
 */
function getActivityTypeBadgeId(activityType) {
  const mapping = {
    "online": "firstOnline",
    "local": "firstLocal",
    "event": "firstEvent",
  };
  return mapping[activityType] || null;
}

/**
 * Find badge document across all categories
 * @param {string} badgeId - Badge ID to find
 * @return {Promise<Object|null>} Badge document with data and categoryId,
 *     or null if not found
 */
async function findBadgeDocument(badgeId) {
  try {
    const categoriesSnapshot = await db.collection("badges").get();
    const categories = categoriesSnapshot.docs;

    // Search through all categories in parallel
    const searchPromises = categories.map(async (categoryDoc) => {
      const badgeDoc = await categoryDoc.ref
          .collection("badges")
          .doc(badgeId)
          .get();
      if (badgeDoc.exists) {
        return {
          data: badgeDoc.data(),
          categoryId: categoryDoc.id,
        };
      }
      return null;
    });

    const results = await Promise.all(searchPromises);
    const found = results.find((r) => r !== null);
    return found;
  } catch (error) {
    console.error(`Error finding badge ${badgeId}:`, error);
    return null;
  }
}

/**
 * All continent badge IDs
 */
const ALL_CONTINENT_BADGES = [
  "america",
  "europe",
  "asia",
  "africa",
  "oceania",
];

/**
 * All SDG badge IDs (1-17)
 */
const ALL_SDG_BADGES = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17",
];

/**
 * Check if user has all continent badges and should receive "world" badge
 * @param {Set<string>} userBadges - Set of badge IDs user has
 * @return {Promise<Object|null>} Badge details if eligible, null otherwise
 */
async function checkWorldBadgeEligibility(userBadges) {
  // Check if user already has world badge
  if (userBadges.has("world")) {
    return null;
  }

  // Check if user has all continent badges
  const hasAllContinents = ALL_CONTINENT_BADGES.every((badgeId) =>
    userBadges.has(badgeId),
  );

  if (hasAllContinents) {
    // Find badge document
    const badgeDetail = await findBadgeDocument("world");
    if (badgeDetail) {
      return {
        id: "world",
        title: badgeDetail.data?.title || "World",
        description: badgeDetail.data?.description || "",
        xp: Number(badgeDetail.data?.xp) || 0,
        data: badgeDetail.data,
      };
    }
  }

  return null;
}

/**
 * Check if user has all SDG badges and should receive "sdg" badge
 * @param {Set<string>} userBadges - Set of badge IDs user has
 * @return {Promise<Object|null>} Badge details if eligible, null otherwise
 */
async function checkSdgBadgeEligibility(userBadges) {
  // Check if user already has sdg badge
  if (userBadges.has("sdg")) {
    return null;
  }

  // Check if user has all SDG badges (1-17)
  const hasAllSdgs = ALL_SDG_BADGES.every((badgeId) =>
    userBadges.has(badgeId),
  );

  if (hasAllSdgs) {
    // Find badge document
    const badgeDetail = await findBadgeDocument("sdg");
    if (badgeDetail) {
      return {
        id: "sdg",
        title: badgeDetail.data?.title || "SDG",
        description: badgeDetail.data?.description || "",
        xp: Number(badgeDetail.data?.xp) || 0,
        data: badgeDetail.data,
      };
    }
  }

  return null;
}

/**
 * Process activity validation rewards (XP + badges)
 * This is the optimized server-side version that processes rewards
 * in background
 * @param {string} activityId - Activity ID
 * @param {string} userId - User ID
 * @param {string|null} validatedBy - User ID who performed validation
 *     (optional)
 * @return {Promise<Object>} Result object with success status and
 *     reward details
 */
export async function processActivityValidationRewards(
    activityId,
    userId,
    validatedBy = null,
) {
  try {
    console.log(
        `Processing rewards for activity ${activityId}, user ${userId}`,
    );

    // 1. Fetch activity once
    const activityDoc = await db.collection("activities").doc(activityId).get();
    if (!activityDoc.exists) {
      throw new Error(`Activity ${activityId} not found`);
    }
    const activity = {id: activityDoc.id, ...activityDoc.data()};

    // 2. Fetch user document once
    const userDoc = await db.collection("members").doc(userId).get();
    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }
    const userData = userDoc.data();
    const userBadges = new Set((userData.badges || []).map((b) => b.id));

    // 3. Determine which badges to grant (no additional reads for checking)
    const badgesToGrant = [];
    const badgeDetailsMap = {};

    // SDG badge
    if (activity.sdg) {
      const sdgBadgeId = activity.sdg.toString();
      if (!userBadges.has(sdgBadgeId)) {
        badgesToGrant.push(sdgBadgeId);
      }
    }

    // Continent badge - fetch organization if needed
    let continentBadgeId = null;
    if (activity.organizationId) {
      try {
        const orgDoc = await db
            .collection("organizations")
            .doc(activity.organizationId)
            .get();
        if (orgDoc.exists) {
          const org = orgDoc.data();
          if (org.country) {
            continentBadgeId = getContinentFromCountry(org.country);
            if (continentBadgeId && !userBadges.has(continentBadgeId)) {
              badgesToGrant.push(continentBadgeId);
            }
          }
        }
      } catch (orgError) {
        console.error("Error fetching organization:", orgError);
        // Continue even if organization fetch fails
      }
    }

    // Activity type badge
    const activityTypeBadgeId = getActivityTypeBadgeId(activity.type);
    if (activityTypeBadgeId && !userBadges.has(activityTypeBadgeId)) {
      badgesToGrant.push(activityTypeBadgeId);
    }

    // 4. Fetch badge details for badges to grant (in parallel)
    if (badgesToGrant.length > 0) {
      const badgeDetailPromises = badgesToGrant.map((badgeId) =>
        findBadgeDocument(badgeId),
      );
      const badgeDetails = await Promise.all(badgeDetailPromises);

      badgeDetails.forEach((badgeDetail, index) => {
        if (badgeDetail) {
          badgeDetailsMap[badgesToGrant[index]] = badgeDetail;
        }
      });
    }

    // 5. Calculate total XP
    // Ensure activityXP is a valid number
    const activityXP = Number(activity.xp_reward) || 0;
    let totalBadgeXP = 0;
    const newBadges = [];

    badgesToGrant.forEach((badgeId) => {
      const badgeDetail = badgeDetailsMap[badgeId];
      if (badgeDetail) {
        // Ensure badgeXP is a valid number
        const badgeXP = Number(badgeDetail.data?.xp) || 0;
        totalBadgeXP += badgeXP;
        newBadges.push({
          id: badgeId,
          earnedDate: Timestamp.now(),
        });
        // Add to userBadges set for completion badge checks
        userBadges.add(badgeId);
      }
    });

    const totalXP = activityXP + totalBadgeXP;

    // 6. Single batch write for all updates
    const batch = db.batch();
    const userRef = db.collection("members").doc(userId);

    // 7. Check for completion badges (world and sdg) after regular badges
    // Check eligibility for completion badges (check in parallel)
    const [worldBadgeEligible, sdgBadgeEligible] = await Promise.all([
      checkWorldBadgeEligibility(userBadges),
      checkSdgBadgeEligibility(userBadges),
    ]);

    const completionBadges = [];
    let completionBadgeXP = 0;

    if (worldBadgeEligible) {
      completionBadges.push({
        id: "world",
        earnedDate: Timestamp.now(),
      });
      // Ensure XP is a valid number
      const worldXP = Number(worldBadgeEligible.xp) || 0;
      completionBadgeXP += worldXP;
    }

    if (sdgBadgeEligible) {
      completionBadges.push({
        id: "sdg",
        earnedDate: Timestamp.now(),
      });
      // Ensure XP is a valid number
      const sdgXP = Number(sdgBadgeEligible.xp) || 0;
      completionBadgeXP += sdgXP;
    }

    // Update total XP if completion badges were granted
    // Ensure finalTotalXP is a valid number
    const finalTotalXP = Number(totalXP) + Number(completionBadgeXP);

    // Debug logging
    console.log(
        `XP calculation: activityXP=${activityXP}, ` +
        `totalBadgeXP=${totalBadgeXP}, ` +
        `completionBadgeXP=${completionBadgeXP}, ` +
        `finalTotalXP=${finalTotalXP}`,
    );

    // Validate finalTotalXP is a valid number
    if (isNaN(finalTotalXP) || !isFinite(finalTotalXP)) {
      console.error(
          `Invalid finalTotalXP calculated: ${finalTotalXP} ` +
          `(activityXP: ${activityXP}, totalBadgeXP: ${totalBadgeXP}, ` +
          `completionBadgeXP: ${completionBadgeXP})`,
      );
      throw new Error(
          `Invalid XP calculation: finalTotalXP is not a valid number`,
      );
    }

    // Update user document with XP and badges (including completion badges)
    const allBadgesToAdd = [...newBadges, ...completionBadges];
    if (finalTotalXP > 0 || allBadgesToAdd.length > 0) {
      const updates = {};
      // Only increment XP if we have a valid positive number
      if (finalTotalXP > 0 && isFinite(finalTotalXP)) {
        updates.xp = FieldValue.increment(finalTotalXP);
      }
      if (allBadgesToAdd.length > 0) {
        updates.badges = FieldValue.arrayUnion(...allBadgesToAdd);
      }
      batch.update(userRef, updates);
    }

    // Add to history - store only reference, not duplicated activity data
    // Best practice: Store only activityId reference to prevent data inconsistency
    const historyRef = userRef.collection("history");
    const historyData = {
      activityId: activityId,
      addedToHistoryAt: FieldValue.serverTimestamp(),
      validatedViaQR: validatedBy === null,
      validatedViaManual: validatedBy !== null,
    };
    batch.set(historyRef.doc(), historyData);

    // Log XP history entries
    if (activityXP > 0) {
      const xpHistoryRef = userRef.collection("xpHistory");
      batch.set(xpHistoryRef.doc(), {
        title: `Activity: ${activity.title || "Unknown Activity"}`,
        points: activityXP,
        type: "activity",
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    // Log badge XP history for regular badges
    for (const badgeId of badgesToGrant) {
      const badgeDetail = badgeDetailsMap[badgeId];
      if (badgeDetail && badgeDetail.data?.xp > 0) {
        const xpHistoryRef = userRef.collection("xpHistory");
        const badgeTitle = badgeDetail.data?.title || badgeId;
        batch.set(xpHistoryRef.doc(), {
          title: `Badge Earned: ${badgeTitle}`,
          points: badgeDetail.data.xp,
          type: "badge",
          timestamp: FieldValue.serverTimestamp(),
        });
      }
    }

    // Log XP history for completion badges
    if (worldBadgeEligible && worldBadgeEligible.xp > 0) {
      const xpHistoryRef = userRef.collection("xpHistory");
      batch.set(xpHistoryRef.doc(), {
        title: `Badge Earned: ${worldBadgeEligible.title}`,
        points: worldBadgeEligible.xp,
        type: "badge",
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    if (sdgBadgeEligible && sdgBadgeEligible.xp > 0) {
      const xpHistoryRef = userRef.collection("xpHistory");
      batch.set(xpHistoryRef.doc(), {
        title: `Badge Earned: ${sdgBadgeEligible.title}`,
        points: sdgBadgeEligible.xp,
        type: "badge",
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    // Execute batch
    await batch.commit();

    const allBadgesGranted = [
      ...newBadges.map((b) => b.id),
      ...completionBadges.map((b) => b.id),
    ];

    if (completionBadges.length > 0) {
      console.log(
          `Completion badges granted: ` +
          `${completionBadges.map((b) => b.id).join(", ")}`,
      );
    }

    console.log(
        `Rewards processed successfully: ${finalTotalXP} XP, ` +
        `${allBadgesGranted.length} badges (${newBadges.length} regular, ` +
        `${completionBadges.length} completion)`,
    );

    // Create a notification (in-app and/or push) for the validated user
    try {
      const hasBadges = allBadgesGranted.length > 0;
      const xpPart = finalTotalXP > 0 ?
        `${finalTotalXP} XP` :
        "XP";
      const badgesPart = hasBadges ?
        ` and ${allBadgesGranted.length} badge` +
          (allBadgesGranted.length > 1 ? "s" : "") :
        "";

      const title = "Activity validated";
      const body = `You earned ${xpPart}${badgesPart}` +
        ` for "${activity.title || "an activity"}".`;

      await sendUserNotification({
        userId,
        type: "REWARD",
        title,
        body,
        link: "/xp-history",
        metadata: {
          activityId,
          validatedBy,
          badgesGranted: allBadgesGranted,
        },
      });
    } catch (notifError) {
      console.error("Failed to send reward notification:", notifError);
    }

    return {
      success: true,
      xpReward: activityXP,
      badgeXP: totalBadgeXP + completionBadgeXP,
      totalXP: finalTotalXP,
      badgesGranted: allBadgesGranted,
    };
  } catch (error) {
    console.error("Error processing rewards:", error);
    throw error;
  }
}

