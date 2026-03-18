# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

WannaGonna is a Next.js 16 (App Router, React 19, JavaScript) volunteer management platform backed by Firebase (Firestore, Auth, Cloud Functions, Storage). See `README.md` and `CODEBASE_DOCUMENTATION.md` for full details.

### Running the app locally

1. **Firebase emulators** (Auth, Firestore, Functions, Storage) must be started before the Next.js dev server:
   ```
   firebase emulators:start --only auth,firestore,functions,storage --project demo-project
   ```
   - Do NOT include `apphosting` — it requires Firebase authentication and is not needed locally.
   - The `functions/` directory needs a `.env` file with dummy Mailgun values (see below), otherwise the emulator prompts interactively for `MAILGUN_API_KEY` and blocks startup.
   - Emulator ports: Auth=9099, Firestore=8080, Functions=5001, Storage=9199, UI=4000.

2. **Next.js dev server**: `npm run dev` (serves on port 3000).
   - `firebaseConfig.js` auto-connects to local emulators when `NODE_ENV === 'development'`.

3. **Required `.env.local`** at project root (dummy values work with emulators):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-project
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-DEMO12345
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=demo-vapid-key
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
   ```

4. **Required `functions/.env`** (dummy values for emulator):
   ```
   MAILGUN_API_KEY=demo-mailgun-key
   MAILGUN_DOMAIN=demo.mailgun.org
   MAILGUN_BASE_URL=https://api.mailgun.net/v3
   MAILGUN_FROM=noreply@demo.mailgun.org
   ```

### Creating a test user

Use the Auth emulator API to create a test user (no real Firebase project needed):
```
curl -s -X POST "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@wannagonna.com","password":"Test123456","returnSecureToken":true}'
```

### Lint

`npm run lint` (`next lint`) does not work in Next.js 16 — the `next lint` subcommand was removed. ESLint 9 also requires flat config (`eslint.config.js`), but the repo still uses `.eslintrc.json`. This is a pre-existing compatibility issue.

### Build

`npm run build` runs a production build. Note that running a build is not necessary for local development — use `npm run dev` instead.

### Key gotchas

- The Firebase `--project demo-project` flag is important; the emulators run in demo mode and do not require real Firebase credentials.
- Java (JDK 11+) is required for Firestore and Storage emulators.
- `firebase-tools` must be installed globally (`npm install -g firebase-tools`).
- Cloud Functions require Node.js 22 (see `functions/package.json` engines field).
