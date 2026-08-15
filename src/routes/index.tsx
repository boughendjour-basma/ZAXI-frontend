import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { GuestRoute } from './GuestRoute';
import { CustomerRoute } from './CustomerRoute';
import { DriverRoute } from './DriverRoute';

// Layouts
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { DriverDashboardLayout } from '@/layouts/DriverDashboardLayout';

// Auth Pages (Guest)
const SplashPage = lazy(() => import('@/pages/SplashPage'));
const WelcomePage = lazy(() => import('@/pages/WelcomePage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const CreateAccountPage = lazy(() => import('@/pages/CreateAccountPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));

// Customer Pages
const CustomerHomePage = lazy(() => import('@/pages/customer/HomePage'));
const CustomerHistoryPage = lazy(() => import('@/pages/customer/HistoryPage'));
const CustomerNotificationsPage = lazy(() => import('@/pages/customer/NotificationsPage'));
const CustomerProfilePage = lazy(() => import('@/pages/customer/ProfilePage'));

// Driver Dashboard Pages
const DriverDashboardPage = lazy(() => import('@/pages/driver/DashboardPage'));
const DriverTodayRidesPage = lazy(() => import('@/pages/driver/TodayRidesPage'));
const DriverRideHistoryPage = lazy(() => import('@/pages/driver/RideHistoryPage'));
const DriverCustomersPage = lazy(() => import('@/pages/driver/CustomersPage'));
const DriverAnnouncementsPage = lazy(() => import('@/pages/driver/AnnouncementsPage'));
const DriverPricingPage = lazy(() => import('@/pages/driver/PricingPage'));
const DriverStatisticsPage = lazy(() => import('@/pages/driver/StatisticsPage'));
const DriverAuditLogsPage = lazy(() => import('@/pages/driver/AuditLogsPage'));
const DriverSettingsPage = lazy(() => import('@/pages/driver/SettingsPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Splash entry screen */}
        <Route path="/splash" element={<SplashPage />} />

        {/* Guest Routes (Unauthenticated flow) */}
        <Route element={<GuestRoute />}>
          <Route path="/welcome" element={<WelcomePage />} />
          {/* Unified login for all users — backend determines role */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create-account" element={<CreateAccountPage />} />
          {/* Password Recovery */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected Customer Routes */}
        <Route element={<CustomerRoute />}>
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<CustomerHomePage />} />
            <Route path="/history" element={<CustomerHistoryPage />} />
            <Route path="/notifications" element={<CustomerNotificationsPage />} />
            <Route path="/profile" element={<CustomerProfilePage />} />
          </Route>
        </Route>

        {/* Protected Driver Routes */}
        <Route element={<DriverRoute />}>
          <Route element={<DriverDashboardLayout />}>
            <Route path="/driver/dashboard" element={<DriverDashboardPage />} />
            <Route path="/driver/today" element={<DriverTodayRidesPage />} />
            <Route path="/driver/history" element={<DriverRideHistoryPage />} />
            <Route path="/driver/customers" element={<DriverCustomersPage />} />
            <Route path="/driver/announcements" element={<DriverAnnouncementsPage />} />
            <Route path="/driver/pricing" element={<DriverPricingPage />} />
            <Route path="/driver/statistics" element={<DriverStatisticsPage />} />
            <Route path="/driver/audit-logs" element={<DriverAuditLogsPage />} />
            <Route path="/driver/settings" element={<DriverSettingsPage />} />
          </Route>
        </Route>

        {/* Fallback to splash */}
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </Suspense>
  );
}

