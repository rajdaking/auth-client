import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

   if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        color: '#64748b',
        fontSize: '14px',
      }}>
        Checking authentication...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) return <Navigate to="/unauthorized" replace />;

  return children;
};

export default ProtectedRoute;