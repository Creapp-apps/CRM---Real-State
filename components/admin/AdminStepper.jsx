'use client';

/* Contador numérico estándar del admin. Reemplaza los <input type="number">
   de conteo chico (baños, ambientes, cocheras) para dar una estética congruente
   (navy + dorado) y evitar valores negativos.

   API:
     <AdminStepper
       value={value}             // number | '' (string del form)
       onChange={(n) => ...}     // n = número, o '' si queda vacío
       min={0} max={Infinity} step={1}
       ariaLabel="Baños"
     />
*/

import styles from './AdminStepper.module.css';
import Icon from './Icon';

const toNum = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

export default function AdminStepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  ariaLabel,
  id,
  name,
}) {
  const current = toNum(value);
  const clamp = (n) => Math.min(max, Math.max(min, n));

  const set = (n) => onChange?.(n === '' ? '' : clamp(n));

  const dec = () => set((current ?? min) - step);
  const inc = () => set((current ?? min) + step);

  const onType = (e) => {
    const raw = e.target.value;
    if (raw === '') return set('');
    const n = parseInt(raw, 10);
    if (Number.isFinite(n)) set(n);
  };

  const atMin = current !== null && current <= min;
  const atMax = current !== null && current >= max;

  return (
    <div className={styles.stepper}>
      <button type="button" className={styles.btn} onClick={dec} disabled={atMin}
        aria-label={`Restar${ariaLabel ? ` ${ariaLabel}` : ''}`} tabIndex={-1}>
        <Icon name="minus" size={16} />
      </button>
      <input
        id={id}
        name={name}
        className={styles.value}
        type="number"
        inputMode="numeric"
        min={min}
        max={Number.isFinite(max) ? max : undefined}
        step={step}
        value={value ?? ''}
        onChange={onType}
        aria-label={ariaLabel}
        placeholder="0"
      />
      <button type="button" className={styles.btn} onClick={inc} disabled={atMax}
        aria-label={`Sumar${ariaLabel ? ` ${ariaLabel}` : ''}`} tabIndex={-1}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
