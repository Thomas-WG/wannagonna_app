'use client';

import { ModalProvider } from '@/utils/modal/ModalContext';
import GlobalModalHandler from './GlobalModalHandler';

/**
 * ModalProviderWrapper
 * 
 * Client component wrapper that provides modal context and global handlers.
 * This is needed because the root layout is a server component.
 */
export default function ModalProviderWrapper({ children }) {
  return (
    <ModalProvider>
      <GlobalModalHandler />
      {children}
    </ModalProvider>
  );
}
