/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/admin/AdminLayout';
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Announcements } from './pages/admin/Announcements';
import { Events } from './pages/admin/Events';
import { Highlights } from './pages/admin/Highlights';
import { QrLinks } from './pages/admin/QrLinks';
import { Settings } from './pages/admin/Settings';
import { Display } from './pages/display/Display';

export default function App() {
  return (
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
          <Route path="qr-links" element={<QrLinks />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

