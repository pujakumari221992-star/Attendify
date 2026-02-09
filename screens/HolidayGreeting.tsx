
import React, { useEffect, useState, useCallback } from 'react';
import { Holiday } from '../types';
import { useAppContext } from '../hooks/useAppContext';

interface HolidayGreetingProps {
  holiday: Holiday;
  onDismiss: () => void;
}

const HolidayGreeting: React.FC<HolidayGreetingProps> = ({ holiday, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const handleDismiss = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(onDismiss, 500); // Wait for exit animation
  }, [onDismiss, isExiting]);

  useEffect(() => {
    const inTimer = setTimeout(() => setVisible(true), 100);
    const outTimer = setTimeout(handleDismiss, 4500); // Auto dismiss after 4.5s

    return () => {
      clearTimeout(inTimer);
      clearTimeout(outTimer);
    };
  }, [handleDismiss]);

  const getAnimationContent = () => {
      const lowerName = holiday.name.toLowerCase();
      
      // HOLI ANIMATION
      if (lowerName.includes('holi')) {
          return (
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[32px]">
                  <div className="absolute w-20 h-20 bg-pink-500/30 rounded-full blur-2xl top-0 left-0 animate-pulse"></div>
                  <div className="absolute w-20 h-20 bg-yellow-500/30 rounded-full blur-2xl bottom-0 right-0 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute w-32 h-32 bg-blue-500/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping" style={{animationDuration: '3s'}}></div>
              </div>
          );
      }
      
      // DIWALI ANIMATION
      if (lowerName.includes('diwali')) {
          return (
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[32px]">
                  <div className="absolute w-full h-full bg-gradient-to-t from-orange-500/20 to-transparent opacity-50"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-200 rounded-full shadow-[0_0_40px_20px_rgba(255,200,0,0.6)] animate-pulse"></div>
                  <div className="absolute top-4 left-10 w-1 h-1 bg-white rounded-full animate-ping"></div>
                  <div className="absolute bottom-10 right-10 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '0.3s'}}></div>
              </div>
          );
      }

      // GENERIC CONFETTI (NEW YEAR / OTHERS)
      return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[32px]">
               <div className="absolute top-0 left-1/4 w-2 h-2 bg-red-400 rotate-45 animate-bounce" style={{animationDuration: '2s'}}></div>
               <div className="absolute top-0 right-1/4 w-2 h-2 bg-blue-400 rotate-12 animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.2s'}}></div>
               <div className="absolute top-10 left-10 w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>
          </div>
      );
  }

  const getThemeColors = () => {
      const lowerName = holiday.name.toLowerCase();
      if (lowerName.includes('holi')) return 'from-pink-600 to-purple-800';
      if (lowerName.includes('diwali')) return 'from-orange-700 to-red-900';
      return 'from-gray-800 to-gray-900';
  }

  return (
    <div
      className={`fixed top-12 left-1/2 -translate-x-1/2 w-[90%] max-w-sm p-1 rounded-[32px] shadow-2xl z-[2000] transition-all duration-500 ease-out transform ${visible && !isExiting ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95'}`}
    >
      <div className={`relative p-5 rounded-[30px] bg-gradient-to-br ${getThemeColors()} text-white overflow-hidden border border-white/10 shadow-inner`}>
        
        {getAnimationContent()}

        <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/20">
            {holiday.name.includes('Holi') ? '🎨' : holiday.name.includes('Diwali') ? '🪔' : '🎉'}
            </div>
            <div className="flex-1 min-w-0">
            <h3 className="font-black text-lg leading-tight tracking-tight drop-shadow-md">{holiday.name}</h3>
            <p className="text-xs text-white/90 font-medium mt-1 leading-snug drop-shadow-sm">{holiday.greeting}</p>
            </div>
            <button onClick={handleDismiss} className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors">
                <i className="fa-solid fa-xmark text-sm"></i>
            </button>
        </div>
      </div>
    </div>
  );
};

export default HolidayGreeting;
