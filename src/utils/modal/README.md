# Global Modal Management

This module provides global modal management functionality for the application, enabling standard behaviors like:
- **ESC key**: Closes the topmost open modal
- **Browser back button / Mobile back gesture**: Closes the topmost modal or navigates back if no modals are open

## Architecture

The system consists of three main components:

1. **ModalContext** (`ModalContext.js`): Provides a React context that tracks all open modals in a stack
2. **useModal hook** (`useModal.js`): A hook that components can use to register their modals
3. **GlobalModalHandler** (`GlobalModalHandler.js`): A component that listens for keyboard and browser events

## Setup

The modal system is already integrated into the root layout (`src/app/layout.js`). No additional setup is required.

## Usage

To enable global modal behavior for your modal component, simply use the `useModal` hook:

```jsx
'use client';

import { Modal } from 'flowbite-react';
import { useModal } from '@/utils/modal/useModal';

export default function MyModal({ isOpen, onClose }) {
  // Register this modal with the global modal manager
  useModal(isOpen, onClose, 'my-modal-id'); // Optional: provide a unique ID
  
  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>My Modal</Modal.Header>
      <Modal.Body>Content here</Modal.Body>
    </Modal>
  );
}
```

### Parameters

- `isOpen` (boolean): Whether the modal is currently open
- `onClose` (function): Callback function to close the modal
- `modalId` (string, optional): Unique identifier for the modal. If not provided, an auto-generated ID will be used.

### Examples

See these components for reference:
- `src/components/activities/ActivityDetailsModal.js`
- `src/components/activities/NPODetailsModal.js`
- `src/components/profile/PublicProfileModal.js`

## How It Works

1. **Modal Registration**: When a modal opens (`isOpen` becomes `true`), the `useModal` hook registers it with the global modal manager
2. **Stack Management**: Modals are tracked in a stack (LIFO - Last In, First Out), so the most recently opened modal is closed first
3. **ESC Key Handling**: When ESC is pressed, the topmost modal's `onClose` callback is called
4. **Browser Back Button**: When the browser back button is pressed (or mobile back gesture), the topmost modal is closed instead of navigating away

## Nested Modals

The system supports nested modals. When multiple modals are open:
- ESC key closes the topmost (most recently opened) modal
- Browser back button closes the topmost modal
- Each modal must be closed individually (in reverse order of opening)

## Notes

- The modal system works with Flowbite React's `Modal` component, but can work with any modal implementation
- The system only handles closing modals - opening modals is still handled by your component's state management
- If a modal doesn't use `useModal`, it won't be affected by ESC key or browser back button (it will work normally)
