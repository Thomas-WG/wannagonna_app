import { Card, Label, TextInput } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { formatUrlForDisplay } from '@/utils/urlUtils';
import { Controller } from 'react-hook-form';
import { normalizeUrl } from '@/utils/urlUtils';
import FormError from './FormError';
import { useTheme } from '@/utils/theme/ThemeContext';

export default function ConnectLinks({ control, errors, setValue, trigger }) {
  const t = useTranslations('CompleteProfile');
  const { isDark } = useTheme();

  const handleUrlBlur = async (fieldName, value) => {
    if (value && value.trim() !== '') {
      const normalized = normalizeUrl(value);
      setValue(fieldName, normalized, { shouldValidate: true });
      await trigger(fieldName);
    }
  };

  return (
    <Card className="w-full h-fit bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
      <div className="p-4 md:p-6">
        <h5 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-primary mb-4">
          {t('connect') || 'Connect'}
        </h5>
        <div className="space-y-4">
          <div>
            <div className="mb-2 block">
              <Label htmlFor="website" className="text-text-primary dark:text-text-primary">
                {t('website')}
              </Label>
            </div>
            <Controller
              name="website"
              control={control}
              render={({ field }) => {
                const displayValue = formatUrlForDisplay(field.value || '');
                return (
                  <TextInput 
                    {...field}
                    value={displayValue}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                    onBlur={async (e) => {
                      await handleUrlBlur('website', e.target.value);
                      field.onBlur();
                    }}
                    id="website" 
                    type="text"
                    placeholder="www.example.com or example.com" 
                    className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
                  />
                );
              }}
            />
            <FormError message={errors.website?.message} />
            <p className="mt-1 text-sm text-text-tertiary dark:text-text-tertiary">
              {t('websiteHelper')} {t('urlHelper') || '(https:// will be added automatically)'}
            </p>
          </div>
          
          <div>
            <div className="mb-2 block">
              <Label htmlFor="linkedin" className="text-text-primary dark:text-text-primary">
                {t('linkedin')}
              </Label>
            </div>
            <Controller
              name="linkedin"
              control={control}
              render={({ field }) => {
                const displayValue = formatUrlForDisplay(field.value || '');
                return (
                  <TextInput 
                    {...field}
                    value={displayValue}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                    onBlur={async (e) => {
                      await handleUrlBlur('linkedin', e.target.value);
                      field.onBlur();
                    }}
                    id="linkedin" 
                    type="text"
                    placeholder="www.linkedin.com/in/yourprofile" 
                    className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
                  />
                );
              }}
            />
            <FormError message={errors.linkedin?.message} />
            <p className="mt-1 text-sm text-text-tertiary dark:text-text-tertiary">
              {t('socialMediaHelper')} {t('urlHelper') || '(https:// will be added automatically)'}
            </p>
          </div>
          
          <div>
            <div className="mb-2 block">
              <Label htmlFor="facebook" className="text-text-primary dark:text-text-primary">
                {t('facebook')}
              </Label>
            </div>
            <Controller
              name="facebook"
              control={control}
              render={({ field }) => {
                const displayValue = formatUrlForDisplay(field.value || '');
                return (
                  <TextInput 
                    {...field}
                    value={displayValue}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                    onBlur={async (e) => {
                      await handleUrlBlur('facebook', e.target.value);
                      field.onBlur();
                    }}
                    id="facebook" 
                    type="text"
                    placeholder="www.facebook.com/yourprofile" 
                    className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
                  />
                );
              }}
            />
            <FormError message={errors.facebook?.message} />
          </div>
          
          <div>
            <div className="mb-2 block">
              <Label htmlFor="instagram" className="text-text-primary dark:text-text-primary">
                {t('instagram')}
              </Label>
            </div>
            <Controller
              name="instagram"
              control={control}
              render={({ field }) => {
                const displayValue = formatUrlForDisplay(field.value || '');
                return (
                  <TextInput 
                    {...field}
                    value={displayValue}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                    onBlur={async (e) => {
                      await handleUrlBlur('instagram', e.target.value);
                      field.onBlur();
                    }}
                    id="instagram" 
                    type="text"
                    placeholder="www.instagram.com/yourprofile" 
                    className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
                  />
                );
              }}
            />
            <FormError message={errors.instagram?.message} />
          </div>
        </div>
      </div>
    </Card>
  );
}
