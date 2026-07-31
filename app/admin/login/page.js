'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const loginStyles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--navy-900, #0a1628)',
    padding: '2rem',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    background: 'rgba(15, 33, 64, 0.6)',
    border: '1px solid rgba(201, 169, 110, 0.15)',
    borderRadius: '1rem',
    padding: '2.5rem',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logoTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--white)',
    marginBottom: '0.25rem',
  },
  logoSub: {
    fontSize: '0.75rem',
    color: 'var(--gold)',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  group: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--gray-400, #9ca3af)',
    marginBottom: '0.5rem',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(201, 169, 110, 0.12)',
    borderRadius: '0.5rem',
    color: 'var(--white)',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '0.75rem',
    background: 'var(--gold)',
    color: 'var(--navy-900, #0a1628)',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: '0.5rem',
  },
  error: {
    color: '#f87171',
    fontSize: '0.8rem',
    textAlign: 'center',
    marginBottom: '1rem',
  },
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
    <div style={loginStyles.page}>
      <div style={loginStyles.card}>
        <div style={loginStyles.logo}>
          <div style={loginStyles.logoTitle}>Cardoso Propiedades</div>
          <div style={loginStyles.logoSub}>Panel de Administración</div>
        </div>

        {error && <p style={loginStyles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={loginStyles.group}>
            <label style={loginStyles.label}>Email</label>
            <input
              style={loginStyles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="monica@cardosoprop.com"
            />
          </div>
          <div style={loginStyles.group}>
            <label style={loginStyles.label}>Contraseña</label>
            <input
              style={loginStyles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" style={loginStyles.btn}>
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
