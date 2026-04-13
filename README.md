# Eduro InfoTV

A digital signage / InfoTV system built with React, TypeScript, Tailwind CSS, and Firebase.

## Features

- **Public Display View (`/display`)**: A fullscreen, auto-rotating display optimized for large TV screens.
- **Admin Dashboard (`/admin`)**: A secure area for staff to manage content.
- **Role-Based Access**: Supports `admin` (full access including settings) and `editor` (content management only) roles.
- **Content Types**: Announcements (with start/end dates), Events, Media (images/video), RSS Feeds, and QR Links.
- **Customizable**: Change colors, rotation intervals, toggle sections on/off, and upload a custom logo.
- **Weather Widget**: Built-in Open-Meteo integration for local weather display.
- **AI Assistant**: Integrated Gemini AI for content generation and summarization.
- **Live Preview**: Built-in preview route (`/admin/preview`) to see changes instantly.

## Architecture

- **Frontend**: React 19, React Router, Tailwind CSS, Framer Motion for transitions.
- **Backend**: Firebase (Firestore + Auth + Storage).
- **Mock Mode**: Explicitly controlled via `VITE_ENABLE_MOCK_MODE=true` for local development without a backend.

## Setup Instructions

### 1. Firebase Setup
1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project.
2. Enable **Authentication** and add **Google** and **Email/Password** as sign-in providers.
3. Enable **Cloud Firestore** and create a database.
4. Deploy the security rules from `firestore.rules`.
5. (Optional) Enable **Firebase Storage** if you plan to use image uploads.

### 2. Environment Variables
1. Copy `.env.example` to `.env.local` (or set them in your deployment environment).
2. Add your Firebase configuration values to `firebase-applet-config.json` or set them as environment variables.
3. If you want to run the app without Firebase for UI testing, set `VITE_ENABLE_MOCK_MODE=true`.

### 3. Creating the First Admin User
1. The application includes a bootstrap mechanism:
   - The **first user** to sign up via Google will automatically be assigned the `admin` role.
   - Subsequent users will be assigned the `editor` role by default.
   - You can also set `VITE_INITIAL_ADMIN_EMAIL` in your environment to designate a specific email as the initial admin.
2. To change a user's role later, you must manually update their document in the `users` collection in the Firebase Console.

### 4. Running the App
```bash
npm install
npm run dev
```

## Deployment

The application is a standard Vite SPA (Single Page Application) and can be deployed to any static hosting provider like Vercel, Netlify, or Cloudflare Pages.

1. Set the build command to `npm run build`.
2. Set the output directory to `dist`.
3. Ensure you add your Firebase configuration to your deployment environment variables.
4. **Do not** set `VITE_ENABLE_MOCK_MODE=true` in production.

### 5. Deploying Cloud Functions & AI
1. The application uses Cloud Functions to handle automated invitations, email sending, and **secure AI generation**.
2. To deploy the functions, run:
   ```bash
   firebase deploy --only functions
   ```
3. **Set the Gemini API Key Secret**: The AI features require a Gemini API key. Set it as a secret in Firebase Functions:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```
   (Paste your key when prompted).
4. **SMTP Setup (Optional)**: For email invitations to work:
   ```bash
   firebase functions:config:set smtp.host="smtp.yourserver.com" smtp.port="587" smtp.user="your-email@example.com" smtp.pass="your-password"
   ```

### 6. Maintenance and Cleanup
1. **Cleaning up old test data**:
   - If you have old collections like `ilmoitukset`, `sisältökohteet`, or `näyttöasetukset` from previous versions, you can safely delete them manually in the Firebase Console.
   - The current application uses `users`, `invitations`, `content_items`, and `display_settings`.
2. **Deploying Security Rules**:
   - To update the security rules in production, run the following command in your terminal:
     ```bash
     firebase deploy --only firestore:rules,storage
     ```
   - Alternatively, you can copy the contents of `firestore.rules` and `storage.rules` directly into the Rules tab of the Firestore and Storage sections in the Firebase Console.

## Security Notes

- **API Keys**: The `GEMINI_API_KEY` is securely stored in Firebase Functions secrets and is *never* exposed to the client browser.
- **Firebase Config**: The `firebase-applet-config.json` file is gitignored to prevent accidental commits of local configuration.
- **Key Rotation**: If this repository was previously public while containing an exposed API key in `vite.config.ts`, it is highly recommended to rotate your Gemini API key immediately.

## V2.1 Roadmap Ideas

- Multiple display profiles (e.g., lobby vs. staff room)
- Calendar sync (iCal/Google Calendar integration)
- Playlist mode for specific screen zones
- Chromecast remote device management
- Optimized dashboard performance for very large content catalogs (denormalized counters)
