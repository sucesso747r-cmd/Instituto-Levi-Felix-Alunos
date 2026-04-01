import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import ExamStatus from './pages/ExamStatus';
import ExamRegistration from './pages/ExamRegistration';
import SenseiDashboard from './pages/SenseiDashboard';
import Admin from './pages/Admin';
import Registrations from './pages/Registrations';
import Students from './pages/Students';
import ExamInactive from './pages/ExamInactive';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/home">
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </Route>
        <Route path="/exam-status">
          <ProtectedRoute>
            <ExamStatus />
          </ProtectedRoute>
        </Route>
        <Route path="/exam-registration">
          <ProtectedRoute>
            <ExamRegistration />
          </ProtectedRoute>
        </Route>
        <Route path="/sensei-dashboard">
          <ProtectedRoute requireSensei>
            <SenseiDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/admin-home" component={Admin} />
        <Route path="/admin/registrations" component={Registrations} />
        <Route path="/admin/students" component={Students} />
        <Route path="/exam-inactive">
          <ProtectedRoute>
            <ExamInactive />
          </ProtectedRoute>
        </Route>
        <Route path="/terms" component={TermsOfUse} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/reset-password" component={ResetPassword} />

        {/* Fallback to login */}
        <Route>
          <Login />
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}
