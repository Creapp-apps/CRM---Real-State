'use client';
import styles from '@/components/admin/admin.module.css';
import ContentEditor from '@/components/admin/contenido/ContentEditor';

export default function AdminContenido() {
  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Contenido del Sitio</h2>
          <p className={styles.pageSubtitle}>Editá los textos, colores y media de la página principal</p>
        </div>
      </div>
      <ContentEditor />
    </>
  );
}
