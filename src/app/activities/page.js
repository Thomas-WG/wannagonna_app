"use client";
import { useEffect, useState } from 'react';
import { fetchActivities } from '@/utils/fetchActivities';
import ActivityCard from '@/components/ActivityCard';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    async function getData() {
      const data = await fetchActivities();
      setActivities(data);
    }
    getData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-orange-600 mb-4">Explore Activities</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity, index) => (
          <ActivityCard
            key={index}
            npoName={activity.npoName}
            npoLogo={activity.npoLogo}
            title={activity.title}
            location={activity.location}
            applicants={activity.applicants}
            points={activity.points}
          />
        ))}
      </div>
    </div>
  );
}
