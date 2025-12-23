import { Card, Label, Checkbox } from 'flowbite-react';
import Select from 'react-select';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { getSkillsForSelect } from '@/utils/crudSkills';
import { useLocale } from 'next-intl';
import { useTheme } from '@/utils/theme/ThemeContext';

export default function SkillsAndAvailability({ profileData, handleMultiSelectChange, handleCheckboxChange }) {
  const t = useTranslations('CompleteProfile');
  const locale = useLocale();
  const { isDark } = useTheme();
  const [skillOptions, setSkillOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Define category colors with dark mode variants
  const categoryColors = [
    { bg: '#e6f7ff', text: '#0066cc', bgDark: '#1e3a5f', textDark: '#7dd3fc' }, // Light blue
    { bg: '#f0fff4', text: '#2e7d32', bgDark: '#1e3d2e', textDark: '#6ee7b7' }, // Light green
    { bg: '#fff8e1', text: '#ff8f00', bgDark: '#5c3d1e', textDark: '#fcd34d' }, // Light amber
    { bg: '#fce4ec', text: '#c2185b', bgDark: '#5c1e3a', textDark: '#f9a8d4' }, // Light pink
    { bg: '#f3e5f5', text: '#7b1fa2', bgDark: '#4c1e5c', textDark: '#d8b4fe' }, // Light purple
    { bg: '#e8f5e9', text: '#388e3c', bgDark: '#1e3d2e', textDark: '#6ee7b7' }, // Another green
    { bg: '#fff3e0', text: '#e65100', bgDark: '#5c3d1e', textDark: '#fcd34d' }, // Another amber
    { bg: '#e0f7fa', text: '#0097a7', bgDark: '#1e3a5f', textDark: '#7dd3fc' }, // Another blue
  ];

  // Load skills from Firestore
  useEffect(() => {
    const loadSkills = async () => {
      try {
        setIsLoading(true);
        const options = await getSkillsForSelect(locale);
        setSkillOptions(options);
        
        // Create a flat map of all skills for easy lookup
        const allSkills = options.reduce((acc, group) => {
          return [...acc, ...group.options];
        }, []);
        
        // Update selected skills with current language labels
        if (profileData.skills && profileData.skills.length > 0) {
          const updatedSelectedSkills = profileData.skills.map(skill => {
            // Find the skill in our options
            const foundSkill = allSkills.find(s => s.value === skill.value);
            return foundSkill || skill; // Use found skill or keep original if not found
          });
          setSelectedSkills(updatedSelectedSkills);
        } else {
          setSelectedSkills([]);
        }
      } catch (error) {
        console.error('Error loading skills:', error);
        setSelectedSkills([]); // Ensure selectedSkills is always defined
      } finally {
        setIsLoading(false);
      }
    };

    loadSkills();
  }, [locale, profileData.skills]);

  // Custom styles for the Select component with dark mode support
  const customStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      color: isDark ? '#f8fafc' : '#0f172a',
      '&:hover': {
        borderColor: isDark ? '#fb923c' : '#f97316',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
    }),
    groupHeading: (base, { group }) => {
      // Default colors in case group is not found
      let colors = categoryColors[0];
      
      // Only try to find the group if it exists and skillOptions is not empty
      if (group && group.label && skillOptions && skillOptions.length > 0) {
        try {
          const groupIndex = skillOptions.findIndex(g => g.label === group.label);
          if (groupIndex !== -1) {
            const colorIndex = groupIndex % categoryColors.length;
            colors = categoryColors[colorIndex];
          }
        } catch (error) {
          console.error('Error styling group heading:', error);
        }
      }
      
      return {
        ...base,
        backgroundColor: isDark ? colors.bgDark : colors.bg,
        color: isDark ? colors.textDark : colors.text,
        fontWeight: 'bold',
        padding: '8px 12px',
        borderRadius: '4px',
        marginBottom: '4px',
      };
    },
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? (isDark ? '#334155' : '#e0f2fe')
        : state.isFocused
        ? (isDark ? '#334155' : '#f1f5f9')
        : isDark ? '#1e293b' : '#ffffff',
      color: state.isSelected
        ? (isDark ? '#f8fafc' : '#0284c7')
        : isDark ? '#f8fafc' : '#0f172a',
      '&:active': {
        backgroundColor: isDark ? '#475569' : '#e0f2fe',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDark ? '#334155' : '#e0f2fe',
      borderRadius: '4px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0284c7',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: isDark ? '#cbd5e1' : '#0284c7',
      '&:hover': {
        backgroundColor: isDark ? '#475569' : '#bae6fd',
        color: isDark ? '#f8fafc' : '#0369a1',
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? '#94a3b8' : '#64748b',
    }),
    input: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
    }),
    indicatorsContainer: (base) => ({
      ...base,
      color: isDark ? '#cbd5e1' : '#64748b',
    }),
  };

  // Ensure we have a valid value for the Select component
  const safeSelectedSkills = selectedSkills || [];

  return (
    <Card className="w-full h-fit bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
      <div className="p-4">
        <h5 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-primary mb-4">
          {t('skillsAvailable')}
        </h5>
        <div className="space-y-6">
          {/* Skills Section */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="skills" className="text-text-primary dark:text-text-primary">{t('skills')}</Label>
            </div>
                    <Select
                      id="skills"
                      name="skills"
                      isMulti
                      options={skillOptions}
                      value={safeSelectedSkills}
                      onChange={handleMultiSelectChange('skills')}
                      placeholder={t('skillsPlaceholder')}
                      className="basic-multi-select"
                      classNamePrefix="select"
                      isLoading={isLoading}
                      isSearchable={true}
                      isClearable={true}
                      closeMenuOnSelect={false}
                      styles={customStyles}
                      formatGroupLabel={data => (
                        <div className="flex items-center">
                          <span>{data.label}</span>
                        </div>
                      )}
                    />
          </div>
          
          {/* Availability Section */}
          <div>
            <h6 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-4">{t('availability') || 'Availability'}</h6>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-2 block">
                        <Label>{t('frequency')}</Label>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Checkbox
                            id="daily"
                            name="daily"
                            checked={profileData.timeCommitment.daily}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="daily" className="text-text-primary dark:text-text-primary">{t('daily')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="weekly"
                            name="weekly"
                            checked={profileData.timeCommitment.weekly}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="weekly" className="text-text-primary dark:text-text-primary">{t('weekly')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="biweekly"
                            name="biweekly"
                            checked={profileData.timeCommitment.biweekly}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="biweekly" className="text-text-primary dark:text-text-primary">{t('biweekly')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="monthly"
                            name="monthly"
                            checked={profileData.timeCommitment.monthly}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="monthly" className="text-text-primary dark:text-text-primary">{t('monthly')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="occasional"
                            name="occasional"
                            checked={profileData.timeCommitment.occasional}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="occasional" className="text-text-primary dark:text-text-primary">{t('occasionally')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="flexible"
                            name="flexible"
                            checked={profileData.timeCommitment.flexible}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="flexible" className="text-text-primary dark:text-text-primary">{t('flexible')}</Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 block">
                        <Label className="text-text-primary dark:text-text-primary">{t('availabilities')}</Label>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Checkbox
                            id="weekdays"
                            name="weekdays"
                            checked={profileData.availabilities.weekdays}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="weekdays" className="text-text-primary dark:text-text-primary">{t('weekdays')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="weekends"
                            name="weekends"
                            checked={profileData.availabilities.weekends}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="weekends" className="text-text-primary dark:text-text-primary">{t('weekends')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="mornings"
                            name="mornings"
                            checked={profileData.availabilities.mornings}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="mornings" className="text-text-primary dark:text-text-primary">{t('mornings')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="afternoons"
                            name="afternoons"
                            checked={profileData.availabilities.afternoons}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="afternoons" className="text-text-primary dark:text-text-primary">{t('afternoons')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="evenings"
                            name="evenings"
                            checked={profileData.availabilities.evenings}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="evenings" className="text-text-primary dark:text-text-primary">{t('evenings')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="flexible2"
                            name="flexible"
                            checked={profileData.availabilities.flexible}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="flexible2" className="text-text-primary dark:text-text-primary">{t('flexible')}</Label>
                        </div>
                      </div>
                    </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
