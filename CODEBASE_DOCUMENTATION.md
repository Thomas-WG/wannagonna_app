# WannaGonna App - Complete Codebase Documentation

**Generated:** 2024  
**Purpose:** Comprehensive documentation of all functions, pages, components, utilities, Firebase Cloud Functions, constants, and hooks in the WannaGonna application.

---

## Table of Contents

1. [Pages](#pages)
2. [Components](#components)
3. [Utilities](#utilities)
4. [Firebase Cloud Functions](#firebase-cloud-functions)
5. [Constants & Configuration](#constants--configuration)
6. [Hooks](#hooks)

---

## Pages

### Root Pages

#### `src/app/page.js` - Landing Page
- **Purpose:** Landing page that welcomes visitors, introduces the platform, and provides login access. Automatically redirects authenticated users to dashboard.
- **Called From:** Next.js App Router (root route `/`)
- **Calls:**
  - `@/utils/auth/AuthContext` - `useAuth` hook
  - `next/navigation` - `useRouter`
  - `@/constant/config` - `siteConfig`
  - `firebase/storage` - Logo fetching
- **Assessment:** 
  - ✅ Good: Well-structured, proper loading states, logo caching logic
  - ⚠️ Issues: Logo caching uses localStorage which may not be ideal for SSR. Consider using cookies or server-side caching.
  - 💡 Improvements: 
    - Move logo fetching to a server component or API route for better SSR support
    - Add error boundaries for better error handling
    - Consider using Next.js Image optimization more effectively

#### `src/app/layout.js` - Root Layout
- **Purpose:** Global layout wrapper that sets up fonts, authentication context, theme context, modal management, and internationalization for all pages.
- **Called From:** Next.js App Router (root layout)
- **Calls:**
  - `@/styles/globals.css` - Global styles
  - `@/utils/auth/AuthContext` - `AuthProvider`
  - `@/utils/theme/ThemeContext` - `ThemeProvider`
  - `@/components/modal/ModalProviderWrapper` - Modal management
  - `next/font/google` - Roboto font
  - `next-intl` - Internationalization
- **Assessment:**
  - ✅ Good: Proper provider nesting, async server component for locale
  - ⚠️ Issues: All providers are nested which could cause performance issues with many re-renders
  - 💡 Improvements:
    - Consider memoizing provider values to prevent unnecessary re-renders
    - Add error boundaries around providers
    - Consider splitting providers into separate layout files for better code organization

#### `src/app/login/page.js` - Login Page
- **Purpose:** Handles user authentication with Google Sign-In and email/password. Validates referral codes for new users, creates user profiles, and manages redirects.
- **Called From:** Next.js App Router (`/login`)
- **Calls:**
  - `firebase/auth` - Authentication functions
  - `firebase/firestore` - User document operations
  - `@/utils/auth/AuthContext` - `useAuth`
  - `@/utils/locale` - `setUserLocale`
  - `@/utils/crudBadges` - `handleReferralReward`
  - `@/utils/modal/useModal` - Modal management
- **Assessment:**
  - ✅ Good: Comprehensive authentication flow, referral code validation, error handling
  - ⚠️ Issues: 
    - Very long file (615 lines) - should be split into smaller components
    - Duplicate logo fetching logic (same as landing page)
    - Complex state management with many useState hooks
  - 💡 Improvements:
    - Extract Google sign-in logic into a custom hook
    - Extract email/password login into separate component
    - Extract referral code validation into utility function
    - Create shared logo fetching hook
    - Split into smaller, focused components

#### `src/app/not-found.js` - 404 Page
- **Purpose:** Custom 404 error page with friendly messaging and navigation back.
- **Called From:** Next.js App Router (when route not found)
- **Calls:**
  - `next/navigation` - `useRouter`
- **Assessment:**
  - ✅ Good: Simple, user-friendly error page
  - ⚠️ Issues: Hardcoded styles instead of using theme tokens
  - 💡 Improvements:
    - Use design tokens for colors and spacing
    - Add dark mode support
    - Consider adding search functionality or popular links

### Main Layout

#### `src/app/(main)/layout.js` - Main Layout
- **Purpose:** Layout wrapper for authenticated routes. Includes sidebar navigation and header, with protected route wrapper.
- **Called From:** Next.js App Router (all routes under `(main)`)
- **Calls:**
  - `@/components/layout/Sidebar` - Navigation sidebar
  - `@/components/layout/Header` - Top header
  - `@/utils/auth/ProtectedRoute` - Route protection
- **Assessment:**
  - ✅ Good: Clean layout structure, proper protection
  - ⚠️ Issues: Fixed positioning might cause z-index conflicts
  - 💡 Improvements:
    - Consider using CSS Grid or Flexbox more effectively
    - Add responsive breakpoint handling
    - Document z-index layering strategy

### Dashboard & Core Pages

#### `src/app/(main)/dashboard/page.js` - Dashboard Page
- **Purpose:** Main user dashboard displaying profile, statistics, activities, applications, badges, and QR code scanner. Handles activity validation results from QR scans.
- **Called From:** Next.js App Router (`/dashboard`)
- **Calls:**
  - `@/utils/auth/AuthContext` - `useAuth`
  - `@/utils/crudMemberProfile` - `fetchMemberById`
  - `@/utils/crudApplications` - `fetchApplicationsByUserId`, `fetchActivitiesForVolunteer`
  - `@/utils/crudActivities` - `fetchHistoryActivities`, `fetchActivityById`
  - `@/components/activities/ActivityCard` - Activity display
  - `@/components/activities/ActivityDetailsModal` - Activity details
  - `@/components/activities/ViewApplicationModal` - Application details
  - `@/components/badges/BadgeList` - Badge display
  - `@/components/activities/QRCodeScanner` - QR code scanning
  - `@/components/activities/ActivityValidationSuccessModal` - Validation success
  - `@/components/profile/PublicProfileModal` - Profile display
  - `@/components/activities/ActivityFilters` - Filtering
  - `@/constant/categories` - Category data
- **Assessment:**
  - ✅ Good: Comprehensive dashboard with many features, good state management
  - ⚠️ Issues: 
    - Very large file (1139 lines) - needs significant refactoring
    - Complex state management with many useState hooks
    - Multiple useEffect hooks that could be optimized
    - URL parameter handling for validation results is complex
  - 💡 Improvements:
    - Split into smaller components (ProfileSection, StatsSection, ActivitiesSection, etc.)
    - Extract validation result handling into custom hook
    - Use React Query or SWR for data fetching and caching
    - Consider using a state management library (Zustand, Redux) for complex state
    - Extract filtering/sorting logic into custom hooks
    - Add error boundaries
    - Optimize re-renders with useMemo and useCallback

#### `src/app/(main)/activities/page.js` - Activities Browse Page
- **Purpose:** Displays all open activities with filtering, sorting, and search. Allows users to view activity details and apply.
- **Called From:** Next.js App Router (`/activities`)
- **Calls:**
  - `@/utils/crudActivities` - `subscribeToOpenActivities`
  - `@/utils/crudApplications` - `createApplication`, `checkExistingApplication`
  - `@/utils/auth/AuthContext` - `useAuth`
  - `@/components/activities/ActivityCard` - Activity display
  - `@/components/activities/ActivityDetailsModal` - Activity details
  - `@/components/activities/ActivityFilters` - Filtering
  - `@/components/badges/BadgeAnimation` - Badge animations
  - `@/hooks/useDebounce` - Search debouncing
  - `@/utils/modal/useModal` - Modal management
- **Assessment:**
  - ✅ Good: Real-time subscriptions, good filtering, proper application status checking
  - ⚠️ Issues:
    - Large file (736 lines)
    - Application status checking runs for all activities on every render
    - Could benefit from better loading states
  - 💡 Improvements:
    - Extract application status checking into a custom hook with caching
    - Split apply modal into separate component
    - Use React Query for better data management
    - Add pagination for large activity lists
    - Optimize application status checks with batching

#### `src/app/(main)/members/page.js` - Members Directory Page
- **Purpose:** Displays all members with filtering by country, sorting, and search. Opens public profile modal on click.
- **Called From:** Next.js App Router (`/members`)
- **Calls:**
  - `@/utils/crudMemberProfile` - `fetchMembers`
  - `@/components/profile/PublicProfileModal` - Profile display
  - `@/hooks/useDebounce` - Search debouncing
  - `countries-list` - Country data
- **Assessment:**
  - ✅ Good: Clean implementation, good filtering, responsive design
  - ⚠️ Issues:
    - Fetches all members at once (could be slow with many members)
    - No pagination
  - 💡 Improvements:
    - Add pagination or virtual scrolling
    - Add server-side filtering for better performance
    - Cache member data
    - Add loading skeletons

#### `src/app/(main)/badges/page.js` - Badges Gallery Page
- **Purpose:** Displays all badges organized by category. Shows earned/unearned status with lazy loading for images.
- **Called From:** Next.js App Router (`/badges`)
- **Calls:**
  - `@/utils/crudBadges` - Badge fetching functions
  - `@/utils/auth/AuthContext` - `useAuth`
- **Assessment:**
  - ✅ Good: Lazy loading, image caching, good performance optimizations
  - ⚠️ Issues:
    - Complex caching logic could be extracted
    - Badge card component is defined in same file
  - 💡 Improvements:
    - Extract BadgeCard component to separate file
    - Extract caching logic into custom hook
    - Add error handling for failed image loads
    - Consider using Next.js Image component for better optimization

#### `src/app/(main)/settings/page.js` - Settings Page
- **Purpose:** Allows users to change language, toggle dark mode, and configure notification preferences.
- **Called From:** Next.js App Router (`/settings`)
- **Calls:**
  - `@/utils/locale` - `setUserLocale`
  - `@/utils/auth/AuthContext` - `useAuth`
  - `@/utils/theme/ThemeContext` - `useTheme`
  - `@/utils/notifications` - Notification preference management
  - `firebase/firestore` - User preferences
- **Assessment:**
  - ✅ Good: Clean UI, proper preference management
  - ⚠️ Issues:
    - Page reload on language change is not ideal UX
    - Error handling could be improved
  - 💡 Improvements:
    - Use Next.js router for language change without reload
    - Add loading states for preference saves
    - Better error messages
    - Add confirmation dialogs for destructive actions

#### `src/app/(main)/faq/page.js` - FAQ Page
- **Purpose:** Displays frequently asked questions with search functionality and accordion interface.
- **Called From:** Next.js App Router (`/faq`)
- **Calls:**
  - `@/utils/crudFaq` - `fetchFaqs`, `getLocalizedText`
  - `@/hooks/useDebounce` - Search debouncing
  - `@/utils/theme/ThemeContext` - `useTheme`
- **Assessment:**
  - ✅ Good: Simple, effective implementation
  - ⚠️ Issues: None significant
  - 💡 Improvements:
    - Add categories/tags for FAQs
    - Add "Was this helpful?" feedback
    - Add keyboard navigation for accordion

#### `src/app/(main)/xp-history/page.js` - XP History Page
- **Purpose:** Displays user's complete XP earning history with timestamps and activity details.
- **Called From:** Next.js App Router (`/xp-history`)
- **Calls:**
  - `@/utils/auth/AuthContext` - `useAuth`
  - `@/utils/crudXpHistory` - `fetchXpHistory`
  - `@/utils/dateUtils` - Date formatting
- **Assessment:**
  - ✅ Good: Clean, simple implementation
  - ⚠️ Issues: No pagination for large histories
  - 💡 Improvements:
    - Add pagination or infinite scroll
    - Add filtering by activity type or date range
    - Add export functionality
    - Add charts/visualizations

#### `src/app/(main)/complete-profile/page.js` - Profile Completion Page
- **Purpose:** Multi-step form for new users to complete their profile. Includes profile information, skills, availability, and social links.
- **Called From:** Next.js App Router (`/complete-profile`)
- **Calls:**
  - `@/utils/crudMemberProfile` - `updateMember`, `fetchMemberById`
  - `@/utils/storage` - `uploadProfilePicture`
  - `@/utils/profileHelpers` - `isProfileComplete`
  - `@/utils/crudBadges` - Badge granting
  - `@/utils/urlUtils` - URL normalization
  - `@/components/profile/ProfileInformation` - Profile form section
  - `@/components/profile/SkillsAndAvailability` - Skills form section
  - `@/components/profile/ConnectLinks` - Social links section
  - `@/components/badges/BadgeAnimation` - Badge animations
- **Assessment:**
  - ✅ Good: Well-structured form with multiple sections
  - ⚠️ Issues:
    - Large file (319 lines)
    - Complex form state management
    - URL normalization happens on submit (should validate on blur)
  - 💡 Improvements:
    - Use React Hook Form or Formik for form management
    - Extract form sections into separate components (already done, but could be improved)
    - Add form validation with better error messages
    - Add progress indicator
    - Add auto-save functionality

#### `src/app/(main)/validate-activity/page.js` - Activity Validation Page
- **Purpose:** Handles QR code validation flow. Processes validation, grants XP/badges, and redirects to dashboard with results.
- **Called From:** Next.js App Router (`/validate-activity`)
- **Calls:**
  - `@/utils/auth/AuthContext` - `useAuth`
  - `@/utils/crudActivityValidation` - `validateActivityByQR`
- **Assessment:**
  - ✅ Good: Clean, focused implementation with proper duplicate prevention
  - ⚠️ Issues: 
    - Uses refs for duplicate prevention (could use URL state instead)
    - Shows loading spinner during processing (could show progress)
  - 💡 Improvements:
    - Add progress indicators
    - Better error messages
    - Add retry functionality
    - Consider moving validation logic to API route for better security

#### `src/app/(main)/feedback/page.js` - Feedback Page
- **Purpose:** Allows users to submit feedback, ideas, or bug reports to the ideaBox collection.
- **Called From:** Next.js App Router (`/feedback`)
- **Calls:**
  - `@/utils/auth/AuthContext` - `useAuth`
  - `@/utils/crudIdeaBox` - `addIdeaBoxEntry`
  - `@/utils/theme/ThemeContext` - `useTheme`
- **Assessment:**
  - ✅ Good: Simple, effective implementation
  - ⚠️ Issues: No character count display, no rich text support
  - 💡 Improvements:
    - Add character count
    - Add categories (bug, feature request, feedback)
    - Add file uploads for screenshots
    - Add preview before submit
    - Add "Thank you" page after submission

### Admin Pages

#### `src/app/(main)/admin/page.js` - Admin Dashboard
- **Purpose:** Admin dashboard showing statistics for members, organizations, skills, badges, activities, and FAQs.
- **Called From:** Next.js App Router (`/admin`)
- **Calls:**
  - `@/utils/crudMemberProfile` - `fetchMembers`
  - `@/utils/crudOrganizations` - `fetchOrganizations`
  - `@/utils/crudSkills` - `fetchSkills`
  - `@/utils/crudBadges` - `fetchBadgeCategories`, `fetchAllBadges`
  - `@/utils/crudActivities` - `fetchActivities`
  - `@/utils/crudFaq` - `fetchFaqs`
- **Assessment:**
  - ✅ Good: Clean dashboard, parallel data fetching
  - ⚠️ Issues: Fetches all data on every load (could cache)
  - 💡 Improvements:
    - Add caching for statistics
    - Add real-time updates with subscriptions
    - Add date range filters
    - Add export functionality
    - Add charts/visualizations

#### `src/app/(main)/admin/layout.js` - Admin Layout
- **Purpose:** Layout wrapper for admin routes with role-based protection.
- **Called From:** Next.js App Router (all routes under `admin`)
- **Calls:**
  - `@/utils/auth/ProtectedRoute` - Route protection with `requiredRole="admin"`
- **Assessment:**
  - ✅ Good: Simple, effective protection
  - ⚠️ Issues: None
  - 💡 Improvements: None needed

#### `src/app/(main)/admin/organizations/page.js` - Organizations Management
- **Purpose:** Complete CRUD interface for managing organizations. Includes add, edit, delete functionality with logo upload.
- **Called From:** Next.js App Router (`/admin/organizations`)
- **Calls:**
  - `@/utils/crudOrganizations` - All CRUD operations
  - `@/utils/storage` - `uploadOrgPicture`
  - `@/constant/sdgs` - SDG options
  - `@/utils/theme/ThemeContext` - `useTheme`
  - `@/utils/modal/useModal` - Modal management
  - `countries-list` - Country options
  - `@cospired/i18n-iso-languages` - Language options
- **Assessment:**
  - ✅ Good: Comprehensive CRUD, good mobile support, proper form handling
  - ⚠️ Issues:
    - Very large file (765 lines)
    - Complex form state
    - react-select styles are verbose
  - 💡 Improvements:
    - Extract form into separate component
    - Extract react-select styles into shared utility
    - Add bulk operations
    - Add search/filter for organizations table
    - Add export functionality
    - Add validation for required fields

### MyNonprofit Pages

#### `src/app/(main)/mynonprofit/page.js` - NPO Dashboard
- **Purpose:** Dashboard for NPO staff showing activity metrics, quick actions, and activity management with filtering.
- **Called From:** Next.js App Router (`/mynonprofit`)
- **Calls:**
  - `@/utils/auth/AuthContext` - `useAuth` (claims)
  - `@/utils/crudOrganizations` - `fetchOrganizationById`
  - `@/utils/crudActivities` - `fetchActivitiesByCriteria`, `deleteActivity`, `duplicateActivity`, `updateActivityStatus`
  - `@/utils/crudApplications` - `countPendingApplicationsForOrganization`
  - `@/components/activities/ActivityCard` - Activity display
  - `@/components/activities/DeleteActivityModal` - Delete confirmation
  - `@/components/activities/ReviewApplicationsModal` - Application review
  - `@/components/activities/ActivityDetailsModal` - Activity details
  - `@/components/activities/StatusUpdateModal` - Status updates
  - `@/components/activities/QRCodeModal` - QR code display
  - `@/components/activities/ActivityValidationModal` - Validation
  - `@/components/activities/ParticipantListModal` - Participants
  - `@/components/activities/ActivityFilters` - Filtering
  - `@/constant/categories` - Category data
- **Assessment:**
  - ✅ Good: Comprehensive dashboard, good modal management, proper activity handling
  - ⚠️ Issues:
    - Very large file (830 lines)
    - Complex state management
    - Many modals (could be consolidated)
  - 💡 Improvements:
    - Extract activity management into separate component
    - Consolidate modals into a modal manager
    - Add activity templates
    - Add bulk operations
    - Add activity analytics
    - Optimize activity fetching with caching

#### `src/app/(main)/mynonprofit/activities/manage/page.js` - Activity Create/Edit Page
- **Purpose:** Multi-step form for creating or editing activities. Handles type selection, details, and SDG assignment.
- **Called From:** Next.js App Router (`/mynonprofit/activities/manage`)
- **Calls:**
  - `@/utils/crudActivities` - All activity CRUD operations
  - `@/utils/calculateActivityXP` - XP calculation
  - `@/utils/crudOrganizations` - `fetchOrganizationById`
  - `@/components/layout/ProgressStepper` - Step indicator
  - `@/components/activities/CategorySelector` - Category selection
  - `@/components/activities/ActivityDetailsForm` - Details form
  - `@/components/activities/SDGSelector` - SDG selection
  - `@/components/activities/FormNavigation` - Navigation buttons
  - `@/components/activities/PublishDraftModal` - Status selection
  - `@/constant/categories` - Category data
- **Assessment:**
  - ✅ Good: Well-structured multi-step form, good component separation
  - ⚠️ Issues:
    - Large file (485 lines)
    - Complex form state with many useEffects
    - Date handling is complex
  - 💡 Improvements:
    - Use React Hook Form for form management
    - Extract date handling into utility functions
    - Add form validation
    - Add draft auto-save
    - Add activity preview
    - Simplify XP calculation logic

#### `src/app/(main)/mynonprofit/activities/applications/page.js` - Applications Review Page
- **Purpose:** Allows NPO staff to review, accept, and reject applications for their activities.
- **Called From:** Next.js App Router (`/mynonprofit/activities/applications`)
- **Calls:**
  - `@/utils/auth/AuthContext` - `useAuth`
  - `@/utils/crudActivities` - `fetchActivitiesByCriteria`
  - `@/utils/crudApplications` - `fetchApplicationsForActivity`, `updateApplicationStatus`
  - `@/utils/dateUtils` - `formatDate`
  - `@/utils/modal/useModal` - Modal management
  - `@/components/profile/PublicProfileModal` - Profile display
- **Assessment:**
  - ✅ Good: Clean implementation, good sorting logic, proper confirmation modals
  - ⚠️ Issues:
    - Fetches all applications for all activities (could be optimized)
    - No pagination
  - 💡 Improvements:
    - Add pagination
    - Add bulk accept/reject
    - Add filtering by status
    - Add search functionality
    - Add email templates for responses
    - Add application analytics

#### `src/app/(main)/mynonprofit/organization/edit/page.js` - Organization Edit Page
- **Purpose:** Allows NPO staff to edit their organization information including logo, details, languages, and SDGs.
- **Called From:** Next.js App Router (`/mynonprofit/organization/edit`)
- **Calls:**
  - `@/utils/crudOrganizations` - `fetchOrganizationById`, `updateOrganization`
  - `@/utils/storage` - `uploadOrgPicture`
  - `@/constant/sdgs` - SDG options
  - `@/utils/theme/ThemeContext` - `useTheme`
  - `countries-list` - Country options
  - `@cospired/i18n-iso-languages` - Language options
- **Assessment:**
  - ✅ Good: Clean form, good validation, proper file upload handling
  - ⚠️ Issues:
    - Large file (547 lines)
    - react-select styles duplication
    - Name field is disabled (should allow editing with proper permissions)
  - 💡 Improvements:
    - Extract react-select styles to shared utility
    - Add form validation
    - Add preview before save
    - Add change history
    - Allow name editing with admin approval workflow

---

## Components

### Activities Components

#### `src/components/activities/ActivityCard.js` - Activity Card Component
- **Purpose:** Displays a single activity in card format with key information, badges, and click handling.
- **Called From:**
  - `src/app/(main)/dashboard/page.js`
  - `src/app/(main)/activities/page.js`
  - `src/app/(main)/mynonprofit/page.js`
  - `src/app/(main)/admin/activities/page.js` (likely)
- **Calls:**
  - `@/utils/dateUtils` - Date formatting
  - `@/constant/categoryIcons` - Category icons
  - `@/constant/categories` - Category data
- **Assessment:**
  - ✅ Good: Reusable component, good props interface
  - ⚠️ Issues: Could be more flexible with styling options
  - 💡 Improvements:
    - Add more size variants
    - Add skeleton loading state
    - Add animation on hover
    - Extract badge rendering to separate component

#### `src/components/activities/ActivityDetailsModal.js` - Activity Details Modal
- **Purpose:** Displays full activity details in a modal with organization info, stats, description, and apply button.
- **Called From:**
  - `src/app/(main)/dashboard/page.js`
  - `src/app/(main)/activities/page.js`
  - `src/app/(main)/mynonprofit/page.js`
- **Calls:**
  - `@/utils/crudActivities` - `fetchActivityById`, `getAcceptedApplicationsCount`
  - `@/utils/crudOrganizations` - `fetchOrganizationById`
  - `@/utils/dateUtils` - `formatDateOnly`
  - `@/utils/crudSkills` - `getSkillsForSelect`
  - `@/utils/theme/ThemeContext` - `useTheme`
  - `@/constant/categoryIcons` - Category icons
  - `@/components/activities/NPODetailsModal` - NPO details
  - `@/utils/modal/useModal` - Modal management
- **Assessment:**
  - ✅ Good: Comprehensive details display, good loading states
  - ⚠️ Issues:
    - Large file (571 lines)
    - Fetches organization data separately (could be optimized)
  - 💡 Improvements:
    - Extract sections into smaller components
    - Add caching for organization data
    - Add share functionality
    - Add print view
    - Optimize image loading

#### `src/components/activities/ActivityDetailsForm.js` - Activity Details Form
- **Purpose:** Form component for entering activity details including title, description, dates, location, skills, etc.
- **Called From:**
  - `src/app/(main)/mynonprofit/activities/manage/page.js`
- **Calls:**
  - `@/utils/crudSkills` - Skills data
  - `@/constant/categories` - Category data
- **Assessment:**
  - ✅ Good: Comprehensive form with all necessary fields
  - ⚠️ Issues:
    - Large file (685 lines)
    - Complex form state management
    - Many conditional fields
  - 💡 Improvements:
    - Use React Hook Form
    - Extract field groups into separate components
    - Add form validation
    - Add field-level help text
    - Add auto-save

#### `src/components/activities/ActivityFilters.js` - Activity Filters Component
- **Purpose:** Provides filtering UI for activities by type, category, country, SDG, and skills.
- **Called From:**
  - `src/app/(main)/dashboard/page.js`
  - `src/app/(main)/activities/page.js`
  - `src/app/(main)/mynonprofit/page.js`
- **Calls:**
  - `@/constant/categories` - Category data
- **Assessment:**
  - ✅ Good: Reusable, flexible filtering
  - ⚠️ Issues: Could be more performant with debouncing
  - 💡 Improvements:
    - Add URL state persistence for filters
    - Add filter presets
    - Add clear all filters button
    - Add filter count badges

#### `src/components/activities/ReviewApplicationsModal.js` - Applications Review Modal
- **Purpose:** Modal for reviewing and managing applications for a specific activity.
- **Called From:**
  - `src/app/(main)/mynonprofit/page.js`
- **Calls:**
  - `@/utils/crudApplications` - Application operations
  - `@/utils/crudMemberProfile` - User profile data
  - `@/utils/dateUtils` - Date formatting
  - `@/utils/modal/useModal` - Modal management
- **Assessment:**
  - ✅ Good: Comprehensive application management
  - ⚠️ Issues: Could be optimized for large application lists
  - 💡 Improvements:
    - Add pagination
    - Add bulk operations
    - Add search/filter
    - Add export functionality

#### `src/components/activities/ViewApplicationModal.js` - Application View Modal
- **Purpose:** Displays a single application with details and allows cancellation.
- **Called From:**
  - `src/app/(main)/dashboard/page.js`
- **Calls:**
  - `@/utils/crudApplications` - Application operations
  - `@/utils/crudActivities` - Activity data
  - `@/utils/dateUtils` - Date formatting
- **Assessment:**
  - ✅ Good: Clean display of application details
  - ⚠️ Issues: None significant
  - 💡 Improvements:
    - Add edit functionality (if allowed)
    - Add message thread
    - Add status change history

#### `src/components/activities/DeleteActivityModal.js` - Delete Confirmation Modal
- **Purpose:** Confirmation modal for deleting activities with cascade delete options.
- **Called From:**
  - `src/app/(main)/mynonprofit/page.js`
- **Calls:**
  - `@/utils/crudActivities` - `deleteActivity`
  - `@/utils/crudApplications` - Application operations
- **Assessment:**
  - ✅ Good: Proper confirmation flow
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add undo functionality
    - Add activity archive instead of delete
    - Show impact preview (how many applications will be affected)

#### `src/components/activities/StatusUpdateModal.js` - Status Update Modal
- **Purpose:** Modal for updating activity status (Open, Draft, Closed, etc.).
- **Called From:**
  - `src/app/(main)/mynonprofit/page.js`
- **Calls:**
  - `@/utils/crudActivities` - `updateActivityStatus`
- **Assessment:**
  - ✅ Good: Simple, effective
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add status change reasons
    - Add scheduled status changes
    - Add status change notifications

#### `src/components/activities/QRCodeModal.js` - QR Code Display Modal
- **Purpose:** Displays QR code for activity validation with download option.
- **Called From:**
  - `src/app/(main)/mynonprofit/page.js`
- **Calls:**
  - `@/components/activities/ActivityQRCode` - QR code generation
  - `@/utils/dateUtils` - Date formatting
- **Assessment:**
  - ✅ Good: Clean QR code display
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add different QR code sizes
    - Add print functionality
    - Add QR code analytics

#### `src/components/activities/ActivityValidationModal.js` - Activity Validation Modal
- **Purpose:** Modal for NPO staff to validate participants and close activities.
- **Called From:**
  - `src/app/(main)/mynonprofit/page.js`
- **Calls:**
  - `@/utils/crudActivityValidation` - Validation operations
  - `@/utils/crudApplications` - Application data
- **Assessment:**
  - ✅ Good: Comprehensive validation flow
  - ⚠️ Issues: Could be optimized for large participant lists
  - 💡 Improvements:
    - Add bulk validation
    - Add search/filter
    - Add validation history
    - Add export functionality

#### `src/components/activities/ParticipantListModal.js` - Participant List Modal
- **Purpose:** Displays list of participants for an activity.
- **Called From:**
  - `src/app/(main)/mynonprofit/page.js`
- **Calls:**
  - `@/utils/crudApplications` - Participant data
  - `@/utils/crudMemberProfile` - User profiles
- **Assessment:**
  - ✅ Good: Clean participant display
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add participant search
    - Add participant export
    - Add participant communication
    - Add participant analytics

#### `src/components/activities/QRCodeScanner.js` - QR Code Scanner Component
- **Purpose:** Camera-based QR code scanner for activity validation.
- **Called From:**
  - `src/app/(main)/dashboard/page.js`
- **Calls:**
  - `react-qr-code` or similar QR scanning library
- **Assessment:**
  - ✅ Good: Essential functionality
  - ⚠️ Issues: Requires camera permissions
  - 💡 Improvements:
    - Add manual code entry fallback
    - Add better error handling for camera access
    - Add scanning history
    - Add batch scanning

#### `src/components/activities/ActivityValidationSuccessModal.js` - Validation Success Modal
- **Purpose:** Displays success message after activity validation with XP and badge rewards.
- **Called From:**
  - `src/app/(main)/dashboard/page.js`
- **Calls:**
  - None significant
- **Assessment:**
  - ✅ Good: Clear success feedback
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add animation
    - Add share functionality
    - Add next steps suggestions

#### `src/components/activities/CategorySelector.js` - Category Selection Component
- **Purpose:** Step 1 of activity creation - allows selection of activity type and category.
- **Called From:**
  - `src/app/(main)/mynonprofit/activities/manage/page.js`
- **Calls:**
  - `@/constant/categories` - Category data
- **Assessment:**
  - ✅ Good: Clean category selection
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add category descriptions
    - Add category icons
    - Add category search

#### `src/components/activities/SDGSelector.js` - SDG Selection Component
- **Purpose:** Step 3 of activity creation - allows selection of Sustainable Development Goals.
- **Called From:**
  - `src/app/(main)/mynonprofit/activities/manage/page.js`
- **Calls:**
  - `@/constant/sdgs` - SDG data
- **Assessment:**
  - ✅ Good: Clear SDG selection
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add SDG descriptions
    - Add SDG icons
    - Add SDG impact preview

#### `src/components/activities/FormNavigation.js` - Form Navigation Component
- **Purpose:** Navigation buttons for multi-step forms (Previous, Next, Submit).
- **Called From:**
  - `src/app/(main)/mynonprofit/activities/manage/page.js`
- **Calls:**
  - None
- **Assessment:**
  - ✅ Good: Reusable navigation component
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add keyboard navigation
    - Add progress indicator
    - Add form validation integration

#### `src/components/activities/PublishDraftModal.js` - Publish/Draft Modal
- **Purpose:** Modal for choosing activity status after creation (Publish or Save as Draft).
- **Called From:**
  - `src/app/(main)/mynonprofit/activities/manage/page.js`
- **Calls:**
  - None
- **Assessment:**
  - ✅ Good: Clear status selection
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add scheduled publishing
    - Add preview before publish
    - Add publish checklist

#### `src/components/activities/NPODetailsModal.js` - NPO Details Modal
- **Purpose:** Displays organization details in a modal.
- **Called From:**
  - `src/components/activities/ActivityDetailsModal.js`
- **Calls:**
  - `@/utils/crudOrganizations` - Organization data
  - `@/constant/sdgs` - SDG display
- **Assessment:**
  - ✅ Good: Clean organization display
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add organization rating/reviews
    - Add organization contact form
    - Add organization social links

### Badges Components

#### `src/components/badges/BadgeList.js` - Badge List Component
- **Purpose:** Displays user's earned badges in a grid layout.
- **Called From:**
  - `src/app/(main)/dashboard/page.js`
- **Calls:**
  - `@/utils/crudBadges` - Badge fetching
  - `@/components/badges/BadgeDisplay` - Individual badge display
- **Assessment:**
  - ✅ Good: Clean badge display
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add badge filtering
    - Add badge search
    - Add badge sharing

#### `src/components/badges/BadgeDisplay.js` - Badge Display Component
- **Purpose:** Displays a single badge with image, title, and description.
- **Called From:**
  - `src/components/badges/BadgeList.js`
  - `src/components/profile/PublicProfileModal.js`
- **Calls:**
  - `@/utils/crudBadges` - Badge image URLs
- **Assessment:**
  - ✅ Good: Reusable badge display
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add badge animation
    - Add badge tooltip
    - Add badge details modal

#### `src/components/badges/BadgeAnimation.js` - Badge Animation Component
- **Purpose:** Animated display when a user earns a new badge.
- **Called From:**
  - `src/app/(main)/dashboard/page.js`
  - `src/app/(main)/activities/page.js`
  - `src/app/(main)/complete-profile/page.js`
- **Calls:**
  - `@/utils/crudBadges` - Badge data
- **Assessment:**
  - ✅ Good: Engaging user feedback
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add more animation variants
    - Add sound effects (optional)
    - Add share functionality

### Profile Components

#### `src/components/profile/PublicProfileModal.js` - Public Profile Modal
- **Purpose:** Displays a user's public profile with badges, activities, skills, and social links.
- **Called From:**
  - `src/app/(main)/dashboard/page.js`
  - `src/app/(main)/members/page.js`
  - `src/app/(main)/mynonprofit/activities/applications/page.js`
- **Calls:**
  - `@/utils/crudMemberProfile` - `fetchPublicMemberProfile`, `formatJoinedDate`
  - `@/utils/crudBadges` - `fetchUserBadges`
  - `@/utils/crudActivities` - `fetchHistoryActivities`
  - `@/utils/crudSkills` - `getSkillsForSelect`
  - `@/utils/dateUtils` - `formatDateOnly`
  - `@/utils/urlUtils` - `normalizeUrl`
  - `@/components/badges/BadgeDisplay` - Badge display
  - `@/utils/modal/useModal` - Modal management
- **Assessment:**
  - ✅ Good: Comprehensive profile display, good data fetching
  - ⚠️ Issues:
    - Very large file (593 lines)
    - Fetches multiple data sources
    - Complex layout logic
  - 💡 Improvements:
    - Extract sections into separate components
    - Add caching for profile data
    - Add profile editing (if own profile)
    - Add profile sharing
    - Optimize image loading
    - Add loading skeletons

#### `src/components/profile/ProfileInformation.js` - Profile Information Form
- **Purpose:** Form section for basic profile information (name, bio, country, languages, etc.).
- **Called From:**
  - `src/app/(main)/complete-profile/page.js`
- **Calls:**
  - None significant
- **Assessment:**
  - ✅ Good: Well-structured form section
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add field validation
    - Add character counters
    - Add preview mode

#### `src/components/profile/SkillsAndAvailability.js` - Skills & Availability Form
- **Purpose:** Form section for skills selection and time commitment/availability preferences.
- **Called From:**
  - `src/app/(main)/complete-profile/page.js`
- **Calls:**
  - `@/utils/crudSkills` - Skills data
- **Assessment:**
  - ✅ Good: Good use of multi-select and checkboxes
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add skill level indicators
    - Add availability calendar
    - Add skill recommendations

#### `src/components/profile/ConnectLinks.js` - Social Links Form
- **Purpose:** Form section for social media and website links.
- **Called From:**
  - `src/app/(main)/complete-profile/page.js`
- **Calls:**
  - None
- **Assessment:**
  - ✅ Good: Simple link input
  - ⚠️ Issues: No URL validation
  - 💡 Improvements:
    - Add URL validation
    - Add link preview
    - Add social media icon detection

### Layout Components

#### `src/components/layout/Sidebar.js` - Navigation Sidebar
- **Purpose:** Responsive sidebar navigation with role-based menu items and logo display.
- **Called From:**
  - `src/app/(main)/layout.js`
- **Calls:**
  - `@/utils/auth/AuthContext` - `useAuth`
  - `firebase/storage` - Logo fetching
- **Assessment:**
  - ✅ Good: Responsive design, role-based navigation, good mobile handling
  - ⚠️ Issues:
    - Large file (343+ lines)
    - Logo fetching logic duplicated
    - Complex menu structure
  - 💡 Improvements:
    - Extract logo fetching to shared hook
    - Extract menu items to configuration
    - Add menu item icons
    - Add menu item badges (notifications)
    - Add keyboard navigation
    - Add menu search

#### `src/components/layout/Header.js` - Top Header
- **Purpose:** Top header bar with notifications, theme toggle, and user menu.
- **Called From:**
  - `src/app/(main)/layout.js`
- **Calls:**
  - `@/utils/auth/AuthContext` - `useAuth`
  - `@/utils/theme/ThemeContext` - `useTheme`
  - `@/utils/notifications` - Notification management
- **Assessment:**
  - ✅ Good: Essential header functionality
  - ⚠️ Issues: Could be more feature-rich
  - 💡 Improvements:
    - Add search functionality
    - Add quick actions menu
    - Add user status indicator
    - Add notification center

#### `src/components/layout/ProgressStepper.js` - Progress Stepper Component
- **Purpose:** Visual progress indicator for multi-step forms.
- **Called From:**
  - `src/app/(main)/mynonprofit/activities/manage/page.js`
- **Calls:**
  - None
- **Assessment:**
  - ✅ Good: Clear progress indication
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add step validation indicators
    - Add clickable steps (if allowed)
    - Add step descriptions

### Modal Components

#### `src/components/modal/ModalProviderWrapper.js` - Modal Provider Wrapper
- **Purpose:** Global modal manager that handles ESC key and browser back button for modals.
- **Called From:**
  - `src/app/layout.js`
- **Calls:**
  - `@/utils/modal/ModalContext` - Modal context
  - `@/components/modal/GlobalModalHandler` - Global handlers
- **Assessment:**
  - ✅ Good: Essential modal management functionality
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add modal history
    - Add modal animations
    - Add modal focus management

#### `src/components/modal/GlobalModalHandler.js` - Global Modal Handler
- **Purpose:** Handles global keyboard and browser events for modal management.
- **Called From:**
  - `src/components/modal/ModalProviderWrapper.js`
- **Calls:**
  - `@/utils/modal/ModalContext` - Modal context
- **Assessment:**
  - ✅ Good: Proper event handling
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add more keyboard shortcuts
    - Add modal focus trap
    - Add modal animation coordination

---

## Utilities

### Authentication Utilities

#### `src/utils/auth/AuthContext.js` - Authentication Context
- **Purpose:** Global authentication context provider with Firebase auth state management, user claims, and logout functionality.
- **Called From:**
  - `src/app/layout.js` (AuthProvider)
  - All pages and components via `useAuth` hook
- **Calls:**
  - `firebase/auth` - `onAuthStateChanged`, `signOut`
  - `firebaseConfig` - Firebase configuration
  - `next/navigation` - Router and pathname
- **Assessment:**
  - ✅ Good: Proper context implementation, token refresh logic, good error handling
  - ⚠️ Issues:
    - Token refresh logic could be more robust
    - Redirect logic in context might cause issues
  - 💡 Improvements:
    - Extract redirect logic to middleware
    - Add token refresh queue
    - Add auth state persistence
    - Add session timeout handling
    - Add refresh token rotation

#### `src/utils/auth/ProtectedRoute.js` - Protected Route Component
- **Purpose:** HOC/wrapper component that protects routes based on authentication and role requirements.
- **Called From:**
  - `src/app/(main)/layout.js`
  - `src/app/(main)/admin/layout.js`
  - `src/app/(main)/mynonprofit/layout.js`
- **Calls:**
  - `@/utils/auth/AuthContext` - `useAuth`
- **Assessment:**
  - ✅ Good: Simple, effective protection
  - ⚠️ Issues: Could support more granular permissions
  - 💡 Improvements:
    - Add permission-based protection
    - Add redirect URL preservation
    - Add loading states
    - Add access denied page

### CRUD Utilities

#### `src/utils/crudActivities.js` - Activities CRUD Operations
- **Purpose:** All Firestore operations for activities including create, read, update, delete, subscriptions, and filtering.
- **Called From:**
  - Multiple pages and components throughout the app
- **Calls:**
  - `firebase/firestore` - All Firestore operations
  - `@/utils/crudApplications` - Application operations
  - `@/utils/crudBadges` - Badge operations
  - `@/utils/crudActivityValidation` - Validation operations
- **Assessment:**
  - ✅ Good: Comprehensive CRUD operations, good error handling
  - ⚠️ Issues:
    - Large file (483+ lines)
    - Some functions are quite long
    - Could benefit from better error types
  - 💡 Improvements:
    - Split into smaller, focused modules
    - Add TypeScript for type safety
    - Add operation batching
    - Add caching layer
    - Add retry logic for failed operations
    - Add operation logging

#### `src/utils/crudApplications.js` - Applications CRUD Operations
- **Purpose:** All Firestore operations for applications including create, read, update, status changes, and user/organization queries.
- **Called From:**
  - Multiple pages and components
- **Calls:**
  - `firebase/firestore` - All Firestore operations
  - `@/utils/crudActivities` - Activity data
  - `@/utils/crudBadges` - Badge granting
- **Assessment:**
  - ✅ Good: Comprehensive operations, transaction support
  - ⚠️ Issues:
    - Large file (412+ lines)
    - Complex transaction logic
  - 💡 Improvements:
    - Extract transaction logic
    - Add application state machine
    - Add application history tracking
    - Add bulk operations
    - Add application analytics

#### `src/utils/crudBadges.js` - Badges CRUD Operations
- **Purpose:** All Firestore operations for badges including fetching, granting, image URL management, and caching.
- **Called From:**
  - Multiple pages and components
- **Calls:**
  - `firebase/firestore` - Badge data
  - `firebase/storage` - Badge images
  - `firebase/functions` - Cloud functions
  - `@/utils/crudXpHistory` - XP logging
- **Assessment:**
  - ✅ Good: Comprehensive badge operations, good caching
  - ⚠️ Issues:
    - Very large file (932+ lines)
    - Complex caching logic
    - Image URL fetching could be optimized
  - 💡 Improvements:
    - Split into smaller modules
    - Extract caching to separate utility
    - Add badge image CDN
    - Add badge analytics
    - Add badge templates

#### `src/utils/crudMemberProfile.js` - Member Profile CRUD Operations
- **Purpose:** All Firestore operations for member profiles including fetch, update, public profile, and formatting utilities.
- **Called From:**
  - Multiple pages and components
- **Calls:**
  - `firebase/firestore` - Member data
- **Assessment:**
  - ✅ Good: Good default value handling, public profile separation
  - ⚠️ Issues:
    - Large file (256+ lines)
    - Default value logic is verbose
  - 💡 Improvements:
    - Extract default values to constants
    - Add profile validation
    - Add profile versioning
    - Add profile analytics
    - Add profile export

#### `src/utils/crudOrganizations.js` - Organizations CRUD Operations
- **Purpose:** All Firestore operations for organizations including CRUD and member management.
- **Called From:**
  - Admin pages, NPO pages, activity pages
- **Calls:**
  - `firebase/firestore` - Organization data
- **Assessment:**
  - ✅ Good: Standard CRUD operations
  - ⚠️ Issues: Could have more organization-specific operations
  - 💡 Improvements:
    - Add organization analytics
    - Add organization verification
    - Add organization ratings
    - Add organization search

#### `src/utils/crudSkills.js` - Skills CRUD Operations
- **Purpose:** Firestore operations for skills including fetching and formatting for select components.
- **Called From:**
  - Profile pages, activity pages
- **Calls:**
  - `firebase/firestore` - Skills data
- **Assessment:**
  - ✅ Good: Simple, focused operations
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add skill categories
    - Add skill recommendations
    - Add skill validation

#### `src/utils/crudFaq.js` - FAQ CRUD Operations
- **Purpose:** Firestore operations for FAQs with localization support.
- **Called From:**
  - FAQ page, admin pages
- **Calls:**
  - `firebase/firestore` - FAQ data
- **Assessment:**
  - ✅ Good: Localization support
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add FAQ categories
    - Add FAQ search indexing
    - Add FAQ analytics

#### `src/utils/crudActivityValidation.js` - Activity Validation Operations
- **Purpose:** Firestore operations for activity validation including QR code validation and XP/badge granting.
- **Called From:**
  - Validation page, validation modal
- **Calls:**
  - `firebase/firestore` - Validation data
  - `@/utils/crudBadges` - Badge operations
  - `@/utils/crudXpHistory` - XP logging
- **Assessment:**
  - ✅ Good: Comprehensive validation logic
  - ⚠️ Issues: Complex validation rules
  - 💡 Improvements:
    - Extract validation rules to configuration
    - Add validation history
    - Add validation analytics
    - Add batch validation

#### `src/utils/crudXpHistory.js` - XP History Operations
- **Purpose:** Firestore operations for XP history logging and fetching.
- **Called From:**
  - Badge operations, validation operations, XP history page
- **Calls:**
  - `firebase/firestore` - XP history data
- **Assessment:**
  - ✅ Good: Simple, effective logging
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add XP history aggregation
    - Add XP history analytics
    - Add XP history export

#### `src/utils/crudIdeaBox.js` - Idea Box Operations
- **Purpose:** Firestore operations for feedback/idea box submissions.
- **Called From:**
  - Feedback page
- **Calls:**
  - `firebase/firestore` - Idea box data
- **Assessment:**
  - ✅ Good: Simple submission handling
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add idea categorization
    - Add idea voting
    - Add idea status tracking

### Helper Utilities

#### `src/utils/dateUtils.js` - Date Utility Functions
- **Purpose:** Date formatting and manipulation utilities.
- **Called From:**
  - Multiple pages and components
- **Calls:**
  - None (pure functions)
- **Assessment:**
  - ✅ Good: Useful date utilities
  - ⚠️ Issues: Could use a date library (date-fns, dayjs)
  - 💡 Improvements:
    - Use date-fns or dayjs for better date handling
    - Add timezone support
    - Add more date formats
    - Add date validation

#### `src/utils/locale.js` - Locale Utility Functions
- **Purpose:** Locale management and user preference storage.
- **Called From:**
  - Login page, settings page
- **Calls:**
  - `firebase/firestore` - User preferences
- **Assessment:**
  - ✅ Good: Simple locale management
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add locale detection
    - Add locale fallbacks
    - Add locale validation

#### `src/utils/storage.js` - Firebase Storage Utilities
- **Purpose:** File upload utilities for profile pictures, organization logos, and badge images.
- **Called From:**
  - Profile pages, organization pages, badge operations
- **Calls:**
  - `firebase/storage` - Storage operations
- **Assessment:**
  - ✅ Good: Standard upload operations
  - ⚠️ Issues: Could have more image optimization
  - 💡 Improvements:
    - Add image compression
    - Add image resizing
    - Add image validation
    - Add upload progress
    - Add CDN integration

#### `src/utils/notifications.js` - Notification Utilities
- **Purpose:** Client-side notification management including push notification setup and preference management.
- **Called From:**
  - Settings page, header component
- **Calls:**
  - `firebase/firestore` - Notification preferences
  - `firebase/messaging` - Push notifications
- **Assessment:**
  - ✅ Good: Comprehensive notification handling
  - ⚠️ Issues: Push notification setup is complex
  - 💡 Improvements:
    - Add notification templates
    - Add notification scheduling
    - Add notification analytics
    - Add notification batching

#### `src/utils/modal/useModal.js` - Modal Hook
- **Purpose:** Custom hook for registering modals with global modal manager for ESC key and browser back button support.
- **Called From:**
  - Multiple modal components
- **Calls:**
  - `@/utils/modal/ModalContext` - Modal context
- **Assessment:**
  - ✅ Good: Clean hook implementation, proper cleanup
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add modal stacking
    - Add modal animations
    - Add modal focus management

#### `src/utils/modal/ModalContext.js` - Modal Context
- **Purpose:** React context for global modal management.
- **Called From:**
  - `@/utils/modal/useModal.js`
  - `@/components/modal/ModalProviderWrapper.js`
- **Calls:**
  - None (pure React context)
- **Assessment:**
  - ✅ Good: Proper context implementation
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add modal history
    - Add modal state persistence
    - Add modal analytics

#### `src/utils/theme/ThemeContext.js` - Theme Context
- **Purpose:** Global theme management (light/dark mode) with user preference persistence.
- **Called From:**
  - `src/app/layout.js` (ThemeProvider)
  - Multiple components via `useTheme` hook
- **Calls:**
  - `firebase/firestore` - User preferences
  - `@/utils/auth/AuthContext` - User data
- **Assessment:**
  - ✅ Good: Proper theme management, persistence
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add theme transitions
    - Add custom theme colors
    - Add system theme detection
    - Add theme preview

#### `src/utils/urlUtils.js` - URL Utility Functions
- **Purpose:** URL normalization and validation utilities.
- **Called From:**
  - Profile pages, organization pages
- **Calls:**
  - None (pure functions)
- **Assessment:**
  - ✅ Good: Useful URL utilities
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add URL validation
    - Add URL preview fetching
    - Add URL shortening

#### `src/utils/profileHelpers.js` - Profile Helper Functions
- **Purpose:** Utility functions for profile validation and completeness checking.
- **Called From:**
  - Complete profile page
- **Calls:**
  - None (pure functions)
- **Assessment:**
  - ✅ Good: Profile validation logic
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add more validation rules
    - Add profile completeness scoring
    - Add profile recommendations

#### `src/utils/calculateActivityXP.js` - XP Calculation Utility
- **Purpose:** Calculates XP rewards for activities based on type, category, time commitment, complexity, and frequency.
- **Called From:**
  - Activity creation/edit page
- **Calls:**
  - None (pure function)
- **Assessment:**
  - ✅ Good: Clear XP calculation logic
  - ⚠️ Issues: Calculation formula could be documented better
  - 💡 Improvements:
    - Add XP calculation documentation
    - Add XP calculation preview
    - Add XP calculation testing
    - Make calculation formula configurable

#### `src/utils/designTokens.js` - Design Tokens
- **Purpose:** Centralized design tokens for colors, spacing, typography, etc.
- **Called From:**
  - Multiple components (via Tailwind config)
- **Calls:**
  - None (constants)
- **Assessment:**
  - ✅ Good: Centralized design system
  - ⚠️ Issues: Could be more comprehensive
  - 💡 Improvements:
    - Add more design tokens
    - Add token documentation
    - Add token validation
    - Add token versioning

---

## Firebase Cloud Functions

### Activity Management Functions

#### `functions/src/activity-mgt/onAddActivity.js` - Activity Created Trigger
- **Purpose:** Cloud function triggered when an activity is created. Updates organization activity counts.
- **Triggered By:** Firestore `onDocumentCreated` on `activities/{activityId}`
- **Calls:**
  - `firebase/firestore` - Organization updates
- **Assessment:**
  - ✅ Good: Proper transaction handling
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add error notifications
    - Add activity creation analytics
    - Add activity validation

#### `functions/src/activity-mgt/onRemoveActivity.js` - Activity Deleted Trigger
- **Purpose:** Cloud function triggered when an activity is deleted. Updates organization activity counts.
- **Triggered By:** Firestore `onDocumentDeleted` on `activities/{activityId}`
- **Calls:**
  - `firebase/firestore` - Organization updates
- **Assessment:**
  - ✅ Good: Proper cleanup handling
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add cascade delete for applications
    - Add activity deletion analytics
    - Add activity archive option

#### `functions/src/activity-mgt/onAddApplication.js` - Application Created Trigger
- **Purpose:** Cloud function triggered when an application is created. Updates activity applicants count.
- **Triggered By:** Firestore `onDocumentCreated` on `activities/{activityId}/applications/{applicationId}`
- **Calls:**
  - `firebase/firestore` - Activity updates
- **Assessment:**
  - ✅ Good: Proper count management
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add application creation notifications
    - Add application analytics
    - Add duplicate detection

#### `functions/src/activity-mgt/onRemoveApplication.js` - Application Deleted Trigger
- **Purpose:** Cloud function triggered when an application is deleted. Updates activity applicants count.
- **Triggered By:** Firestore `onDocumentDeleted` on `activities/{activityId}/applications/{applicationId}`
- **Calls:**
  - `firebase/firestore` - Activity updates
- **Assessment:**
  - ✅ Good: Proper count management
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add application deletion analytics
    - Add cancellation notifications

### Notification Functions

#### `functions/src/notifications/notificationService.js` - Notification Service
- **Purpose:** Core notification service for creating, reading, updating, and deleting user notifications with push support.
- **Called From:**
  - Multiple cloud functions
  - Client-side via callable functions
- **Calls:**
  - `firebase/firestore` - Notification data
  - `firebase/messaging` - Push notifications
- **Assessment:**
  - ✅ Good: Comprehensive notification service
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add notification batching
    - Add notification scheduling
    - Add notification templates
    - Add notification analytics

#### `functions/src/notifications/emailService.js` - Email Service
- **Purpose:** Mailgun email service for sending transactional emails.
- **Called From:**
  - Application status change function
- **Calls:**
  - Mailgun API
- **Assessment:**
  - ✅ Good: Proper email service abstraction
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add email templates
    - Add email queuing
    - Add email analytics
    - Add email retry logic

#### `functions/src/notifications/emailTemplates.js` - Email Templates
- **Purpose:** Email template generation for various notification types.
- **Called From:**
  - Email service
- **Calls:**
  - None (template functions)
- **Assessment:**
  - ✅ Good: Template-based emails
  - ⚠️ Issues: Could support more templates
  - 💡 Improvements:
    - Add more email templates
    - Add template variables
    - Add template preview
    - Add template versioning

### Reward Functions

#### `functions/src/rewards/onValidationCreated.js` - Validation Reward Trigger
- **Purpose:** Cloud function triggered when activity validation is created. Grants XP and badges, sends notifications.
- **Triggered By:** Firestore `onDocumentCreated` on `validations/{validationId}`
- **Calls:**
  - `firebase/firestore` - User updates, badge operations
  - `firebase/functions` - Notification functions
- **Assessment:**
  - ✅ Good: Comprehensive reward logic
  - ⚠️ Issues: Complex reward calculation
  - 💡 Improvements:
    - Extract reward rules to configuration
    - Add reward analytics
    - Add reward history
    - Add reward validation

### User Management Functions

#### `functions/src/user-mgt/setCustomClaims.js` - Custom Claims Setter
- **Purpose:** Sets Firebase Auth custom claims for user roles and permissions.
- **Called From:**
  - Callable function `setCustomClaims`
- **Calls:**
  - `firebase/auth` - Admin SDK
- **Assessment:**
  - ✅ Good: Proper claims management
  - ⚠️ Issues: Could have more validation
  - 💡 Improvements:
    - Add claims validation
    - Add claims history
    - Add claims audit log

### Main Functions Index

#### `functions/index.js` - Cloud Functions Entry Point
- **Purpose:** Exports all cloud functions including triggers and callable functions.
- **Called From:** Firebase Functions runtime
- **Calls:**
  - All cloud function modules
- **Assessment:**
  - ✅ Good: Well-organized exports
  - ⚠️ Issues: Large file (484 lines)
  - 💡 Improvements:
    - Split into multiple index files by domain
    - Add function documentation
    - Add function versioning
    - Add function monitoring

---

## Constants & Configuration

#### `src/constant/config.js` - Site Configuration
- **Purpose:** Centralized site configuration including title, description, URL, and metadata.
- **Called From:**
  - Landing page, layout
- **Calls:**
  - None (constants)
- **Assessment:**
  - ✅ Good: Centralized configuration
  - ⚠️ Issues: Could include more configuration
  - 💡 Improvements:
    - Add environment-specific configs
    - Add feature flags
    - Add API endpoints
    - Add social media links

#### `src/constant/categories.js` - Activity Categories
- **Purpose:** Defines activity categories organized by type (online, local, event).
- **Called From:**
  - Activity pages, activity components
- **Calls:**
  - None (constants)
- **Assessment:**
  - ✅ Good: Well-organized categories
  - ⚠️ Issues: Categories are hardcoded
  - 💡 Improvements:
    - Move categories to Firestore for dynamic management
    - Add category descriptions
    - Add category icons
    - Add category translations

#### `src/constant/categoryIcons.js` - Category Icons Mapping
- **Purpose:** Maps category IDs to React Icons components.
- **Called From:**
  - Activity components
- **Calls:**
  - `react-icons/hi` - Heroicons
  - `react-icons/fa` - Font Awesome icons
  - `react-icons/io5` - Ionicons
- **Assessment:**
  - ✅ Good: Centralized icon mapping
  - ⚠️ Issues: Uses multiple icon libraries
  - 💡 Improvements:
    - Standardize on one icon library
    - Add icon fallbacks
    - Add icon size variants
    - Add icon colors

#### `src/constant/sdgs.js` - SDG Constants
- **Purpose:** Sustainable Development Goals data including names, options, and helper functions.
- **Called From:**
  - Activity pages, organization pages, admin pages
- **Calls:**
  - None (constants and pure functions)
- **Assessment:**
  - ✅ Good: Comprehensive SDG data, useful helper functions
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add SDG descriptions
    - Add SDG icons
    - Add SDG targets
    - Add SDG translations

---

## Hooks

#### `src/hooks/useDebounce.js` - Debounce Hook
- **Purpose:** Custom React hook for debouncing values (useful for search inputs).
- **Called From:**
  - Activities page, members page, FAQ page
- **Calls:**
  - None (pure React hook)
- **Assessment:**
  - ✅ Good: Simple, effective debounce implementation
  - ⚠️ Issues: None
  - 💡 Improvements:
    - Add cancel functionality
    - Add immediate execution option
    - Add max wait time
    - Add TypeScript types

---

## Overall Codebase Assessment

### Strengths
1. **Well-organized structure** - Clear separation of pages, components, utilities, and functions
2. **Comprehensive feature set** - Covers authentication, activities, applications, badges, profiles, organizations
3. **Good use of React patterns** - Custom hooks, context providers, component composition
4. **Real-time updates** - Firestore subscriptions for live data
5. **Internationalization** - next-intl integration for multi-language support
6. **Responsive design** - Mobile-friendly components and layouts
7. **Error handling** - Generally good error handling throughout
8. **Code comments** - Many files have helpful comments

### Areas for Improvement

#### Code Organization
1. **Large files** - Many files exceed 500 lines and should be split:
   - `dashboard/page.js` (1139 lines)
   - `mynonprofit/page.js` (830 lines)
   - `admin/organizations/page.js` (765 lines)
   - `activities/page.js` (736 lines)
   - `PublicProfileModal.js` (593 lines)
   - `login/page.js` (615 lines)

2. **Component extraction** - Many pages have inline components that should be extracted:
   - BadgeCard in badges page
   - Form sections in activity management
   - Modal components scattered across pages

#### State Management
1. **Complex state** - Many components use multiple useState hooks that could benefit from:
   - React Hook Form for forms
   - Zustand or Redux for global state
   - React Query for server state

2. **Prop drilling** - Some components pass many props that could use context

#### Performance
1. **Data fetching** - Many pages fetch all data at once:
   - Add pagination
   - Add virtual scrolling
   - Add data caching (React Query, SWR)

2. **Re-renders** - Some components could benefit from:
   - More useMemo and useCallback
   - Component memoization
   - Code splitting

3. **Image optimization** - Consider:
   - Next.js Image component everywhere
   - Image CDN
   - Lazy loading improvements

#### Code Quality
1. **Type safety** - Consider migrating to TypeScript for better type safety

2. **Testing** - No test files found - should add:
   - Unit tests for utilities
   - Component tests
   - Integration tests
   - E2E tests

3. **Error boundaries** - Add React error boundaries for better error handling

4. **Loading states** - Some components lack proper loading states

5. **Accessibility** - Could improve:
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

#### Security
1. **Client-side validation** - Add more server-side validation
2. **Rate limiting** - Consider adding rate limiting for API calls
3. **Input sanitization** - Ensure all user inputs are sanitized

#### Documentation
1. **API documentation** - Add JSDoc comments for all functions
2. **Component documentation** - Add Storybook or similar
3. **Architecture documentation** - Document system architecture
4. **Deployment documentation** - Document deployment process

### Recommended Refactoring Priorities

1. **High Priority:**
   - Split large page files into smaller components
   - Add React Query for data fetching
   - Add error boundaries
   - Add loading states everywhere
   - Extract duplicate logic (logo fetching, form handling)

2. **Medium Priority:**
   - Migrate to TypeScript
   - Add comprehensive testing
   - Implement pagination/virtual scrolling
   - Add state management library
   - Optimize image loading

3. **Low Priority:**
   - Add Storybook
   - Improve accessibility
   - Add analytics
   - Add monitoring/logging
   - Add performance monitoring

---

## Dependency Graph Summary

### Most Used Utilities
1. `@/utils/auth/AuthContext` - Used in almost every page/component
2. `@/utils/crudActivities` - Used extensively for activity operations
3. `@/utils/crudApplications` - Used in dashboard, activities, NPO pages
4. `@/utils/crudBadges` - Used in dashboard, badges, profile pages
5. `@/utils/crudMemberProfile` - Used in profile, members, dashboard pages

### Most Used Components
1. `ActivityCard` - Used in dashboard, activities, NPO pages
2. `ActivityDetailsModal` - Used in multiple pages
3. `PublicProfileModal` - Used in dashboard, members, applications pages
4. `ActivityFilters` - Used in multiple activity listing pages

### Most Used Constants
1. `@/constant/categories` - Used in activity pages
2. `@/constant/categoryIcons` - Used in activity components
3. `@/constant/sdgs` - Used in activity and organization pages
4. `@/constant/config` - Used in landing page and layout

---

## Conclusion

The WannaGonna codebase is a comprehensive, feature-rich application with good organization and modern React patterns. The main areas for improvement are:

1. **Code organization** - Split large files into smaller, focused components
2. **State management** - Consider using React Query and a state management library
3. **Performance** - Add pagination, caching, and optimization
4. **Type safety** - Consider migrating to TypeScript
5. **Testing** - Add comprehensive test coverage
6. **Documentation** - Add more inline documentation and API docs

The codebase shows good understanding of React, Next.js, and Firebase, with proper use of hooks, context, and modern patterns. With the suggested improvements, it can become even more maintainable and scalable.

---

**Documentation Generated:** 2024  
**Total Files Analyzed:** 100+  
**Lines of Code:** ~15,000+
