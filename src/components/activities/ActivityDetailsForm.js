import { FloatingLabel, Textarea, Radio, Label, Datepicker, Card, TextInput, Select as FlowbiteSelect, Badge, Checkbox, Tooltip, RangeSlider } from 'flowbite-react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'use-intl';
import { useLocale } from 'next-intl';
import Select from 'react-select';
import { getSkillsForSelect } from '@/utils/crudSkills';
import { useTheme } from '@/utils/theme/ThemeContext';
import { 
  HiCalendar, 
  HiUsers, 
  HiLink, 
  HiCog, 
  HiPhone, 
  HiMail, 
  HiUser,
  HiMapPin,
  HiRefresh,
  HiChevronDown,
  HiExternalLink,
  HiQuestionMarkCircle
} from 'react-icons/hi';
import { HiClock } from "react-icons/hi2";

export default function ActivityDetailsForm({ formData, handleChange, setFormData }) {
  const t = useTranslations('ManageActivities');
  const locale = useLocale();
  const { isDark } = useTheme();
  
  // Debug logging
  console.log('ActivityDetailsForm - formData dates:', {
    start_date: formData.start_date,
    start_date_type: typeof formData.start_date,
    start_date_isDate: formData.start_date instanceof Date,
    end_date: formData.end_date,
    end_date_type: typeof formData.end_date,
    end_date_isDate: formData.end_date instanceof Date,
    creation_date: formData.creation_date,
    creation_date_type: typeof formData.creation_date,
    creation_date_isDate: formData.creation_date instanceof Date,
  });
  const [skillOptions, setSkillOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Define category colors with dark mode variants (same as profile update page)
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

  // Load skills from Firestore (for local and online activities)
  useEffect(() => {
    if (formData.type === 'local' || formData.type === 'online') {
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
          if (formData.skills && formData.skills.length > 0) {
            const updatedSelectedSkills = formData.skills.map(skill => {
              // Find the skill in our options
              const foundSkill = allSkills.find(s => s.value === (skill.value || skill.id || skill));
              return foundSkill || skill; // Use found skill or keep original if not found
            });
            setSelectedSkills(updatedSelectedSkills);
          } else {
            setSelectedSkills([]);
          }
        } catch (error) {
          console.error('Error loading skills:', error);
          setSelectedSkills([]);
        } finally {
          setIsLoading(false);
        }
      };

      loadSkills();
    } else {
      setSkillOptions([]);
      setSelectedSkills([]);
      setIsLoading(false);
    }
  }, [locale, formData.type, formData.skills]);

  // Handle skills selection change
  const handleSkillsChange = (selectedOptions) => {
    setSelectedSkills(selectedOptions || []);
    setFormData((prev) => ({
      ...prev,
      skills: selectedOptions || []
    }));
  };

  // Auto-set frequency to 'once' for events
  useEffect(() => {
    if (formData.type === 'event' && formData.frequency !== 'once') {
      setFormData((prev) => ({ ...prev, frequency: 'once' }));
    }
  }, [formData.type, setFormData]);

  // Get external platform link (use externalPlatformLink or fallback to activity_url for backward compatibility)
  const externalLink = formData.externalPlatformLink || formData.activity_url || '';
  
  // Determine if external link is required (for local activities when not accepting WG applications)
  const isExternalLinkRequired = formData.type === 'local' && formData.acceptApplicationsWG === false;
  
  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Basic Information Section */}
      <Card className="p-4 sm:p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center gap-3 mb-6">
          {/* Header with centered title, description, and badge */}
          <div className="flex flex-col items-center gap-2 w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center">{t('info-label')}</h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">Provide essential details about your activity</p>
            <Badge 
              color={formData.type === 'online' ? 'blue' : formData.type === 'local' ? 'green' : 'purple'}
              size="lg"
              className="capitalize w-fit"
            >
              {formData.type} Activity
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Title */}
          <div className="lg:col-span-2 space-y-2">
            <FloatingLabel
              variant='filled'
              label={t('activity-title-label')}
              helperText={t('activity-title-helper')}
              name='title'
              value={formData.title || ''}
              onChange={(e) => {
                if (e.target.value.length <= 50) {
                  handleChange(e);
                }
              }}
              maxLength={50}
              className="text-base sm:text-lg w-full"
            />
            {formData.title && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right px-1">
                {formData.title.length}/50
              </div>
            )}
          </div>
          
          {/* Description */}
          <div className="lg:col-span-2 space-y-2">
            <Label htmlFor='activityDescription' className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              {t('activity-description-label')}
            </Label>
            <Textarea
              id='activityDescription'
              placeholder={t('activity-description-label')}
              required
              rows={5}
              name='description'
              value={formData.description || ''}
              onChange={handleChange}
              helperText={t('activity-description-helper')}
              className="resize-none text-sm sm:text-base w-full"
            />
          </div>
          
          {/* Frequency - Hidden for events, auto-set to 'once' */}
          {formData.type !== 'event' && (
            <div className="lg:col-span-2 space-y-3">
              <Label htmlFor='frequency' className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <HiClock className="h-4 w-4" />
                {t('frequency-label')}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer touch-manipulation ${
                    formData.frequency === 'once' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400 shadow-md' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95'
                  }`}
                  onClick={() => setFormData((prev) => ({ ...prev, frequency: 'once' }))}
                >
                  <Radio
                    id='once'
                    name='frequency'
                    value='once'
                    checked={formData.frequency === 'once'}
                    onChange={handleChange}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  <Label htmlFor='once' className="text-sm font-medium cursor-pointer flex-1 dark:text-gray-300">
                    {t('frequency-once')}
                  </Label>
                </div>  
                {(formData.type === 'online' || formData.type === 'local') && (
                  <div 
                    className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer touch-manipulation ${
                      formData.frequency === 'role' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400 shadow-md' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95'
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, frequency: 'role' }))}
                  >
                    <Radio
                      id='role'
                      name='frequency'
                      value='role'
                      checked={formData.frequency === 'role'}
                      onChange={handleChange}
                      className="text-blue-600 dark:text-blue-400"
                    />
                    <Label htmlFor='role' className="text-sm font-medium cursor-pointer flex-1 dark:text-gray-300">
                      {t('frequency-longterm')}
                    </Label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location - For local and event activities */}
          {(formData.type === 'local' || formData.type === 'event') && (
            <div className="lg:col-span-2 space-y-2">
              <FloatingLabel
                variant='filled'
                label={t('location-label')}
                helperText={t('location-helper')}
                name='location'
                value={formData.location || ''}
                onChange={handleChange}
                className="text-base sm:text-lg"
              />
            </div>
          )}

          {/* Dates */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor='start_date' className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <HiCalendar className="h-4 w-4" />
                  {t('start_date')}
                </Label>
                <Datepicker 
                  weekStart={1}
                  value={(() => {
                    try {
                      return formData.start_date ? (formData.start_date instanceof Date ? formData.start_date : new Date(formData.start_date)) : new Date();
                    } catch (error) {
                      console.error('Error with start_date Datepicker value:', error, 'formData.start_date:', formData.start_date);
                      return new Date();
                    }
                  })()}
                  name='start_date'
                  onChange={(date) => setFormData((prev) => ({ ...prev, start_date: date }))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor='end_date' className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <HiCalendar className="h-4 w-4" />
                  {t('end_date')}
                </Label>
                <Datepicker 
                  weekStart={1}
                  name='end_date'
                  value={(() => {
                    try {
                      return formData.end_date ? (formData.end_date instanceof Date ? formData.end_date : new Date(formData.end_date)) : new Date();
                    } catch (error) {
                      console.error('Error with end_date Datepicker value:', error, 'formData.end_date:', formData.end_date);
                      return new Date();
                    }
                  })()}
                  onChange={(date) => setFormData((prev) => ({ ...prev, end_date: date }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Local Activity Application Controls - BEFORE External Platform Link */}
      {formData.type === 'local' && (
        <Card className="p-4 sm:p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-start sm:items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg shrink-0">
              <HiCog className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{t('application-settings-title')}</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('application-settings-description')}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Accept applications through WannaGonna */}
            <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <Checkbox
                id="acceptApplicationsWG"
                checked={formData.acceptApplicationsWG !== false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData((prev) => ({
                    ...prev,
                    acceptApplicationsWG: checked,
                    // Reset auto-accept if WG applications are disabled
                    autoAcceptApplications: checked ? prev.autoAcceptApplications : false
                  }));
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="acceptApplicationsWG" className="text-sm sm:text-base font-medium text-gray-900 dark:text-white cursor-pointer">
                  {t('accept-applications-wg-label')}
                </Label>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('accept-applications-wg-description')}
                </p>
              </div>
            </div>

            {/* Auto-accept checkbox - only shown when WG applications are enabled */}
            {formData.acceptApplicationsWG !== false && (
              <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 ml-6">
                <Checkbox
                  id="autoAcceptApplications"
                  checked={formData.autoAcceptApplications === true}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      autoAcceptApplications: e.target.checked
                    }));
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="autoAcceptApplications" className="text-sm sm:text-base font-medium text-gray-900 dark:text-white cursor-pointer">
                    {t('auto-accept-applications-label')}
                  </Label>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('auto-accept-applications-description')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* External Platform Link - All Activity Types */}
      <Card className="p-4 sm:p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-start sm:items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg shrink-0">
            <HiLink className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{t('external-platform-link-title')}</h2>
            <p className={`text-xs sm:text-sm ${
              isExternalLinkRequired && !externalLink.trim() 
                ? 'text-red-600 dark:text-red-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {isExternalLinkRequired 
                ? t('external-platform-link-description-required')
                : t('external-platform-link-description-optional')}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <FloatingLabel
              variant='filled'
              label={t('external-platform-url-label')}
              helperText={isExternalLinkRequired && !externalLink.trim()
                ? '' // Don't show helper text when error is shown below
                : (isExternalLinkRequired 
                    ? t('external-platform-url-helper-required')
                    : t('external-platform-url-helper-optional'))}
              name='externalPlatformLink'
              value={externalLink}
              onChange={(e) => {
                handleChange(e);
                // Also update activity_url for backward compatibility
                setFormData((prev) => ({
                  ...prev,
                  externalPlatformLink: e.target.value,
                  activity_url: e.target.value
                }));
              }}
              type='url'
              required={isExternalLinkRequired}
              className={`text-base sm:text-lg ${isExternalLinkRequired && !externalLink.trim() ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {/* Show error message in red when external link is required but missing */}
            {isExternalLinkRequired && !externalLink.trim() && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                {t('external-platform-url-helper-required')}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Participant Target - All Activity Types */}
      <Card className="p-4 sm:p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-start sm:items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg shrink-0">
            <HiUsers className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{t('participant-target-title')}</h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('participant-target-description')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <FloatingLabel
              variant='filled'
              label={t('participant-target-label')}
              helperText={t('participant-target-helper')}
              name='participantTarget'
              value={formData.participantTarget || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                if (value === null || (!isNaN(value) && value > 0)) {
                  setFormData((prev) => ({ ...prev, participantTarget: value }));
                }
              }}
              type='number'
              min="1"
              className="text-base sm:text-lg"
            />
          </div>
        </div>
      </Card>

      {/* Activity Expectation Sliders - Local and Online Only */}
      {(formData.type === 'local' || formData.type === 'online') && (
        <Card className="p-4 sm:p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-start sm:items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg shrink-0">
              <HiClock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{t('activity-expectation-title')}</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('activity-expectation-description')}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Time Commitment Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="timeCommitment" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('time-commitment-label')}
                </Label>
                <Tooltip content={(() => {
                  const value = formData.timeCommitment ?? 50;
                  if (value <= 20) return t('time-commitment-tooltip-very-quick');
                  if (value <= 40) return t('time-commitment-tooltip-quick');
                  if (value <= 60) return t('time-commitment-tooltip-standard');
                  if (value <= 80) return t('time-commitment-tooltip-substantial');
                  return t('time-commitment-tooltip-major');
                })()}>
                  <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <HiQuestionMarkCircle className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>{t('time-commitment-quick')}</span>
                  <span>{t('time-commitment-takes-long')}</span>
                </div>
                <RangeSlider
                  id="timeCommitment"
                  min={0}
                  max={100}
                  value={formData.timeCommitment ?? 50}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setFormData((prev) => ({ ...prev, timeCommitment: value }));
                  }}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {formData.timeCommitment ?? 50}%
                </div>
              </div>
            </div>

            {/* Complexity Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="complexity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('complexity-label')}
                </Label>
                <Tooltip content={(() => {
                  const value = formData.complexity ?? 50;
                  if (value <= 30) return t('complexity-tooltip-simple');
                  if (value <= 60) return t('complexity-tooltip-moderate');
                  return t('complexity-tooltip-complex');
                })()}>
                  <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <HiQuestionMarkCircle className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>{t('complexity-simple')}</span>
                  <span>{t('complexity-very-complex')}</span>
                </div>
                <RangeSlider
                  id="complexity"
                  min={0}
                  max={100}
                  value={formData.complexity ?? 50}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setFormData((prev) => ({ ...prev, complexity: value }));
                  }}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {formData.complexity ?? 50}%
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Skills Selector - Local and Online Only */}
      {(formData.type === 'local' || formData.type === 'online') && (
        <Card className="p-4 sm:p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-start sm:items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg shrink-0">
              <HiUsers className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{t('required-skills-title')}</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('required-skills-description')}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="skills" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('skills-label')}
            </Label>
            <Select
              id="skills"
              name="skills"
              isMulti
              options={skillOptions}
              value={selectedSkills}
              onChange={handleSkillsChange}
              placeholder={t('skills-placeholder')}
              className="basic-multi-select"
              classNamePrefix="select"
              isLoading={isLoading}
              isSearchable={true}
              isClearable={true}
              closeMenuOnSelect={false}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  minHeight: '48px',
                  fontSize: '14px',
                  '&:hover': {
                    borderColor: isDark ? '#fb923c' : '#f97316',
                  },
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  zIndex: 9999,
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
              }}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('skills-helper')}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
} 