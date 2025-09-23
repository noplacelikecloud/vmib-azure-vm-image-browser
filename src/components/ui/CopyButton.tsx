import React, { useState, useRef, useEffect } from 'react';
import type { VMImageReference } from '../../types';
import { 
  generateAllFormats, 
  validateImageReference, 
  AVAILABLE_FORMATS
} from '../../utils/iacFormats';
import type { FormatKey } from '../../utils/iacFormats';
import { copyToClipboard } from '../../utils';

interface CopyButtonProps {
  imageReference: VMImageReference;
  className?: string;
  disabled?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  imageReference,
  className = '',
  disabled = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const [selectedFormat, setSelectedFormat] = useState<FormatKey>('arm');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset copy status after showing feedback
  useEffect(() => {
    if (copyStatus === 'success' || copyStatus === 'error') {
      const timer = setTimeout(() => setCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  const handleCopy = async (format: FormatKey) => {
    if (!validateImageReference(imageReference)) {
      setCopyStatus('error');
      return;
    }

    setCopyStatus('copying');
    setIsDropdownOpen(false);

    try {
      const formats = generateAllFormats(imageReference);
      const textToCopy = formats[format];
      
      const success = await copyToClipboard(textToCopy);
      
      if (success) {
        setSelectedFormat(format);
        setCopyStatus('success');
      } else {
        setCopyStatus('error');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      setCopyStatus('error');
    }
  };

  const handleQuickCopy = () => {
    handleCopy(selectedFormat);
  };

  const isDisabled = disabled || !validateImageReference(imageReference);

  const getButtonText = () => {
    switch (copyStatus) {
      case 'copying':
        return 'Copying...';
      case 'success':
        return 'Copied!';
      case 'error':
        return 'Copy Failed';
      default:
        return 'Copy';
    }
  };

  const getButtonIcon = () => {
    switch (copyStatus) {
      case 'copying':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const getButtonColorClasses = () => {
    if (isDisabled) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }
    
    switch (copyStatus) {
      case 'success':
        return 'bg-green-600 text-white hover:bg-green-700';
      case 'error':
        return 'bg-red-600 text-white hover:bg-red-700';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div className="flex">
        {/* Main copy button */}
        <button
          onClick={handleQuickCopy}
          disabled={isDisabled}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-l-md
            transition-colors duration-200 focus:outline-none focus:opacity-80
            ${getButtonColorClasses()}
          `}
          aria-label={`Copy as ${AVAILABLE_FORMATS.find(f => f.key === selectedFormat)?.label}`}
        >
          {getButtonIcon()}
          {getButtonText()}
        </button>

        {/* Dropdown toggle button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isDisabled}
          className={`
            px-2 py-2 text-sm font-medium rounded-r-md border-l border-opacity-20 border-white
            transition-colors duration-200 focus:outline-none focus:opacity-80
            ${getButtonColorClasses()}
          `}
          aria-label="Select copy format"
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {AVAILABLE_FORMATS.map((format) => (
              <button
                key={format.key}
                onClick={() => handleCopy(format.key)}
                className={`
                  w-full text-left px-4 py-2 text-sm transition-colors duration-150
                  hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
                  ${selectedFormat === format.key ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                `}
                role="menuitem"
              >
                <div className="flex items-center justify-between">
                  <span>{format.label}</span>
                  {selectedFormat === format.key && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};