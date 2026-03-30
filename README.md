# Eduro InfoTV

A digital signage / InfoTV system built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Public Display View (`/display`)**: A fullscreen, auto-rotating display optimized for large TV screens.
- **Admin Dashboard (`/admin`)**: A secure area for staff to manage content.
- **Content Types**: Announcements, Events, Highlights (image cards), and QR Links.
- **Customizable**: Change colors, rotation intervals, and toggle sections on/off.

## Architecture

- **Frontend**: React 19, React Router, Tailwind CSS, Framer Motion for transitions.
- **Backend**: Supabase (PostgreSQL + Auth).
- **Mock Mode**: If Supabase environment variables are missing, the app automatically falls back to a mock data provider so you can preview the UI immediately.

## Setup Instructions

1. **Create a Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project.
2. **Run the Schema**: Copy the contents of `supabase/schema.sql` and run it in the Supabase SQL Editor.
3. **Configure Environment Variables**:
   - Copy `.env.example` to `.env.local`
   - Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase Project Settings -> API.
4. **Create an Admin User**:
   - Go to Supabase Authentication -> Users and invite a user or sign up.
5. **Run the App**:
   - `npm install`
   - `npm run dev`

## V2 Roadmap Ideas

- Multiple display profiles (e.g., lobby vs. staff room)
- Direct image uploads to Supabase Storage
- Calendar sync (iCal/Google Calendar integration)
- Remote scheduling (start/end dates for all content)
- Playlist mode for specific screen zones
