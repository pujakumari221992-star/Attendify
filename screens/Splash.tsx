
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  isAppReady: boolean;
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ isAppReady, onComplete }) => {
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [shouldFadeOut, setShouldFadeOut] = useState(false);

  useEffect(() => {
    // Minimum 2 seconds display time for animations to complete
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 2500); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only proceed if minimum time passed AND app data is ready
    if (minTimePassed && isAppReady && !shouldFadeOut) {
      setShouldFadeOut(true);
      
      // Wait for fade out animation (500ms) before completing
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 500);
      
      return () => clearTimeout(completeTimer);
    }
  }, [minTimePassed, isAppReady, shouldFadeOut, onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-opacity duration-500 ease-out overflow-hidden`}
      style={{ opacity: shouldFadeOut ? 0 : 1, pointerEvents: shouldFadeOut ? 'none' : 'auto' }}
    >
        {/* Background Decorative Elements */}
        <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-[#136A73]/10 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#2DD4BF]/10 rounded-full blur-[100px] animate-pulse-slow" style={{animationDelay: '1s'}}></div>

        {/* Logo Container */}
        <div className="flex flex-col items-center justify-center relative z-10">
             <div className="w-32 h-32 bg-gradient-to-br from-[#136A73] to-[#0D9488] rounded-[36px] flex items-center justify-center shadow-2xl shadow-teal-900/30 mb-8 relative overflow-hidden animate-elastic">
                <i className="fa-solid fa-check-double text-white text-6xl drop-shadow-sm relative z-10"></i>
                <div className="absolute inset-0 bg-white/10 rotate-12 translate-x-8 translate-y-8"></div>
            </div>
            
            {/* App Name */}
            <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-3 animate-fade-in-up" style={{animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards'}}>
                Attendify
            </h1>
            
            {/* Tagline */}
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase animate-tracking-expand">
                Smart Attendance Management
            </p>
        </div>
        
        {/* Loading Spinner */}
        <div className={`absolute bottom-16 transition-opacity duration-300 ${isAppReady ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    </div>
  );
};

export default SplashScreen;
