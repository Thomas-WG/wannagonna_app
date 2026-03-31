require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, writeBatch, doc, connectFirestoreEmulator } = require('firebase/firestore');
const skillsData = require('../data/skills.json');


// Your Firebase configuration
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to Firestore emulator
connectFirestoreEmulator(db, 'localhost', 8080);

async function importSkills() {
  try {
    console.log('Starting skills import to emulator...');
    
    // Create a batch for atomic operations
    const batch = writeBatch(db);
    
    // Import categories
    const categoryMap = new Map();
    const categoriesCollection = collection(db, 'skill_categories');
    
    console.log('Importing categories...');
    for (const category of skillsData.categories) {
      const categoryRef = doc(categoriesCollection);
      categoryMap.set(category.id, categoryRef.id);
      
      console.log(`Adding category: ${category.name.en}`);
      batch.set(categoryRef, {
        name: category.name,
        id: category.id,
        order: category.order
      });
    }
    
    // Import skills
    const skillsCollection = collection(db, 'skills');
    
    console.log('Importing skills...');
    for (const skill of skillsData.skills) {
      const skillRef = doc(skillsCollection);
      
      console.log(`Adding skill: ${skill.name.en} (category_id: ${skill.categoryId})`);
      batch.set(skillRef, {
        name: skill.name,
        category_id: skill.categoryId,
        order: skill.order
      });
    }
    
    // Commit the batch
    console.log('Committing batch...');
    await batch.commit();
    console.log('Skills import to emulator completed successfully!');
    
  } catch (error) {
    console.error('Error importing skills:', error);
  }
}

// Run the import
importSkills(); 