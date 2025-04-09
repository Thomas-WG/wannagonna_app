import { collection, getDocs, addDoc, getDoc, updateDoc, doc, onSnapshot} from 'firebase/firestore';
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
      setProfileData(prevData => ({
        ...prevData,
        ...memberData,
        // Ensure we don't override with undefined values
        displayName: memberData.displayName || prevData.displayName,
        email: memberData.email || prevData.email,
        profilePicture: memberData.profilePicture || prevData.profilePicture,
        bio: memberData.bio || prevData.bio,
        country: memberData.country || prevData.country,
        languages: memberData.languages || prevData.languages,
        skills: memberData.skills || prevData.skills,
        timeCommitment: memberData.timeCommitment || prevData.timeCommitment,
        availabilities: memberData.availabilities || prevData.availabilities
      }));
    } else {
      console.log("No member document found for user ID:", userId);
    }
  } catch (error) {
    console.error("Error fetching member data:", error);
  }
}