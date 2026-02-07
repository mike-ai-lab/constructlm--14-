import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyle = "px-4 py-2 font-mono text-sm uppercase tracking-wide transition-colors border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "bg-white text-black hover:bg-gray-100",
    danger: "bg-white text-red-600 border-red-600 hover:bg-red-50"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Wait..." : children}
    </button>
  );
};
