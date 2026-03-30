/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminLayout } from './components/admin/AdminLayout';
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Announcements } from './pages/admin/Announcements';
import { Events } from './pages/admin/Events';
import { Highlights } from './pages/admin/Highlights';
import { Jobs } from './pages/admin/Jobs';
import { QrLinks } from './pages/admin/QrLinks';
import { Settings } from './pages/admin/Settings';
import { Preview } from './pages/admin/Preview';
import { Display } from './pages/display/Display';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/display" replace />} />
          <Route path="/display" element={<Display />} />
          
          <Route path="/admin/login" element={<Login />} />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="events" element={<Events />} />
            <Route path="highlights" element={<Highlights />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="qr-links" element={<QrLinks />} />
            <Route path="settings" element={<Settings />} />
            <Route path="preview" element={<Preview />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

