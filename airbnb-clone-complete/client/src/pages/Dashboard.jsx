import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarDays, Heart, House, LoaderCircle, Pencil, Plus, Trash2, UserRound, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { fetchMyBookings } from '../store/bookingsSlice';
import PropertyCard from '../components/PropertyCard';
import Spinner from '../components/Spinner';
import { money, shortDate, imageFallback } from '../utils/format';

const tabs = [
  { key: 'listings', label: 'My listings', Icon: House },
  { key: 'bookings', label: 'My bookings', Icon: CalendarDays },
  { key: 'wishlist', label: 'Wishlist', Icon: Heart },
  { key: 'profile', label: 'Profile', Icon: UserRound },
];

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'bookings');
  const [listings, setListings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [hostBookings, setHostBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const dispatch = useDispatch();
  const { items: bookings, loading: bookingsLoading } = useSelector((state) => state.bookings);

  const refreshListings = useCallback(async () => {
    const { data } = await api.get('/properties/host/mine');
    setListings(data.data || []);
  }, []);
  const refreshWishlist = useCallback(async () => {
    const { data } = await api.get('/wishlist');
    setWishlist(data.data || []);
  }, []);
  const refreshHostBookings = useCallback(async () => {
    const { data } = await api.get('/bookings/host');
    setHostBookings(data.data || []);
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.some((entry) => entry.key === tab) || tab === 'hosting') setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const tasks = [dispatch(fetchMyBookings()).unwrap().catch(() => {})];
    if (user?.role === 'host' || user?.role === 'admin') {
      tasks.push(refreshListings().catch(() => {}), refreshHostBookings().catch(() => {}));
    }
    tasks.push(refreshWishlist().catch(() => {}));
    Promise.all(tasks).finally(() => setLoading(false));
  }, [dispatch, refreshListings, refreshWishlist, refreshHostBookings, user?.role]);

  function selectTab(tab) { setActiveTab(tab); setSearchParams(tab === 'bookings' ? {} : { tab }); }
  async function deleteListing(id) {
    if (!window.confirm('Delete this listing? This action cannot be undone.')) return;
    try { await api.delete(`/properties/${id}`); setListings((current) => current.filter((p) => p._id !== id)); toast.success('Listing deleted.'); }
    catch (error) { toast.error(getApiError(error)); }
  }
  async function cancelBooking(id) {
    if (!window.confirm('Cancel this booking? Paid bookings will be refunded when the configured payment provider supports it.')) return;
    try { await api.delete(`/bookings/${id}`); await dispatch(fetchMyBookings()).unwrap(); toast.success('Booking cancelled.'); }
    catch (error) { toast.error(getApiError(error)); }
  }
  async function becomeHost() {
    try { await api.post('/auth/become-host'); await refreshUser(); toast.success('Your host tools are ready.'); }
    catch (error) { toast.error(getApiError(error)); }
  }
  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await api.patch('/auth/profile', { name: profileName, avatar: profileAvatar });
      await refreshUser(); setProfileEditing(false); toast.success('Profile updated.');
    } catch (error) { toast.error(getApiError(error)); }
    finally { setSavingProfile(false); }
  }
  async function continuePayment(bookingId) {
    try {
      const { data } = await api.post('/payment/create-checkout-session', { bookingId });
      if (data.url) window.location.assign(data.url);
      else toast.error('Could not create checkout session.');
    } catch (error) { toast.error(getApiError(error)); }
  }
  async function removeWishlist(id) {
    try { await api.post(`/wishlist/${id}`); setWishlist((current) => current.filter((p) => p._id !== id)); toast.success('Removed from wishlist.'); }
    catch (error) { toast.error(getApiError(error)); }
  }

  if (loading && !user) return <main className="content-wrap"><Spinner/></main>;

  return <main className="content-wrap dashboard-page"><div className="dashboard-header"><div><span className="eyebrow">YOUR STAYBNB</span><h1>Welcome, {user?.name?.split(' ')[0] || 'traveller'}</h1><p>Manage your stays, saved places and hosting activity.</p></div><Link to="/listing/new" className="primary-button inline-flex"><Plus size={18}/> List your place</Link></div>
    <div className="dashboard-layout"><aside className="dashboard-sidebar">{tabs.map(({ key, label, Icon }) => <button key={key} onClick={() => selectTab(key)} className={`dashboard-tab ${activeTab === key ? 'selected' : ''}`}><Icon size={19}/>{label}</button>)}{(user?.role === 'host' || user?.role === 'admin') && <button onClick={() => selectTab('hosting')} className={`dashboard-tab ${activeTab === 'hosting' ? 'selected' : ''}`}><Wallet size={19}/> Hosting activity</button>}<div className="sidebar-note"><strong>Hosting made simple</strong><p>Share your space and keep your calendar organized.</p><Link to="/listing/new">Create a listing →</Link></div></aside>
      <section className="dashboard-content">
        {activeTab === 'listings' && <><div className="dashboard-section-heading"><div><h2>My listings</h2><p>Your published and draft stays.</p></div><Link to="/listing/new" className="outline-button"><Plus size={16}/> Add listing</Link></div>{loading && !listings.length ? <Spinner/> : listings.length ? <div className="dashboard-listing-grid">{listings.map((property) => <article className="manage-listing-card" key={property._id}><Link to={`/properties/${property._id}`}><img src={property.images?.[0] || imageFallback} alt={property.title} onError={(e) => { e.currentTarget.src = imageFallback; }}/></Link><div className="manage-listing-body"><h3>{property.title}</h3><p>{property.location.city}, {property.location.state}</p><strong>{money(property.price)} <span>/ night</span></strong><div className="manage-listing-actions"><Link className="outline-button small" to={`/listing/${property._id}/edit`}><Pencil size={14}/> Edit</Link><button className="outline-button small danger-outline" onClick={() => deleteListing(property._id)}><Trash2 size={14}/> Delete</button></div></div></article>)}</div> : <div className="empty-state compact"><House size={36}/><h2>No listings yet</h2><p>Start hosting and welcome your first guest.</p><Link className="primary-button inline-flex" to="/listing/new">Create a listing</Link></div>}</>}

        {activeTab === 'bookings' && <><div className="dashboard-section-heading"><div><h2>My bookings</h2><p>Manage your upcoming and previous stays.</p></div></div>{bookingsLoading ? <Spinner/> : bookings.length ? <div className="booking-list">{bookings.map((booking) => <article className="booking-row" key={booking._id}><img src={booking.property?.images?.[0] || imageFallback} alt={booking.property?.title || 'Stay'} onError={(e) => { e.currentTarget.src = imageFallback; }}/><div className="booking-row-main"><h3>{booking.property?.title || 'Property booking'}</h3><p>{booking.property?.location?.city || ''}, {booking.property?.location?.state || ''}</p><p>{shortDate(booking.checkIn)} — {shortDate(booking.checkOut)} · {booking.guests} guest{booking.guests > 1 ? 's' : ''}</p><span className={`status-pill status-${booking.status}`}>{booking.status}</span> <span className={`status-pill status-${booking.paymentStatus}`}>{booking.paymentStatus}</span></div><div className="booking-row-end"><strong>{money(booking.totalPrice)}</strong>{booking.status === 'pending' && <button className="outline-button small" onClick={() => continuePayment(booking._id)}>Complete payment</button>}{booking.status !== 'cancelled' && <button className="text-button danger-text" onClick={() => cancelBooking(booking._id)}>Cancel</button>}</div></article>)}</div> : <div className="empty-state compact"><CalendarDays size={36}/><h2>No bookings yet</h2><p>Your next memorable stay is waiting.</p><Link className="primary-button inline-flex" to="/">Explore stays</Link></div>}</>}

        {activeTab === 'wishlist' && <><div className="dashboard-section-heading"><div><h2>Wishlist</h2><p>Places you saved for later.</p></div></div>{wishlist.length ? <div className="property-grid dashboard-wishlist">{wishlist.map((property) => <div key={property._id} className="wishlist-wrap"><PropertyCard property={property} onWishlistChange={refreshWishlist}/><button className="text-button danger-text wishlist-remove" onClick={() => removeWishlist(property._id)}>Remove from wishlist</button></div>)}</div> : <div className="empty-state compact"><Heart size={36}/><h2>Your wishlist is waiting</h2><p>Tap the heart on any stay to save it here.</p><Link className="primary-button inline-flex" to="/">Discover stays</Link></div>}</>}

        {activeTab === 'profile' && <><div className="dashboard-section-heading"><div><h2>Profile</h2><p>Your Staybnb account details.</p></div><button className="outline-button" onClick={() => { setProfileName(user?.name || ''); setProfileAvatar(user?.avatar || ''); setProfileEditing((value) => !value); }}>{profileEditing ? 'Cancel edit' : 'Edit profile'}</button></div><div className="profile-panel"><div className="profile-big-avatar">{user?.name?.slice(0,1) || 'S'}</div>{profileEditing ? <form className="profile-edit-form" onSubmit={saveProfile}><label>Full name<input value={profileName} onChange={(e) => setProfileName(e.target.value)} minLength={2} maxLength={80} required /></label><label>Avatar image URL (optional)<input type="url" value={profileAvatar} onChange={(e) => setProfileAvatar(e.target.value)} placeholder="https://..." /></label><button className="primary-button mt-2" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save profile'}</button></form> : <div className="profile-fields"><div><span>Full name</span><strong>{user?.name}</strong></div><div><span>Email address</span><strong>{user?.email}</strong></div><div><span>Account type</span><strong>{user?.role?.toUpperCase()}</strong></div><div><span>Member since</span><strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Staybnb member'}</strong></div></div>}{user?.role === 'guest' && <button className="primary-button mt-5" onClick={becomeHost}>Become a host</button>}</div></>}

        {activeTab === 'hosting' && <><div className="dashboard-section-heading"><div><h2>Hosting activity</h2><p>Guests who have reserved your listings.</p></div></div>{hostBookings.length ? <div className="booking-list">{hostBookings.map((booking) => <article className="booking-row" key={booking._id}><img src={booking.property?.images?.[0] || imageFallback} alt={booking.property?.title || 'Stay'} onError={(e) => { e.currentTarget.src = imageFallback; }}/><div className="booking-row-main"><h3>{booking.property?.title || 'Listing'}</h3><p>Guest: {booking.user?.name || 'Guest'} · {booking.user?.email || ''}</p><p>{shortDate(booking.checkIn)} — {shortDate(booking.checkOut)}</p><span className={`status-pill status-${booking.status}`}>{booking.status}</span></div><div className="booking-row-end"><strong>{money(booking.totalPrice)}</strong></div></article>)}</div> : <div className="empty-state compact"><Wallet size={36}/><h2>No hosting activity yet</h2><p>Your reservations will appear here when guests book your listings.</p></div>}</>}
      </section>
    </div>
  </main>;
}
