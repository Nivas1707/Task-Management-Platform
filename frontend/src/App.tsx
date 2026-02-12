import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PrivateRoute } from './components/layout/PrivateRoute';

import { DashboardPage } from './pages/dashboard/DashboardPage';
import { TasksPage } from './pages/tasks/TasksPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ThemeProvider } from './context/ThemeContext';

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
