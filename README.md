
# Wanna Gonna App

A Next.js application leveraging Firebase as the backend and styled with Tailwind CSS. This README provides guidelines for development practices, including branch naming conventions, installed tools, and setup instructions.

## Branching Rules

To keep the Git history organized and facilitate collaboration among team members, we use the following branch naming conventions:

### Main Branches

- **`main`**: Production-ready branch. Contains fully tested and reviewed code that’s ready to be deployed.
- **`develop`**: Staging branch. Used as the main working branch for ongoing development. All feature, bugfix, and other branches should be merged here first.

### Supporting Branches

To maintain a clean history and ensure clarity, use specific prefixes when creating branches based on their purpose.

- **`feature/`**: For new features or enhancements.
  - Example: `feature/user-authentication`
- **`bugfix/`**: For fixing bugs in the codebase.
  - Example: `bugfix/login-issue`
- **`hotfix/`**: For urgent fixes to production issues.
  - Example: `hotfix/critical-logout-error`
- **`chore/`**: For non-functional tasks, such as updating dependencies, refactoring code, or improving configuration files.
  - Example: `chore/update-dependencies`
- **`test/`**: For testing and experimenting with new ideas, libraries, or UI components. These branches are temporary and can be deleted if the tests are not successful.
  - Example: `test/new-ui-library`

**Workflow Tips**:
1. Create new branches from `develop`.
2. Merge completed work back into `develop` via a pull request (PR).
3. Only merge `develop` into `main` for a production release.

## Project Setup

This project was initialized with Next.js, Tailwind CSS, and Firebase. Here’s a breakdown of the setup choices and the installed tools.

### Installation Summary

- **TypeScript**: No (initially started with JavaScript, may add TypeScript later for type safety).
- **ESLint**: Yes (auto-fix enabled, helping to enforce code quality and consistency).
- **Tailwind CSS**: Yes (for utility-first CSS styling).
- **`src` Directory**: Yes (to separate configuration files from code files).
- **App Router**: Yes (uses the latest Next.js routing mechanism within the `app` folder instead of the `pages` folder).
- **Turbopack**: No (opted out as it’s currently optimized for development mode, and might introduce complexity).
- **Import Alias**: Yes (using `@/*` for cleaner import paths).

---

## Tools and Libraries

### 1. **Next.js**
   - **Description**: A React framework that provides server-side rendering, static site generation, and full-stack capabilities.
   - **Purpose**: Powers the core of the application, handling routing, server-side rendering, and API routes.

### 2. **Tailwind CSS**
   - **Description**: A utility-first CSS framework for quickly styling applications.
   - **Purpose**: Allows for responsive, custom, and efficient styling through utility classes, making the design process faster and more consistent.

### 3. **Firebase**
   - **Description**: A comprehensive backend-as-a-service (BaaS) platform from Google, providing Firestore for database storage, Firebase Authentication, and other services.
   - **Purpose**: Used as the backend for storing data (in Firestore), handling authentication, and supporting various real-time functionalities.

### 4. **ESLint**
   - **Description**: A tool for identifying and fixing potential problems in JavaScript code.
   - **Purpose**: Enforces code style and best practices, helping to maintain a consistent and error-free codebase. Autofix capabilities streamline code formatting.

### 5. **Import Aliases (`@/*`)**
   - **Description**: Custom import paths defined with an alias (`@`), configured to point to the `src` directory.
   - **Purpose**: Simplifies importing files within the project, making it easier to manage dependencies, especially in large codebases.

---

## Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (version 14 or above)
- **npm** (version 6 or above) or **yarn**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Thomas-WG/wannagonna_app.git
   cd project-name
   ```

2. **Install dependencies**:
   ```bash
   npm install
   

3. **Set up Firestore info**:
   - Add the provided `.env.local` file at the root of the project with Firebase config:
     ```plaintext
     NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
     NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
     NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
     ```

### Running the Project

1. **Start the development server**:
   ```bash
   npm run dev


2. **Open the application** in your browser:
   - Visit `http://localhost:3000` to view the app.

### Building for Production

To create an optimized production build, run:

   ```bash
   npm run build


---

## Project Structure

```plaintext
src/
├── app/                  # Main application folder (App Router in Next.js 13)
│   ├── layout.js         # Layout file for consistent UI structure
│   └── page.js           # Main entry point of the app
├── components/           # Reusable UI components
├── lib/                  # Firebase configuration and utility functions
├── styles/               # Global styles and Tailwind configuration
└── ...                   # Other folders and files as needed
```

---

## Contributing

### Branching and Pull Requests

1. **Create a new branch** based on the feature/purpose:
   - `feature/your-feature-name`
   - `bugfix/issue-description`
   - `test/experiment-name`

2. **Commit your changes** with clear, concise messages.

3. **Push your branch** to the repository:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request (PR)** and request a code review from another developer.

### Code Style

- **Run ESLint** before committing to ensure code quality.
- Follow the branching rules for clear and organized development.

---

## Future Plans

- **Switch to TypeScript**: Transition from JavaScript to TypeScript for type safety and better maintainability.
- **Add Turbopack**: Consider adding Turbopack in development mode for faster hot-reloading once the app scales.

---

## License

This project is licensed under the MIT License.

