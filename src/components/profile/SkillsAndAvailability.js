import { Card, Label, Checkbox } from 'flowbite-react';
import Select from 'react-select';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { getSkillsForSelect } from '@/utils/crudSkills';
import { useLocale } from 'next-intl';

export default function SkillsAndAvailability({ profileData, handleMultiSelectChange, handleCheckboxChange }) {
  const t = useTranslations('CompleteProfile');
  const locale = useLocale();
  const [skillOptions, setSkillOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Define category colors
  const categoryColors = [
    { bg: '#e6f7ff', text: '#0066cc' }, // Light blue
    { bg: '#f0fff4', text: '#2e7d32' }, // Light green
    { bg: '#fff8e1', text: '#ff8f00' }, // Light amber
    { bg: '#fce4ec', text: '#c2185b' }, // Light pink
    { bg: '#f3e5f5', text: '#7b1fa2' }, // Light purple
    { bg: '#e8f5e9', text: '#388e3c' }, // Another green
    { bg: '#fff3e0', text: '#e65100' }, // Another amber
    { bg: '#e0f7fa', text: '#0097a7' }, // Another blue
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

  // Custom styles for the Select component
  const customStyles = {
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
        backgroundColor: colors.bg,
        color: colors.text,
        fontWeight: 'bold',
        padding: '8px 12px',
        borderRadius: '4px',
        marginBottom: '4px',
      };
    },
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#e6f7ff' : state.isFocused ? '#f5f5f5' : 'white',
      color: state.isSelected ? '#0066cc' : '#333',
      '&:active': {
        backgroundColor: '#e6f7ff',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e6f7ff',
      borderRadius: '4px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#0066cc',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#0066cc',
      '&:hover': {
        backgroundColor: '#cce6ff',
        color: '#003366',
      },
    }),
  };

  // Ensure we have a valid value for the Select component
  const safeSelectedSkills = selectedSkills || [];

  return (
    <Card className="w-full h-fit">
              <div className="p-4">
                <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                    {t('skillsAvailable')}
                </h5>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="skills">{t('skills')}</Label>
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
                          <Label htmlFor="daily">{t('daily')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="weekly"
                            name="weekly"
                            checked={profileData.timeCommitment.weekly}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="weekly">{t('weekly')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="biweekly"
                            name="biweekly"
                            checked={profileData.timeCommitment.biweekly}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="biweekly">{t('biweekly')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="monthly"
                            name="monthly"
                            checked={profileData.timeCommitment.monthly}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="monthly">{t('monthly')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="occasional"
                            name="occasional"
                            checked={profileData.timeCommitment.occasional}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="occasional">{t('occasionally')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="flexible"
                            name="flexible"
                            checked={profileData.timeCommitment.flexible}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="flexible">{t('flexible')}</Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 block">
                        <Label>{t('availabilities')}</Label>
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
                          <Label htmlFor="weekdays">{t('weekdays')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="weekends"
                            name="weekends"
                            checked={profileData.availabilities.weekends}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="weekends">{t('weekends')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="mornings"
                            name="mornings"
                            checked={profileData.availabilities.mornings}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="mornings">{t('mornings')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="afternoons"
                            name="afternoons"
                            checked={profileData.availabilities.afternoons}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="afternoons">{t('afternoons')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="evenings"
                            name="evenings"
                            checked={profileData.availabilities.evenings}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="evenings">{t('evenings')}</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="flexible2"
                            name="flexible"
                            checked={profileData.availabilities.flexible}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="flexible2">{t('flexible')}</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
  );
}
