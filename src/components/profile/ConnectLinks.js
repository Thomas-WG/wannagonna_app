import { Card, Label, TextInput } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { formatUrlForDisplay } from '@/utils/urlUtils';
import { useState, useEffect } from 'react';

export default function ConnectLinks({ profileData, handleInputChange }) {
  const t = useTranslations('CompleteProfile');
  
  // Local state to store display values (without https://)
  const [displayValues, setDisplayValues] = useState({
    website: '',
    linkedin: '',
    facebook: '',
    instagram: ''
  });

  // Update display values when profileData changes
  useEffect(() => {
    setDisplayValues({
      website: formatUrlForDisplay(profileData.website || ''),
      linkedin: formatUrlForDisplay(profileData.linkedin || ''),
      facebook: formatUrlForDisplay(profileData.facebook || ''),
      instagram: formatUrlForDisplay(profileData.instagram || '')
    });
  }, [profileData.website, profileData.linkedin, profileData.facebook, profileData.instagram]);

  const handleUrlChange = (e) => {
    const { name, value } = e.target;
    // Update display value
    setDisplayValues(prev => ({ ...prev, [name]: value }));
    // Call parent handler with the raw value (user can type www.example.com or example.com)
    handleInputChange(e);
  };

  return (
    <Card className="w-full h-fit">
      <div className="p-4">
        <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          {t('connect') || 'Connect'}
        </h5>
        <div className="space-y-4">
          <div>
            <div className="mb-2 block">
              <Label htmlFor="website">{t('website')}</Label>
            </div>
            <TextInput 
              id="website" 
              name="website"
              type="text"
              placeholder="www.example.com or example.com" 
              value={displayValues.website} 
              onChange={handleUrlChange}
            />
            <p className="mt-1 text-sm text-gray-500">
              {t('websiteHelper')} {t('urlHelper') || '(https:// will be added automatically)'}
            </p>
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="linkedin">{t('linkedin')}</Label>
            </div>
            <TextInput 
              id="linkedin" 
              name="linkedin"
              type="text"
              placeholder="www.linkedin.com/in/yourprofile" 
              value={displayValues.linkedin} 
              onChange={handleUrlChange}
            />
            <p className="mt-1 text-sm text-gray-500">
              {t('socialMediaHelper')} {t('urlHelper') || '(https:// will be added automatically)'}
            </p>
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="facebook">{t('facebook')}</Label>
            </div>
            <TextInput 
              id="facebook" 
              name="facebook"
              type="text"
              placeholder="www.facebook.com/yourprofile" 
              value={displayValues.facebook} 
              onChange={handleUrlChange}
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="instagram">{t('instagram')}</Label>
            </div>
            <TextInput 
              id="instagram" 
              name="instagram"
              type="text"
              placeholder="www.instagram.com/yourprofile" 
              value={displayValues.instagram} 
              onChange={handleUrlChange}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
