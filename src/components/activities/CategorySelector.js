import { useTranslations } from 'use-intl';
import { Card } from 'flowbite-react';
import { 
  HiGlobeAlt, HiHome, HiCalendar, 
  HiCode, HiPencil, HiTranslate, 
  HiDocumentText, HiLightBulb, 
  HiDatabase, HiCamera, HiShare, 
  HiSupport, HiAcademicCap, HiHeart, 
  HiClock, HiPlay, HiQuestionMarkCircle,
  HiSparkles, HiBookOpen, HiTruck, 
  HiUserGroup, 
  HiUsers, 
  HiClipboardList, HiGift, 
  HiPresentationChartLine, HiUserCircle, HiShoppingBag
} from 'react-icons/hi';
import { FaPaw, FaLeaf, FaChild, FaWrench, FaPaintBrush } from "react-icons/fa";
import { IoMegaphone } from "react-icons/io5";

export default function CategorySelector({ availableCategories, formData, setFormData }) {
  const t = useTranslations('ManageActivities');
  const activityTypes = [
    { id: 'online', label: t('type-online'), icon: HiGlobeAlt },
    { id: 'local', label: t('type-local'), icon: HiHome },
    { id: 'event', label: t('type-event'), icon: HiCalendar }
  ];

  const categoryIcons = {
    website: HiCode,
    logo: HiPencil,
    translation: HiTranslate,
    flyer: HiDocumentText,
    consulting: HiLightBulb,
    architecture: HiSparkles,
    dataentry: HiDatabase,
    photovideo: HiCamera,
    sns: HiShare,
    onlinesupport: HiSupport,
    education: HiAcademicCap,
    fundraising: HiHeart,
    longtermrole: HiClock,
    explainer: HiPlay,
    other: HiQuestionMarkCircle,
    cleaning: HiSparkles,
    teaching: HiBookOpen,
    food_distribution: HiTruck,
    elderly_support: HiUserGroup,
    animal_care: FaPaw,
    environment: FaLeaf,
    community_events: HiUsers,
    childcare: FaChild,
    manual_labor: FaWrench,
    administrative: HiClipboardList,
    fundraising_event: HiGift,
    awareness_campaign: IoMegaphone,
    workshop: HiPresentationChartLine,
    seminar_conference: HiUserCircle,
    charity_walk: HiUsers,
    networking: HiUserGroup,
    arts_and_crafts: FaPaintBrush,
    food_fair: HiShoppingBag
  };

  return (
    <Card className="w-full p-1 space-y-6">
      <div className='space-y-4'>
        <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {t('type-label')}
        </h5>
        <div className='grid grid-cols-3 gap-4'>
          {activityTypes.map(({ id, label, icon: Icon }) => (
            <Card
              key={id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                formData.type === id
                  ? 'border-orange-400 bg-orange-400 dark:bg-orange-900/20 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800'
              }`}
              onClick={() => {
                setFormData((prev) => ({ ...prev, type: id }));
              }}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <Icon className={`w-8 h-8 ${
                  formData.type === id
                    ? 'text-white dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`} />
                <h5 className={`text-sm font-medium text-center ${
                  formData.type === id
                    ? 'text-white dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {label}
                </h5>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <div className='space-y-4'>
        <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {t('category-label')}
        </h5>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
          {availableCategories.map(({ id }) => {
            const Icon = categoryIcons[id] || HiQuestionMarkCircle;
            return (
              <Card
                key={id}
                className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                  formData.category === id
                    ? 'border-orange-400 bg-orange-400 dark:bg-orange-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800'
                }`}
                onClick={() => {
                  setFormData((prev) => ({ ...prev, category: id }));
                }}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Icon className={`w-8 h-8 ${
                    formData.category === id
                      ? 'text-white dark:text-orange-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`} />
                  <h5 className={`text-sm font-medium text-center ${
                    formData.category === id
                      ? 'text-white dark:text-orange-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {t(`${id}`)}
                  </h5>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Card>
  );
} 