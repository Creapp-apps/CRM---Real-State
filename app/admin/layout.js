'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import styles from '@/components/admin/admin.module.css';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login page doesn't use admin layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className={styles.adminMain}>
        <AdminTopbar
          pathname={pathname}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className={styles.adminContent}>
          {children}
        </div>
      </div>
    </div>
  );
}
