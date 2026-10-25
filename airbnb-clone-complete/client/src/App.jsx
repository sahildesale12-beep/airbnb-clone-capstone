import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PropertyDetails from './pages/PropertyDetails';
import ListingForm from './pages/ListingForm';
import Dashboard from './pages/Dashboard';
import BookingConfirmation from './pages/BookingConfirmation';
import NotFound from './pages/NotFound';
import { Toaster } from 'react-hot-toast';

function GoogleSuccess() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { refreshUser().then((user) => navigate(user ? '/' : '/login?error=google_auth_failed', { replace: true })); }, [refreshUser, navigate]);
  return <main className="content-wrap py-16 text-center"><p>Finishing Google sign in…</p></main>;
}

function AppShell() {
  return <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/google/success" element={<GoogleSuccess />} />
      <Route path="/properties/:id" element={<PropertyDetails />} />
      <Route path="/listing/new" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
      <Route path="/listing/:id/edit" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/booking-confirmation/:id" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
      <Route path="/checkout-cancelled/:id" element={<ProtectedRoute><BookingConfirmation cancelled /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Toaster position="top-center" toastOptions={{ duration: 3500, style: { borderRadius: '14px', padding: '12px 16px' } }} />
  </>;
}

export default function App() {
  return <Provider store={store}><BrowserRouter><AuthProvider><AppShell /></AuthProvider></BrowserRouter></Provider>;
}
