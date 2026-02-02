// app/complete-profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth } from 'firebaseConfig';
import { useRouter } from 'next/navigation';
import { Button, Toast } from 'flowbite-react';
import { useAuth } from '@/utils/auth/AuthContext';
import { countries } from 'countries-list';
import languages from '@cospired/i18n-iso-languages';
import { updateMember, fetchMemberById } from '@/utils/crudMemberProfile';
import { uploadProfilePicture } from '@/utils/storage';
import { isProfileComplete } from '@/utils/profileHelpers';
import { grantBadgeToUser, userHasBadge } from '@/utils/crudBadges';
import { profileSchema } from '@/utils/validation/profileSchema';
import ProfileInformation from '@/components/profile/ProfileInformation';
import SkillsAndAvailability from '@/components/profile/SkillsAndAvailability';
import ConnectLinks from '@/components/profile/ConnectLinks';
import BadgeAnimation from '@/components/badges/BadgeAnimation';
import ProfileProgress from '@/components/profile/ProfileProgress';

// Register the languages you want to use
languages.registerLocale(require("@cospired/i18n-iso-languages/langs/en.json"));

// Convert languages to array format needed for Select
const languageOptions = Object.entries(languages.getNames('en')).map(([code, name]) => ({
  value: code,
  label: name
})).sort((a, b) => a.label.localeCompare(b.label));

// Convert countries object to array format needed for Select
const countryOptions = Object.entries(countries).map(([code, country]) => ({
  value: code,
  label: country.name
})).sort((a, b) => a.label.localeCompare(b.label));

// Default form values
const defaultValues = {
  displayName: '',
  email: '',
  bio: '',
  cause: '',
  hobbies: '',
  website: '',
  linkedin: '',
  facebook: '',
  instagram: '',
  country: '',
  languages: [],
  skills: [],
  profilePicture: '',
  timeCommitment: {
    daily: false,
    weekly: false,
    biweekly: false,
    monthly: false,
    occasional: false,
    flexible: false
  },
  availabilities: {
    weekdays: false,
    weekends: false,
    mornings: false,
    afternoons: false,
    evenings: false,
    flexible: false
  }
};

