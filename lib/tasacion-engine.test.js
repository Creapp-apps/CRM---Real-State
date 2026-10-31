import { describe, it, expect } from 'vitest';
import { calcularTasacion, PRECIOS_ZONA, AMENITIES } from './tasacion-engine';

describe('calcularTasacion', () => {
  it('devuelve null sin superficie válida', () => {
    expect(calcularTasacion({ superficie_cubierta: '' })).toBeNull();
    expect(calcularTasacion({ superficie_cubierta: 0 })).toBeNull();
    expect(calcularTasacion({ superficie_cubierta: -10 })).toBeNull();
  });

  it('caso base: depto bueno, 10 años, sin extras = base de zona × superficie', () => {
    const zona = 'CABA - Belgrano';
    const base = (PRECIOS_ZONA[zona].min + PRECIOS_ZONA[zona].max) / 2; // 2800
    const r = calcularTasacion({
      zona, tipo_propiedad: 'Departamento', estado_conservacion: 'Bueno',
      antiguedad: 10, superficie_cubierta: 50,
    });
    expect(r.baseM2).toBe(Math.round(base));
    expect(r.precioM2).toBe(Math.round(base)); // todos los factores = 1
    expect(r.valorUSD).toBe(Math.round(base * 50));
  });

  it('el rango es ±8% del estimado y lo contiene', () => {
    const r = calcularTasacion({ zona: 'CABA - Belgrano', superficie_cubierta: 78 });
    expect(r.valorMin).toBe(Math.round(r.valorUSD * 0.92));
    expect(r.valorMax).toBe(Math.round(r.valorUSD * 1.08));
    expect(r.valorMin).toBeLessThanOrEqual(r.valorUSD);
    expect(r.valorMax).toBeGreaterThanOrEqual(r.valorUSD);
  });

  it('cochera, 3+ baños y amenities suben el precio', () => {
    const baseR = calcularTasacion({ zona: 'CABA - Belgrano', superficie_cubierta: 78, banos: 1 });
    const upR = calcularTasacion({
      zona: 'CABA - Belgrano', superficie_cubierta: 78, banos: 3,
      cochera: true, amenities: ['Pileta', 'SUM'],
    });
    expect(upR.valorUSD).toBeGreaterThan(baseR.valorUSD);
  });

  it('ajuste manual negativo baja el precio y aparece en factores', () => {
    const r = calcularTasacion({ zona: 'CABA - Belgrano', superficie_cubierta: 78, ajuste_manual: -10 });
    const base = calcularTasacion({ zona: 'CABA - Belgrano', superficie_cubierta: 78 });
    expect(r.valorUSD).toBeLessThan(base.valorUSD);
    expect(r.factores.some(f => f.label === 'Ajuste del tasador' && f.pct === -0.1)).toBe(true);
  });

  it('zona desconocida cae a Interior', () => {
    const r = calcularTasacion({ zona: 'Narnia', superficie_cubierta: 100 });
    const interior = (PRECIOS_ZONA['Interior'].min + PRECIOS_ZONA['Interior'].max) / 2;
    expect(r.baseM2).toBe(Math.round(interior));
  });

  it('amenities inválidos no rompen ni suman', () => {
    const r = calcularTasacion({ zona: 'CABA - Belgrano', superficie_cubierta: 50, amenities: ['NoExiste'] });
    const base = calcularTasacion({ zona: 'CABA - Belgrano', superficie_cubierta: 50 });
    expect(r.valorUSD).toBe(base.valorUSD);
    expect(AMENITIES['NoExiste']).toBeUndefined();
  });
});
