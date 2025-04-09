import { Card, Label, TextInput, Textarea, Select } from 'flowbite-react';
import ProfilePicture from './ProfilePicture';
import CreatableSelect from 'react-select/creatable';

export default function ProfileInformation({ profileData, handleInputChange, handleMultiSelectChange, countryOptions, languageOptions, handleProfilePictureChange }) {
  return (
    <Card className="w-full h-fit">
              <div className="p-4">
                <ProfilePicture profileData={profileData} handleProfilePictureChange={handleProfilePictureChange} />
                <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                  Profile Information
                </h5>
                <div className="space-y-4">
                <div>
                    <div className="mb-2 block">
                      <Label htmlFor="email">Your email</Label>
                    </div>
                    <TextInput 
                      id="email" 
                      name="email"
                      type="email"
                      value={profileData.email} 
                      disabled
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      This can not be changed as it is your login. Please contact us if you need to change it (support@wannagona.org).
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="displayname">Your display name</Label>
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
                      <Label htmlFor="bio">Your bio</Label>
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
                      <Label htmlFor="country">Your country</Label>
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
                      <Label htmlFor="languages">Languages you speak</Label>
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
                      You can select from the list or type new languages
                    </p>
                  </div>
                </div>
              </div>
            </Card>
  );
}
