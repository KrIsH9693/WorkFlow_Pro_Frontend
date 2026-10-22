import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AcceptInvitePage } from './pages/auth/AcceptInvitePage'; // <-- Added Import
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { WorkspacesPage } from './pages/workspaces/WorkspacesPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { KanbanBoardPage } from './pages/projects/KanbanBoardPage';
import { TeamPage } from './pages/team/TeamPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { AppThemeProvider } from './theme/ThemeModeContext';
import { useAuth } from './context/AuthContext';

// Root route handler: Agar logged in hai to dashboard, nahi to login screen
const RootRedirect = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AppThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Default Root Route */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} /> {/* <-- Added Public Route */}

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/workspaces" element={<WorkspacesPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/workspaces/:workspaceId/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId/kanban" element={<KanbanBoardPage />} />
              
              {/* Profile & Security Settings Route */}
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AppThemeProvider>
  );
}

export default App;