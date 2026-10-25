import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { HeartHandshake } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../api/axios';

const schema = yup.object({
  name: yup.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long').required('Name is required'),
  email: yup.string().email('Enter a valid email address').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords do not match').required('Please confirm your password'),
});

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema), defaultValues: { name: '', email: '', password: '', confirmPassword: '' } });
  async function onSubmit(values) {
    try { await registerUser({ name: values.name, email: values.email, password: values.password }); toast.success('Your account is ready!'); navigate('/'); }
    catch (error) { toast.error(getApiError(error)); }
  }
  return <main className="auth-page"><section className="auth-card"><div className="auth-icon"><HeartHandshake size={26}/></div><h1>Create your account</h1><p className="auth-subtitle">Discover stays and save your favourites.</p>
    <form onSubmit={handleSubmit(onSubmit)} className="form-stack" noValidate>
      <label>Full name<input autoComplete="name" placeholder="Your name" {...register('name')}/>{errors.name && <span className="field-error">{errors.name.message}</span>}</label>
      <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" {...register('email')}/>{errors.email && <span className="field-error">{errors.email.message}</span>}</label>
      <label>Password<input type="password" autoComplete="new-password" placeholder="At least 8 characters" {...register('password')}/>{errors.password && <span className="field-error">{errors.password.message}</span>}</label>
      <label>Confirm password<input type="password" autoComplete="new-password" placeholder="Repeat your password" {...register('confirmPassword')}/>{errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}</label>
      <p className="tiny-legal">By signing up, you agree to our demo terms and privacy notice.</p>
      <button className="primary-button full-button" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}</button>
    </form>
    <p className="auth-foot">Already have an account? <Link to="/login">Log in</Link></p>
  </section></main>;
}
