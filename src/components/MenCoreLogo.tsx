import React, { useState } from 'react';
import mencoreLogoImg from '../assets/mencore-logo.jpg';
import { Sparkles, Bot } from 'lucide-react';

interface MenCoreAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
}

export const MenCoreAvatar: React.FC<MenCoreAvatarProps> = ({
  className = '',
  size = 'md',
  src,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || mencoreLogoImg || '/mencore-logo.jpg');
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const handleImageError = () => {
    if (imgSrc !== '/mencore-logo.jpg') {
      // Try static public path first
      setImgSrc('/mencore-logo.jpg');
    } else {
      // Both failed, fallback to vector logo avatar
      setHasError(true);
    }
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-full overflow-hidden border border-cyan-500/40 shadow-md bg-slate-900 ${sizeClasses[size]} ${className}`}>
      {!hasError ? (
        <img
          src={imgSrc}
          alt="MenCore AI Logo"
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white relative">
          <Bot className="w-1/2 h-1/2 text-cyan-200" />
          <Sparkles className="w-1/3 h-1/3 text-amber-300 absolute top-0.5 right-0.5 animate-pulse" />
        </div>
      )}
    </div>
  );
};

interface MenCoreFullLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export const MenCoreFullLogo: React.FC<MenCoreFullLogoProps> = ({
  className = '',
  showSubtitle = true,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(mencoreLogoImg || '/mencore-logo.jpg');
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {!hasError ? (
        <img
          src={imgSrc}
          alt="Smart MenCore - Powered by Menmex"
          className="h-16 md:h-20 object-contain drop-shadow-lg"
          onError={() => {
            if (imgSrc !== '/mencore-logo.jpg') {
              setImgSrc('/mencore-logo.jpg');
            } else {
              setHasError(true);
            }
          }}
        />
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-cyan-500/40 rounded-2xl shadow-lg">
          <Bot className="w-8 h-8 text-cyan-400" />
          <div className="text-left">
            <span className="font-black text-lg text-white tracking-wider block">MenCore AI</span>
            <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block">Smart Tutor Studio</span>
          </div>
        </div>
      )}
      {showSubtitle && (
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 mt-1">
          Powered by Menmex
        </span>
      )}
    </div>
  );
};
