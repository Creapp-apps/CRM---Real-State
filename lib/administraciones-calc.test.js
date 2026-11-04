import { describe, it, expect } from 'vitest';
import {
  montoVigente, honorarios, netoPropietario, proximaActualizacion,
  estadoVigente, estaVigente, totalesPorMoneda, filaGrilla,
  mesesActualizacion, estadoActualizacion,
  saldoPorContraparte, nombreContraparte,
} from './administraciones-calc';

// Datos reales del excel de Mónica (ADMINISTRACIONES.xlsx, hoja Adm.).
const corvetto = {
  moneda: 'ARS', monto_inicial: 950000, honorarios_porcentaje: 7, honorarios_iva: false,
  fecha_inicio: '2025-12-01', fecha_fin: '2027-11-30', periodicidad_ajuste: 'trimestral', estado: 'activo',
  acts: [{ fecha: '2026-03-01', monto_nuevo: 1190348 }],
};
const havranUSD = {
  moneda: 'USD', monto_inicial: 2250, honorarios_porcentaje: 7, honorarios_iva: false,
  fecha_inicio: '2026-06-01', fecha_fin: '2028-05-31', periodicidad_ajuste: 'trimestral', estado: 'activo',
  acts: [{ fecha: '2026-06-01', monto_nuevo: 2272 }],
};

describe('montoVigente', () => {
  it('usa el último monto_nuevo cuando hay actualizaciones', () => {
    expect(montoVigente(corvetto)).toBe(1190348);
  });
  it('toma la actualización más reciente aunque vengan desordenadas', () => {
    const c = { monto_inicial: 100, acts: [
      { fecha: '2026-01-01', monto_nuevo: 200 },
      { fecha: '2026-06-01', monto_nuevo: 400 },
      { fecha: '2026-03-01', monto_nuevo: 300 },
    ] };
    expect(montoVigente(c)).toBe(400);
  });
  it('cae al monto_inicial si no hay actualizaciones', () => {
    expect(montoVigente({ monto_inicial: 500000, acts: [] })).toBe(500000);
  });
});

describe('honorarios', () => {
  it('calcula 7% del alquiler (caso Corvetto)', () => {
    expect(honorarios(1190348, 7, false).total).toBeCloseTo(83324.36, 2);
  });
  it('suma IVA 21% cuando corresponde', () => {
    const h = honorarios(1000000, 7, true);
    expect(h.neto).toBeCloseTo(70000, 2);
    expect(h.iva).toBeCloseTo(14700, 2);
    expect(h.total).toBeCloseTo(84700, 2);
  });
  it('es 0 si el porcentaje es 0 (no asume 7% por defecto)', () => {
    expect(honorarios(1000000, 0, false).total).toBe(0);
  });
});

describe('netoPropietario', () => {
  it('resta honorarios al alquiler (caso Corvetto)', () => {
    const h = honorarios(1190348, 7, false).total;
    expect(netoPropietario(1190348, h)).toBeCloseTo(1107023.64, 2);
  });
});

describe('proximaActualizacion', () => {
  it('inicio + periodicidad cuando no hay actualizaciones', () => {
    const c = { fecha_inicio: '2026-01-01', periodicidad_ajuste: 'trimestral', acts: [] };
    const next = proximaActualizacion(c);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(3); // abril (0-indexed)
  });
  it('avanza al siguiente período después de la última actualización', () => {
    const c = { fecha_inicio: '2026-01-01', periodicidad_ajuste: 'trimestral',
      acts: [{ fecha: '2026-04-01', monto_nuevo: 1 }] };
    const next = proximaActualizacion(c);
    expect(next.getMonth()).toBe(6); // julio
  });
});

describe('estadoVigente', () => {
  const hoy = new Date('2026-11-03T12:00:00');
  it('respeta rescindido manual', () => {
    expect(estadoVigente({ estado: 'rescindido', fecha_fin: '2030-01-01' }, hoy)).toBe('rescindido');
  });
  it('vencido si fecha_fin pasó', () => {
    expect(estadoVigente({ fecha_fin: '2026-10-01' }, hoy)).toBe('vencido');
  });
  it('proximo_a_vencer dentro de 30 días', () => {
    expect(estadoVigente({ fecha_fin: '2026-11-20' }, hoy)).toBe('proximo_a_vencer');
  });
  it('activo si falta más de 30 días', () => {
    expect(estadoVigente({ fecha_fin: '2027-11-30' }, hoy)).toBe('activo');
  });
});

