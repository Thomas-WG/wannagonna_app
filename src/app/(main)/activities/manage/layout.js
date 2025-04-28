import ProtectedRoute from '@/utils/auth/ProtectedRoute';

export default function ManageActivitiesLayout({ children }) {
  return (
    <ProtectedRoute requiredRole={["admin", "npo-staff", "ambassador"]}>
      {children}
    </ProtectedRoute>
  );
}
