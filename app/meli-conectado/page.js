// Página de confirmación tras el OAuth de MercadoLibre.
import Link from 'next/link';

export const metadata = {
  title: 'Conexión MercadoLibre | Cardoso Propiedades',
  robots: { index: false, follow: false },
};

export default async function MeliConectadoPage({ searchParams }) {
  const sp = await searchParams;
  const ok = sp?.status === 'ok';
  const reason = sp?.reason;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--navy-900, #0A1628)',
        color: '#fff',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          textAlign: 'center',
          padding: '2.5rem',
          borderRadius: 24,
          background: 'rgba(15,33,64,0.65)',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>{ok ? '✓' : '✕'}</div>
        <h1 style={{ fontSize: 28, marginBottom: 12, fontWeight: 700 }}>
          {ok ? 'Cuenta de MercadoLibre conectada' : 'No se pudo conectar'}
        </h1>
        <p style={{ opacity: 0.8, marginBottom: 24, lineHeight: 1.5 }}>
          {ok
            ? 'Ya podés generar fichas con tus publicaciones de MercadoLibre.'
            : `Hubo un error${reason ? ` (${reason})` : ''}. Reintentá la conexión.`}
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            borderRadius: 999,
            background: '#fff',
            color: '#0A1628',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