function cleanData(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanData);
  }

  return Object.keys(obj).reduce((acc, key) => {
    if (!key.startsWith('__') && !key.endsWith('__')) {
      acc[key] = cleanData(obj[key]);
    }
    return acc;
  }, {});
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [earnedBadgeId, setEarnedBadgeId] = useState(null);
  const [hasCompleteProfileBadge, setHasCompleteProfileBadge] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger,
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: 'onBlur', // Validate on blur for better UX
  });

  const formValues = watch();

  // Check if user has completeProfile badge
  useEffect(() => {
    const checkBadge = async () => {
      if (!user?.uid) return;
      
      try {
        const hasBadge = await userHasBadge(user.uid, 'completeProfile');
        setHasCompleteProfileBadge(hasBadge);
      } catch (error) {
        console.error('Error checking badge:', error);
        // Default to showing progress bar if check fails
        setHasCompleteProfileBadge(false);
      }
    };

    checkBadge();
  }, [user?.uid]);

  // Load existing profile data
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // fetchMemberById uses a callback pattern
    fetchMemberById(user.uid, (profileData) => {
      if (profileData) {
        // Merge with defaults and reset form
        const mergedData = {
          ...defaultValues,
          ...profileData,
          displayName: profileData.displayName || auth.currentUser?.displayName || '',
          email: profileData.email || auth.currentUser?.email || '',
          profilePicture: profileData.profilePicture || auth.currentUser?.photoURL || '',
          languages: Array.isArray(profileData.languages) ? profileData.languages : [],
          skills: Array.isArray(profileData.skills) ? profileData.skills : [],
          timeCommitment: {
            ...defaultValues.timeCommitment,
            ...(profileData.timeCommitment || {}),
          },
          availabilities: {
            ...defaultValues.availabilities,
            ...(profileData.availabilities || {}),
          },
        };
        reset(mergedData);
      } else {
        // No existing profile, use auth defaults
        reset({
          ...defaultValues,
          displayName: auth.currentUser?.displayName || '',
          email: auth.currentUser?.email || '',
          profilePicture: auth.currentUser?.photoURL || '',
        });
      }
      setIsLoading(false);
    });
  }, [user?.uid, reset]);

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setSelectedFile(file);
        const imageUrl = URL.createObjectURL(file);
        setValue('profilePicture', imageUrl, { shouldValidate: true });
        // Note: We'll revoke the blob URL after upload in onSubmit
      } catch (error) {
        console.error("Error handling profile picture:", error);
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      let finalProfileData = { ...data };

      // Upload profile picture if a new one was selected
      if (selectedFile && user?.uid) {
        try {
          const downloadURL = await uploadProfilePicture(selectedFile, user.uid);
          finalProfileData.profilePicture = downloadURL;
          // Update form value with Firebase URL
          setValue('profilePicture', downloadURL, { shouldValidate: true });
          
          // Revoke the blob URL to free memory
          const currentProfilePicture = watch('profilePicture');
          if (currentProfilePicture && currentProfilePicture.startsWith('blob:')) {
            URL.revokeObjectURL(currentProfilePicture);
          }
          
          // Clear selected file after successful upload
          setSelectedFile(null);
        } catch (error) {
          console.error("Error uploading profile picture:", error);
        }
      }

      // Clean and normalize data
      const cleanedProfileData = cleanData(finalProfileData);

      await updateMember(user.uid, cleanedProfileData);
      console.log("Profile updated!");

      // Check if profile is complete and grant badge if needed
      const profileIsComplete = isProfileComplete(cleanedProfileData);
      let badgeDetails = null;

      if (profileIsComplete) {
        const hasBadge = await userHasBadge(user.uid, 'completeProfile');

        if (!hasBadge) {
          badgeDetails = await grantBadgeToUser(user.uid, 'completeProfile');

          if (badgeDetails) {
            console.log('Profile completion badge granted!', badgeDetails);
            setEarnedBadgeId(badgeDetails.id);
            setShowBadgeAnimation(true);
            // Update badge state to hide progress bar
            setHasCompleteProfileBadge(true);
          }
        }
      }

      // Show success toast
      setToastMessage('Profile updated successfully!');
      setToastType('success');
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setToastMessage('Failed to update profile. Please try again.');
      setToastType('error');
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-primary dark:text-text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator - Only show if user doesn't have the badge */}
      {!hasCompleteProfileBadge && (
        <ProfileProgress formData={formValues} />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Profile Information (takes 3/5 of width) */}
          <div className="lg:col-span-3">
            <ProfileInformation
              control={control}
              errors={errors}
              countryOptions={countryOptions}
              languageOptions={languageOptions}
              handleProfilePictureChange={handleProfilePictureChange}
              watch={watch}
            />
          </div>

          {/* Right Column - Connect Links and Skills & Availability stacked (takes 2/5 of width) */}
          <div className="lg:col-span-2 space-y-6">
            <ConnectLinks
              control={control}
              errors={errors}
              setValue={setValue}
              trigger={trigger}
            />
            <SkillsAndAvailability
              control={control}
              errors={errors}
              watch={watch}
            />
          </div>
        </div>
        <div className="flex justify-center pb-6">
          <Button 
            type="submit" 
            className="w-full md:w-auto md:min-w-[200px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50">
          <Toast>
            <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              toastType === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
            }`}>
              {toastType === 'success' ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              )}
            </div>
            <div className="ml-3 text-sm font-normal">
              {toastMessage}
            </div>
          </Toast>
        </div>
      )}

      {/* Badge Animation */}
      <BadgeAnimation
        badgeId={earnedBadgeId}
        show={showBadgeAnimation}
        onClose={() => {
          setShowBadgeAnimation(false);
          setEarnedBadgeId(null);
        }}
      />
    </div>
  );
}
