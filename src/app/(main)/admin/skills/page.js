'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Card, Button, Label, TextInput, Select, Table, Modal, Toast } from 'flowbite-react';
import { 
  fetchSkillCategories, 
  fetchSkills, 
  addSkillCategory, 
  addSkill, 
  updateSkillCategory, 
  updateSkill,
  deleteSkillCategory,
  deleteSkill
} from '@/utils/crudSkills';

export default function SkillsManagementPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [showDeleteSkillModal, setShowDeleteSkillModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: { en: '', fr: '', es: '', ja: '' },
    order: 0
  });
  const [skillForm, setSkillForm] = useState({
    name: { en: '', fr: '', es: '', ja: '' },
    categoryId: '',
    order: 0
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const categoriesData = await fetchSkillCategories();
        const skillsData = await fetchSkills();
        setCategories(categoriesData);
        setSkills(skillsData);
      } catch (error) {
        console.error('Error loading data:', error);
        showToast(t('errorLoading'), 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [t]);

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCategory) {
        await updateSkillCategory(selectedCategory.id, categoryForm);
        showToast(t('categoryUpdated'), 'success');
      } else {
        await addSkillCategory(categoryForm);
        showToast(t('categoryAdded'), 'success');
      }
      setShowCategoryModal(false);
      resetCategoryForm();
      loadData();
    } catch (error) {
      console.error('Error saving category:', error);
      showToast(t('errorSavingCategory'), 'error');
    }
  };

  const handleSkillSubmit = async (e) => {
    e.preventDefault();
    try {
      if (skillForm.id) {
        await updateSkill(skillForm.id, skillForm);
        showToast(t('skillUpdated'), 'success');
      } else {
        await addSkill(skillForm);
        showToast(t('skillAdded'), 'success');
      }
      setShowSkillModal(false);
      resetSkillForm();
      loadData();
    } catch (error) {
      console.error('Error saving skill:', error);
      showToast(t('errorSavingSkill'), 'error');
    }
  };

  const editCategory = (category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      order: category.order
    });
    setShowCategoryModal(true);
  };

  const editSkill = (skill) => {
    setSkillForm({
      id: skill.id,
      name: skill.name,
      categoryId: skill.categoryId,
      order: skill.order
    });
    setShowSkillModal(true);
  };

  const resetCategoryForm = () => {
    setSelectedCategory(null);
    setCategoryForm({
      name: { en: '', fr: '', es: '', ja: '' },
      order: 0
    });
  };

  const resetSkillForm = () => {
    setSkillForm({
      name: { en: '', fr: '', es: '', ja: '' },
      categoryId: '',
      order: 0
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleDeleteCategory = async () => {
    try {
      await deleteSkillCategory(selectedCategory.id);
      showToast(t('categoryDeleted'), 'success');
      setShowDeleteCategoryModal(false);
      setSelectedCategory(null);
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast(t('errorDeletingCategory'), 'error');
    }
  };

  const handleDeleteSkill = async () => {
    try {
      await deleteSkill(selectedSkill.id);
      showToast(t('skillDeleted'), 'success');
      setShowDeleteSkillModal(false);
      setSelectedSkill(null);
      loadData();
    } catch (error) {
      console.error('Error deleting skill:', error);
      showToast(t('errorDeletingSkill'), 'error');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">{t('skillsManagement')}</h1>
      
      {/* Categories Section */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('categories')}</h2>
          <Button onClick={() => {
            resetCategoryForm();
            setShowCategoryModal(true);
          }}>
            {t('addCategory')}
          </Button>
        </div>
        
        <Table>
          <Table.Head>
            <Table.HeadCell>{t('nameEn')}</Table.HeadCell>
            <Table.HeadCell>{t('order')}</Table.HeadCell>
            <Table.HeadCell>{t('actions')}</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {categories.map(category => (
              <Table.Row key={category.id}>
                <Table.Cell>{category.name.en}</Table.Cell>
                <Table.Cell>{category.order}</Table.Cell>
                <Table.Cell>
                  <div className="flex space-x-2">
                    <Button size="xs" onClick={() => editCategory(category)}>
                      {t('editCategory')}
                    </Button>
                    <Button size="xs" color="failure" onClick={() => {
                      setSelectedCategory(category);
                      setShowDeleteCategoryModal(true);
                    }}>
                      {t('deleteCategory')}
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
      
      {/* Skills Section */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('skills')}</h2>
          <Button onClick={() => {
            resetSkillForm();
            setShowSkillModal(true);
          }}>
            {t('addSkill')}
          </Button>
        </div>
        
        <Table>
          <Table.Head>
            <Table.HeadCell>{t('nameEn')}</Table.HeadCell>
            <Table.HeadCell>{t('category')}</Table.HeadCell>
            <Table.HeadCell>{t('order')}</Table.HeadCell>
            <Table.HeadCell>{t('actions')}</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {skills.map(skill => {
              const category = categories.find(c => c.id === skill.categoryId);
              return (
                <Table.Row key={skill.id}>
                  <Table.Cell>{skill.name.en}</Table.Cell>
                  <Table.Cell>{category ? category.name.en : 'N/A'}</Table.Cell>
                  <Table.Cell>{skill.order}</Table.Cell>
                  <Table.Cell>
                    <div className="flex space-x-2">
                      <Button size="xs" onClick={() => editSkill(skill)}>
                        {t('editSkill')}
                      </Button>
                      <Button size="xs" color="failure" onClick={() => {
                        setSelectedSkill(skill);
                        setShowDeleteSkillModal(true);
                      }}>
                        {t('deleteSkill')}
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </Card>
      
      {/* Category Modal */}
      <Modal show={showCategoryModal} onClose={() => setShowCategoryModal(false)}>
        <Modal.Header>
          {selectedCategory ? t('editCategory') : t('addCategory')}
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div>
              <Label htmlFor="categoryNameEn">{t('nameEn')}</Label>
              <TextInput
                id="categoryNameEn"
                value={categoryForm.name.en}
                onChange={(e) => setCategoryForm({
                  ...categoryForm,
                  name: { ...categoryForm.name, en: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="categoryNameFr">{t('nameFr')}</Label>
              <TextInput
                id="categoryNameFr"
                value={categoryForm.name.fr}
                onChange={(e) => setCategoryForm({
                  ...categoryForm,
                  name: { ...categoryForm.name, fr: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="categoryNameEs">{t('nameEs')}</Label>
              <TextInput
                id="categoryNameEs"
                value={categoryForm.name.es}
                onChange={(e) => setCategoryForm({
                  ...categoryForm,
                  name: { ...categoryForm.name, es: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="categoryNameJa">{t('nameJa')}</Label>
              <TextInput
                id="categoryNameJa"
                value={categoryForm.name.ja}
                onChange={(e) => setCategoryForm({
                  ...categoryForm,
                  name: { ...categoryForm.name, ja: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="categoryOrder">{t('order')}</Label>
              <TextInput
                id="categoryOrder"
                type="number"
                value={categoryForm.order}
                onChange={(e) => setCategoryForm({
                  ...categoryForm,
                  order: parseInt(e.target.value)
                })}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button color="gray" onClick={() => setShowCategoryModal(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">
                {selectedCategory ? t('update') : t('add')}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      
      {/* Skill Modal */}
      <Modal show={showSkillModal} onClose={() => setShowSkillModal(false)}>
        <Modal.Header>
          {skillForm.id ? t('editSkill') : t('addSkill')}
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSkillSubmit} className="space-y-4">
            <div>
              <Label htmlFor="skillNameEn">{t('nameEn')}</Label>
              <TextInput
                id="skillNameEn"
                value={skillForm.name.en}
                onChange={(e) => setSkillForm({
                  ...skillForm,
                  name: { ...skillForm.name, en: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="skillNameFr">{t('nameFr')}</Label>
              <TextInput
                id="skillNameFr"
                value={skillForm.name.fr}
                onChange={(e) => setSkillForm({
                  ...skillForm,
                  name: { ...skillForm.name, fr: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="skillNameEs">{t('nameEs')}</Label>
              <TextInput
                id="skillNameEs"
                value={skillForm.name.es}
                onChange={(e) => setSkillForm({
                  ...skillForm,
                  name: { ...skillForm.name, es: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="skillNameJa">{t('nameJa')}</Label>
              <TextInput
                id="skillNameJa"
                value={skillForm.name.ja}
                onChange={(e) => setSkillForm({
                  ...skillForm,
                  name: { ...skillForm.name, ja: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="skillCategory">{t('category')}</Label>
              <Select
                id="skillCategory"
                value={skillForm.categoryId}
                onChange={(e) => setSkillForm({
                  ...skillForm,
                  categoryId: e.target.value
                })}
                required
              >
                <option value="">{t('selectCategory')}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name.en}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="skillOrder">{t('order')}</Label>
              <TextInput
                id="skillOrder"
                type="number"
                value={skillForm.order}
                onChange={(e) => setSkillForm({
                  ...skillForm,
                  order: parseInt(e.target.value)
                })}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button color="gray" onClick={() => setShowSkillModal(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">
                {skillForm.id ? t('update') : t('add')}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      
      {/* Delete Category Confirmation Modal */}
      <Modal show={showDeleteCategoryModal} onClose={() => setShowDeleteCategoryModal(false)}>
        <Modal.Header>{t('deleteCategory')}</Modal.Header>
        <Modal.Body>
          <p>{t('confirmDeleteCategory')}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setShowDeleteCategoryModal(false)}>
            {t('cancel')}
          </Button>
          <Button color="failure" onClick={handleDeleteCategory}>
            {t('delete')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Skill Confirmation Modal */}
      <Modal show={showDeleteSkillModal} onClose={() => setShowDeleteSkillModal(false)}>
        <Modal.Header>{t('deleteSkill')}</Modal.Header>
        <Modal.Body>
          <p>{t('confirmDeleteSkill')}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setShowDeleteSkillModal(false)}>
            {t('cancel')}
          </Button>
          <Button color="failure" onClick={handleDeleteSkill}>
            {t('delete')}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Toast Notification */}
      {toast.show && (
        <Toast>
          <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            toast.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
          }`}>
            {toast.type === 'success' ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3 text-sm font-normal">{toast.message}</div>
        </Toast>
      )}
    </div>
  );
} 