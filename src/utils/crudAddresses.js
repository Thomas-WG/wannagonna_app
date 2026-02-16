import { collection, getDocs, addDoc, getDoc, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * Fetch all addresses for an organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Array>} Array of address objects
 */
export async function fetchAddresses(organizationId) {
  try {
    if (!organizationId) {
      console.error('Error fetching addresses: organizationId is required');
      return [];
    }

    const orgRef = doc(db, 'organizations', organizationId);
    const addressesCollection = collection(orgRef, 'addresses');
    const q = query(addressesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return [];
  }
}

/**
 * Fetch a single address by ID
 * @param {string} organizationId - Organization ID
 * @param {string} addressId - Address ID
 * @returns {Promise<Object|null>} Address object or null if not found
 */
export async function fetchAddressById(organizationId, addressId) {
  try {
    if (!organizationId || !addressId) {
      console.error('Error fetching address: organizationId and addressId are required');
      return null;
    }

    const addressDoc = doc(db, 'organizations', organizationId, 'addresses', addressId);
    const snapshot = await getDoc(addressDoc);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    } else {
      console.log('No such address!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching address:', error);
    return null;
  }
}

/**
 * Create a new address for an organization
 * @param {string} organizationId - Organization ID
 * @param {Object} addressData - Address data object
 * @returns {Promise<string>} Address ID
 */
export async function createAddress(organizationId, addressData) {
  try {
    if (!organizationId) {
      console.error('Error creating address: organizationId is required');
      throw new Error('organizationId is required to create an address');
    }

    const orgRef = doc(db, 'organizations', organizationId);
    const addressesCollection = collection(orgRef, 'addresses');
    
    const addressWithTimestamps = {
      ...addressData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(addressesCollection, addressWithTimestamps);
    console.log('Address created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating address:', error);
    throw error;
  }
}

/**
 * Update an existing address
 * @param {string} organizationId - Organization ID
 * @param {string} addressId - Address ID
 * @param {Object} addressData - Updated address data
 */
export async function updateAddress(organizationId, addressId, addressData) {
  try {
    if (!organizationId || !addressId) {
      console.error('Error updating address: organizationId and addressId are required');
      throw new Error('organizationId and addressId are required');
    }

    const addressDoc = doc(db, 'organizations', organizationId, 'addresses', addressId);
    
    const updateData = {
      ...addressData,
      updatedAt: new Date()
    };
    
    await updateDoc(addressDoc, updateData);
    console.log('Address updated:', addressId);
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
}

/**
 * Delete an address
 * @param {string} organizationId - Organization ID
 * @param {string} addressId - Address ID
 */
export async function deleteAddress(organizationId, addressId) {
  try {
    if (!organizationId || !addressId) {
      console.error('Error deleting address: organizationId and addressId are required');
      throw new Error('organizationId and addressId are required');
    }

    const addressDoc = doc(db, 'organizations', organizationId, 'addresses', addressId);
    await deleteDoc(addressDoc);
    console.log('Address deleted:', addressId);
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
}
