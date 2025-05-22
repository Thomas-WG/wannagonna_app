'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import categories from '@/constant/categories';
import {
  createActivity,
  updateActivity,
  fetchActivityById,
} from '@/utils/crudActivities';
import {fetchOrganizationById} from '@/utils/crudOrganizations';
import ProgressStepper from '@/components/layout/ProgressStepper';
import { useAuth } from '@/utils/auth/AuthContext'; // Hook for accessing user authentication status
import { useTranslations } from 'use-intl';

export default function MyNonProfitActivitiesManagePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activityId = searchParams.get('activityId');
    const activityType = searchParams.get('activityType');
    const isEditMode = Boolean(activityId);
    const { user, claims, loading } = useAuth();
    const t = useTranslations('ManageActivities');

    const [formData, setFormData] = useState({
        
    })

  return (
    <div>
      <h1>Activity create / update</h1>
    </div>
  );
}