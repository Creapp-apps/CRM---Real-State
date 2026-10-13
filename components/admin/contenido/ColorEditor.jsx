'use client';
import { COLOR_VAR_MAP } from '@/lib/content/theme';
import styles from '@/components/admin/admin.module.css';

const LABELS = {
  navy900: 'Navy 900 (fondo)', navy800: 'Navy 800', navy700: 'Navy 700',
  navy600: 'Navy 600', navy500: 'Navy 500',
  gold: 'Acento principal', goldLight: 'Acento claro', goldDark: 'Acento oscuro',
};

export default function ColorEditor({ colors = {}, onChange }) {
  return (
    <div>
      {Object.keys(COLOR_VAR_MAP).map((key) => (
        <div className={styles.colorRow} key={key}>
          <span className={styles.formLabel}>{LABELS[key] || key}</span>
          <input
            type="color"
            className={styles.colorSwatch}
            value={/^#[0-9a-fA-F]{6}$/.test(colors[key] || '') ? colors[key] : '#000000'}
            onChange={(e) => onChange(key, e.target.value)}
          />
          <input
            className={styles.colorHex}
            value={colors[key] ?? ''}
            placeholder="#RRGGBB"
            onChange={(e) => onChange(key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
