import { Card, Label, TextInput, Textarea, Select } from 'flowbite-react';
import ProfilePicture from './ProfilePicture';
import CreatableSelect from 'react-select/creatable';
import { useTranslations } from 'next-intl';

export default function ProfileInformation({ profileData, handleInputChange, handleMultiSelectChange, countryOptions, languageOptions, handleProfilePictureChange }) {
  const t = useTranslations('CompleteProfile');

  return (
    <Card className="w-full h-fit">
              <div className="p-4">
                <ProfilePicture profileData={profileData} handleProfilePictureChange={handleProfilePictureChange} />
                <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                  {t('profile')}
                </h5>
                <div className="space-y-4">
                <div>
                    <div className="mb-2 block">
                      <Label htmlFor="email">{t('email')}</Label>
                    </div>
                    <TextInput 
                      id="email" 
                      name="email"
                      type="email"
                      value={profileData.email} 
                      disabled
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {t('emailHelper')}
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="displayname">{t('displayName')}</Label>
                    </div>
                    <TextInput 
                      id="displayname" 
                      name="displayName"
                      type="text" 
                      placeholder="Titi Toto" 
                      value={profileData.displayName} 
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="bio">{t('bio')}</Label>
                    </div>
                    <Textarea 
                      id="bio" 
                      name="bio"
                      placeholder="A few words about yourself" 
                      value={profileData.bio} 
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="country">{t('country')}</Label>
                    </div>
                    <Select
                      id="country"
                      name="country"
                      value={profileData.country}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a country</option>
                      {countryOptions.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="languages">{t('languages')}</Label>
                    </div>
                    <CreatableSelect
                      id="languages"
                      name="languages"
                      isMulti
                      options={languageOptions}
                      value={profileData.languages}
                      onChange={handleMultiSelectChange('languages')}
                      placeholder="Select or type languages..."
                      className="basic-multi-select"
                      classNamePrefix="select"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {t('languagesHelper')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
  );
}
