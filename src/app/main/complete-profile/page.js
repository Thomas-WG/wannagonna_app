// app/complete-profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { auth } from 'firebaseConfig';
import { useRouter } from 'next/navigation';
import { Button, Toast } from 'flowbite-react';
import { useAuth } from '@/utils/AuthContext'; // Hook for accessing user authentication status
import { countries } from 'countries-list';
import languages from '@cospired/i18n-iso-languages';
import { updateMember, fetchMemberById } from '@/utils/crudMemberProfile';
import { uploadProfilePicture } from '@/utils/storage';
import ProfileInformation from '@/components/profile/ProfileInformation';
import SkillsAndAvailability from '@/components/profile/SkillsAndAvailability';

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

  const [profileData, setProfileData] = useState({
    displayName: auth.currentUser?.displayName || '',
    email: auth.currentUser?.email || '',
    bio: '',
    country: '',
    languages: [], // This will now store an array of { value, label } objects
    skills: [],
    profilePicture: auth.currentUser?.photoURL || '',
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
  });
  
  // Add state to store the selected file
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Add state for toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'

  useEffect(() => {
    if (user?.uid) {
      fetchMemberById(user.uid, setProfileData);
    }
  }, [user?.uid]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'languages') {
      // Handle multiple selections for languages
      const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
      setProfileData(prev => ({ ...prev, languages: selectedOptions }));
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMultiSelectChange = (field) => (newValue) => {
    setProfileData(prev => ({
      ...prev,
      [field]: newValue || []
    }));
  };

  const handleCheckboxChange = (field) => (e) => {
    const { name, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [name]: checked
      }
    }));
  };
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Store the file for later upload
        setSelectedFile(file);
        
        // Create a temporary URL for preview
        const imageUrl = URL.createObjectURL(file);
        
        // Update the profile data with the temporary image URL
        setProfileData(prev => ({
          ...prev,
          profilePicture: imageUrl
        }));
      } catch (error) {
        console.error("Error handling profile picture:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(profileData);

    try {
      let finalProfileData = { ...profileData };
      
      // Upload profile picture if a new one was selected
      if (selectedFile && user?.uid) {
        try {
          const downloadURL = await uploadProfilePicture(selectedFile, user.uid);
          finalProfileData.profilePicture = downloadURL;
        } catch (error) {
          console.error("Error uploading profile picture:", error);
          // Continue with form submission even if picture upload fails
        }
      }
      
      const cleanedProfileData = cleanData(finalProfileData);
      await updateMember(user.uid, cleanedProfileData);
      console.log("Profile updated!");
      
      // Show success toast
      setToastMessage('Profile updated successfully!');
      setToastType('success');
      setShowToast(true);
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Show error toast
      setToastMessage('Failed to update profile. Please try again.');
      setToastType('error');
      setShowToast(true);
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileInformation
            profileData={profileData}
            handleProfilePictureChange={handleProfilePictureChange}
            handleInputChange={handleInputChange}
            handleMultiSelectChange={handleMultiSelectChange}
            countryOptions={countryOptions}
            languageOptions={languageOptions}
          />
          <SkillsAndAvailability
            profileData={profileData}
            handleMultiSelectChange={handleMultiSelectChange}
            handleCheckboxChange={handleCheckboxChange}
          />
        </div>
        <div className="flex justify-center pb-6">
          <Button type="submit" className="w-full md:w-auto md:min-w-[200px]">
            Save Profile
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
    </div>
  );
}
