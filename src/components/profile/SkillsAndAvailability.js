import { Card, Label, Checkbox } from 'flowbite-react';
import Select from 'react-select';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { getSkillsForSelect } from '@/utils/crudSkills';
import { useLocale } from 'next-intl';
import { useTheme } from '@/utils/theme/ThemeContext';
import { Controller } from 'react-hook-form';
import FormError from './FormError';

export default function SkillsAndAvailability({ control, errors, watch }) {
  const t = useTranslations('CompleteProfile');
  const locale = useLocale();
  const { isDark } = useTheme();
  const [skillOptions, setSkillOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Watch skills value
  const selectedSkills = watch('skills') || [];

  // Define category colors with dark mode variants
  const categoryColors = [
    { bg: '#e6f7ff', text: '#0066cc', bgDark: '#1e3a5f', textDark: '#7dd3fc' },
    { bg: '#f0fff4', text: '#2e7d32', bgDark: '#1e3d2e', textDark: '#6ee7b7' },
    { bg: '#fff8e1', text: '#ff8f00', bgDark: '#5c3d1e', textDark: '#fcd34d' },
    { bg: '#fce4ec', text: '#c2185b', bgDark: '#5c1e3a', textDark: '#f9a8d4' },
    { bg: '#f3e5f5', text: '#7b1fa2', bgDark: '#4c1e5c', textDark: '#d8b4fe' },
    { bg: '#e8f5e9', text: '#388e3c', bgDark: '#1e3d2e', textDark: '#6ee7b7' },
    { bg: '#fff3e0', text: '#e65100', bgDark: '#5c3d1e', textDark: '#fcd34d' },
    { bg: '#e0f7fa', text: '#0097a7', bgDark: '#1e3a5f', textDark: '#7dd3fc' },
  ];

  // Load skills from Firestore
  useEffect(() => {
    const loadSkills = async () => {
      try {
        setIsLoading(true);
        const options = await getSkillsForSelect(locale);
        setSkillOptions(options);
      } catch (error) {
        console.error('Error loading skills:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSkills();
  }, [locale]);

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
      let colors = categoryColors[0];
      
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

  // Watch timeCommitment and availabilities for validation
  const timeCommitment = watch('timeCommitment') || {};
  const availabilities = watch('availabilities') || {};

  return (
    <Card className="w-full h-fit bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
      <div className="p-4 md:p-6">
        <h5 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-primary mb-4">
          {t('skillsAvailable')}
        </h5>
        <div className="space-y-6">
          {/* Skills Section */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="skills" className="text-text-primary dark:text-text-primary">
                {t('skills')}
              </Label>
            </div>
            <Controller
              name="skills"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  id="skills"
                  isMulti
                  options={skillOptions}
                  placeholder={t('skillsPlaceholder')}
                  className="basic-multi-select w-full"
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
              )}
            />
            <FormError message={errors.skills?.message} />
          </div>
          
          {/* Availability Section */}
          <div>
            <h6 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-4">
              {t('availability') || 'Availability'}
            </h6>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="mb-2 block">
                  <Label className="text-text-primary dark:text-text-primary">
                    {t('frequency')}
                  </Label>
                </div>
                <div className="space-y-2">
                  {['daily', 'weekly', 'biweekly', 'monthly', 'occasional', 'flexible'].map((key) => (
                    <Controller
                      key={key}
                      name={`timeCommitment.${key}`}
                      control={control}
                      render={({ field: { value, onChange, name } }) => {
                        // Map 'occasional' to 'occasionally' for translation
                        const translationKey = key === 'occasional' ? 'occasionally' : key;
                        return (
                          <div className="flex items-center">
                            <Checkbox
                              id={key}
                              name={name}
                              checked={value || false}
                              onChange={(e) => onChange(e.target.checked)}
                              className="mr-2"
                            />
                            <Label htmlFor={key} className="text-text-primary dark:text-text-primary">
                              {t(translationKey)}
                            </Label>
                          </div>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormError message={errors.timeCommitment?.message} />
              </div>
              
              <div>
                <div className="mb-2 block">
                  <Label className="text-text-primary dark:text-text-primary">
                    {t('availabilities')}
                  </Label>
                </div>
                <div className="space-y-2">
                  {['weekdays', 'weekends', 'mornings', 'afternoons', 'evenings', 'flexible'].map((key) => (
                    <Controller
                      key={key}
                      name={`availabilities.${key}`}
                      control={control}
                      render={({ field: { value, onChange, name } }) => (
                        <div className="flex items-center">
                          <Checkbox
                            id={`avail-${key}`}
                            name={name}
                            checked={value || false}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mr-2"
                          />
                          <Label htmlFor={`avail-${key}`} className="text-text-primary dark:text-text-primary">
                            {t(key)}
                          </Label>
                        </div>
                      )}
                    />
                  ))}
                </div>
                <FormError message={errors.availabilities?.message} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
