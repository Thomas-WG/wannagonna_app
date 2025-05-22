import { collection, getDocs, addDoc, getDoc, updateDoc, doc, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';

// Fetch all organizations
export async function fetchOrganizations() {
  try {
    const organizationsCollection = collection(db, 'organizations');
    const q = query(organizationsCollection, orderBy('name'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return [];
  }
}

// Fetch a single organization by ID
export async function fetchOrganizationById(id) {
  try {
    const organizationDoc = doc(db, 'organizations', id);
    const docSnap = await getDoc(organizationDoc);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
}

// Add a new organization
export async function addOrganization(data) {
  try {
    const organizationsCollection = collection(db, 'organizations');
    const docRef = await addDoc(organizationsCollection, {
      ...data,
      totalOnlineActivities: 0,
      totalLocalActivities: 0,
      totalEvents: 0,
      totalNewApplications: 0,
      totalParticipants: 0
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding organization:', error);
    throw error;
  }
}

// Update an existing organization
export async function updateOrganization(id, data) {
  try {
    const organizationDoc = doc(db, 'organizations', id);
    await updateDoc(organizationDoc, data);
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
}

// Delete an organization
export async function deleteOrganization(id) {
  try {
    const organizationDoc = doc(db, 'organizations', id);
    await deleteDoc(organizationDoc);
  } catch (error) {
    console.error('Error deleting organization:', error);
    throw error;
  }
}

// Get organizations for the Select component
export async function getOrganizationsForSelect(locale = 'en') {
  try {
    const organizations = await fetchOrganizations();
    
    return organizations.map(org => ({
      value: org.id,
      label: org.name[locale] || org.name['en']
    }));
  } catch (error) {
    console.error('Error getting organizations for select:', error);
    return [];
  }
} 