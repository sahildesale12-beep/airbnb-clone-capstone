import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { Bath, BedDouble, CalendarDays, ChevronLeft, Heart, MapPin, ShieldCheck, Star, Users, Wifi, Utensils, Car, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { money, imageFallback } from '../utils/format';

const amenityIcons = { 'Wi-Fi': Wifi, Kitchen: Utensils, 'Free parking': Car };
const toDateKey = (date) => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
const nightsBetween = (a, b) => a && b ? Math.max(0, Math.round((new Date(toDateKey(b)) - new Date(toDateKey(a))) / 86400000)) : 0;

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/properties/${id}`).then(({ data }) => { if (active) setProperty(data.data); })
      .catch((error) => { toast.error(getApiError(error)); if (active) setProperty(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const nights = nightsBetween(checkIn, checkOut);
  const priceBreakdown = useMemo(() => {
    const subtotal = Number(property?.price || 0) * nights;
    return { subtotal, serviceFee: 0, taxes: 0, total: subtotal };
  }, [property, nights]);
  const photos = property?.images?.length ? property.images : [imageFallback];

  async function checkDates() {
    if (!checkIn || !checkOut || !nights) { toast.error('Choose a check-in and check-out date first.'); return; }
    setChecking(true); setAvailability(null);
    try {
      const { data } = await api.get('/bookings/check-availability', { params: { propertyId: id, checkIn: toDateKey(checkIn), checkOut: toDateKey(checkOut), guests } });
      setAvailability(data);
      if (data.available) toast.success('Those dates are available!'); else toast.error(data.reason || 'These dates are not available.');
    } catch (error) { toast.error(getApiError(error)); }
    finally { setChecking(false); }
  }

  async function reserve() {
    if (!user) { navigate('/login', { state: { from: { pathname: `/properties/${id}` } } }); return; }
    if (!checkIn || !checkOut || !nights) { toast.error('Select your dates first.'); return; }
    setReserving(true);
    try {
      const { data: bookingResponse } = await api.post('/bookings', { propertyId: id, checkIn: toDateKey(checkIn), checkOut: toDateKey(checkOut), guests });
      const booking = bookingResponse.data;
      const { data: payment } = await api.post('/payment/create-checkout-session', { bookingId: booking._id });
      if (payment.url) window.location.assign(payment.url);
      else toast.success('Booking hold created. Continue to payment from your dashboard.');
    } catch (error) { toast.error(getApiError(error)); }
    finally { setReserving(false); }
  }

  async function submitReview(event) {
    event.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post(`/properties/${id}/reviews`, { rating: Number(reviewRating), comment: reviewText });
      const { data } = await api.get(`/properties/${id}`);
      setProperty(data.data); setReviewText(''); setReviewRating(5); toast.success('Your review was submitted.');
    } catch (error) { toast.error(getApiError(error)); }
    finally { setSubmittingReview(false); }
  }

  if (loading) return <main className="content-wrap"><Spinner label="Loading this stay..."/></main>;
  if (!property) return <main className="content-wrap py-16 text-center"><h1 className="page-title">Stay not found</h1><Link className="primary-button inline-flex mt-5" to="/">Back to stays</Link></main>;

  const hostName = typeof property.host === 'object' ? property.host?.name : 'Your host';
  return <main className="content-wrap details-page">
    <Link to="/" className="back-link"><ChevronLeft size={18}/> Back to stays</Link>
    <div className="details-title-row"><div><h1>{property.title}</h1><div className="details-meta"><span><Star size={15} fill="currentColor"/> {Number(property.rating || 0).toFixed(1)} ({property.reviews?.length || 0} reviews)</span><span>·</span><span className="underlined-meta">{property.location.city}, {property.location.state}, {property.location.country}</span></div></div><button className="share-button" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); } catch { toast('Copy this page URL to share it.'); } }}><span>↗</span> Share</button></div>
    <div className="gallery-grid"><button className="gallery-main" onClick={() => setActiveImage((activeImage + 1) % photos.length)}><img src={photos[activeImage]} alt={property.title} onError={(e) => { e.currentTarget.src = imageFallback; }}/><span className="gallery-counter">{activeImage + 1} / {photos.length}</span></button>{photos.slice(1, 5).map((photo, index) => <button className="gallery-small" key={`${photo}-${index}`} onClick={() => setActiveImage(index + 1)}><img src={photo} alt={`${property.title} view ${index + 2}`} onError={(e) => { e.currentTarget.src = imageFallback; }}/></button>)}</div>
    <div className="details-layout"><section className="details-main">
      <div className="host-summary"><div><h2>Entire {property.propertyType || 'home'} hosted by {hostName}</h2><p>{property.maxGuests} guests · {property.bedrooms} bedrooms · {property.beds} beds · {property.baths} baths</p></div><div className="host-avatar">{hostName?.slice(0, 1) || 'H'}</div></div>
      <div className="info-list"><div><ShieldCheck size={22}/><div><strong>Great check-in experience</strong><p>Guests gave the arrival process a high rating in similar demo stays.</p></div></div><div><MapPin size={22}/><div><strong>Great location</strong><p>{property.location.city}, {property.location.state}</p></div></div><div><CalendarDays size={22}/><div><strong>Flexible planning</strong><p>Check availability for the dates that work for you.</p></div></div></div>
      <div className="section-divider"/><section className="description-section"><h2>About this place</h2><p>{property.description}</p></section>
      <div className="section-divider"/><section className="amenities-section"><h2>What this place offers</h2><div className="amenities-grid">{(property.amenities || []).map((amenity) => { const Icon = amenityIcons[amenity] || ShieldCheck; return <div key={amenity}><Icon size={20}/>{amenity}</div>; })}</div></section>
      <div className="section-divider"/><section className="map-section"><h2><MapPin size={22}/> Where you'll be</h2><p>{property.location.city}, {property.location.state}, India</p><div className="small-map"><iframe title="OpenStreetMap location" src={`https://www.openstreetmap.org/export/embed.html?bbox=${(property.location.lng || 78.65) - .05}%2C${(property.location.lat || 22.97) - .03}%2C${(property.location.lng || 78.65) + .05}%2C${(property.location.lat || 22.97) + .03}&layer=mapnik&marker=${property.location.lat || 22.97}%2C${property.location.lng || 78.65}`} loading="lazy"/></div></section>
      <div className="section-divider"/><section className="reviews-section"><h2><Star size={20} fill="currentColor"/> {Number(property.rating || 0).toFixed(1)} · {property.reviews?.length || 0} reviews</h2>{property.reviews?.length ? <div className="review-grid">{property.reviews.map((review) => <div className="review-card" key={review._id}><div className="review-person"><span className="host-avatar small">{review.user?.name?.slice(0,1) || 'G'}</span><div><strong>{review.user?.name || 'Guest'}</strong><p>{new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p></div></div><div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div><p>{review.comment}</p></div>)}</div> : <p className="muted-copy">Reviews will appear here when guests have completed a paid stay.</p>}
        {user && <form className="review-form" onSubmit={submitReview}><h3>Leave a review</h3><label>Rating<select value={reviewRating} onChange={(e) => setReviewRating(e.target.value)}>{[5,4,3,2,1].map((v) => <option value={v} key={v}>{v} stars</option>)}</select></label><label>Your review<textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} minLength={3} maxLength={1500} required placeholder="Share what future guests should know..."/></label><button className="outline-button" disabled={submittingReview}>{submittingReview ? 'Submitting...' : 'Submit review'}</button><p className="muted-copy text-sm">The API permits verified reviews only after a completed paid stay.</p></form>}
      </section>
    </section>
    <aside className="booking-card"><div className="booking-card-price"><strong>{money(property.price)}</strong> <span>night</span></div><div className="booking-card-rating"><Star size={13} fill="currentColor"/> {Number(property.rating || 0).toFixed(1)} · {property.reviews?.length || 0} reviews</div>
      <div className="booking-date-grid"><label>CHECK-IN<DatePicker selected={checkIn} onChange={(date) => { setCheckIn(date); setAvailability(null); if (checkOut && date && checkOut <= date) setCheckOut(null); }} minDate={new Date()} placeholderText="Add date" dateFormat="d MMM yyyy" className="booking-date-input" /></label><label>CHECKOUT<DatePicker selected={checkOut} onChange={(date) => { setCheckOut(date); setAvailability(null); }} minDate={checkIn || new Date()} placeholderText="Add date" dateFormat="d MMM yyyy" className="booking-date-input" /></label></div>
      <label className="guest-select-label">GUESTS<select value={guests} onChange={(e) => { setGuests(Number(e.target.value)); setAvailability(null); }}>{Array.from({ length: property.maxGuests }, (_, i) => i + 1).map((num) => <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>)}</select></label>
      <button className="primary-button full-button" disabled={reserving} onClick={reserve}>{reserving ? <><LoaderCircle size={17} className="animate-spin inline mr-2"/>Reserving...</> : 'Reserve'}</button>
      <p className="booking-small-note">You won't be charged yet.</p>
      <button className="availability-button" disabled={checking} onClick={checkDates}>{checking ? 'Checking dates...' : 'Check availability'}</button>
      {availability && <p className={availability.available ? 'availability-success' : 'availability-error'}>{availability.available ? `${availability.nights} night${availability.nights === 1 ? '' : 's'} available for your group.` : availability.reason || 'Not available for those dates.'}</p>}
      {nights > 0 && <div className="price-breakdown"><p><span>{money(property.price)} × {nights} night{nights > 1 ? 's' : ''}</span><span>{money(priceBreakdown.subtotal)}</span></p><p><span>Service fee</span><span>{money(priceBreakdown.serviceFee)}</span></p><p><span>Taxes</span><span>{money(priceBreakdown.taxes)}</span></p><div className="breakdown-total"><strong>Total before taxes</strong><strong>{money(priceBreakdown.total)}</strong></div></div>}
    </aside></div>
  </main>;
}
