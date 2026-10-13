'use client';
import { CATEGORIES } from './fields';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';

export default function ContentCategorySidebar({ active, onSelect, dirtyKeys }) {
  return (
    <div className={styles.catSidebar}>
      {CATEGORIES.map((c) => (
        <button
          key={c.key}
          className={`${styles.catItem} ${styles.catItemFull} ${active === c.key ? styles.catItemActive : ''}`}
          onClick={() => onSelect(c.key)}
        >
          <span className={styles.catItemIcon}><Icon name={c.icon} size={18} /></span>
          <span className={styles.catItemBody}>
            <span className={styles.catItemLabel}>
              {c.label}
              {dirtyKeys?.has(c.key) && <span className={styles.catDot} />}
            </span>
            <span className={styles.catItemDesc}>{c.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
