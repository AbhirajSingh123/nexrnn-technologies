import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ServiceLeadProvider } from '@/contexts/ServiceLeadContext';
import { CourseEnrollProvider } from '@/contexts/CourseEnrollContext';
import ServiceLeadModal from '@/components/services/ServiceLeadModal';
import CourseEnrollModal from '@/components/courses/CourseEnrollModal';

export default function RootLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ServiceLeadProvider>
      <CourseEnrollProvider>
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Footer />
        <ServiceLeadModal />
        <CourseEnrollModal />
      </CourseEnrollProvider>
    </ServiceLeadProvider>
  );
}
