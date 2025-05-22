import ProtectedRoute from '@/utils/auth/ProtectedRoute';

export default function MyNonProfitLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="npo-staff">
      {children}
    </ProtectedRoute>
  );
}