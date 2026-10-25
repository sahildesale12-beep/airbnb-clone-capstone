import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const schema = yup.object({
  title: yup.string().trim().min(8, 'Use at least 8 characters').max(120).required('Title is required'),
  description: yup.string().trim().min(20, 'Add at least 20 characters').max(6000).required('Description is required'),
  price: yup.number().typeError('Enter a nightly price').min(1, 'Price must be at least ₹1').max(10000000).required('Nightly price is required'),
  location: yup.object({ city: yup.string().trim().required('City is required'), state: yup.string().trim().required('State is required'), country: yup.string().trim().required('Country is required'), lat: yup.number().nullable().transform((v, original) => original === '' ? undefined : v).min(-90).max(90), lng: yup.number().nullable().transform((v, original) => original === '' ? undefined : v).min(-180).max(180) }),
  category: yup.string().required('Choose a category'),
  propertyType: yup.string().required('Choose a property type'),
  maxGuests: yup.number().typeError('Choose guest capacity').integer().min(1).max(50).required(),
  bedrooms: yup.number().typeError('Enter bedrooms').integer().min(0).max(50).required(),
  beds: yup.number().typeError('Enter beds').integer().min(1).max(100).required(),
  baths: yup.number().typeError('Enter bathrooms').min(0).max(50).required(),
});
const amenityOptions = ['Wi-Fi', 'Kitchen', 'Free parking', 'Air conditioning', 'Mountain view', 'Pool', 'Washer', 'Workspace', 'TV'];
const propertyTypes = ['home', 'apartment', 'guesthouse', 'hotel', 'unique-stay', 'villa', 'cabin'];
const categoryOptions = ['bed & breakfasts', 'icons', 'historical homes', 'trending', 'tropical', 'domes', 'barns', 'luxe', 'amazing pools'];
const initialValues = { title: '', description: '', price: 2500, location: { city: '', state: '', country: 'India', lat: '', lng: '' }, category: 'trending', propertyType: 'home', maxGuests: 2, bedrooms: 1, beds: 1, baths: 1 };

