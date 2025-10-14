'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  descripcion?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, descripcion, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={props.id} 
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        
        {descripcion && (
          <p className="text-sm text-gray-600">{descripcion}</p>
        )}
        
        <textarea
          ref={ref}
          className={`
            block w-full px-4 py-3 border rounded-lg shadow-sm
            focus:ring-2 focus:ring-teal-500 focus:border-transparent
            transition-all duration-200 resize-none
            ${error 
              ? 'border-red-500 focus:ring-teal-500' 
              : 'border-gray-300 focus:border-teal-500'
            }
            ${className || ''}
          `}
          {...props}
        />
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 flex items-center gap-1"
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

Textarea.displayName = 'Textarea';