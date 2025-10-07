import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Successfully authenticated, redirect to dashboard
        navigate('/dashboard');
      } else {
        // Authentication failed, redirect to home or show error
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Authenticating...</h2>
        <p className="text-gray-400">Please wait while we complete your login.</p>
      </div>
    </div>
  );
};

export default AuthCallback;