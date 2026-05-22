import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { SignUp, SignedIn, SignedOut } from '@clerk/clerk-react';
import ClerkErrorBoundary from '../components/ClerkErrorBoundary';

const Signup = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
             {/* Background Pastel Waves */}
            <div className="w-full max-w-md relative z-10">
                 {/* Logo to match your brand identity */}
                <div className="text-center mb-6 flex justify-center">
                    <img 
                    src="/HouseNSeekBlueLOGO.png" 
                    alt="HouseNSeek Logo" 
                    />
                </div>

                <div className="flex justify-center w-full clerk-container-override">
                    <SignedIn>
                        <Navigate to="/" replace />
                    </SignedIn>
                    <SignedOut>
                        <ClerkErrorBoundary
                            fallback={
                                <div className="w-full bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200 rounded-xl p-6 text-center">
                                    <p className="text-gray-700 font-semibold">Sign up is temporarily unavailable.</p>
                                    <p className="text-gray-500 text-sm mt-2">Refresh the page and try again.</p>
                                </div>
                            }
                        >
                            <SignUp
                                routing="path"
                                path="/signup"
                                signInUrl="/login"
                                fallbackRedirectUrl="/"
                                appearance={{
                                    elements: {
                                        rootBox: "w-full",
                                        card: "bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200 rounded-xl w-full",
                                        headerTitle: "text-2xl font-bold text-gray-800",
                                        headerSubtitle: "text-gray-500",
                                        formButtonPrimary: "bg-blue-600 text-white font-semibold transition-all duration-300 hover:bg-blue-700 shadow-md",
                                        footerAction: "hidden",
                                        footer: "hidden",
                                        formFieldInput: "bg-gray-50 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-transparent",
                                        socialButtonsBlockButton: "border-gray-300 rounded-lg py-2",
                                        dividerText: "text-gray-500"
                                    }
                                }}
                            />
                        </ClerkErrorBoundary>
                    </SignedOut>
                </div>

                <p className="mt-6 text-center text-sm text-gray-600 font-medium">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 underline">
                        Sign in
                    </Link>
                </p>
            </div>

            <style>{`
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
                    background: linear-gradient(to top right, #fef3c7, #dbeafe);
                    opacity: 0.4;
                }

                .min-h-screen.overflow-hidden::after {
                    bottom: 12vh;
                    border-radius: 47%;
                    background: linear-gradient(to top right, #dbeafe, #fef3c7);
                    opacity: 0.4;
                }
                
                @keyframes rotate {
                    0% { transform: translate(-50%, 0) rotateZ(0deg); }
                    100% { transform: translate(-50%, 0) rotateZ(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Signup;
