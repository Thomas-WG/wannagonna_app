/**
 * Email/Password Login Component
 * Handles email and password input for user login
 */

'use client';

import { useState } from 'react';
import { Button, Label, TextInput } from 'flowbite-react';

/**
 * EmailPasswordLogin component
 * @param {Function} onSubmit - Callback function called with (email, password) on form submit
 * @param {string} errorMessage - Error message to display
 * @param {Function} t - Translation function
 */
export default function EmailPasswordLogin({ onSubmit, errorMessage, t }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(email, password);
  };

  return (
    <>
      <form className="flex max-w-md flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="email1" className="text-text-primary dark:text-text-primary">{t('email')}</Label>
          </div>
          <TextInput 
            id="email1" 
            type="email" 
            placeholder="name@wannagonna.org" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            className="bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
          />
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="password1" className="text-text-primary dark:text-text-primary">{t('password')}</Label>
          </div>
          <TextInput 
            id="password1" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark"
          />
        </div>
        <Button type="submit" className="mb-4 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white">{t('login')}</Button>
      </form>
      
      {/* Display login error message if exists */}
      {errorMessage && (
        <div className="text-semantic-error-600 dark:text-semantic-error-400 text-center mb-4">{errorMessage}</div>
      )}
    </>
  );
}

