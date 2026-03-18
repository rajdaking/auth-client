import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUserFromToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=oauth_failed');
      return;
    }

    // Store token and decode user
    sessionStorage.setItem('accessToken', token);
    setUserFromToken(token);
    
    // Small delay to let context update before navigating
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 100);
  }, []);

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
      Completing sign in...
    </div>
  );
}