import { useQuery } from '@tanstack/react-query';
import { fetchPublicMemberProfile } from '@/utils/crudMemberProfile';
import { getSkillsForSelect } from '@/utils/crudSkills';
import { useLocale } from 'next-intl';

/**
 * React Query hook for fetching public profile data with skills translation
 * @param {string} userId - User ID
 * @returns {Object} Query result with profile data, translated skills, loading, and error states
 */
export function usePublicProfile(userId) {
  const locale = useLocale();

  return useQuery({
    queryKey: ['publicProfile', userId, locale],
    queryFn: async () => {
      if (!userId) return null;

      // Fetch profile and skills in parallel
      const [profile, skillOptions] = await Promise.all([
        fetchPublicMemberProfile(userId),
        getSkillsForSelect(locale).catch(err => {
          console.error('Error fetching skills:', err);
          return [];
        })
      ]);

      if (!profile) {
        return null;
      }

      // Create a flat map of all skills for easy lookup
      const allSkills = skillOptions.reduce((acc, group) => {
        return [...acc, ...group.options];
      }, []);

      // Translate skills if profile has skills
      let translatedSkillsList = [];
      if (profile.skills && profile.skills.length > 0) {
        translatedSkillsList = profile.skills.map(skill => {
          // Find the skill in our options by value (skill ID)
          const foundSkill = allSkills.find(s => s.value === (skill.value || skill.id || skill));
          if (foundSkill) {
            return foundSkill;
          }
          // Fallback: if skill is an object with label, use it; otherwise use the value/id
          if (typeof skill === 'object' && skill.label) {
            return skill;
          }
          return { value: skill.value || skill.id || skill, label: skill.label || skill.value || skill.id || skill };
        });
      }

      return {
        profile,
        translatedSkills: translatedSkillsList
      };
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
