import { FloatingLabel, Textarea, Radio, Label, Datepicker, Card } from 'flowbite-react';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import Select from 'react-select';
import { fetchSkills } from '@/utils/crudSkills';

export default function ActivityDetailsForm({ formData, handleChange, setFormData }) {
  const t = useTranslations('ManageActivities');
  const [skillOptions, setSkillOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState([]);
  
  return (
    <Card className="max-w-4xl w-full">
      <label className='block font-medium mb-1'>
        {`${t('info-label')}`}
      </label>
      <div className='flex flex-col md:flex-row flex-wrap gap-4'>
        <div className="w-full md:w-96">
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
          />
        </div>
        <div className="w-full md:w-96">
          <Textarea
            id='activityDescription'
            placeholder={t('activity-description-label')}
            required
            rows={4}
            name='description'
            value={formData.description}
            onChange={handleChange}
            helperText={t('activity-description-helper')}
          />
        </div>
        <fieldset className='flex max-w-md flex-col gap-4 w-full md:w-96'>
          <Label htmlFor='frequency'>{t('frequency-label')}</Label>
          <div className='flex items-center gap-2'>
            <Radio
              id='once'
              name='frequency'
              value='once'
              checked={formData.frequency === 'once'}
              onChange={handleChange}
            />
            <Label htmlFor='once'>{t('frequency-once')}</Label>
          </div>
          <div className='flex items-center gap-2'>
            <Radio
              id='regular'
              name='frequency'
              value='regular'
              checked={formData.frequency === 'regular'}
              onChange={handleChange}
            />
            <Label htmlFor='regular'>{t('frequency-regular')}</Label>
          </div>
        </fieldset>
        <div className="w-full md:w-96">
          <Label htmlFor='start_date'>{t('start_date')}</Label>
          <Datepicker 
            weekStart={1}
            value={formData.start_date ? new Date(formData.start_date) : new Date()}
            name='start_date'
            onChange={(date) => setFormData((prev) => ({ ...prev, start_date: date }))}
          />
        </div>
        <div className="w-full md:w-96">
          <Label htmlFor='end_date'>{t('end_date')}</Label>
          <Datepicker 
            weekStart={1}
            name='end_date'
            value={formData.end_date ? new Date(formData.end_date) : new Date()}
            onChange={(date) => setFormData((prev) => ({ ...prev, end_date: date }))}
          />
        </div>
      </div>
    </Card>
  );
} 