'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { useModal } from '@/utils/modal/useModal';

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
  
  // Register modals with global modal manager
  const wrappedCategoryModalOnClose = useModal(showCategoryModal, () => setShowCategoryModal(false), 'skill-category-modal');
  const wrappedSkillModalOnClose = useModal(showSkillModal, () => setShowSkillModal(false), 'skill-modal');
  const wrappedDeleteCategoryModalOnClose = useModal(showDeleteCategoryModal, () => setShowDeleteCategoryModal(false), 'delete-skill-category-modal');
  const wrappedDeleteSkillModalOnClose = useModal(showDeleteSkillModal, () => setShowDeleteSkillModal(false), 'delete-skill-modal');
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

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  // Define loadData function outside of useEffect so it can be reused
  const loadData = useCallback(async () => {
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
  }, [t, showToast]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

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
    <div className="container mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{t('skillsManagement')}</h1>
      
      {/* Categories Section */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">{t('categories')}</h2>
          <Button 
            onClick={() => {
              resetCategoryForm();
              setShowCategoryModal(true);
            }}
            className="w-full sm:w-auto text-sm sm:text-base"
            size="sm"
          >
            {t('addCategory')}
          </Button>
        </div>
        
        {/* Desktop Table */}
        {categories.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <Table.Head>
                <Table.HeadCell className="text-xs sm:text-sm">{t('nameEn')}</Table.HeadCell>
                <Table.HeadCell className="text-xs sm:text-sm">{t('order')}</Table.HeadCell>
                <Table.HeadCell className="text-xs sm:text-sm">{t('actions')}</Table.HeadCell>
              </Table.Head>
              <Table.Body>
                {categories.map(category => (
                  <Table.Row key={category.id}>
                    <Table.Cell className="text-sm">{category.name.en}</Table.Cell>
                    <Table.Cell className="text-sm">{category.order}</Table.Cell>
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
          </div>
        )}

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {categories.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No categories found</p>
          ) : (
            categories.map(category => (
              <Card key={category.id} className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-base">{category.name.en}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('order')}:</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300">{category.order}</span>
                  </div>
                  <div className="flex flex-col gap-2 mt-3">
                    <Button 
                      size="sm" 
                      onClick={() => editCategory(category)}
                      className="w-full text-xs sm:text-sm"
                    >
                      {t('editCategory')}
                    </Button>
                    <Button 
                      size="sm" 
                      color="failure" 
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowDeleteCategoryModal(true);
                      }}
                      className="w-full text-xs sm:text-sm"
                    >
                      {t('deleteCategory')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
      
      {/* Skills Section */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">{t('skills')}</h2>
          <Button 
            onClick={() => {
              resetSkillForm();
              setShowSkillModal(true);
            }}
            className="w-full sm:w-auto text-sm sm:text-base"
            size="sm"
          >
            {t('addSkill')}
          </Button>
        </div>
        
        {/* Desktop Table */}
        {skills.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <Table.Head>
                <Table.HeadCell className="text-xs sm:text-sm">{t('nameEn')}</Table.HeadCell>
                <Table.HeadCell className="text-xs sm:text-sm">{t('category')}</Table.HeadCell>
                <Table.HeadCell className="text-xs sm:text-sm">{t('order')}</Table.HeadCell>
                <Table.HeadCell className="text-xs sm:text-sm">{t('actions')}</Table.HeadCell>
              </Table.Head>
              <Table.Body>
                {skills.map(skill => {
                  const category = categories.find(c => c.id === skill.categoryId);
                  return (
                    <Table.Row key={skill.id}>
                      <Table.Cell className="text-sm">{skill.name.en}</Table.Cell>
                      <Table.Cell className="text-sm">{category ? category.name.en : 'N/A'}</Table.Cell>
                      <Table.Cell className="text-sm">{skill.order}</Table.Cell>
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
          </div>
        )}

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {skills.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No skills found</p>
          ) : (
            skills.map(skill => {
              const category = categories.find(c => c.id === skill.categoryId);
              return (
                <Card key={skill.id} className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-base">{skill.name.en}</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('category')}:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{category ? category.name.en : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('order')}:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{skill.order}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-3">
                      <Button 
                        size="sm" 
                        onClick={() => editSkill(skill)}
                        className="w-full text-xs sm:text-sm"
                      >
                        {t('editSkill')}
                      </Button>
                      <Button 
                        size="sm" 
                        color="failure" 
                        onClick={() => {
                          setSelectedSkill(skill);
                          setShowDeleteSkillModal(true);
                        }}
                        className="w-full text-xs sm:text-sm"
                      >
                        {t('deleteSkill')}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </Card>
      
      {/* Category Modal */}
      <Modal show={showCategoryModal} onClose={wrappedCategoryModalOnClose} size="xl">
        <Modal.Header className="text-base sm:text-lg px-4 sm:px-6">
          {selectedCategory ? t('editCategory') : t('addCategory')}
        </Modal.Header>
        <Modal.Body className="px-4 sm:px-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div>
              <Label htmlFor="categoryNameEn" className="text-sm sm:text-base">{t('nameEn')}</Label>
              <TextInput
                id="categoryNameEn"
                value={categoryForm.name.en}
                onChange={(e) => setCategoryForm({
                  ...categoryForm,
                  name: { ...categoryForm.name, en: e.target.value }
                })}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="categoryNameFr" className="text-sm sm:text-base">{t('nameFr')}</Label>
              <TextInput
                id="categoryNameFr"
                value={categoryForm.name.fr}
                onChange={(e) => setCategoryForm({
                  ...categoryForm,
                  name: { ...categoryForm.name, fr: e.target.value }
                })}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="categoryNameEs" className="text-sm sm:text-base">{t('nameEs')}</Label>
              <TextInput
                id="categoryNameEs"
                value={categoryForm.name.es}
                onChange={(e) => setCategoryForm({
                  ...categoryForm,
                  name: { ...categoryForm.name, es: e.target.value }
                })}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="categoryNameJa" className="text-sm sm:text-base">{t('nameJa')}</Label>
              <TextInput
                id="categoryNameJa"
                value={categoryForm.name.ja}
                onChange={(e) => setCategoryForm({
                  ...categoryForm,
                  name: { ...categoryForm.name, ja: e.target.value }
                })}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="categoryOrder" className="text-sm sm:text-base">{t('order')}</Label>
              <TextInput
                id="categoryOrder"
                type="number"
                value={categoryForm.order}
                onChange={(e) => setCategoryForm({
                  ...categoryForm,
                  order: parseInt(e.target.value)
                })}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2 pt-2">
              <Button 
                color="gray" 
                onClick={wrappedCategoryModalOnClose}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                {t('cancel')}
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                {selectedCategory ? t('update') : t('add')}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      
      {/* Skill Modal */}
      <Modal show={showSkillModal} onClose={wrappedSkillModalOnClose} size="xl">
        <Modal.Header className="text-base sm:text-lg px-4 sm:px-6">
          {skillForm.id ? t('editSkill') : t('addSkill')}
        </Modal.Header>
        <Modal.Body className="px-4 sm:px-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSkillSubmit} className="space-y-4">
            <div>
              <Label htmlFor="skillNameEn" className="text-sm sm:text-base">{t('nameEn')}</Label>
              <TextInput
                id="skillNameEn"
                value={skillForm.name.en}
                onChange={(e) => setSkillForm({
                  ...skillForm,
                  name: { ...skillForm.name, en: e.target.value }
                })}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="skillNameFr" className="text-sm sm:text-base">{t('nameFr')}</Label>
              <TextInput
                id="skillNameFr"
                value={skillForm.name.fr}
                onChange={(e) => setSkillForm({
                  ...skillForm,
                  name: { ...skillForm.name, fr: e.target.value }
                })}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="skillNameEs" className="text-sm sm:text-base">{t('nameEs')}</Label>
              <TextInput
                id="skillNameEs"
                value={skillForm.name.es}
                onChange={(e) => setSkillForm({
                  ...skillForm,
                  name: { ...skillForm.name, es: e.target.value }
                })}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="skillNameJa" className="text-sm sm:text-base">{t('nameJa')}</Label>
              <TextInput
                id="skillNameJa"
                value={skillForm.name.ja}
                onChange={(e) => setSkillForm({
                  ...skillForm,
                  name: { ...skillForm.name, ja: e.target.value }
                })}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="skillCategory" className="text-sm sm:text-base">{t('category')}</Label>
              <Select
                id="skillCategory"
                value={skillForm.categoryId}
                onChange={(e) => setSkillForm({
                  ...skillForm,
                  categoryId: e.target.value
                })}
                required
                className="text-sm sm:text-base"
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
              <Label htmlFor="skillOrder" className="text-sm sm:text-base">{t('order')}</Label>
              <TextInput
                id="skillOrder"
                type="number"
                value={skillForm.order}
                onChange={(e) => setSkillForm({
                  ...skillForm,
                  order: parseInt(e.target.value)
                })}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2 pt-2">
              <Button 
                color="gray" 
                onClick={wrappedSkillModalOnClose}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                {t('cancel')}
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                {skillForm.id ? t('update') : t('add')}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      
      {/* Delete Category Confirmation Modal */}
      <Modal show={showDeleteCategoryModal} onClose={wrappedDeleteCategoryModalOnClose}>
        <Modal.Header className="text-base sm:text-lg px-4 sm:px-6">{t('deleteCategory')}</Modal.Header>
        <Modal.Body className="px-4 sm:px-6">
          <p className="text-sm sm:text-base">{t('confirmDeleteCategory')}</p>
        </Modal.Body>
        <Modal.Footer className="px-4 sm:px-6">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2 w-full sm:w-auto">
            <Button 
              color="gray" 
              onClick={wrappedDeleteCategoryModalOnClose}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              {t('cancel')}
            </Button>
            <Button 
              color="failure" 
              onClick={handleDeleteCategory}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              {t('delete')}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Delete Skill Confirmation Modal */}
      <Modal show={showDeleteSkillModal} onClose={wrappedDeleteSkillModalOnClose}>
        <Modal.Header className="text-base sm:text-lg px-4 sm:px-6">{t('deleteSkill')}</Modal.Header>
        <Modal.Body className="px-4 sm:px-6">
          <p className="text-sm sm:text-base">{t('confirmDeleteSkill')}</p>
        </Modal.Body>
        <Modal.Footer className="px-4 sm:px-6">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2 w-full sm:w-auto">
            <Button 
              color="gray" 
              onClick={wrappedDeleteSkillModalOnClose}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              {t('cancel')}
            </Button>
            <Button 
              color="failure" 
              onClick={handleDeleteSkill}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              {t('delete')}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
      
      {/* Toast Notification */}
      {toast.show && (
        <Toast className="fixed bottom-4 right-4 z-50 max-w-[calc(100%-2rem)] sm:max-w-md">
          <div className={`inline-flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg ${
            toast.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
          }`}>
            {toast.type === 'success' ? (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-2 sm:ml-3 text-xs sm:text-sm font-normal">{toast.message}</div>
        </Toast>
      )}
    </div>
  );
} 