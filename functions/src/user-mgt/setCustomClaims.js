import {auth} from "../init.js";

export const setUserCustomClaims = async (uid, claims) => {
  try {
    // Set custom claims for the user
    await auth.setCustomUserClaims(uid, claims);

    // Force token refresh
    await auth.revokeRefreshTokens(uid);

    return {success: true};
  } catch (error) {
    console.error("Error setting custom claims:", error);
    throw error;
  }
};