export default function ListingForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [pageLoading, setPageLoading] = useState(editing);
  const [working, setWorking] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: yupResolver(schema), defaultValues: initialValues });

  useEffect(() => {
    if (!editing) return;
    let alive = true;
    api.get(`/properties/${id}`).then(({ data }) => {
      if (!alive) return;
      const p = data.data;
      reset({ title: p.title, description: p.description, price: p.price, location: { city: p.location.city, state: p.location.state, country: p.location.country || 'India', lat: p.location.lat ?? '', lng: p.location.lng ?? '' }, category: p.category, propertyType: p.propertyType, maxGuests: p.maxGuests, bedrooms: p.bedrooms, beds: p.beds, baths: p.baths });
      setExistingImages(p.images || []); setAmenities(p.amenities || []);
    }).catch((error) => { toast.error(getApiError(error)); navigate('/dashboard'); }).finally(() => { if (alive) setPageLoading(false); });
    return () => { alive = false; };
  }, [editing, id, reset, navigate]);

  useEffect(() => { setValue('amenities', amenities); }, [amenities, setValue]);

  function changeFiles(event) {
    const selected = Array.from(event.target.files || []);
    const combined = [...files, ...selected].slice(0, 10);
    setFiles(combined);
    setPreviews(combined.map((file) => URL.createObjectURL(file)));
    event.target.value = '';
  }
  function removeExistingImage(url) { setExistingImages((current) => current.filter((image) => image !== url)); }
  function removeNewImage(index) {
    setFiles((current) => current.filter((_, i) => i !== index));
    setPreviews((current) => current.filter((_, i) => i !== index));
  }

  async function becomeHost() {
    try { await api.post('/auth/become-host'); await refreshUser(); toast.success('You are now ready to host!'); }
    catch (error) { toast.error(getApiError(error)); }
  }

  async function onSubmit(values) {
    if (!user) { navigate('/login'); return; }
    setWorking(true);
    try {
      let uploadedImages = [];
      if (files.length) {
        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));
        const { data } = await api.post('/uploads/images', formData);
        uploadedImages = data.data || [];
      }
      const location = { city: values.location.city, state: values.location.state, country: values.location.country || 'India' };
      if (values.location.lat !== '' && values.location.lat !== undefined && values.location.lat !== null) location.lat = Number(values.location.lat);
      if (values.location.lng !== '' && values.location.lng !== undefined && values.location.lng !== null) location.lng = Number(values.location.lng);
      const payload = { ...values, price: Number(values.price), location, maxGuests: Number(values.maxGuests), bedrooms: Number(values.bedrooms), beds: Number(values.beds), baths: Number(values.baths), amenities, images: [...existingImages, ...uploadedImages] };
      const response = editing ? await api.put(`/properties/${id}`, payload) : await api.post('/properties', payload);
      toast.success(editing ? 'Listing updated.' : 'Your listing is live!');
      navigate(`/properties/${response.data.data._id}`);
    } catch (error) { toast.error(getApiError(error)); }
    finally { setWorking(false); }
  }

  if (pageLoading) return <main className="content-wrap"><Spinner label="Loading listing..."/></main>;
  if (user?.role !== 'host' && user?.role !== 'admin') return <main className="content-wrap host-gate"><div className="auth-icon"><ImagePlus size={26}/></div><h1>Become a host</h1><p>Share your place with guests and manage your listing from one dashboard.</p><button className="primary-button" onClick={becomeHost}>Continue as a host</button><Link className="back-link mt-5" to="/dashboard"><ArrowLeft size={17}/> Back to dashboard</Link></main>;

  return <main className="content-wrap listing-form-page"><Link className="back-link" to="/dashboard"><ArrowLeft size={17}/> Back to dashboard</Link><div className="form-page-heading"><span className="eyebrow">HOST YOUR PLACE</span><h1>{editing ? 'Edit your listing' : 'Tell us about your place'}</h1><p>Good photos and useful details help guests feel at home before they arrive.</p></div>
    <form className="listing-form" onSubmit={handleSubmit(onSubmit)}>
      <section className="form-panel"><h2>Listing details</h2><label>Listing title<input placeholder="e.g. Quiet hillside cottage with a view" {...register('title')}/>{errors.title && <span className="field-error">{errors.title.message}</span>}</label><label>Description<textarea rows="5" placeholder="Describe the space, neighbourhood and what makes it special." {...register('description')}/>{errors.description && <span className="field-error">{errors.description.message}</span>}</label>
      <div className="two-col-fields"><label>Category<select {...register('category')}>{categoryOptions.map((v) => <option key={v} value={v}>{v.replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}</select>{errors.category && <span className="field-error">{errors.category.message}</span>}</label><label>Property type<select {...register('propertyType')}>{propertyTypes.map((v) => <option key={v} value={v}>{v.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}</select>{errors.propertyType && <span className="field-error">{errors.propertyType.message}</span>}</label></div></section>
      <section className="form-panel"><h2>Location</h2><div className="two-col-fields"><label>City<input placeholder="City or town" {...register('location.city')}/>{errors.location?.city && <span className="field-error">{errors.location.city.message}</span>}</label><label>State<input placeholder="State" {...register('location.state')}/>{errors.location?.state && <span className="field-error">{errors.location.state.message}</span>}</label></div><div className="two-col-fields"><label>Country<input {...register('location.country')}/></label><label>Nightly price (₹)<input type="number" min="1" {...register('price', { valueAsNumber: true })}/>{errors.price && <span className="field-error">{errors.price.message}</span>}</label></div><p className="form-hint">Optional map coordinates let your stay appear on the map view.</p><div className="two-col-fields"><label>Latitude<input type="number" step="any" placeholder="e.g. 30.9648" {...register('location.lat')}/>{errors.location?.lat && <span className="field-error">Enter a latitude from -90 to 90.</span>}</label><label>Longitude<input type="number" step="any" placeholder="e.g. 77.1935" {...register('location.lng')}/>{errors.location?.lng && <span className="field-error">Enter a longitude from -180 to 180.</span>}</label></div></section>
      <section className="form-panel"><h2>Rooms and guests</h2><div className="four-col-fields"><label>Max guests<input type="number" min="1" max="50" {...register('maxGuests', { valueAsNumber: true })}/>{errors.maxGuests && <span className="field-error">Choose 1–50</span>}</label><label>Bedrooms<input type="number" min="0" {...register('bedrooms', { valueAsNumber: true })}/>{errors.bedrooms && <span className="field-error">Required</span>}</label><label>Beds<input type="number" min="1" {...register('beds', { valueAsNumber: true })}/>{errors.beds && <span className="field-error">Required</span>}</label><label>Bathrooms<input type="number" min="0" step="0.5" {...register('baths', { valueAsNumber: true })}/>{errors.baths && <span className="field-error">Required</span>}</label></div><h3 className="mt-6 mb-3 font-semibold">Amenities</h3><div className="amenity-checkbox-grid">{amenityOptions.map((amenity) => <label key={amenity} className="checkbox-label"><input type="checkbox" checked={amenities.includes(amenity)} onChange={(e) => setAmenities((old) => e.target.checked ? [...old, amenity] : old.filter((a) => a !== amenity))}/>{amenity}</label>)}</div></section>
      <section className="form-panel"><h2>Photos</h2><p className="form-hint mb-4">Upload JPG, PNG, WEBP or AVIF files (max 5 MB each). Development mode stores photos on your server; configure Cloudinary for deployment.</p><label className="upload-drop"><ImagePlus size={28}/><span>Add photos</span><small>Up to 10 new images</small><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={changeFiles} /></label>
        {(existingImages.length > 0 || previews.length > 0) && <div className="upload-preview-grid">{existingImages.map((url) => <div className="upload-preview" key={url}><img src={url} alt="Existing property"/><button type="button" onClick={() => removeExistingImage(url)} aria-label="Remove image"><X size={15}/></button></div>)}{previews.map((url, index) => <div className="upload-preview" key={url}><img src={url} alt={`New upload ${index + 1}`}/><button type="button" onClick={() => removeNewImage(index)} aria-label="Remove image"><X size={15}/></button></div>)}</div>}
      </section>
      <div className="form-submit-row"><button className="outline-button" type="button" onClick={() => navigate('/dashboard')}>Cancel</button><button className="primary-button" disabled={working}>{working ? 'Saving your listing...' : editing ? 'Save changes' : 'Publish listing'}</button></div>
    </form>
  </main>;
}