describe('totalesPorMoneda', () => {
  const hoy = new Date('2026-11-03T12:00:00');
  it('separa ARS de USD y nunca los mezcla', () => {
    const t = totalesPorMoneda([corvetto, havranUSD], hoy);
    expect(t.ARS.count).toBe(1);
    expect(t.USD.count).toBe(1);
    expect(t.ARS.honorarios).toBeCloseTo(83324.36, 2);
    expect(t.USD.honorarios).toBeCloseTo(159.04, 2);
  });
  it('excluye contratos no vigentes', () => {
    const vencido = { ...corvetto, fecha_fin: '2026-01-01' };
    const t = totalesPorMoneda([vencido], hoy);
    expect(t.ARS.count).toBe(0);
    expect(t.ARS.honorarios).toBe(0);
  });
});

describe('mesesActualizacion', () => {
  it('trimestral desde enero → Ene/Abr/Jul/Oct', () => {
    expect(mesesActualizacion({ fecha_inicio: '2026-01-01', periodicidad_ajuste: 'trimestral' }))
      .toEqual(['Ene', 'Abr', 'Jul', 'Oct']);
  });
  it('trimestral desde diciembre envuelve el año → Dic/Mar/Jun/Sep', () => {
    expect(mesesActualizacion({ fecha_inicio: '2025-12-01', periodicidad_ajuste: 'trimestral' }))
      .toEqual(['Dic', 'Mar', 'Jun', 'Sep']);
  });
  it('bimestral → 6 meses', () => {
    expect(mesesActualizacion({ fecha_inicio: '2026-02-01', periodicidad_ajuste: 'bimestral' }))
      .toEqual(['Feb', 'Abr', 'Jun', 'Ago', 'Oct', 'Dic']);
  });
  it('anual → un solo mes', () => {
    expect(mesesActualizacion({ fecha_inicio: '2026-05-01', periodicidad_ajuste: 'anual' }))
      .toEqual(['May']);
  });
});

describe('estadoActualizacion', () => {
  const hoy = new Date('2026-11-03T12:00:00');
  it('vencida si la fecha ya pasó', () => {
    expect(estadoActualizacion(new Date('2026-10-01T12:00:00'), hoy)).toBe('vencida');
  });
  it('este_mes si cae dentro del mes en curso', () => {
    expect(estadoActualizacion(new Date('2026-11-20T12:00:00'), hoy)).toBe('este_mes');
  });
  it('null si es a futuro', () => {
    expect(estadoActualizacion(new Date('2027-02-01T12:00:00'), hoy)).toBe(null);
  });
});

describe('nombreContraparte', () => {
  it('prioriza el cliente vinculado', () => {
    expect(nombreContraparte({ contraparte: { nombre: 'Havrán' }, contraparte_texto: 'x' })).toBe('Havrán');
  });
  it('cae al texto libre si no hay cliente', () => {
    expect(nombreContraparte({ contraparte_texto: 'Lorena' })).toBe('Lorena');
  });
});

describe('saldoPorContraparte', () => {
  it('suma a_favor y resta en_contra, separado por moneda', () => {
    const saldos = [
      { contraparte_texto: 'Havrán', moneda: 'USD', sentido: 'a_favor', monto: 28 },
      { contraparte_texto: 'Havrán', moneda: 'USD', sentido: 'en_contra', monto: 10 },
      { contraparte_texto: 'Lorena', moneda: 'USD', sentido: 'en_contra', monto: 50 },
      { contraparte: { nombre: 'Havrán' }, moneda: 'ARS', sentido: 'a_favor', monto: 1000 },
    ];
    const r = saldoPorContraparte(saldos);
    const havUSD = r.find(x => x.contraparte === 'Havrán' && x.moneda === 'USD');
    const havARS = r.find(x => x.contraparte === 'Havrán' && x.moneda === 'ARS');
    const lorena = r.find(x => x.contraparte === 'Lorena');
    expect(havUSD.saldo).toBe(18);
    expect(havUSD.movimientos).toBe(2);
    expect(havARS.saldo).toBe(1000);
    expect(lorena.saldo).toBe(-50);
  });
  it('maneja lista vacía', () => {
    expect(saldoPorContraparte([])).toEqual([]);
  });
});

describe('filaGrilla', () => {
  const hoy = new Date('2026-11-03T12:00:00');
  it('arma la fila con todos los derivados (caso Corvetto)', () => {
    const f = filaGrilla(corvetto, hoy);
    expect(f.alquilerVigente).toBe(1190348);
    expect(f.honorarios).toBeCloseTo(83324.36, 2);
    expect(f.netoPropietario).toBeCloseTo(1107023.64, 2);
    expect(f.moneda).toBe('ARS');
    expect(f.estadoCalculado).toBe('activo');
  });
});
