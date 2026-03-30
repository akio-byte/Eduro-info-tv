# Eduro InfoTV

A digital signage / InfoTV system built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Public Display View (`/display`)**: A fullscreen, auto-rotating display optimized for large TV screens.
- **Admin Dashboard (`/admin`)**: A secure area for staff to manage content.
- **Role-Based Access**: Supports `admin` (full access including settings) and `editor` (content management only) roles.
- **Content Types**: Announcements (with start/end dates), Events, Highlights (image cards), and QR Links.
- **Customizable**: Change colors, rotation intervals, and toggle sections on/off.
- **Live Preview**: Built-in preview route (`/admin/preview`) to see changes instantly.

## Architecture

- **Frontend**: React 19, React Router, Tailwind CSS, Framer Motion for transitions.
- **Backend**: Supabase (PostgreSQL + Auth + RLS).
- **Mock Mode**: Explicitly controlled via `VITE_ENABLE_MOCK_MODE=true` for local development without a backend.

## Setup Instructions

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase/schema.sql` and run it. This will create the necessary tables, Row Level Security (RLS) policies, and triggers.

### 2. Environment Variables
1. Copy `.env.example` to `.env.local` (or set them in your deployment environment).
2. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase Project Settings -> API.
3. If you want to run the app without Supabase for UI testing, set `VITE_ENABLE_MOCK_MODE=true`.

### 3. Creating the First Admin User
1. Go to **Authentication -> Users** in your Supabase dashboard.
2. Click **Add user -> Create new user** (or invite a user).
3. **Important**: By default, new users get the `editor` role via the database trigger. To make the first user an admin:
   - Go to the **Table Editor** -> `profiles` table.
   - Find the newly created user and change their `role` from `editor` to `admin`.

### 4. Running the App
```bash
npm install
npm run dev
```

## Deployment

The application is a standard Vite SPA (Single Page Application) and can be deployed to any static hosting provider like Vercel, Netlify, or Cloudflare Pages.

1. Set the build command to `npm run build`.
2. Set the output directory to `dist`.
3. Ensure you add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your deployment environment variables.
4. **Do not** set `VITE_ENABLE_MOCK_MODE=true` in production.

## V2 Roadmap Ideas

- Multiple display profiles (e.g., lobby vs. staff room)
- Direct image uploads to Supabase Storage for Highlights
- Calendar sync (iCal/Google Calendar integration)
- Remote scheduling (start/end dates) for all content types (currently only on Announcements)
- Playlist mode for specific screen zones
- Weather widget integration
