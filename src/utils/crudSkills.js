import { collection, getDocs, addDoc, getDoc, updateDoc, doc, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';

// Fetch all skill categories
export async function fetchSkillCategories() {
  try {
    const categoriesCollection = collection(db, 'skillCategories');
    const q = query(categoriesCollection, orderBy('order'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching skill categories:', error);
    return [];
  }
}

// Fetch all skills, optionally filtered by category
export async function fetchSkills(categoryId = null) {
  try {
    const skillsCollection = collection(db, 'skills');
    let q = query(skillsCollection, orderBy('order'));
    
    if (categoryId) {
      q = query(q, where('categoryId', '==', categoryId));
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching skills:', error);
    return [];
  }
}

// Add a new skill category
export async function addSkillCategory(categoryData) {
  try {
    const categoriesCollection = collection(db, 'skillCategories');
    const docRef = await addDoc(categoriesCollection, categoryData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding skill category:', error);
    throw error;
  }
}

// Add a new skill
export async function addSkill(skillData) {
  try {
    const skillsCollection = collection(db, 'skills');
    const docRef = await addDoc(skillsCollection, skillData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding skill:', error);
    throw error;
  }
}

// Update a skill category
export async function updateSkillCategory(categoryId, categoryData) {
  try {
    const categoryDoc = doc(db, 'skillCategories', categoryId);
    await updateDoc(categoryDoc, categoryData);
  } catch (error) {
    console.error('Error updating skill category:', error);
    throw error;
  }
}

// Update a skill
export async function updateSkill(skillId, skillData) {
  try {
    const skillDoc = doc(db, 'skills', skillId);
    await updateDoc(skillDoc, skillData);
  } catch (error) {
    console.error('Error updating skill:', error);
    throw error;
  }
}

// Get skills with their categories for the Select component
export async function getSkillsForSelect(locale = 'en') {
  try {
    const categories = await fetchSkillCategories();
    const skills = await fetchSkills();
    
    // Group skills by category
    const groupedSkills = categories.map(category => {
      const categorySkills = skills
        .filter(skill => skill.categoryId === category.id)
        .map(skill => ({
          value: skill.id,
          label: skill.name[locale] || skill.name['en'],
          category: category.name[locale] || category.name['en']
        }));
      
      return {
        label: category.name[locale] || category.name['en'],
        options: categorySkills
      };
    });
    
    return groupedSkills;
  } catch (error) {
    console.error('Error getting skills for select:', error);
    return [];
  }
}

// Delete a skill category
export async function deleteSkillCategory(categoryId) {
  try {
    const categoryDoc = doc(db, 'skillCategories', categoryId);
    await deleteDoc(categoryDoc);
  } catch (error) {
    console.error('Error deleting skill category:', error);
    throw error;
  }
}

// Delete a skill
export async function deleteSkill(skillId) {
  try {
    const skillDoc = doc(db, 'skills', skillId);
    await deleteDoc(skillDoc);
  } catch (error) {
    console.error('Error deleting skill:', error);
    throw error;
  }
} 