'use client';
import { CATEGORIES } from './fields';
import styles from '@/components/admin/admin.module.css';

export default function ContentCategorySidebar({ active, onSelect, dirtyKeys }) {
  return (
    <div className={styles.catSidebar}>
      {CATEGORIES.map((c) => (
        <button
          key={c.key}
          className={`${styles.catItem} ${active === c.key ? styles.catItemActive : ''}`}
          onClick={() => onSelect(c.key)}
        >
          {c.label}
          {dirtyKeys?.has(c.key) && <span className={styles.catDot} />}
        </button>
      ))}
    </div>
  );
}
