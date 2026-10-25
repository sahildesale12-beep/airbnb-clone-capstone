import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Map, MapPin, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { fetchProperties } from '../store/listingsSlice';
import SearchBar from '../components/SearchBar';
import CategoryBar from '../components/CategoryBar';
import PropertyCard from '../components/PropertyCard';
import PropertyMap from '../components/PropertyMap';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

function countNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const nights = Math.round((new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime()) / 86400000);
  return Math.max(1, nights);
}

export default function Home() {
  const dispatch = useDispatch();
  const { items, loading, error, pagination } = useSelector((state) => state.listings);
  const [filters, setFilters] = useState({ search: '', checkIn: '', checkOut: '', guests: 1, minPrice: '', maxPrice: '', propertyType: '', category: '' });
  const [includeTotal, setIncludeTotal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [mapMode, setMapMode] = useState(false);

  const query = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([key, value]) => value !== '' && value !== undefined && value !== null)), [filters]);
  useEffect(() => { dispatch(fetchProperties(query)); }, [dispatch, query]);

  function applySearch(values) { setFilters((old) => ({ ...old, ...values })); }
  function updateFilter(key, value) { setFilters((old) => ({ ...old, [key]: value })); }
  function clearFilters() { setFilters({ search: '', checkIn: '', checkOut: '', guests: 1, minPrice: '', maxPrice: '', propertyType: '', category: '' }); toast.success('Filters cleared'); }

  return <main className="content-wrap home-page">
    <section className="search-zone"><SearchBar initial={filters} onSearch={applySearch}/></section>
    <CategoryBar selected={filters.category} onSelect={(category) => updateFilter('category', category)} onFilters={() => setShowFilters((v) => !v)} includeTotal={includeTotal} onIncludeTotal={setIncludeTotal}/>
    {showFilters && <section className="filter-panel">
      <div className="filter-panel-head"><div><SlidersHorizontal size={19}/><strong>Filters</strong></div><button className="icon-button" onClick={() => setShowFilters(false)} aria-label="Close filters"><X size={20}/></button></div>
      <div className="filter-grid">
        <label>Minimum price (₹)<input type="number" min="0" placeholder="No minimum" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)}/></label>
        <label>Maximum price (₹)<input type="number" min="0" placeholder="No maximum" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)}/></label>
        <label>Property type<select value={filters.propertyType} onChange={(e) => updateFilter('propertyType', e.target.value)}><option value="">Any type</option><option value="home">Home</option><option value="apartment">Apartment</option><option value="guesthouse">Guesthouse</option><option value="hotel">Hotel</option><option value="villa">Villa</option><option value="cabin">Cabin</option></select></label>
        <label>Guests<select value={filters.guests || 1} onChange={(e) => updateFilter('guests', Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => i + 1).map((v) => <option key={v} value={v}>{v} {v === 1 ? 'guest' : 'guests'}</option>)}</select></label>
      </div>
      <div className="filter-actions"><button className="text-button" onClick={clearFilters}>Clear all</button><button className="primary-button" onClick={() => setShowFilters(false)}>Show {pagination?.totalResults ?? items.length} stays</button></div>
    </section>}

    {error && <div className="notice error-notice">{error}. Check that the backend is running at localhost:5000.</div>}
    <section className="results-section">
      <div className="results-heading"><div><h1>{filters.search ? `Stays in ${filters.search}` : 'Find your place in the world'}</h1><p>{loading ? 'Finding stays…' : `${pagination?.totalResults ?? items.length} stays to explore`}</p></div>{(filters.search || filters.category || filters.minPrice || filters.maxPrice || filters.propertyType) && <button className="text-button" onClick={clearFilters}>Clear filters</button>}</div>
      {loading && !items.length ? <Spinner label="Finding lovely places to stay..."/> : items.length ? <>
        {mapMode && <div className="home-map"><PropertyMap properties={items}/></div>}
        <div className="property-grid">{items.map((property) => <PropertyCard key={property._id} property={property} includeTotal={includeTotal} nights={countNights(filters.checkIn, filters.checkOut)}/>)}</div>
      </> : <div className="empty-state"><SearchX size={40}/><h2>No stays match these filters</h2><p>Try a different destination, dates, or price range.</p><button className="primary-button" onClick={clearFilters}>Clear filters</button></div>}
    </section>
    <button className="map-toggle-button" onClick={() => setMapMode((v) => !v)}>{mapMode ? <><MapPin size={17}/> Show list</> : <><Map size={17}/> Show map</>}</button>
    <footer className="site-footer"><span>© 2026 Staybnb · A capstone project</span><span>Privacy · Terms · Help</span></footer>
  </main>;
}
