import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string;
  success?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  success,
  required,
  children,
  hint,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {children}
        {success && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Check className="w-4 h-4 text-green-500" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1 text-red-600 text-sm"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1 text-green-600 text-sm"
          >
            <Check className="w-3 h-3" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {hint && !error && !success && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
}

export const Input: React.FC<InputProps> = ({
  error,
  success,
  className = '',
  ...props
}) => {
  const baseClasses = 'block w-full px-3 py-2 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors';
  
  const stateClasses = error
    ? 'border-red-300 focus:border-red-300 focus:ring-red-500'
    : success
    ? 'border-green-300 focus:border-green-300 focus:ring-green-500'
    : 'border-gray-300 focus:border-blue-300 focus:ring-blue-500';

  return (
    <input
      className={`${baseClasses} ${stateClasses} ${className}`}
      {...props}
    />
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  success?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  error,
  success,
  className = '',
  ...props
}) => {
  const baseClasses = 'block w-full px-3 py-2 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors resize-none';
  
  const stateClasses = error
    ? 'border-red-300 focus:border-red-300 focus:ring-red-500'
    : success
    ? 'border-green-300 focus:border-green-300 focus:ring-green-500'
    : 'border-gray-300 focus:border-blue-300 focus:ring-blue-500';

  return (
    <textarea
      className={`${baseClasses} ${stateClasses} ${className}`}
      {...props}
    />
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  success?: boolean;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  error,
  success,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'block w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors';
  
  const stateClasses = error
    ? 'border-red-300 focus:border-red-300 focus:ring-red-500'
    : success
    ? 'border-green-300 focus:border-green-300 focus:ring-green-500'
    : 'border-gray-300 focus:border-blue-300 focus:ring-blue-500';

  return (
    <select
      className={`${baseClasses} ${stateClasses} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};