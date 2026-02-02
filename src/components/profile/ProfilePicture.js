import { Avatar } from 'flowbite-react';
import { useTranslations } from 'next-intl';

export default function ProfilePicture({profileData, handleProfilePictureChange}) {
  const t = useTranslations('CompleteProfile');

  const profilePictureValue = profileData?.profilePicture || null;
  const profilePicture = profilePictureValue && profilePictureValue.trim() !== '' ? profilePictureValue : null;

  return (
    <div className='flex flex-col items-center mb-6'>
      <div className='relative'>
        <Avatar
          rounded
          size='lg'
          img={profilePicture || ''}
          alt='Profile picture'
          className='cursor-pointer'
        />
        <input
          type='file'
          accept='image/*'
          onChange={handleProfilePictureChange}
          className='hidden'
          id='profile-picture-input'
        />
        <label
          htmlFor='profile-picture-input'
          className='absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
            />
          </svg>
        </label>
      </div>
      <p className='mt-2 text-sm text-gray-500'>
        {t('profilePictureHelper')}
      </p>
    </div>
  );
}
