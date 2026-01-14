/**
 * Create Account Modal Component
 * Modal form for creating a new account with email/password
 */

'use client';

import { useState } from 'react';
import { Modal, Button, Label, TextInput } from 'flowbite-react';

/**
 * CreateAccountModal component
 * @param {boolean} show - Whether the modal is visible
 * @param {Function} onClose - Callback when modal is closed
 * @param {Function} onSubmit - Callback with { email, password, confirmPassword, referralCode } on form submit
 * @param {string} errorMessage - Error message to display
 * @param {Function} t - Translation function
 */
export default function CreateAccountModal({ show, onClose, onSubmit, errorMessage, t }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ email, password, confirmPassword, referralCode });
  };

  const handleClose = () => {
    // Reset form when closing
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setReferralCode('');
    onClose();
  };

  return (
    <Modal show={show} onClose={handleClose} size="md" className="flex items-center justify-center h-full">
      <Modal.Header className="bg-background-card dark:bg-background-card border-b border-border-light dark:border-border-dark text-text-primary dark:text-text-primary">
        {t('createtitle')}
      </Modal.Header>
      <Modal.Body className="bg-background-card dark:bg-background-card">
        <form className="flex flex-col gap-4 w-full max-w-sm mx-auto" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="referralCode" className="text-text-primary dark:text-text-primary">{t('referralCode')}</Label>
            <TextInput 
              id="referralCode" 
              type="text" 
              required 
              placeholder={t('referralCodePlaceholder')}
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              maxLength={5}
              className="uppercase bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
            />
            <p className="text-xs text-text-tertiary dark:text-text-tertiary mt-1">{t('referralCodeHelper')}</p>
          </div>
          <div>
            <Label htmlFor="newEmail" className="text-text-primary dark:text-text-primary">{t('email')}</Label>
            <TextInput 
              id="newEmail" 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
            />
          </div>
          <div>
            <Label htmlFor="newPassword" className="text-text-primary dark:text-text-primary">{t('password')}</Label>
            <TextInput 
              id="newPassword" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-text-primary dark:text-text-primary">{t('confirmpassword')}</Label>
            <TextInput 
              id="confirmPassword" 
              type="password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark"
            />
          </div>
          {/* Display creation error message if exists */}
          {errorMessage && (
            <div className="text-semantic-error-600 dark:text-semantic-error-400 text-center mb-4">{errorMessage}</div>
          )}
          <Button type="submit" className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white">
            {t('create')}
          </Button>
        </form>
      </Modal.Body>
    </Modal>
  );
}

