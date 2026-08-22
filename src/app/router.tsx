import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/shell/AppShell'
import { LoadingState } from '@/components/ui/States'
import { NotFound } from '@/routes/NotFound'

/**
 * Route-level code splitting.
 *
 * The landing page is the entry point for first-time visitors and must not
 * carry the weight of the application screens, so every authenticated route is
 * loaded on demand.
 */
const LandingPage = lazy(() =>
  import('@/routes/LandingPage').then((m) => ({ default: m.LandingPage })),
)
const DashboardPage = lazy(() =>
  import('@/routes/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const AgentsPage = lazy(() =>
  import('@/routes/AgentsPage').then((m) => ({ default: m.AgentsPage })),
)
const RunsPage = lazy(() =>
  import('@/routes/RunsPage').then((m) => ({ default: m.RunsPage })),
)
const TracePage = lazy(() =>
  import('@/routes/TracePage').then((m) => ({ default: m.TracePage })),
)
const SimulatorPage = lazy(() =>
  import('@/routes/SimulatorPage').then((m) => ({ default: m.SimulatorPage })),
)
const EvaluationsPage = lazy(() =>
  import('@/routes/EvaluationsPage').then((m) => ({
    default: m.EvaluationsPage,
  })),
)
const ExperimentsPage = lazy(() =>
  import('@/routes/ExperimentsPage').then((m) => ({
    default: m.ExperimentsPage,
  })),
)
const ApprovalsPage = lazy(() =>
  import('@/routes/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })),
)
const PoliciesPage = lazy(() =>
  import('@/routes/PoliciesPage').then((m) => ({ default: m.PoliciesPage })),
)
const IncidentsPage = lazy(() =>
  import('@/routes/IncidentsPage').then((m) => ({ default: m.IncidentsPage })),
)
const AnalyticsPage = lazy(() =>
  import('@/routes/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
)
const SettingsPage = lazy(() =>
  import('@/routes/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)

function RouteFallback() {
  return (
    <div className="page">
      <LoadingState label="Loading section" rows={5} />
    </div>
  )
}

function lazyRoute(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

// Vite's BASE_URL is '/' locally and '/zevqora/' in the GitHub Pages build
// (see vite.config.ts). React Router's basename wants no trailing slash
// (except the root case, where '/' is the correct value), so normalize it
// once here rather than hard-coding the deployment path into the router.
const baseUrl = import.meta.env.BASE_URL
const basename = baseUrl.length > 1 ? baseUrl.replace(/\/$/, '') : baseUrl

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: lazyRoute(<LandingPage />),
    },
    {
      element: <AppShell />,
      children: [
        { path: '/dashboard', element: lazyRoute(<DashboardPage />) },
        { path: '/agents', element: lazyRoute(<AgentsPage />) },
        { path: '/runs', element: lazyRoute(<RunsPage />) },
        { path: '/runs/:runId', element: lazyRoute(<TracePage />) },
        { path: '/simulator', element: lazyRoute(<SimulatorPage />) },
        { path: '/evaluations', element: lazyRoute(<EvaluationsPage />) },
        { path: '/experiments', element: lazyRoute(<ExperimentsPage />) },
        { path: '/approvals', element: lazyRoute(<ApprovalsPage />) },
        { path: '/policies', element: lazyRoute(<PoliciesPage />) },
        { path: '/incidents', element: lazyRoute(<IncidentsPage />) },
        { path: '/analytics', element: lazyRoute(<AnalyticsPage />) },
        { path: '/settings', element: lazyRoute(<SettingsPage />) },

        // Legacy/alias paths.
        { path: '/overview', element: <Navigate to="/dashboard" replace /> },

        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename },
)
