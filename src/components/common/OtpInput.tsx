import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';

interface OtpInputProps {
  length: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
  theme?: 'dark' | 'light';
}

const OtpInput: React.FC<OtpInputProps> = ({ length, onComplete, disabled, theme = 'dark' }) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!/^[0-9]$/.test(value) && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index-1] = '';
      setOtp(newOtp);
    }
  };

  const inputClassName = theme === 'light'
    ? "w-12 h-14 md:w-14 md:h-16 text-center text-2xl md:text-3xl font-semibold text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400"
    : "w-12 h-14 md:w-14 md:h-16 text-center text-2xl md:text-3xl font-semibold text-white bg-white/10 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-[#1473E6] focus:border-[#1473E6] transition-all duration-200 placeholder:text-gray-500";

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={el => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index]}
          onChange={e => handleChange(index, e)}
          onKeyDown={e => handleKeyDown(index, e)}
          disabled={disabled}
          className={inputClassName}
        />
      ))}
    </div>
  );
};

export default OtpInput;
