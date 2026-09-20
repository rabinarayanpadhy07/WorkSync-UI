import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/components/molecules/ProtectedRoute/ProtectedRoute';
import { SuperAdminRoute } from '@/components/molecules/SuperAdminRoute/SuperAdminRoute';
import { useDocumentMetadata } from '@/hooks/useDocumentMetadata';

const lazyNamed = (loader, exportName) =>
  lazy(() => loader().then((module) => ({ default: module[exportName] })));

const SigninContainer = lazyNamed(
  () => import('@/components/organisms/Auth/SigninContainer'),
  'SigninContainer'
);
const SignupContainer = lazyNamed(
  () => import('@/components/organisms/Auth/SignupContainer'),
  'SignupContainer'
);
const AdminDashboard = lazyNamed(
  () => import('@/pages/Admin/AdminDashboard'),
  'AdminDashboard'
);
const Auth = lazyNamed(() => import('@/pages/Auth/Auth'), 'Auth');
const GoogleAuthSuccess = lazyNamed(
  () => import('@/pages/Auth/GoogleAuthSuccess'),
  'GoogleAuthSuccess'
);
const ResetPasswordPage = lazyNamed(
  () => import('@/pages/Auth/ResetPasswordPage'),
  'ResetPasswordPage'
);
const Home = lazyNamed(() => import('@/pages/Home/Home'), 'Home');
const LandingPage = lazyNamed(() => import('@/pages/Landing/LandingPage'), 'LandingPage');
const Notfound = lazyNamed(() => import('@/pages/Notfound/Notfound'), 'Notfound');
const Payments = lazyNamed(() => import('@/pages/Payments/Payments'), 'Payments');
const CreateWorkspacePage = lazyNamed(
  () => import('@/pages/CreateWorkspace/CreateWorkspacePage'),
  'CreateWorkspacePage'
);
const Channel = lazyNamed(
  () => import('./pages/Workspace/Channel/Channel'),
  'Channel'
);
const DirectMessage = lazyNamed(
  () => import('./pages/Workspace/DirectMessage/DirectMessage'),
  'DirectMessage'
);
const Drafts = lazyNamed(
  () => import('./pages/Workspace/Drafts/Drafts'),
  'Drafts'
);
const Threads = lazyNamed(
  () => import('./pages/Workspace/Threads/Threads'),
  'Threads'
);
const JoinPage = lazyNamed(
  () => import('./pages/Workspace/JoinPage'),
  'JoinPage'
);
const WorkspaceLayout = lazyNamed(
  () => import('./pages/Workspace/Layout'),
  'WorkspaceLayout'
);
const WorkspaceRedirect = lazyNamed(
  () => import('./pages/Workspace/WorkspaceRedirect'),
  'WorkspaceRedirect'
);

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
    Loading WorkSync...
  </div>
);

export const AppRoutes = () => {
    useDocumentMetadata();

    return (
        <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/workspaces/create" element={<ProtectedRoute><CreateWorkspacePage /></ProtectedRoute>} />
              <Route path="/auth/signup" element={<Auth><SignupContainer /></Auth>} />
              <Route path="/auth/signin" element={<Auth><SigninContainer /></Auth>} />
              <Route path="/auth/reset-password" element={<Auth><ResetPasswordPage /></Auth>} />
              <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
              <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><SuperAdminRoute><AdminDashboard /></SuperAdminRoute></ProtectedRoute>} />
              <Route path="/workspaces/:workspaceId" element={<ProtectedRoute><WorkspaceLayout><WorkspaceRedirect /></WorkspaceLayout></ProtectedRoute>} />
              <Route
                path="/workspaces/:workspaceId/channels/:channelId"
                element={<ProtectedRoute><WorkspaceLayout><Channel /></WorkspaceLayout></ProtectedRoute>}
              />
              <Route
                path="/workspaces/:workspaceId/threads"
                element={<ProtectedRoute><WorkspaceLayout><Threads /></WorkspaceLayout></ProtectedRoute>}
              />
              <Route
                path="/workspaces/:workspaceId/drafts"
                element={<ProtectedRoute><WorkspaceLayout><Drafts /></WorkspaceLayout></ProtectedRoute>}
              />
              <Route
                path="/workspaces/:workspaceId/members/:memberId"
                element={<ProtectedRoute><WorkspaceLayout><DirectMessage /></WorkspaceLayout></ProtectedRoute>}
              />
              <Route path="/makepayment" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/workspaces/join" element={<ProtectedRoute><JoinPage /></ProtectedRoute>} />
              <Route path="/workspaces/join/:workspaceId" element={<ProtectedRoute><JoinPage /></ProtectedRoute>} />
              <Route path="/*" element={<Notfound />} />
            </Routes>
        </Suspense>
    );
};
