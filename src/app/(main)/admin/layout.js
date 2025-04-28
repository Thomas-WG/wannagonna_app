import ProtectedRoute from '@/utils/auth/ProtectedRoute';

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
}
