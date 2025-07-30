"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ isOpen, onAccept, onDecline }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(false);

  if (!isOpen) return null;

  const canAccept = termsAccepted && cookiesAccepted;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-baseDark p-6 rounded-2xl shadow-xl max-w-[90%] xs:max-w-md w-full text-baseBlack dark:text-baseWhite">
        <h2 className="text-xl font-bold mb-2">Terms of Use, Privacy Policy, and Cookie Policy</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          To proceed, review and accept the following:
        </p>

        <div className="space-y-4 mb-8">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={() => setTermsAccepted(!termsAccepted)}
              className="mt-1 form-checkbox h-5 w-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm text-neutral-800 dark:text-neutral-200">
              You acknowledge that you have read, understood, and agreed to the{' '}
              <Link
                href="/terms-of-use"
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Use
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy-policy"
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </Link>.
            </span>
          </label>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cookiesAccepted}
              onChange={() => setCookiesAccepted(!cookiesAccepted)}
              className="mt-1 form-checkbox h-5 w-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm text-neutral-800 dark:text-neutral-200">
              This site uses cookies to ensure the best user experience. These cookies are strictly necessary or essential for optimal functionality. By using this site, you agree to the cookie policy.
            </span>
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onDecline}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={!canAccept}
            className={`px-8 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
              canAccept
                ? 'bg-gradient-to-r from-gradient-1 to-gradient-2 hover:opacity-90'
                : 'bg-neutral-400 dark:bg-neutral-500 cursor-not-allowed'
            }`}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;