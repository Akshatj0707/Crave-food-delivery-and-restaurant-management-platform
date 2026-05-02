import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuthLayout = ({ children, title, subtitle, image }) => (
  <div style={{ minHeight: '100vh', display: 'flex' }}>
    {/* Left panel - form */}
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', background: 'white'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 40, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: 'var(--crave-orange)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18 }}>C</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--gray-900)' }}>Crave</span>
        </Link>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 8 }}>{title}</h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: 36 }}>{subtitle}</p>
        {children}
      </div>
    </div>

    {/* Right panel - decorative */}
    <div className="hide-mobile" style={{
      width: 480, background: 'linear-gradient(135deg, var(--gray-900), #2D1206)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60,
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,90,31,0.25) 0%, transparent 70%)' }} />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>🍽️</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'white', marginBottom: 16 }}>
          Your cravings,<br />delivered.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
          Order from 500+ restaurants. Choose Delivery, Takeaway, or Dine-in.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 36 }}>
          {['🍕', '🍛', '🍔', '🍜'].map((emoji, i) => (
            <div key={i} style={{
              width: 52, height: 52, background: 'rgba(255,255,255,0.1)',
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              animation: `fadeIn 0.5s ease ${i * 0.1}s both`
            }}>{emoji}</div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const InputField = ({ label, type, value, onChange, placeholder, icon: Icon, showToggle, onToggle, showPassword }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <div style={{ position: 'relative' }}>
      {Icon && <Icon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} size={17} />}
      <input
        type={showToggle ? (showPassword ? 'text' : 'password') : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="form-input"
        style={{ paddingLeft: Icon ? 44 : 16, paddingRight: showToggle ? 44 : 16 }}
      />
      {showToggle && (
        <button type="button" onClick={onToggle} style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)'
        }}>
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      )}
    </div>
  </div>
);

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.first_name}!`);
      if (['admin', 'super_admin'].includes(user.role)) navigate('/admin');
      else if (user.role === 'partner') navigate('/partner');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Crave account">
      {/* Demo credentials */}
      <div style={{ background: 'var(--crave-orange-pale)', border: '1px solid var(--crave-orange-mid)', borderRadius: 12, padding: '14px 16px', marginBottom: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--crave-orange)', marginBottom: 8 }}>🔑 Demo Accounts</p>
        {[
          ['Customer', 'customer@crave.com'],
          ['Partner', 'partner1@crave.com'],
          ['Admin', 'admin@crave.com'],
        ].map(([role, em]) => (
          <div key={role} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-600)', marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>{role}:</span>
            <button type="button" onClick={() => { setEmail(em); setPassword('password123'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--crave-orange)', fontWeight: 600, fontSize: 12 }}>
              {em} (click to fill)
            </button>
          </div>
        ))}
        <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>Password: password123</p>
      </div>

      <form onSubmit={handleSubmit}>
        <InputField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon={Mail} />
        <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" icon={Lock} showToggle showPassword={showPwd} onToggle={() => setShowPwd(!showPwd)} />
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
          {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={16} /></>}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--gray-500)' }}>
        Don't have an account? <Link to="/signup" style={{ color: 'var(--crave-orange)', fontWeight: 700 }}>Sign up free</Link>
      </p>
    </AuthLayout>
  );
}

export function SignupPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'customer' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await signup(form);
      toast.success(`Welcome to Crave, ${user.first_name}! 🎉`);
      if (user.role === 'partner') navigate('/partner/setup');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Join Crave and start ordering">
      <form onSubmit={handleSubmit}>
        {/* Role toggle */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1.5px solid var(--gray-200)' }}>
          {[{ key: 'customer', label: '🍽️ Customer' }, { key: 'partner', label: '🏪 Restaurant Partner' }].map(({ key, label }) => (
            <button
              key={key} type="button"
              onClick={() => setForm(p => ({ ...p, role: key }))}
              style={{
                flex: 1, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: form.role === key ? 'var(--crave-orange)' : 'white',
                color: form.role === key ? 'white' : 'var(--gray-600)',
                border: 'none', transition: 'var(--transition)'
              }}
            >{label}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Arjun" className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Verma" className="form-input" required />
          </div>
        </div>
        <InputField label="Email Address" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" icon={Mail} />
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="9876543210" className="form-input" />
        </div>
        <InputField label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" icon={Lock} showToggle showPassword={showPwd} onToggle={() => setShowPwd(!showPwd)} />

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
          {loading ? 'Creating Account...' : <><span>Create Account</span><ArrowRight size={16} /></>}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--gray-500)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--crave-orange)', fontWeight: 700 }}>Sign in</Link>
      </p>
    </AuthLayout>
  );
}

export default LoginPage;
