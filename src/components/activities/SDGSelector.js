import Image from 'next/image';
import { useTranslations } from 'use-intl';

export default function SDGSelector({ formData, setFormData }) {
  const t = useTranslations('ManageActivities');

  return (
    <div>
      <label className='block font-medium mb-2'>{t('sdg-label')}</label>
      <p>{t('sdg-helper')}</p>
      <ul className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1'>
        {[
          { id: '1', name: 1 },
          { id: '2', name: 2 },
          { id: '3', name: 3 },
          { id: '4', name: 4 },
          { id: '5', name: 5 },
          { id: '6', name: 6 },
          { id: '7', name: 7 },
          { id: '8', name: 8 },
          { id: '9', name: 9 },
          { id: '10', name: 10 },
          { id: '11', name: 11 },
          { id: '12', name: 12 },
          { id: '13', name: 13 },
          { id: '14', name: 14 },
          { id: '15', name: 15 },
          { id: '16', name: 16 },
          { id: '17', name: 17 },
        ].map(({ id, name }) => (
          <li
            key={id}
            className={`flex flex-col items-center justify-center p-1 cursor-pointer`}
            onClick={() =>
              setFormData((prev) => ({ ...prev, sdg: name }))
            }
          >
            <Image
              src={
                formData.sdg === name
                  ? `/icons/sdgs/c-${id}.png`
                  : `/icons/sdgs/w-${id}.png`
              }
              alt={name}
              style={{ width: '80%', height: 'auto', maxWidth: '90px', maxHeight: '90px' }}
              width={80} 
              height={80} 
              priority={true}
            />
          </li>
        ))}
      </ul>
    </div>
  );
} 