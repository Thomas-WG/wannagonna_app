'use client';
import { useEffect, useState } from 'react';
import { fetchActivities } from '@/utils/fetchActivities';
import ActivityCard from '@/components/ActivityCard';
import { useAuth } from '@/hooks/useAuth';

export default function ActivitiesPage() {
  const { user, loading } = useAuth();

  const [activities, setActivities] = useState([]);

  useEffect(() => {
    async function getData() {
      if (user) {
        // Only fetch data if user is authenticated
        const data = await fetchActivities();
        setActivities(data);
      }
    }
    getData();
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (!user) return null; // Prevent content rendering if no user

  return (
    <div className='p-4'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {activities.map((activity, index) => (
          <ActivityCard
            key={index}
            npoName={activity.npoName}
            npoLogo={activity.npoLogo}
            title={activity.title}
            location={activity.location}
            applicants={activity.applicants}
            points={activity.points}
            description={activity.description}
          />
        ))}
      </div>
    </div>
  );
}
