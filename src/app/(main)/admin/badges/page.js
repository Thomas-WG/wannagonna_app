'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Card, 
  Button, 
  Label, 
  TextInput, 
  Textarea, 
  Modal, 
  Toast, 
  Table,
  Spinner,
  Select
} from 'flowbite-react';
import { 
  fetchBadgeCategories, 
  fetchAllBadges, 
  getBadgeImageUrl,
  createBadgeCategory,
  deleteBadgeCategory,
  createBadge,
  updateBadge,
  deleteBadge
} from '@/utils/crudBadges';
import { HiBadgeCheck, HiPlus, HiTrash, HiPencil } from 'react-icons/hi';
import Image from 'next/image';

export default function AdminBadgesPage() {
  const t = useTranslations('Admin');
  const [categories, setCategories] = useState([]);
  const [badges, setBadges] = useState([]);
  const [badgeImageUrls, setBadgeImageUrls] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);
  
  // Modal states
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteBadgeModal, setShowDeleteBadgeModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [deletingBadge, setDeletingBadge] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  
  // Form states
  const [badgeForm, setBadgeForm] = useState({
    categoryId: '',
    badgeId: '',
    title: '',
    description: '',
    xp: 0,
    imageFile: null
  });
  const [categoryForm, setCategoryForm] = useState({
    categoryId: '',
    title: '',
    description: '',
    order: 0
  });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setIsLoading(true);
      setImagesLoading(true);
      
      const [categoriesData, badgesData] = await Promise.all([
        fetchBadgeCategories(),
        fetchAllBadges()
      ]);
      
      setCategories(categoriesData);
      setBadges(badgesData);
      
      setIsLoading(false);
      
      // Load image URLs
      const urls = {};
      for (const badge of badgesData) {
        try {
          const url = await getBadgeImageUrl(badge.categoryId, badge.id);
          if (url) {
            urls[badge.id] = url;
          }
        } catch (error) {
          console.error(`Error loading image for badge ${badge.id}:`, error);
        }
      }
      setBadgeImageUrls(urls);
      setImagesLoading(false);
    } catch (error) {
      console.error('Error loading badges:', error);
      setIsLoading(false);
      setImagesLoading(false);
      showToast(t('errorLoadingBadges') || 'Error loading badges', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const openAddBadgeModal = () => {
    setEditingBadge(null);
    setBadgeForm({
      categoryId: categories[0]?.id || '',
      badgeId: '',
      title: '',
      description: '',
      xp: 0,
      imageFile: null
    });
    setShowBadgeModal(true);
  };

  const openEditBadgeModal = (badge) => {
    setEditingBadge(badge);
    setBadgeForm({
      categoryId: badge.categoryId,
      badgeId: badge.id,
      title: badge.title || '',
      description: badge.description || '',
      xp: badge.xp || 0,
      imageFile: null
    });
    setShowBadgeModal(true);
  };

  const openAddCategoryModal = () => {
    setCategoryForm({
      categoryId: '',
      title: '',
      description: '',
      order: categories.length
    });
    setShowCategoryModal(true);
  };

  const handleBadgeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!badgeForm.categoryId || !badgeForm.title) {
        showToast(t('fillRequiredFields') || 'Please fill all required fields', 'error');
        return;
      }

      // Normalize badge ID: lowercase, replace non-alphanumeric with hyphens, remove multiple hyphens
      const badgeId = badgeForm.badgeId || badgeForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      if (editingBadge) {
        await updateBadge(
          badgeForm.categoryId,
          editingBadge.id,
          {
            title: badgeForm.title,
            description: badgeForm.description,
            xp: parseInt(badgeForm.xp) || 0
          },
          badgeForm.imageFile
        );
        showToast(t('badgeUpdated') || 'Badge updated successfully', 'success');
      } else {
        await createBadge(
          badgeForm.categoryId,
          badgeId,
          {
            title: badgeForm.title,
            description: badgeForm.description,
            xp: parseInt(badgeForm.xp) || 0
          },
          badgeForm.imageFile
        );
        showToast(t('badgeCreated') || 'Badge created successfully', 'success');
      }
      
      setShowBadgeModal(false);
      await loadBadges();
    } catch (error) {
      console.error('Error saving badge:', error);
      showToast(t('errorSavingBadge') || 'Error saving badge', 'error');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (!categoryForm.categoryId || !categoryForm.title) {
        showToast(t('fillRequiredFields') || 'Please fill all required fields', 'error');
        return;
      }

      await createBadgeCategory(categoryForm.categoryId, {
        title: categoryForm.title,
        description: categoryForm.description,
        order: parseInt(categoryForm.order) || 0
      });
      
      showToast(t('categoryCreated') || 'Category created successfully', 'success');
      setShowCategoryModal(false);
      await loadBadges();
    } catch (error) {
      console.error('Error creating category:', error);
      showToast(t('errorCreatingCategory') || 'Error creating category', 'error');
    }
  };

  const handleDeleteBadge = async () => {
    try {
      if (!deletingBadge) return;
      
      await deleteBadge(deletingBadge.categoryId, deletingBadge.id);
      showToast(t('badgeDeleted') || 'Badge deleted successfully', 'success');
      setShowDeleteBadgeModal(false);
      setDeletingBadge(null);
      await loadBadges();
    } catch (error) {
      console.error('Error deleting badge:', error);
      showToast(t('errorDeletingBadge') || 'Error deleting badge', 'error');
    }
  };

  const handleDeleteCategory = async () => {
    try {
      if (!deletingCategory) return;
      
      await deleteBadgeCategory(deletingCategory.id);
      showToast(t('categoryDeleted') || 'Category deleted successfully', 'success');
      setShowDeleteCategoryModal(false);
      setDeletingCategory(null);
      await loadBadges();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast(t('errorDeletingCategory') || 'Error deleting category', 'error');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.title || categoryId;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Spinner size="xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <HiBadgeCheck className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-500 flex-shrink-0" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{t('badges') || 'Badges Management'}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={openAddCategoryModal} className="w-full sm:w-auto text-sm sm:text-base" size="sm">
            <HiPlus className="mr-2 h-4 w-4" />
            {t('addCategory') || 'Add Category'}
          </Button>
          <Button onClick={openAddBadgeModal} color="purple" className="w-full sm:w-auto text-sm sm:text-base" size="sm">
            <HiPlus className="mr-2 h-4 w-4" />
            {t('addBadge') || 'Add Badge'}
          </Button>
        </div>
      </div>

      {/* Categories Section */}
      <Card className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t('categories') || 'Categories'}</h2>
        {categories.length === 0 ? (
          <p className="text-sm sm:text-base text-gray-500">{t('noCategories') || 'No categories found'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((category) => {
              const categoryBadges = badges.filter(b => b.categoryId === category.id);
              return (
                <Card key={category.id} className="relative">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{category.title || category.id}</h3>
                      {category.description && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{category.description}</p>
                      )}
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {categoryBadges.length} {t('badges') || 'badges'}
                      </p>
                    </div>
                    <Button
                      size="xs"
                      color="failure"
                      onClick={() => {
                        setDeletingCategory(category);
                        setShowDeleteCategoryModal(true);
                      }}
                      className="flex-shrink-0"
                    >
                      <HiTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* Badges Table */}
      <Card>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t('allBadges') || 'All Badges'}</h2>
        {badges.length === 0 ? (
          <p className="text-sm sm:text-base text-gray-500">{t('noBadges') || 'No badges found'}</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <Table.Head>
                  <Table.HeadCell>{t('image') || 'Image'}</Table.HeadCell>
                  <Table.HeadCell>{t('category') || 'Category'}</Table.HeadCell>
                  <Table.HeadCell>{t('title') || 'Title'}</Table.HeadCell>
                  <Table.HeadCell>{t('description') || 'Description'}</Table.HeadCell>
                  <Table.HeadCell>{t('xp') || 'XP'}</Table.HeadCell>
                  <Table.HeadCell>{t('actions') || 'Actions'}</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                  {badges.map((badge) => (
                    <Table.Row key={`${badge.categoryId}-${badge.id}`}>
                      <Table.Cell>
                        {imagesLoading ? (
                          <Spinner size="sm" />
                        ) : badgeImageUrls[badge.id] ? (
                          <Image
                            src={badgeImageUrls[badge.id]}
                            alt={badge.title || badge.id}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <HiBadgeCheck className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </Table.Cell>
                      <Table.Cell className="font-medium">
                        {getCategoryName(badge.categoryId)}
                      </Table.Cell>
                      <Table.Cell>{badge.title || badge.id}</Table.Cell>
                      <Table.Cell className="max-w-xs truncate">
                        {badge.description || '-'}
                      </Table.Cell>
                      <Table.Cell>{badge.xp || 0}</Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            color="purple"
                            onClick={() => openEditBadgeModal(badge)}
                          >
                            <HiPencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => {
                              setDeletingBadge(badge);
                              setShowDeleteBadgeModal(true);
                            }}
                          >
                            <HiTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {badges.map((badge) => (
                <Card key={`${badge.categoryId}-${badge.id}`} className="p-4">
                  <div className="flex items-start gap-3">
                    {imagesLoading ? (
                      <Spinner size="sm" />
                    ) : badgeImageUrls[badge.id] ? (
                      <Image
                        src={badgeImageUrls[badge.id]}
                        alt={badge.title || badge.id}
                        width={50}
                        height={50}
                        className="object-contain flex-shrink-0 rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        <HiBadgeCheck className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{badge.title || badge.id}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-medium">{t('category') || 'Category'}:</span> {getCategoryName(badge.categoryId)}
                      </p>
                      {badge.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{badge.description}</p>
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-medium">{t('xp') || 'XP'}:</span> {badge.xp || 0}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="xs"
                          color="purple"
                          onClick={() => openEditBadgeModal(badge)}
                          className="flex-1"
                        >
                          <HiPencil className="h-3 w-3 mr-1" />
                          {t('edit') || 'Edit'}
                        </Button>
                        <Button
                          size="xs"
                          color="failure"
                          onClick={() => {
                            setDeletingBadge(badge);
                            setShowDeleteBadgeModal(true);
                          }}
                          className="flex-1"
                        >
                          <HiTrash className="h-3 w-3 mr-1" />
                          {t('delete') || 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Add/Edit Badge Modal */}
      <Modal show={showBadgeModal} onClose={() => setShowBadgeModal(false)} size="lg">
        <Modal.Header className="text-base sm:text-lg px-4 sm:px-6">
          {editingBadge ? t('editBadge') || 'Edit Badge' : t('addBadge') || 'Add Badge'}
        </Modal.Header>
        <Modal.Body className="px-4 sm:px-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleBadgeSubmit} className="space-y-4">
            <div>
              <Label htmlFor="categoryId" className="text-sm sm:text-base">{t('category') || 'Category'} *</Label>
              <Select
                id="categoryId"
                value={badgeForm.categoryId}
                onChange={(e) => setBadgeForm({ ...badgeForm, categoryId: e.target.value })}
                required
                disabled={!!editingBadge}
                className="text-sm sm:text-base"
              >
                <option value="">{t('selectCategory') || 'Select category'}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.title || cat.id}</option>
                ))}
              </Select>
            </div>

            {!editingBadge && (
              <div>
                <Label htmlFor="badgeId" className="text-sm sm:text-base">{t('badgeId') || 'Badge ID'}</Label>
                <TextInput
                  id="badgeId"
                  value={badgeForm.badgeId}
                  onChange={(e) => setBadgeForm({ ...badgeForm, badgeId: e.target.value })}
                  placeholder={t('autoGenerated') || 'Auto-generated from title if empty'}
                  className="text-sm sm:text-base"
                />
              </div>
            )}

            <div>
              <Label htmlFor="title" className="text-sm sm:text-base">{t('title') || 'Title'} *</Label>
              <TextInput
                id="title"
                value={badgeForm.title}
                onChange={(e) => setBadgeForm({ ...badgeForm, title: e.target.value })}
                required
                className="text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm sm:text-base">{t('description') || 'Description'}</Label>
              <Textarea
                id="description"
                value={badgeForm.description}
                onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                rows={3}
                className="text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="xp" className="text-sm sm:text-base">{t('xp') || 'XP Points'}</Label>
              <TextInput
                id="xp"
                type="number"
                min="0"
                value={badgeForm.xp}
                onChange={(e) => setBadgeForm({ ...badgeForm, xp: e.target.value })}
                className="text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="image" className="text-sm sm:text-base">{t('image') || 'Image'}</Label>
              <TextInput
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setBadgeForm({ ...badgeForm, imageFile: e.target.files[0] || null })}
                className="text-xs sm:text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('imageUploadHint') || 'Image will be uploaded with the same name as the title'}
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button color="gray" onClick={() => setShowBadgeModal(false)} className="w-full sm:w-auto text-sm sm:text-base">
                {t('cancel') || 'Cancel'}
              </Button>
              <Button type="submit" className="w-full sm:w-auto text-sm sm:text-base">
                {editingBadge ? t('update') || 'Update' : t('create') || 'Create'}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Add Category Modal */}
      <Modal show={showCategoryModal} onClose={() => setShowCategoryModal(false)}>
        <Modal.Header className="text-base sm:text-lg px-4 sm:px-6">{t('addCategory') || 'Add Category'}</Modal.Header>
        <Modal.Body className="px-4 sm:px-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div>
              <Label htmlFor="categoryId" className="text-sm sm:text-base">{t('categoryId') || 'Category ID'} *</Label>
              <TextInput
                id="categoryId"
                value={categoryForm.categoryId}
                onChange={(e) => setCategoryForm({ ...categoryForm, categoryId: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                required
                placeholder="e.g., sdg, geography"
                className="text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="categoryTitle" className="text-sm sm:text-base">{t('title') || 'Title'} *</Label>
              <TextInput
                id="categoryTitle"
                value={categoryForm.title}
                onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                required
                className="text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="categoryDescription" className="text-sm sm:text-base">{t('description') || 'Description'}</Label>
              <Textarea
                id="categoryDescription"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                rows={3}
                className="text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="categoryOrder" className="text-sm sm:text-base">{t('order') || 'Order'}</Label>
              <TextInput
                id="categoryOrder"
                type="number"
                value={categoryForm.order}
                onChange={(e) => setCategoryForm({ ...categoryForm, order: e.target.value })}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button color="gray" onClick={() => setShowCategoryModal(false)} className="w-full sm:w-auto text-sm sm:text-base">
                {t('cancel') || 'Cancel'}
              </Button>
              <Button type="submit" className="w-full sm:w-auto text-sm sm:text-base">
                {t('create') || 'Create'}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Delete Badge Confirmation Modal */}
      <Modal show={showDeleteBadgeModal} onClose={() => setShowDeleteBadgeModal(false)} size="md">
        <Modal.Header className="text-base sm:text-lg px-4 sm:px-6">{t('deleteBadge') || 'Delete Badge'}</Modal.Header>
        <Modal.Body className="px-4 sm:px-6">
          <p className="text-sm sm:text-base">{t('confirmDeleteBadge') || 'Are you sure you want to delete this badge?'}</p>
          {deletingBadge && (
            <p className="mt-2 font-semibold text-sm sm:text-base">{deletingBadge.title || deletingBadge.id}</p>
          )}
        </Modal.Body>
        <Modal.Footer className="px-4 sm:px-6">
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
            <Button color="gray" onClick={() => setShowDeleteBadgeModal(false)} className="w-full sm:w-auto text-sm sm:text-base">
              {t('cancel') || 'Cancel'}
            </Button>
            <Button color="failure" onClick={handleDeleteBadge} className="w-full sm:w-auto text-sm sm:text-base">
              {t('delete') || 'Delete'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <Modal show={showDeleteCategoryModal} onClose={() => setShowDeleteCategoryModal(false)} size="md">
        <Modal.Header className="text-base sm:text-lg px-4 sm:px-6">{t('deleteCategory') || 'Delete Category'}</Modal.Header>
        <Modal.Body className="px-4 sm:px-6">
          <p className="text-sm sm:text-base">{t('confirmDeleteCategory') || 'Are you sure you want to delete this category? All badges in this category will also be deleted.'}</p>
          {deletingCategory && (
            <p className="mt-2 font-semibold text-sm sm:text-base">{deletingCategory.title || deletingCategory.id}</p>
          )}
        </Modal.Body>
        <Modal.Footer className="px-4 sm:px-6">
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
            <Button color="gray" onClick={() => setShowDeleteCategoryModal(false)} className="w-full sm:w-auto text-sm sm:text-base">
              {t('cancel') || 'Cancel'}
            </Button>
            <Button color="failure" onClick={handleDeleteCategory} className="w-full sm:w-auto text-sm sm:text-base">
              {t('delete') || 'Delete'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 max-w-sm sm:max-w-none">
          <Toast className="w-full sm:w-auto">
            <div className={`ml-2 sm:ml-3 text-xs sm:text-sm font-normal ${toast.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {toast.message}
            </div>
            <Toast.Toggle onClick={() => setToast({ show: false, message: '', type: 'success' })} />
          </Toast>
        </div>
      )}
    </div>
  );
}
