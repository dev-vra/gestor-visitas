import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Vistorias from "./pages/Vistorias";
import Users from "./pages/Users";
import ForcePasswordChange from "./pages/ForcePasswordChange";
import Profile from "./pages/Profile";

import Layout from "./components/Layout";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="vistorias" element={<Vistorias />} />
            <Route path="users" element={<Users />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route
            path="/force-password-change"
            element={
              <ProtectedRoute>
                <ForcePasswordChange />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-password"
            element={
              <ProtectedRoute>
                <ForcePasswordChange />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
