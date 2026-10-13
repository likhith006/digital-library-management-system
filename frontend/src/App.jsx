import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import MainLayout from './layouts/MainLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BooksPage from './pages/BooksPage';
import BookDetailsPage from './pages/BookDetailsPage';
import MyBooksPage from './pages/MyBooksPage';
import DigitalLibraryPage from './pages/DigitalLibraryPage';
import ReservationsPage from './pages/ReservationsPage';
import FinesPage from './pages/FinesPage';
import IssueReturnPage from './pages/IssueReturnPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected System Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/books/:id" element={<BookDetailsPage />} />
            <Route path="/my-books" element={<MyBooksPage />} />
            <Route path="/digital-library" element={<DigitalLibraryPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/fines" element={<FinesPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin / Librarian Only Routes */}
            <Route element={<RoleBasedRoute allowedRoles={['ADMIN', 'LIBRARIAN']} />}>
              <Route path="/issue-book" element={<IssueReturnPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
