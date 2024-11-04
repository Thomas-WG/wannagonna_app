// app/complete-profile/page.js
'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth } from 'firebaseConfig';
import { useRouter } from 'next/navigation';

export default function CompleteProfilePage() {
  const [profileData, setProfileData] = useState({
    displayName: auth.currentUser.displayName || '',
    bio: '',
  });
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDoc, profileData);
      console.log("Profile updated!");
      router.push('/'); // Redirect to home or dashboard after saving profile
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-semibold text-center mb-4">Complete Profile</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="displayName"
            placeholder="Display Name"
            value={profileData.displayName}
            onChange={handleInputChange}
            className="w-full p-2 border rounded mb-4"
          />
          <textarea
            name="bio"
            placeholder="Short Bio"
            value={profileData.bio}
            onChange={handleInputChange}
            className="w-full p-2 border rounded mb-4"
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
