'use client';

// Generador de contrato de locación (modelo orientativo, editable).
// Arma el documento con los datos del contrato y permite imprimir / guardar PDF.
// Documento en blanco/negro A4 (no usa el tema oscuro del admin).

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const PERIODICIDAD_LABEL = {
  mensual: 'mensual', bimestral: 'bimestral', trimestral: 'trimestral',
  cuatrimestral: 'cuatrimestral', semestral: 'semestral', anual: 'anual',
};
const INDICE_LABEL = {
  ICL: 'Índice para Contratos de Locación (ICL) publicado por el BCRA',
  IPC: 'Índice de Precios al Consumidor (IPC) publicado por el INDEC',
  UVA: 'Unidad de Valor Adquisitivo (UVA) publicada por el BCRA',
};

const fmtFecha = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : '__________';
const blank = (v) => v || '__________';

export default function ContratoDocumentoPage() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('contratos')
        .select('*, locador:clientes!contratos_locador_id_fkey(*), locatario:clientes!contratos_locatario_id_fkey(*), inmueble:inmuebles_administrados!contratos_inmueble_id_fkey(*)')
        .eq('id', id).single();
      setC(data); setLoading(false);
    })();
  }, [id]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>Cargando…</div>;
  if (!c) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
      Contrato no encontrado. <Link href={`/admin/administraciones/contratos`}>Volver</Link>
    </div>
  );

  const loc = c.locador || {};
  const inq = c.locatario || {};
  const inm = c.inmueble || {};
  const montoFmt = `${c.moneda === 'USD' ? 'USD' : '$'} ${Number(c.monto_inicial || 0).toLocaleString('es-AR')}`;

  return (
    <>
      <style>{`
        .doc-wrap { background: #525659; min-height: 100vh; padding: 24px 12px; }
        .doc-toolbar { max-width: 820px; margin: 0 auto 16px; display: flex; gap: 10px; justify-content: space-between; align-items: center; }
        .doc-toolbar a, .doc-toolbar button { font: 500 14px system-ui; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; }
        .doc-back { background: rgba(255,255,255,.15); color: #fff; text-decoration: none; }
        .doc-print { background: #C9A96E; color: #1a1a1a; font-weight: 700; }
        .doc-page { max-width: 820px; margin: 0 auto; background: #fff; color: #1a1a1a; padding: 56px 64px; box-shadow: 0 8px 40px rgba(0,0,0,.4);
          font-family: Georgia, 'Times New Roman', serif; font-size: 13px; line-height: 1.7; }
        .doc-page h1 { text-align: center; font-size: 19px; letter-spacing: 1px; margin: 0 0 4px; }
        .doc-sub { text-align: center; color: #666; font-size: 11px; margin-bottom: 28px; }
        .doc-page h2 { font-size: 13px; margin: 20px 0 6px; text-transform: uppercase; letter-spacing: .5px; }
        .doc-page p { margin: 0 0 10px; text-align: justify; }
        .doc-firmas { display: flex; justify-content: space-between; gap: 40px; margin-top: 64px; }
        .doc-firma { flex: 1; text-align: center; border-top: 1px solid #1a1a1a; padding-top: 6px; font-size: 12px; }
        .doc-note { max-width: 820px; margin: 14px auto 0; color: #cfcfcf; font: 12px system-ui; text-align: center; }
        @media print {
          .doc-wrap { background: #fff; padding: 0; }
          .doc-toolbar, .doc-note { display: none; }
          .doc-page { box-shadow: none; max-width: none; padding: 0; margin: 0; }
          @page { size: A4; margin: 2cm; }
        }
      `}</style>

      <div className="doc-wrap">
        <div className="doc-toolbar">
          <Link href={`/admin/administraciones/contratos/${id}`} className="doc-back">← Volver al contrato</Link>
          <button className="doc-print" onClick={() => window.print()}>Imprimir / Guardar PDF</button>
        </div>

        <div className="doc-page">
          <h1>CONTRATO DE LOCACIÓN</h1>
          <div className="doc-sub">Destino vivienda · Ley 27.551 y Código Civil y Comercial de la Nación</div>

          <p>
            Entre <strong>{blank(loc.nombre)}</strong>, DNI/CUIT N° {blank(loc.dni_cuit)}, con domicilio en {blank(loc.domicilio)}
            {loc.telefono ? `, tel. ${loc.telefono}` : ''} (en adelante, <strong>“EL LOCADOR”</strong>), por una parte; y por la otra,
            <strong> {blank(inq.nombre)}</strong>, DNI/CUIT N° {blank(inq.dni_cuit)}, con domicilio en {blank(inq.domicilio)}
            {inq.telefono ? `, tel. ${inq.telefono}` : ''} (en adelante, <strong>“EL LOCATARIO”</strong>), convienen en celebrar el presente
            contrato de locación, que se regirá por las siguientes cláusulas:
          </p>

          <h2>Primera — Objeto</h2>
          <p>
            EL LOCADOR da en locación a EL LOCATARIO, quien acepta, el inmueble sito en <strong>{blank(inm.direccion)}</strong>
            {inm.tipo ? ` (${inm.tipo})` : ''}, en el estado en que se encuentra y que el locatario declara conocer y aceptar.
          </p>

          <h2>Segunda — Destino</h2>
          <p>
            El inmueble se destinará exclusivamente a <strong>vivienda</strong> del locatario y su grupo familiar conviviente,
            quedando prohibido darle otro destino sin autorización expresa y por escrito del locador.
          </p>

          <h2>Tercera — Plazo</h2>
          <p>
            La locación se conviene por el plazo comprendido entre el <strong>{fmtFecha(c.fecha_inicio)}</strong> y el
            <strong> {fmtFecha(c.fecha_fin)}</strong>, de conformidad con el plazo mínimo legal vigente.
          </p>

          <h2>Cuarta — Precio</h2>
          <p>
            El precio de la locación se fija en la suma de <strong>{montoFmt}</strong> mensuales, que EL LOCATARIO abonará por
            mes adelantado, del 1 al 10 de cada mes, en el domicilio del locador o por el medio que las partes acuerden.
          </p>

          <h2>Quinta — Actualización</h2>
          <p>
            El valor del alquiler se ajustará con periodicidad <strong>{PERIODICIDAD_LABEL[c.periodicidad_ajuste] || '__________'}</strong>,
            conforme a la variación del <strong>{INDICE_LABEL[c.indice_ajuste] || blank(c.indice_ajuste)}</strong>, tomando como base
            el valor del índice a la fecha de inicio de cada período de ajuste.
          </p>

          <h2>Sexta — Depósito en garantía</h2>
          <p>
            A la firma del presente, EL LOCATARIO entrega en concepto de depósito en garantía la suma equivalente a un (1) mes de
            alquiler, que será reintegrada al finalizar la locación conforme lo previsto por la ley, previa verificación del estado del inmueble.
          </p>

          <h2>Séptima — Servicios e impuestos</h2>
          <p>
            Estarán a cargo de EL LOCATARIO los servicios de consumo (luz, gas, agua, etc.) y las expensas ordinarias. Los impuestos
            que graven el inmueble y las expensas extraordinarias quedarán a cargo de EL LOCADOR, salvo acuerdo en contrario.
          </p>

          <h2>Octava — Conservación</h2>
          <p>
            EL LOCATARIO se obliga a conservar el inmueble en buen estado y a restituirlo al finalizar la locación en las mismas
            condiciones en que lo recibió, salvo el deterioro propio del uso normal y del paso del tiempo.
          </p>

          <h2>Novena — Domicilios y jurisdicción</h2>
          <p>
            Para todos los efectos legales, las partes constituyen domicilio en los indicados en el encabezamiento, donde se tendrán
            por válidas las notificaciones, y se someten a la jurisdicción de los tribunales ordinarios competentes, renunciando a
            cualquier otro fuero.
          </p>

          <p style={{ marginTop: 20 }}>
            En prueba de conformidad, se firman dos (2) ejemplares de un mismo tenor y a un solo efecto, en __________________,
            a los {new Date().getDate()} días del mes de {new Date().toLocaleDateString('es-AR', { month: 'long' })} de {new Date().getFullYear()}.
          </p>

          <div className="doc-firmas">
            <div className="doc-firma">EL LOCADOR<br />{blank(loc.nombre)}</div>
            <div className="doc-firma">EL LOCATARIO<br />{blank(inq.nombre)}</div>
          </div>
        </div>

        <div className="doc-note">
          Modelo orientativo generado automáticamente con los datos cargados. Revisá y ajustá las cláusulas antes de firmar; no constituye asesoramiento legal.
        </div>
      </div>
    </>
  );
}
