import { collection, getDocs, addDoc, getDoc, updateDoc, doc, onSnapshot, query, where} from 'firebase/firestore';
import { db } from 'firebaseConfig';

// Fetch all members from the Firestore database
export async function fetchMembers() {
  try {
    const membersCollection = collection(db, 'members'); // Reference to the member collection
    const snapshot = await getDocs(membersCollection); // Get documents from the collection
    
    // Log the snapshot to see the raw data
    console.log('Firestore snapshot:', snapshot);

    // Map over the documents and log each activity's data
    const members = snapshot.docs.map((doc) => {
      const data = doc.data(); // Get data from each document
      return {id: doc.id, ...data}; // Return an object with the document ID and data
    });

    return members; // Return the array of members
  } catch (error) {
    console.error('Error fetching members:', error); // Log any errors
  }
}


// Update an existing member in the Firestore database
export async function updateMember(id, data) {
  try {
    const memberDoc = doc(db, 'members', id); // Reference to the specific member document
    await updateDoc(memberDoc, data); // Update the document with the provided data
    console.log('Member updated:', id); // Log the ID of the updated member
  } catch (error) {
    console.error('Error updating member:', error); // Log any errors
  }
}


// Fetch a member's data and set it in state with default values
export async function fetchMemberById(userId, setProfileData) {
  if (!userId) return;
  
  try {
    // Get the document reference
    const memberDoc = doc(db, 'members', userId);
    // Fetch the document
    const docSnap = await getDoc(memberDoc);
    
    if (docSnap.exists()) {
      const memberData = docSnap.data();
      
      // Default values for all fields
      const defaultValues = {
        displayName: '',
        email: '',
        bio: '',
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
        },
        xp: 0,
        badges:[],
        code: '',
        referredBy: '',
        cause: '',
        hobbies: ''
      };
      
      // Build the final data object with proper defaults
      const finalData = {
        ...defaultValues,
        ...memberData,
        // Ensure we don't override with undefined/null values, use defaults
        displayName: memberData.displayName ?? defaultValues.displayName,
        email: memberData.email ?? defaultValues.email,
        profilePicture: memberData.profilePicture ?? defaultValues.profilePicture,
        bio: memberData.bio ?? defaultValues.bio,
        country: memberData.country ?? defaultValues.country,
        languages: Array.isArray(memberData.languages) ? memberData.languages : defaultValues.languages,
        skills: Array.isArray(memberData.skills) ? memberData.skills : defaultValues.skills,
        xp: memberData.xp ?? defaultValues.xp,
        badges: Array.isArray(memberData.badges) ? memberData.badges : defaultValues.badges,
        code: memberData.code ?? defaultValues.code,
        referredBy: memberData.referredBy ?? defaultValues.referredBy,
        cause: memberData.cause ?? defaultValues.cause,
        hobbies: memberData.hobbies ?? defaultValues.hobbies,
        timeCommitment: {
          ...defaultValues.timeCommitment,
          ...(memberData.timeCommitment || {})
        },
        availabilities: {
          ...defaultValues.availabilities,
          ...(memberData.availabilities || {})
        }
      };
      
      // Call setProfileData with final data
      // React's useState setter accepts both values and functions, so this works for both patterns:
      // - Direct setter: setProfileData (will receive finalData as value)
      // - Callback pattern: (data) => setProfileData(data) (will receive finalData as argument)
      setProfileData(finalData);
    } else {
      console.log("No member document found for user ID:", userId);
    }
  } catch (error) {
    console.error("Error fetching member data:", error);
  }
}

/**
 * Fetch public member profile data (excludes sensitive information like email)
 * @param {string} userId - The user ID of the member
 * @returns {Promise<Object|null>} Public member profile object or null if not found
 */
export async function fetchPublicMemberProfile(userId) {
  if (!userId) return null;
  
  try {
    const memberDoc = doc(db, 'members', userId);
    const docSnap = await getDoc(memberDoc);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const memberData = docSnap.data();
    
    // Convert createdAt timestamp if it exists
    let createdAt = null;
    if (memberData.createdAt) {
      if (memberData.createdAt.toDate && typeof memberData.createdAt.toDate === 'function') {
        createdAt = memberData.createdAt.toDate();
      } else if (memberData.createdAt.seconds) {
        createdAt = new Date(memberData.createdAt.seconds * 1000);
      } else if (memberData.createdAt instanceof Date) {
        createdAt = memberData.createdAt;
      }
    }
    
    // Calculate level from XP
    const xp = memberData.xp || 0;
    const level = Math.floor(xp / 100) + 1;
    
    // Return only public fields (exclude email, referredBy, code)
    return {
      displayName: memberData.displayName || '',
      bio: memberData.bio || '',
      country: memberData.country || '',
      languages: Array.isArray(memberData.languages) ? memberData.languages : [],
      skills: Array.isArray(memberData.skills) ? memberData.skills : [],
      profilePicture: memberData.profilePicture || '',
      xp: xp,
      level: level,
      badges: Array.isArray(memberData.badges) ? memberData.badges : [],
      cause: memberData.cause || '',
      hobbies: memberData.hobbies || '',
      createdAt: createdAt,
      timeCommitment: memberData.timeCommitment || {
        daily: false,
        weekly: false,
        biweekly: false,
        monthly: false,
        occasional: false,
        flexible: false
      },
      availabilities: memberData.availabilities || {
        weekdays: false,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: false,
        flexible: false
      }
    };
  } catch (error) {
    console.error('Error fetching public member profile:', error);
    return null;
  }
}

/**
 * Format creation date as "Month Year" (e.g., "January 2024")
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatJoinedDate(date) {
  if (!date) return null;
  
  try {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting joined date:', error);
    return null;
  }
}

/**
 * Find a user by their referral code
 * @param {string} referralCode - The referral code to search for
 * @returns {Promise<Object|null>} User object with id and data if found, null otherwise
 */
export async function findUserByCode(referralCode) {
  try {
    if (!referralCode || referralCode.trim().length === 0) {
      return null;
    }
    
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where('code', '==', referralCode.toUpperCase().trim()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Return the first matching user (codes should be unique)
    const userDoc = querySnapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error finding user by code:', error);
    return null;
  }
}