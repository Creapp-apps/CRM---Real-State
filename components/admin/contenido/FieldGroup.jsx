'use client';
import styles from '@/components/admin/admin.module.css';

// Renderiza un campo con label + descripción + control según type.
// type: 'text' | 'textarea' | 'list' (array de strings, una por línea).
export default function FieldGroup({ field, value, onChange }) {
  const { label, desc, type } = field;

  let control;
  if (type === 'textarea') {
    control = (
      <textarea
        className={styles.formTextarea}
        rows={3}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else if (type === 'list') {
    const text = Array.isArray(value) ? value.join('\n') : (value ?? '');
    control = (
      <textarea
        className={styles.formTextarea}
        rows={4}
        value={text}
        onChange={(e) =>
          onChange(
            e.target.value
              .split('\n')
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
          )
        }
      />
    );
  } else {
    control = (
      <input
        className={styles.formInput}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      {desc && <div className={styles.fieldDesc}>{desc}</div>}
      {control}
    </div>
  );
}
