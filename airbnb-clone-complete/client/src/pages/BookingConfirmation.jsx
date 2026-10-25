import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BadgeCheck, CalendarCheck, CreditCard, Home, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { money } from '../utils/format';
import Spinner from '../components/Spinner';

export default function BookingConfirmation({ cancelled = false }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(Boolean(params.get('session_id')));
  const [confirmingDemo, setConfirmingDemo] = useState(false);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.get('session_id')) return;
    let alive = true;
    api.get('/payment/confirm-session', { params: { session_id: params.get('session_id') } })
      .then(({ data }) => { if (alive) { setBooking(data.data); toast.success('Payment confirmed!'); } })
      .catch((e) => { if (alive) setError(getApiError(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [params]);

  async function completeDemoPayment() {
    setConfirmingDemo(true);
    try {
      const { data } = await api.post('/payment/demo-confirm', { bookingId: id });
      setBooking(data.data); setError(''); toast.success('Demo payment completed. No money was charged.');
    } catch (e) { const message = getApiError(e); setError(message); toast.error(message); }
    finally { setConfirmingDemo(false); }
  }

  useEffect(() => {
    if (booking || loading || !id || !user) return;
    api.get('/bookings/my').then(({ data }) => setBooking((data.data || []).find((b) => b._id === id) || null)).catch(() => {});
  }, [booking, loading, id, user]);

  if (loading) return <main className="content-wrap"><Spinner label="Confirming your payment with Stripe..."/></main>;
  if (cancelled) return <main className="confirmation-page content-wrap"><div className="confirmation-card"><div className="confirmation-icon warning"><CreditCard size={35}/></div><h1>Checkout cancelled</h1><p>Your payment was not completed. Your date hold may expire; you can return to the stay and reserve again.</p><div className="confirmation-actions"><Link className="primary-button" to={booking?.property?._id ? `/properties/${booking.property._id}` : '/'}>Return to stays</Link><Link className="outline-button" to="/dashboard">View dashboard</Link></div></div></main>;

  const isDemo = params.get('demo') === '1';
  const paid = booking?.paymentStatus === 'paid' && booking?.status === 'confirmed';
  return <main className="confirmation-page content-wrap"><div className="confirmation-card"><div className={`confirmation-icon ${paid ? '' : 'warning'}`}>{paid ? <BadgeCheck size={38}/> : <CalendarCheck size={38}/>}</div><span className="eyebrow">BOOKING {paid ? 'CONFIRMED' : 'CHECKOUT'}</span><h1>{paid ? 'Your stay is confirmed!' : 'Finish your reservation'}</h1><p>{paid ? 'Everything is set. We hope you have a wonderful trip.' : isDemo ? 'You are using the local demonstration payment flow. This will not charge real money.' : 'Your dates are being held temporarily while you complete checkout.'}</p>
    {error && <div className="notice error-notice">{error}</div>}
    {booking && <div className="confirmation-summary"><div><span>Reservation reference</span><strong>{booking._id.slice(-8).toUpperCase()}</strong></div><div><span>Dates</span><strong>{new Date(booking.checkIn).toLocaleDateString('en-IN')} – {new Date(booking.checkOut).toLocaleDateString('en-IN')}</strong></div><div><span>Guests</span><strong>{booking.guests}</strong></div><div><span>Total</span><strong>{money(booking.totalPrice)}</strong></div></div>}
    {isDemo && !paid && <button className="primary-button full-button" onClick={completeDemoPayment} disabled={confirmingDemo}>{confirmingDemo ? <><LoaderCircle className="inline mr-2 animate-spin" size={17}/>Processing demo payment...</> : 'Complete demo payment (no real charge)'}</button>}
    {!user && <p className="muted-copy">Please <Link to="/login" className="inline-link">log in</Link> with the account used to make this reservation to confirm payment.</p>}
    <div className="confirmation-actions"><Link className="outline-button" to="/dashboard">View my bookings</Link><Link className="primary-button" to="/"><Home size={17}/> Explore more stays</Link></div>
  </div></main>;
}
