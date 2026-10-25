import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Globe, HeartHandshake } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../api/axios';
import api from '../api/axios';

const schema = yup.object({ email: yup.string().email('Enter a valid email address').required('Email is required'), password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters') });

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema), defaultValues: { email: '', password: '' } });
  useEffect(() => { if (params.get('error')) toast.error('Google login did not complete. Try email and password instead.'); }, [params]);
  const onSubmit = async (values) => {
    try {
      await login(values);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || (params.get('host') ? '/listing/new' : '/'), { replace: true });
    } catch (error) { toast.error(getApiError(error)); }
  };
  return <main className="auth-page"><section className="auth-card"><div className="auth-icon"><HeartHandshake size={26}/></div><h1>Welcome back</h1><p className="auth-subtitle">Log in to plan your next great stay.</p>
    <form onSubmit={handleSubmit(onSubmit)} className="form-stack" noValidate>
      <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" {...register('email')}/>{errors.email && <span className="field-error">{errors.email.message}</span>}</label>
      <label>Password<input type="password" autoComplete="current-password" placeholder="Your password" {...register('password')}/>{errors.password && <span className="field-error">{errors.password.message}</span>}</label>
      <button className="primary-button full-button" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Log in'}</button>
    </form>
    <div className="auth-divider"><span/>or continue with<span/></div>
    <a className="social-button" href={`${api.defaults.baseURL}/auth/google`}><Globe size={18}/> Continue with Google</a>
    <p className="auth-foot">Don't have an account? <Link to="/register">Sign up</Link></p>
    <p className="demo-note"><strong>Demo guest:</strong> guest@staybnb.local · GuestPass123!<br/><strong>Demo host:</strong> host@staybnb.local · HostPass123!</p>
  </section></main>;
}
