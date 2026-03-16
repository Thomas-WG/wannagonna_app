/**
 * Callable Cloud Function to return a sanitized list of members for the
 * public members page. Strips PII (email, referredBy, code) so sensitive
 * data never leaves the server.
 *
 * request.data: { filters: { country?: string }, sortBy, pageSize, lastDocId? }
 * response: { members, lastDocId: string|null, hasNextPage: boolean }
 */

import {onCall} from "firebase-functions/v2/https";
import {db} from "../init.js";

const SANITIZED_FIELDS = [
  "displayName", "profilePicture", "country", "xp", "badges", "createdAt",
];

/**
 * Sanitize a member document - return only public-safe fields.
 * @param {string} id - Document ID
 * @param {Object} data - Raw document data
 * @return {Object} Sanitized member object
 */
function sanitizeMember(id, data) {
  const out = {id};
  for (const key of SANITIZED_FIELDS) {
    if (data[key] !== undefined) {
      out[key] = data[key];
    }
  }
  return out;
}

export const getMembersList = onCall(
    {invoker: "public"},
    async (request) => {
      if (!request.auth) {
        throw new Error("Unauthorized");
      }

      const data = request.data || {};
      const filters = data.filters || {};
      const sortBy = data.sortBy || "name_az";
      const pageSize = data.pageSize ?? 100;
      const lastDocId = data.lastDocId ?? null;

      const pageLimit = Math.min(Math.max(1, Number(pageSize) || 100), 100);

      let query = db.collection("members");

      if (filters.country && filters.country !== "all") {
        query = query.where("country", "==", filters.country);
      }

      switch (sortBy) {
        case "name_az":
          query = query.orderBy("displayName", "asc");
          break;
        case "name_za":
          query = query.orderBy("displayName", "desc");
          break;
        case "joined_newest":
          query = query.orderBy("createdAt", "desc");
          break;
        case "joined_oldest":
          query = query.orderBy("createdAt", "asc");
          break;
        default:
          query = query.orderBy("displayName", "asc");
      }

      if (lastDocId) {
        const startAfterSnap = await db.collection("members")
            .doc(lastDocId).get();
        if (startAfterSnap.exists) {
          query = query.startAfter(startAfterSnap);
        }
      }

      query = query.limit(pageLimit + 1);

      const snapshot = await query.get();
      const docs = snapshot.docs;
      const hasNextPage = docs.length > pageLimit;
      const membersToReturn = hasNextPage ? docs.slice(0, pageLimit) : docs;

      const members = membersToReturn.map((docSnap) => {
        const data = docSnap.data();
        return sanitizeMember(docSnap.id, data);
      });

      const lastDoc = membersToReturn.length > 0 ?
        membersToReturn[membersToReturn.length - 1] : null;
      const lastDocIdOut = hasNextPage && lastDoc ? lastDoc.id : null;

      return {
        members,
        lastDocId: lastDocIdOut,
        hasNextPage,
      };
    });
