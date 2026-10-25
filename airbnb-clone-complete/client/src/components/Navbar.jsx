import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Globe, Heart, House, Menu, UserRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    toast.success('You have logged out.');
    navigate('/');
  }
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="site-header content-wrap">
        <Link to="/" className="brand" aria-label="Staybnb home"><span className="brand-mark">⌂</span><span>staybnb</span></Link>
        <nav className="header-tabs" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'header-tab active' : 'header-tab'}><House size={18} className="md:hidden"/><span>Homes</span></NavLink>
          <button className="header-tab muted-tab" onClick={() => { toast('Experiences are coming in a future version.'); }}>Experiences</button>
      </nav>
        <div className="header-actions">
          <Link to={user ? '/listing/new' : '/login?host=1'} className="host-link">Airbnb your home</Link>
          <button className="icon-circle hidden sm:flex" aria-label="Language"><Globe size={17}/></button>
          <div className="relative">
            <button className="profile-pill" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Open profile menu">
              {menuOpen ? <X size={17}/> : <Menu size={19}/>}<span className="avatar-dot"><UserRound size={17}/></span>
            </button>
            {menuOpen && <div className="profile-menu">
              {user ? <>
                <div className="border-b border-gray-100 px-4 py-3"><p className="font-semibold">{user.name}</p><p className="text-sm text-muted">{user.email}</p></div>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link to="/dashboard?tab=wishlist" onClick={() => setMenuOpen(false)}><Heart size={16}/> Wishlist</Link>
                <Link to="/listing/new" onClick={() => setMenuOpen(false)}>List your place</Link>
                <button onClick={handleLogout}>Log out</button>
              </> : <>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="font-semibold">Sign up</Link>
                <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
              </>}
            </div>}
          </div>
        </div>
      </div>
    </header>
  );
}
