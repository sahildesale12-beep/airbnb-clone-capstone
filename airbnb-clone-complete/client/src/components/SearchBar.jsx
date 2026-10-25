import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { Search } from 'lucide-react';

export default function SearchBar({ onSearch, initial = {} }) {
  const [destination, setDestination] = useState(initial.search || '');
  const [checkIn, setCheckIn] = useState(initial.checkIn ? new Date(`${initial.checkIn}T00:00:00`) : null);
  const [checkOut, setCheckOut] = useState(initial.checkOut ? new Date(`${initial.checkOut}T00:00:00`) : null);
  const [guests, setGuests] = useState(Number(initial.guests) || 1);
  useEffect(() => { setDestination(initial.search || ''); }, [initial.search]);
  useEffect(() => { setCheckIn(initial.checkIn ? new Date(`${initial.checkIn}T00:00:00`) : null); }, [initial.checkIn]);
  useEffect(() => { setCheckOut(initial.checkOut ? new Date(`${initial.checkOut}T00:00:00`) : null); }, [initial.checkOut]);
  useEffect(() => { setGuests(Number(initial.guests) || 1); }, [initial.guests]);
  const dateValue = (date) => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
  function submit(event) {
    event?.preventDefault();
    onSearch({ search: destination.trim(), checkIn: dateValue(checkIn), checkOut: dateValue(checkOut), guests });
  }
  return <form className="search-shell" onSubmit={submit}>
    <div className="search-section destination-section"><label htmlFor="destination">Where</label><input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Search destinations" /></div>
    <div className="search-section date-section"><label>Check in</label><DatePicker selected={checkIn} onChange={(date) => { setCheckIn(date); if (checkOut && date && checkOut <= date) setCheckOut(null); }} minDate={new Date()} placeholderText="Add dates" dateFormat="d MMM" className="date-input" /></div>
    <div className="search-section date-section"><label>Check out</label><DatePicker selected={checkOut} onChange={setCheckOut} minDate={checkIn || new Date()} placeholderText="Add dates" dateFormat="d MMM" className="date-input" /></div>
    <div className="search-section guest-section"><label htmlFor="guests">Who</label><select id="guests" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}</select></div>
    <div className="search-submit-wrap"><button className="search-submit" type="submit" aria-label="Search stays"><Search size={21}/></button></div>
  </form>;
}
