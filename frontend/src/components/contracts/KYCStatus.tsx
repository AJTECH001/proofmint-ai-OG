import React from 'react';
import { useKYCStatus } from '../../hooks/useContractQueries';

interface KYCStatusProps {
  address: `0x${string}`;
  showVerifyButton?: boolean;
  onVerify?: () => void;
}

export const KYCStatus: React.FC<KYCStatusProps> = ({
  address,
  showVerifyButton = false,
  onVerify,
}) => {
  const { data: isVerified, isLoading, error } = useKYCStatus(address);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-red-900">KYC Status Error</h4>
            <p className="text-sm text-red-700">Unable to verify KYC status</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isVerified ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {isVerified ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              KYC {isVerified ? 'Verified' : 'Not Verified'}
            </h4>
            <p className="text-sm text-gray-500">
              {isVerified 
                ? 'Identity verification completed' 
                : 'Identity verification required'
              }
            </p>
          </div>
        </div>
        
        {!isVerified && showVerifyButton && onVerify && (
          <button
            onClick={onVerify}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Verify KYC
          </button>
        )}
      </div>
    </div>
  );
};