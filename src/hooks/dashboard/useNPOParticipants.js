'use client';

import { useQuery } from '@tanstack/react-query';
import { getDoc, doc } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { fetchParticipantRecords } from '@/utils/crudParticipantRecords';

const PAGE_SIZE = 30;

/**
 * Resolve display name, profile picture, and email from members for a list of user IDs.
 * @param {string[]} userIds
 * @returns {Promise<Map<string, { displayName: string, profilePicture: string|null, email: string|null }>>
 */
async function resolveMemberProfiles(userIds) {
  if (!userIds.length) return new Map();
  const results = await Promise.all(
    userIds.map(async (userId) => {
      try {
        const memberRef = doc(db, 'members', userId);
        const memberSnap = await getDoc(memberRef);
        if (!memberSnap.exists()) {
          return [userId, { displayName: 'Unknown User', profilePicture: null, email: null }];
        }
        const data = memberSnap.data();
        return [
          userId,
          {
            displayName: data.displayName || data.name || 'Unknown User',
            profilePicture: data.profilePicture || data.photoURL || null,
            email: data.email || null,
          },
        ];
      } catch (err) {
        console.error(`Error fetching member ${userId}:`, err);
        return [userId, { displayName: 'Unknown User', profilePicture: null, email: null }];
      }
    })
  );
  return new Map(results);
}

/**
 * Fetch participant records for the current page and resolve member profiles.
 * @param {string} organizationId
 * @param {import('firebase/firestore').DocumentSnapshot|null} startAfterDoc
 * @returns {Promise<{ participants: Array<{
 *   id: string, userId: string, displayName: string, profilePicture: string|null, email: string|null,
 *   online: boolean, local: boolean, event: boolean, createdAt: unknown, lastValidatedAt: unknown
 * }>, lastDoc: import('firebase/firestore').DocumentSnapshot|null }>}
 */
async function fetchParticipantsWithProfiles(organizationId, startAfterDoc = null) {
  const { records, lastDoc } = await fetchParticipantRecords(organizationId, {
    limit: PAGE_SIZE,
    startAfterDoc,
  });

  const userIds = records.map((r) => r.userId);
  const profilesMap = await resolveMemberProfiles(userIds);

  const participants = records.map((r) => {
    const profile = profilesMap.get(r.userId) || {
      displayName: 'Unknown User',
      profilePicture: null,
      email: null,
    };
    return {
      ...r,
      displayName: profile.displayName,
      profilePicture: profile.profilePicture,
      email: profile.email,
    };
  });

  return { participants, lastDoc };
}

/**
 * React Query hook for NPO participants list (participant_records + member profiles).
 *
 * @param {string} organizationId - NPO organization ID
 * @param {import('firebase/firestore').DocumentSnapshot|null} [startAfterDoc] - Cursor for pagination (optional)
 * @returns {Object} { participants, lastDoc, isLoading, error, refetch }
 */
export function useNPOParticipants(organizationId, startAfterDoc = null) {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['npoParticipants', organizationId, startAfterDoc?.id ?? 'first'],
    queryFn: () => fetchParticipantsWithProfiles(organizationId, startAfterDoc),
    enabled: !!organizationId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    participants: data?.participants ?? [],
    lastDoc: data?.lastDoc ?? null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Fetch all participants for an organization (first page only) with profiles.
 * Used by the participants page which may then do client-side filter/sort/search.
 * For "Load more", the page can use useNPOParticipants(orgId, lastDoc) or a dedicated load-more pattern.
 */
export function useNPOParticipantsPage(organizationId) {
  return useNPOParticipants(organizationId, null);
}
