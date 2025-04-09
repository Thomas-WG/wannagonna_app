import { Card, Label, Checkbox } from 'flowbite-react';
import CreatableSelect from 'react-select/creatable';

export default function SkillsAndAvailability({ profileData, handleMultiSelectChange, handleCheckboxChange }) {
  return (
    <Card className="w-full h-fit">
              <div className="p-4">
                <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                  Skills & Availability
                </h5>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="skills">Your skills</Label>
                    </div>
                    <CreatableSelect
                      id="skills"
                      name="skills"
                      isMulti
                      options={[]} // You'll need to define skill options
                      value={profileData.skills}
                      onChange={handleMultiSelectChange('skills')}
                      placeholder="Select or type your skills..."
                      className="basic-multi-select"
                      classNamePrefix="select"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-2 block">
                        <Label>How often do you want to volunteer?</Label>
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
                          <Label htmlFor="daily">Daily</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="weekly"
                            name="weekly"
                            checked={profileData.timeCommitment.weekly}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="weekly">Weekly</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="biweekly"
                            name="biweekly"
                            checked={profileData.timeCommitment.biweekly}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="biweekly">Every two weeks</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="monthly"
                            name="monthly"
                            checked={profileData.timeCommitment.monthly}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="monthly">Monthly</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="occasional"
                            name="occasional"
                            checked={profileData.timeCommitment.occasional}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="occasional">Occasionally</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="flexible"
                            name="flexible"
                            checked={profileData.timeCommitment.flexible}
                            onChange={handleCheckboxChange('timeCommitment')}
                            className="mr-2"
                          />
                          <Label htmlFor="flexible">Flexible</Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 block">
                        <Label>When are you usually available?</Label>
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
                          <Label htmlFor="weekdays">Weekdays</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="weekends"
                            name="weekends"
                            checked={profileData.availabilities.weekends}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="weekends">Weekends</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="mornings"
                            name="mornings"
                            checked={profileData.availabilities.mornings}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="mornings">Mornings</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="afternoons"
                            name="afternoons"
                            checked={profileData.availabilities.afternoons}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="afternoons">Afternoons</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="evenings"
                            name="evenings"
                            checked={profileData.availabilities.evenings}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="evenings">Evenings</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="flexible2"
                            name="flexible"
                            checked={profileData.availabilities.flexible}
                            onChange={handleCheckboxChange('availabilities')}
                            className="mr-2"
                          />
                          <Label htmlFor="flexible2">Flexible</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
  );
}
