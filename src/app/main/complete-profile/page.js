// app/complete-profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth } from 'firebaseConfig';
import { useRouter } from 'next/navigation';
import { Button } from 'flowbite-react';
import { useAuth } from '@/hooks/useAuth';
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
    } catch (error) {
      console.error("Error updating profile:", error);
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
    </div>
  );
}
