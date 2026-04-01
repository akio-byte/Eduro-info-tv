/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const Login = lazy(() => import('./pages/admin/Login').then((module) => ({ default: module.Login })));
const Dashboard = lazy(() => import('./pages/admin/Dashboard').then((module) => ({ default: module.Dashboard })));
const Announcements = lazy(() => import('./pages/admin/Announcements').then((module) => ({ default: module.Announcements })));
const Events = lazy(() => import('./pages/admin/Events').then((module) => ({ default: module.Events })));
const Highlights = lazy(() => import('./pages/admin/Highlights').then((module) => ({ default: module.Highlights })));
const QrLinks = lazy(() => import('./pages/admin/QrLinks').then((module) => ({ default: module.QrLinks })));
const Settings = lazy(() => import('./pages/admin/Settings').then((module) => ({ default: module.Settings })));
const Preview = lazy(() => import('./pages/admin/Preview').then((module) => ({ default: module.Preview })));
const Display = lazy(() => import('./pages/display/Display').then((module) => ({ default: module.Display })));

function AdminOnlyRoute({ children }: { children: ReactElement }) {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-slate-500">Ladataan...</div>;
  }

  if (role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">Ladataan...</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/display" replace />} />
            <Route path="/display" element={<Display />} />

            <Route path="/admin/login" element={<Login />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="events" element={<Events />} />
              <Route path="highlights" element={<Highlights />} />
              <Route path="qr-links" element={<QrLinks />} />
              <Route path="settings" element={<AdminOnlyRoute><Settings /></AdminOnlyRoute>} />
              <Route path="preview" element={<Preview />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
