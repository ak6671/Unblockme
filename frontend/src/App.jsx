import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/ui/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import RegisterVehicle from './pages/RegisterVehicle';
import PublicVehicleView from './pages/PublicVehicleView';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import ModeratorDashboard from './pages/ModeratorDashboard';
import AdminSignupApartment from './pages/AdminSignupApartment';
import AdminSignupFleet from './pages/AdminSignupFleet';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="auth" element={<Login />} />
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="dashboard/register" element={<RegisterVehicle />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin/signup/apartment" element={<AdminSignupApartment />} />
          <Route path="admin/signup/fleet" element={<AdminSignupFleet />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="moderator/dashboard" element={<ModeratorDashboard />} />
          <Route path="v/:id" element={<PublicVehicleView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
