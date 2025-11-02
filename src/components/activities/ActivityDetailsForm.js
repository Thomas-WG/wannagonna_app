import { FloatingLabel, Textarea, Radio, Label, Datepicker, Card, TextInput, Select as FlowbiteSelect, Badge } from 'flowbite-react';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import Select from 'react-select';
import { fetchSkills } from '@/utils/crudSkills';
import { 
  HiCalendar, 
  HiUsers, 
  HiLink, 
  HiCog, 
  HiPhone, 
  HiMail, 
  HiUser,
  HiMapPin,
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

      {/* URL Field for Event Links or Volunteering Management System */}
      <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <HiLink className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Activity Link</h2>
            <p className="text-sm text-gray-600">Link to the event or your volunteering management system (optional)</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <FloatingLabel
              variant='filled'
              label="Event or Management System URL"
              helperText="Provide a link to the event, registration page, or your own volunteering management system"
              name='activity_url'
              value={formData.activity_url || ''}
              onChange={handleChange}
              type='url'
              icon={HiLink}
            />
          </div>
        </div>
      </Card>
    </div>
  );
} 