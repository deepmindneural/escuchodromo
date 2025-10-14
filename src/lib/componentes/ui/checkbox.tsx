'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  descripcion?: string;
  children?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, descripcion, children, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <div className="flex items-start">
          <input
            ref={ref}
            type="checkbox"
            className={`
              w-4 h-4 text-teal-600 border-gray-300 rounded 
              focus:ring-teal-500 focus:ring-2 mt-1
              ${className || ''}
            `}
            {...props}
          />
          
          {(label || children) && (
            <div className="ml-3">
              {label && (
                <label 
                  htmlFor={props.id} 
                  className="text-sm font-medium text-gray-700"
                >
                  {label}
                </label>
              )}
              {children && (
                <div className="text-sm text-gray-700">
                  {children}
                </div>
              )}
              {descripcion && (
                <p className="text-xs text-gray-600 mt-1">{descripcion}</p>
              )}
            </div>
          )}
        </div>
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-teal-600 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';