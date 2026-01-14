import { Card, Label, TextInput, Textarea, Select as FlowbiteSelect } from 'flowbite-react';
import ProfilePicture from './ProfilePicture';
import { useTranslations } from 'next-intl';
import Select from 'react-select';
import { useTheme } from '@/utils/theme/ThemeContext';
import { Controller } from 'react-hook-form';
import FormError from './FormError';

export default function ProfileInformation({ 
  control, 
  errors, 
  countryOptions, 
  languageOptions, 
  handleProfilePictureChange,
  watch 
}) {
  const t = useTranslations('CompleteProfile');
  const { isDark } = useTheme();
  
  // Watch profilePicture for ProfilePicture component
  const profilePicture = watch('profilePicture');

  // Custom styles for react-select with dark mode support
  const selectStyles = {
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

  return (
    <Card className="w-full h-fit bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
      <div className="p-4 md:p-6">
        <ProfilePicture 
          profileData={{ profilePicture }} 
          handleProfilePictureChange={handleProfilePictureChange} 
        />
        <h5 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-primary mb-4">
          {t('profile')}
        </h5>
        <div className="space-y-4">
          <div>
            <div className="mb-2 block">
              <Label htmlFor="email" className="text-text-primary dark:text-text-primary">
                {t('email')}
              </Label>
            </div>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextInput 
                  {...field}
                  id="email" 
                  type="email"
                  disabled
                  className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
                />
              )}
            />
            <p className="mt-1 text-sm text-text-tertiary dark:text-text-tertiary">
              {t('emailHelper')}
            </p>
          </div>
          
          <div>
            <div className="mb-2 block">
              <Label htmlFor="displayname" className="text-text-primary dark:text-text-primary">
                {t('displayName')}
              </Label>
            </div>
            <Controller
              name="displayName"
              control={control}
              render={({ field }) => (
                <TextInput 
                  {...field}
                  id="displayname" 
                  type="text" 
                  placeholder="Titi Toto" 
                  className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
                />
              )}
            />
            <FormError message={errors.displayName?.message} />
          </div>
          
          <div>
            <div className="mb-2 block">
              <Label htmlFor="bio" className="text-text-primary dark:text-text-primary">
                {t('bio')}
              </Label>
            </div>
            <Controller
              name="bio"
              control={control}
              render={({ field }) => (
                <Textarea 
                  {...field}
                  id="bio" 
                  placeholder="A few words about yourself" 
                  className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
                />
              )}
            />
            <FormError message={errors.bio?.message} />
          </div>
          
          <div>
            <div className="mb-2 block">
              <Label htmlFor="cause" className="text-text-primary dark:text-text-primary">
                {t('cause')}
              </Label>
            </div>
            <Controller
              name="cause"
              control={control}
              render={({ field }) => (
                <Textarea 
                  {...field}
                  id="cause" 
                  placeholder="What cause are you passionate about?" 
                  rows={3}
                  className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
                />
              )}
            />
            <FormError message={errors.cause?.message} />
          </div>
          
          <div>
            <div className="mb-2 block">
              <Label htmlFor="hobbies" className="text-text-primary dark:text-text-primary">
                My Hobbies
              </Label>
            </div>
            <Controller
              name="hobbies"
              control={control}
              render={({ field }) => (
                <Textarea 
                  {...field}
                  id="hobbies" 
                  placeholder="What are your hobbies and interests?" 
                  rows={3}
                  className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
                />
              )}
            />
            <FormError message={errors.hobbies?.message} />
          </div>
          
          <div>
            <div className="mb-2 block">
              <Label htmlFor="country" className="text-text-primary dark:text-text-primary">
                {t('country')}
              </Label>
            </div>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <FlowbiteSelect
                  {...field}
                  id="country"
                  className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
                >
                  <option value="">Select a country</option>
                  {countryOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </FlowbiteSelect>
              )}
            />
            <FormError message={errors.country?.message} />
          </div>
          
          <div>
            <div className="mb-2 block">
              <Label htmlFor="languages" className="text-text-primary dark:text-text-primary">
                {t('languages')}
              </Label>
            </div>
            <Controller
              name="languages"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  id="languages"
                  isMulti
                  options={languageOptions}
                  placeholder="Select or type languages..."
                  className="basic-multi-select w-full"
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              )}
            />
            <FormError message={errors.languages?.message} />
            <p className="mt-1 text-sm text-text-tertiary dark:text-text-tertiary">
              You can select from the list or type new languages
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
