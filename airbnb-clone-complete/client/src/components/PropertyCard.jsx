import { useState } from 'react';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { money, shortDate, imageFallback } from '../utils/format';

export default function PropertyCard({ property, includeTotal = false, nights = 1, onWishlistChange }) {
  const { user } = useAuth();
  const [imageIndex, setImageIndex] = useState(0);
  const [liked, setLiked] = useState(Boolean(user?.wishlist?.some((id) => String(id) === property._id)));
  const images = property.images?.length ? property.images : [imageFallback];
  const hostName = typeof property.host === 'object' ? property.host?.name : 'Local host';
  async function toggleLike(event) {
    event.preventDefault(); event.stopPropagation();
    if (!user) { toast('Log in to save a stay to your wishlist.'); return; }
    try {
      const { data } = await api.post(`/wishlist/${property._id}`);
      setLiked(data.isWishlisted);
      toast.success(data.isWishlisted ? 'Saved to wishlist' : 'Removed from wishlist');
      onWishlistChange?.();
    } catch (error) { toast.error(error.response?.data?.message || 'Could not update wishlist'); }
  }
  const price = includeTotal ? property.price * nights : property.price;
  return <article className="property-card">
    <div className="property-photo-wrap">
      <Link to={`/properties/${property._id}`} aria-label={`View ${property.title}`}><img className="property-photo" src={images[imageIndex]} alt={property.title} onError={(e) => { e.currentTarget.src = imageFallback; }} loading="lazy" /></Link>
      {property.rating >= 4.9 && <span className="favorite-badge">Guest favourite</span>}
      <button className={`heart-button ${liked ? 'hearted' : ''}`} onClick={toggleLike} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={22} fill={liked ? 'currentColor' : 'rgba(0,0,0,.3)'}/></button>
      {images.length > 1 && <><button className="image-arrow left" onClick={() => setImageIndex((imageIndex - 1 + images.length) % images.length)} aria-label="Previous image"><ChevronLeft size={18}/></button><button className="image-arrow right" onClick={() => setImageIndex((imageIndex + 1) % images.length)} aria-label="Next image"><ChevronRight size={18}/></button><div className="image-dots">{images.map((_, index) => <button key={index} onClick={() => setImageIndex(index)} className={imageIndex === index ? 'dot current' : 'dot'} aria-label={`Show image ${index + 1}`}/>)}</div></>}
    </div>
    <Link to={`/properties/${property._id}`} className="property-card-info">
      <div className="flex items-start justify-between gap-2"><h3>{property.location?.city}, {property.location?.country || 'India'}</h3><span className="rating"><Star size={13} fill="currentColor"/> {Number(property.rating || 0).toFixed(1)}</span></div>
      <p className="host-line">Hosted by {hostName}</p>
      <p className="date-line">Available dates vary</p>
      <p className="price-line"><strong>{money(price)}</strong> {includeTotal ? `total before taxes · ${nights} ${nights === 1 ? 'night' : 'nights'}` : 'night'}</p>
    </Link>
  </article>;
}
