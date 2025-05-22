'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/utils/auth/AuthContext';
import { fetchActivitiesByCriteria } from '@/utils/crudActivities';
import ActivityCard from '@/components/activities/ActivityCard';
import { useRouter, useSearchParams } from 'next/navigation';

export default function MyNonprofitActivitiesPage() {
  const { user, claims, loading } = useAuth();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  useEffect(() => {
    const fetchOrgActivities = async () => {
      if (claims && claims.npoId) {
        try {
          setIsLoading(true);
          const orgActivities = await fetchActivitiesByCriteria(claims.npoId, type);
          setActivities(orgActivities);
        } catch (error) {
          console.error('Error fetching organization activities:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchOrgActivities();
  }, [claims]);

  const goToManage = () => {
    router.push('/activities/manage');
  };

  // If there is no authenticated user, return null
  if (!user) return null;

  return (
    <div className='flex flex-col items-center bg-gray-100 p-6'>
      <h1 className='text-2xl font-bold mb-6'>My Organization Activities</h1>
      
      {isLoading ? (
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500'></div>
        </div>
      ) : activities.length > 0 ? (
        <div className='grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {activities.map((activity, index) => (
            <ActivityCard
              key={index}
              id={activity.id}
              organization_name={activity.organization_name}
              organization_logo={activity.organization_logo}
              title={activity.title}
              location={activity.location}
              applicants={activity.applicants}
              xp_reward={activity.xp_reward}
              description={activity.description}
            />
          ))}
        </div>
      ) : (
        <div className='text-center p-8 bg-white rounded-lg shadow-md'>
          <p className='text-lg text-gray-600 mb-4'>No activities found for your organization.</p>
          <button 
            onClick={goToManage}
            className='px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors'
          >
            Create New Activity
          </button>
        </div>
      )}
      
      <button 
        onClick={goToManage} 
        className="fixed bottom-4 right-4 bg-orange-500 text-white text-2xl w-12 h-12 rounded-full shadow-lg hover:bg-orange-600"
      >
        +
      </button>
    </div>
  );
}
