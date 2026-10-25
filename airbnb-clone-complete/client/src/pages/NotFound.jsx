import { Link } from 'react-router-dom';
import { House } from 'lucide-react';
export default function NotFound() {
  return <main className="not-found content-wrap"><span className="not-found-code">404</span><h1>This page took a little vacation.</h1><p>We couldn't find the page you were looking for.</p><Link className="primary-button inline-flex" to="/"><House size={17}/> Back to home</Link></main>;
}
