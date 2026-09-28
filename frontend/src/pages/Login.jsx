import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEmail, hasErrors } from '../utils/validation';

const DEMO_CREDENTIALS = [
  { role: 'ADMIN', email: 'admin@farmfresh.com', password: 'Admin@123' },
  { role: 'SALES', email: 'sales@farmfresh.com', password: 'Sales@123' },
  { role: 'FARMER', email: 'farmer@farmfresh.com', password: 'Farmer@123' },
  { role: 'DELIVERY', email: 'delivery@farmfresh.com', password: 'Delivery@123' },
];

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@farmfresh.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const formInvalid = hasErrors(fieldErrors) || !email || !password;

  const emailError = useMemo(() => validateEmail(email), [email]);

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const applyCredential = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setFieldErrors({ email: '', password: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {
      email: validateEmail(email),
      password: password ? '' : 'Password is required',
    };
    setFieldErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>FarmFresh</h1>
        <p>Sign in to manage dairy operations</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="form-grid single">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
              }}
              required
            />
            {(fieldErrors.email || emailError) && (
              <small className="field-error">{fieldErrors.email || emailError}</small>
            )}
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({
                  ...prev,
                  password: e.target.value ? '' : 'Password is required',
                }));
              }}
              required
            />
            {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting || formInvalid || !!emailError}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-credentials">
          <div className="demo-credentials-header">
            <h3>Demo Credentials</h3>
            <p>Use any role below to explore the system</p>
          </div>
          <div className="demo-credentials-list">
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.role}
                type="button"
                className="demo-credential-row"
                onClick={() => applyCredential(cred)}
              >
                <span className="demo-role">{cred.role}</span>
                <span className="demo-details">
                  <a href={`mailto:${cred.email}`} onClick={(e) => e.stopPropagation()}>
                    {cred.email}
                  </a>
                  <span className="demo-pass">/ {cred.password}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
 
