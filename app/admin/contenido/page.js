'use client';
import styles from '@/components/admin/admin.module.css';
import ContentEditor from '@/components/admin/contenido/ContentEditor';

export default function AdminContenido() {
  return (
    <div className={styles.systemHeader}>
      <span className={styles.systemHeaderTag}>Sistema de Diseño</span>
      <h2 className={styles.pageTitle}>Sitio web</h2>
      <p className={styles.pageSubtitle}>Configuración de contenido, textos y llamadas a la acción del sitio</p>
      <ContentEditor />
    </div>
  );
}
