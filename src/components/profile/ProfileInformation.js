import { Card, Label, TextInput, Textarea, Select as FlowbiteSelect } from 'flowbite-react';
import ProfilePicture from './ProfilePicture';
import CreatableSelect from 'react-select/creatable';
import { useTranslations } from 'next-intl';
import Select from 'react-select';

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
                      <Label htmlFor="cause">{t('cause')}</Label>
                    </div>
                    <Textarea 
                      id="cause" 
                      name="cause"
                      placeholder="What cause are you passionate about?" 
                      value={profileData.cause || ''} 
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="hobbies">My Hobbies</Label>
                    </div>
                    <Textarea 
                      id="hobbies" 
                      name="hobbies"
                      placeholder="What are your hobbies and interests?" 
                      value={profileData.hobbies || ''} 
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="country">{t('country')}</Label>
                    </div>
                    <FlowbiteSelect
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
                    </FlowbiteSelect>
                  </div>
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="languages">{t('languages')}</Label>
                    </div>
                    <Select
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
                      You can select from the list or type new languages
                    </p>
                  </div>
                </div>
              </div>
            </Card>
  );
}
