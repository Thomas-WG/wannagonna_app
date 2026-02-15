import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * Add a contact form submission (landing page - unauthenticated).
 * @param {{ name: string, email: string, message: string }} data
 * @returns {Promise<string>} New document ID
 */
export async function addContactSubmission({ name, email, message }) {
  if (!name || !name.trim()) throw new Error('Name is required');
  if (!email || !email.trim()) throw new Error('Email is required');
  if (!message || !message.trim()) throw new Error('Message is required');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) throw new Error('Invalid email address');

  const col = collection(db, 'contactSubmissions');
  const docRef = await addDoc(col, {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

/**
 * Add an email to the waitlist (landing page - unauthenticated).
 * @param {{ email: string }} data
 * @returns {Promise<string>} New document ID
 */
export async function addWaitlistEntry({ email }) {
  if (!email || !email.trim()) throw new Error('Email is required');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) throw new Error('Invalid email address');

  const col = collection(db, 'waitlist');
  const docRef = await addDoc(col, {
    email: email.trim().toLowerCase(),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}
