import { Route, Switch } from 'wouter';
import Login from './pages/Login';
import Home from './pages/Home';
import ExamStatus from './pages/ExamStatus';
import ExamRegistration from './pages/ExamRegistration';
import SenseiDashboard from './pages/SenseiDashboard';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/home" component={Home} />
      <Route path="/exam-status" component={ExamStatus} />
      <Route path="/exam-registration" component={ExamRegistration} />
      <Route path="/sensei-dashboard" component={SenseiDashboard} />
      
      {/* Fallback to login */}
      <Route>
        <Login />
      </Route>
    </Switch>
  );
}
