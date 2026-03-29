import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * React Query hook for fetching member profile data
 * @param {string} userId - User ID
 * @returns {Object} Query result with profile data, loading, and error states
 */
export function useMemberProfile(userId) {
  return useQuery({
    queryKey: ['memberProfile', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get the document reference
      const memberDoc = doc(db, 'members', userId);
      // Fetch the document
      const docSnap = await getDoc(memberDoc);

      if (!docSnap.exists()) {
        return null;
      }

      const memberData = docSnap.data();

      // Default values for all fields
      const defaultValues = {
        display_name: '',
        email: '',
        bio: '',
        country: '',
        languages: [],
        skills: [],
        profile_picture: '',
        time_commitment: {
          daily: false,
          weekly: false,
          biweekly: false,
          monthly: false,
          occasional: false,
          flexible: false,
        },
        availabilities: {
          weekdays: false,
          weekends: false,
          mornings: false,
          afternoons: false,
          evenings: false,
          flexible: false,
        },
        xp: 0,
        badges: [],
        code: '',
        referred_by: '',
        cause: '',
        hobbies: '',
        website: '',
        linkedin: '',
        facebook: '',
        instagram: '',
      };

      // Build the final data object with proper defaults
      const finalData = {
        ...defaultValues,
        ...memberData,
        // Ensure we don't override with undefined/null values, use defaults
        display_name: memberData.display_name ?? defaultValues.display_name,
        email: memberData.email ?? defaultValues.email,
        profile_picture: memberData.profile_picture ?? defaultValues.profile_picture,
        bio: memberData.bio ?? defaultValues.bio,
        country: memberData.country ?? defaultValues.country,
        languages: Array.isArray(memberData.languages)
          ? memberData.languages
          : defaultValues.languages,
        skills: Array.isArray(memberData.skills) ? memberData.skills : defaultValues.skills,
        xp: memberData.xp ?? defaultValues.xp,
        badges: Array.isArray(memberData.badges) ? memberData.badges : defaultValues.badges,
        code: memberData.code ?? defaultValues.code,
        referred_by: memberData.referred_by ?? defaultValues.referred_by,
        cause: memberData.cause ?? defaultValues.cause,
        hobbies: memberData.hobbies ?? defaultValues.hobbies,
        website: memberData.website ?? defaultValues.website,
        linkedin: memberData.linkedin ?? defaultValues.linkedin,
        facebook: memberData.facebook ?? defaultValues.facebook,
        instagram: memberData.instagram ?? defaultValues.instagram,
        time_commitment: {
          ...defaultValues.time_commitment,
          ...(memberData.time_commitment || {}),
        },
        availabilities: {
          ...defaultValues.availabilities,
          ...(memberData.availabilities || {}),
        },
      };

      return finalData;
    },
    enabled: !!userId, // Only run query if userId exists
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
  });
}

