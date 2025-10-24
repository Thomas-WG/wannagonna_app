import { FloatingLabel, Textarea, Radio, Label, Datepicker, Card, TextInput, Select as FlowbiteSelect, Badge } from 'flowbite-react';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import Select from 'react-select';
import { fetchSkills } from '@/utils/crudSkills';
import { 
  HiGlobeAlt, 
  HiLocationMarker, 
  HiCalendar, 
  HiUsers, 
  HiLink, 
  HiCog, 
  HiPhone, 
  HiMail, 
  HiUser,
  HiMapPin,
  HiWrench,
  HiTicket,
  HiShieldCheck,
  HiRefresh,
  HiChevronDown
} from 'react-icons/hi';
import { HiClock } from "react-icons/hi2";

export default function ActivityDetailsForm({ formData, handleChange, setFormData }) {
  const t = useTranslations('ManageActivities');
  
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
  
  return (
    <div className="max-w-6xl w-full space-y-8 p-4">
      {/* Basic Information Section */}
      <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HiShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('info-label')}</h2>
              <p className="text-sm text-gray-600">Provide essential details about your activity</p>
            </div>
          </div>
          <Badge 
            color={formData.type === 'online' ? 'blue' : formData.type === 'local' ? 'green' : 'purple'}
            size="lg"
            className="capitalize"
          >
            {formData.type} Activity
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Title */}
          <div className="lg:col-span-2">
          <FloatingLabel
            variant='filled'
            label={t('activity-title-label')}
            helperText={t('activity-title-helper')}
            name='title'
            value={formData.title}
            onChange={(e) => {
              if (e.target.value.length <= 50) {
                handleChange(e);
              }
            }}
            maxLength={50}
              className="text-lg"
          />
        </div>
          
          {/* Description */}
          <div className="lg:col-span-2">
          <Textarea
            id='activityDescription'
            placeholder={t('activity-description-label')}
            required
            rows={4}
            name='description'
            value={formData.description}
            onChange={handleChange}
            helperText={t('activity-description-helper')}
              className="resize-none"
          />
        </div>
          
          {/* Frequency */}
          <div className="space-y-3">
            <Label htmlFor='frequency' className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <HiClock className="h-4 w-4" />
              {t('frequency-label')}
            </Label>
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                formData.frequency === 'once' 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
              onClick={() => setFormData((prev) => ({ ...prev, frequency: 'once' }))}
              >
            <Radio
              id='once'
              name='frequency'
              value='once'
              checked={formData.frequency === 'once'}
              onChange={handleChange}
                  className="text-blue-600"
            />
                <Label htmlFor='once' className="text-sm font-medium cursor-pointer">{t('frequency-once')}</Label>
            </div>  
              {(formData.type === 'online' || formData.type === 'local') && (
                <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  formData.frequency === 'longterm' 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
                onClick={() => setFormData((prev) => ({ ...prev, frequency: 'role' }))}
                >
                  <Radio
                    id='role'
                    name='frequency'
                    value='role'
                    checked={formData.frequency === 'role'}
                    onChange={handleChange}
                    className="text-blue-600"
                  />
                  <Label htmlFor='role' className="text-sm font-medium cursor-pointer">{t('frequency-longterm')}</Label>
                </div>
              )}
            </div>
          </div>

          
          {/* Dates */}
          <div className="space-y-4">
            <div>
              <Label htmlFor='start_date' className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
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
            <div>
              <Label htmlFor='end_date' className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
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
      </Card>

      {/* Online Activity Specific Fields */}
      {formData.type === 'online' && (
        <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HiGlobeAlt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Online Activity Details</h2>
              <p className="text-sm text-gray-600">Configure your online meeting and participation settings</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <FloatingLabel
                variant='filled'
                label="Meeting Link"
                helperText="URL for the online meeting (Zoom, Teams, etc.)"
                name='meeting_link'
                value={formData.meeting_link || ''}
                onChange={handleChange}
                type='url'
              />
            </div>
            <div>
              <FloatingLabel
                variant='filled'
                label="Max Participants"
                helperText="Maximum number of participants allowed"
                name='max_participants'
                value={formData.max_participants || ''}
                onChange={handleChange}
                type='number'
                min='1'
              />
            </div>
          </div>
        </Card>
      )}

      {/* Local Activity Specific Fields */}
      {formData.type === 'local' && (
        <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <HiLocationMarker className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Local Activity Details</h2>
              <p className="text-sm text-gray-600">Set up location and logistics for your local activity</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <FloatingLabel
                variant='filled'
                label="Address"
                helperText="Full address where the activity takes place"
                name='address'
                value={formData.address || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <FloatingLabel
                variant='filled'
                label="Meeting Point"
                helperText="Specific meeting location or landmark"
                name='meeting_point'
                value={formData.meeting_point || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <FloatingLabel
                variant='filled'
                label="Max Volunteers"
                helperText="Maximum number of volunteers needed"
                name='max_volunteers'
                value={formData.max_volunteers || ''}
                onChange={handleChange}
                type='number'
                min='1'
              />
            </div>
            <div className="lg:col-span-2">
              <FloatingLabel
                variant='filled'
                label="Equipment Needed"
                helperText="Tools, materials, or equipment volunteers should bring"
                name='equipment_needed'
                value={formData.equipment_needed || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Event Specific Fields */}
      {formData.type === 'event' && (
        <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HiCalendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
              <p className="text-sm text-gray-600">Configure your event logistics and registration</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <FloatingLabel
                variant='filled'
                label="Venue"
                helperText="Event venue or location"
                name='venue'
                value={formData.venue || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <FloatingLabel
                variant='filled'
                label="Event Time"
                helperText="Time when the event starts"
                name='event_time'
                value={formData.event_time || ''}
                onChange={handleChange}
                type='time'
              />
            </div>
            <div>
              <FloatingLabel
                variant='filled'
                label="Duration"
                helperText="How long the event will last (e.g., 2 hours, 1 day, etc.)"
                name='duration'
                value={formData.duration || ''}
                onChange={handleChange}
              />
            </div>
            <div className="lg:col-span-2">
              <FloatingLabel
                variant='filled'
                label="Registration Link"
                helperText="Link to registration or ticketing system"
                name='ticketing_link'
                value={formData.ticketing_link || ''}
                onChange={handleChange}
                type='url'
              />
            </div>
            <div>
              <FloatingLabel
                variant='filled'
                label="Max Attendees"
                helperText="Maximum number of attendees"
                name='max_attendees'
                value={formData.max_attendees || ''}
                onChange={handleChange}
                type='number'
                min='1'
          />
        </div>
      </div>
    </Card>
      )}
    </div>
  );
} 