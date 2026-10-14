'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/admin/Icon';

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'radial-gradient(circle at 50% 0%, var(--admin-gold-08), transparent 60%), var(--navy-900)',
    padding: '2rem',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--navy-800)',
    border: '1px solid var(--admin-gold-15)',
    borderRadius: '1.25rem',
    padding: '3rem 2.5rem 2.5rem',
    boxShadow:
      '0 30px 80px -20px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--admin-gold-08), 0 0 60px -30px var(--admin-gold-glow)',
  },
  brand: {
    textAlign: 'center',
    marginBottom: '2.25rem',
  },
  avatar: {
    width: '64px',
    height: '64px',
    margin: '0 auto 1.25rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(145deg, var(--admin-gold), #b8945a)',
    color: 'var(--navy-900)',
    fontFamily: 'var(--font-heading)',
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '1px',
    boxShadow: '0 8px 24px -6px var(--admin-gold-40)',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--white)',
    marginBottom: '0.4rem',
  },
  subtitle: {
    fontSize: '0.72rem',
    color: 'var(--admin-gold)',
    textTransform: 'uppercase',
    letterSpacing: '3px',
  },
  group: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--gray-400)',
    marginBottom: '0.5rem',
    fontWeight: 600,
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.9rem',
    display: 'flex',
    color: 'var(--admin-gold)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.8rem 1rem 0.8rem 2.6rem',
    background: 'var(--navy-900)',
    border: '1px solid var(--admin-gold-12)',
    borderRadius: '0.6rem',
    color: 'var(--white)',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  btn: {
    width: '100%',
    padding: '0.85rem',
    background: 'var(--admin-gold)',
    color: 'var(--navy-900)',
    border: 'none',
    borderRadius: '0.6rem',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    marginTop: '0.75rem',
    transition: 'filter 0.2s, box-shadow 0.2s',
    boxShadow: '0 8px 24px -8px var(--admin-gold-40)',
  },
  error: {
    color: '#f87171',
    fontSize: '0.8rem',
    textAlign: 'center',
    marginBottom: '1rem',
  },
};

const focusOn = (e) => {
  e.target.style.borderColor = 'var(--admin-gold)';
  e.target.style.boxShadow = '0 0 0 3px var(--admin-gold-15)';
};
const focusOff = (e) => {
  e.target.style.borderColor = 'var(--admin-gold-12)';
  e.target.style.boxShadow = 'none';
};

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Frontend-only: accept any credentials for now
    if (!email || !password) {
      setError('Completá todos los campos');
      return;
    }
    // Simulate login — will be replaced with real auth
    router.push('/admin');
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.brand}>
          <div style={S.avatar}>MC</div>
          <div style={S.title}>Cardoso Propiedades</div>
          <div style={S.subtitle}>Panel de Administración</div>
        </div>

        {error && <p style={S.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={S.group}>
            <label style={S.label}>Email</label>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}>
                <Icon name="mail" size={16} />
              </span>
              <input
                style={S.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={focusOn}
                onBlur={focusOff}
                placeholder="monica@cardosoprop.com"
              />
            </div>
          </div>
          <div style={S.group}>
            <label style={S.label}>Contraseña</label>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}>
                <Icon name="lock" size={16} />
              </span>
              <input
                style={S.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={focusOn}
                onBlur={focusOff}
                placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" style={S.btn}>
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
