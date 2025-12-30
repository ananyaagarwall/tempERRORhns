import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            
            if (response.ok) {
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirect based on role
                switch (data.user.role) {
                    case 'admin':
                        navigate('/dashboard/admin');
                        break;
                    case 'builder':
                        navigate('/builder-dashboard');
                        break;
                    case 'customer':
                        navigate('/');
                        break;
                    default:
                        navigate('/');
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred during login');
        }
    };

                
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
            <div className="w-full max-w-md relative z-10">
                 {/* Logo to match your brand identity */}
                <div className="text-center mb-8">
                    <img 
                    src="/HouseNSeek.png" 
                    alt="HouseNSeek Logo" 
                    />
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Welcome Back!</h2>
                    <p className="text-center text-gray-500 mb-6">Sign in to continue</p>
                    
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                            <p>{error}</p>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-400"
                                    required
                                    placeholder="your.email@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-400"
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-yellow-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-yellow-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-px"
                        >
                            Login
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <button className="inline-flex justify-center p-3 border border-gray-300 rounded-full shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                  <path d="M1 1h22v22H1z" fill="none" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
            {/* New background styles for pastel waves */}
            <style jsx global>{`
                .min-h-screen.overflow-hidden::before,
                .min-h-screen.overflow-hidden::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    min-width: 300vw;
                    min-height: 300vw;
                    z-index: 0;
                    animation: rotate 20s linear infinite;
                }

                .min-h-screen.overflow-hidden::before {
                    bottom: 15vh;
                    border-radius: 45%;
                    background: linear-gradient(to top right, #fef3c7, #dbeafe); /* Pastel yellow to pastel blue */
                    opacity: 0.4;
                }

                .min-h-screen.overflow-hidden::after {
                    bottom: 12vh;
                    border-radius: 47%;
                    background: linear-gradient(to top right, #dbeafe, #fef3c7); /* Pastel blue to pastel yellow */
                    opacity: 0.4;
                }
                
                @keyframes rotate {
                    0% {
                        transform: translate(-50%, 0) rotateZ(0deg);
                    }
                    100% {
                        transform: translate(-50%, 0) rotateZ(360deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;
