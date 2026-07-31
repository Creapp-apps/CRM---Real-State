'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DarkVeil from '@/components/ui/DarkVeil';

export default function PageLayout({ children }) {
  return (
    <>
      <DarkVeil />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
