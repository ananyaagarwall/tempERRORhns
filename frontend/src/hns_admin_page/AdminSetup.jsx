import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../services/apiInstance';

const AdminSetup = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [setupKey, setSetupKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    api.get('/auth/me')
      .then((res) => {
        const nextProfile = res.data;
        setProfile(nextProfile);
        localStorage.setItem('user', JSON.stringify(nextProfile));
        setEmail(nextProfile?.email || '');
      })
      .catch(() => setProfile(null));
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (profile?.admin_session_verified) {
      localStorage.setItem('user', JSON.stringify(profile));
      navigate('/dashboard/admin', { replace: true });
    }
  }, [profile, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password || !setupKey) {
      setStatus({ type: 'error', message: 'Admin email, password, and setup key are all required.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Verifying admin access...' });
    try {
      const res = await api.post('/auth/promote-admin', {
        email,
        password,
        setup_key: setupKey,
      });

      setStatus({ type: 'success', message: res.data?.message || 'Admin verification successful. Opening dashboard...' });
      const me = await api.get('/auth/me');
      setProfile(me.data);
      localStorage.setItem('user', JSON.stringify(me.data));
      setSetupKey('');
      setPassword('');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Verification failed.';
      setStatus({ type: 'error', message: msg });
    }
  };

  if (isLoaded && isSignedIn && profile && !profile.is_primary_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white shadow-lg border border-gray-200 rounded-xl p-6">
        <div className="text-center mb-6">
          <img src="/HouseNSeek.png" alt="HouseNSeek Logo" />
          <h1 className="text-2xl font-bold text-gray-800 mt-3">Admin Setup</h1>
          <p className="text-gray-500 text-sm mt-1">
            Only the designated primary admin can continue from here.
          </p>
        </div>

        {!isLoaded && (
          <p className="text-gray-600">Loading...</p>
        )}

        {isLoaded && !isSignedIn && (
          <p className="text-gray-600">
            Please sign in with the primary admin account first.
          </p>
        )}

        {isLoaded && isSignedIn && (
          <>
            {profile && (
              <div className="mb-4 text-sm text-gray-700">
                <div>Signed in as: <strong>{profile.email}</strong></div>
                <div>Current role: <strong>{profile.role}</strong></div>
              </div>
            )}

            {profile?.is_primary_admin && !profile?.admin_session_verified && (
              <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Admin Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter designated admin email"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Admin Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter admin password"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Setup Key</label>
                  <input
                    type="password"
                    value={setupKey}
                    onChange={(e) => setSetupKey(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter setup key"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm mt-2"
                  disabled={status.type === 'loading'}
                >
                  Verify Admin Access
                </button>

                {status.type !== 'idle' && (
                  <div
                    className={`text-sm p-2 rounded ${
                      status.type === 'success' ? 'bg-green-50 text-green-700' :
                      status.type === 'error' ? 'bg-red-50 text-red-600' :
                      'text-gray-600'
                    }`}
                  >
                    {status.message}
                  </div>
                )}
              </form>
            )}
          </>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <Link to="/login" className="text-blue-600 hover:text-blue-700 underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
