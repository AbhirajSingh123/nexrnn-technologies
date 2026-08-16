import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import RootLayout from '@/layouts/RootLayout';
import Home from '@/pages/Home';
import { SITE } from '@/constants/siteData';
import 'react-toastify/dist/ReactToastify.css';

// Route-level code splitting only (whole-page swap, not section-level) — safe and simple.
const Services = lazy(() => import('@/pages/Services'));
const ServiceDetail = lazy(() => import('@/pages/services/ServiceDetail'));
const Courses = lazy(() => import('@/pages/Courses'));
const CourseDetail = lazy(() => import('@/pages/course/CourseDetail'));
const AboutUs = lazy(() => import('@/pages/AboutUs'));
const ContactUs = lazy(() => import('@/pages/ContactUs'));
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy'));
const TermsConditions = lazy(() => import('@/pages/legal/TermsConditions'));
const RefundPolicy = lazy(() => import('@/pages/legal/RefundPolicy'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>{`${SITE.name} \u2014 ${SITE.tagline}`}</title>
        <meta
          name="description"
          content="NexRNN Technology is a digital marketing agency and technology solutions company in Lucknow offering Google Ads, Meta Ads, SEO, website development, and practical digital marketing, AI and web development courses."
        />
        <meta property="og:title" content={SITE.name} />
        <meta property="og:description" content={SITE.tagline} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE.domain} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfessionalService',
            name: SITE.name,
            url: SITE.domain,
            email: SITE.email,
            telephone: SITE.phoneDisplay,
            address: {
              '@type': 'PostalAddress',
              addressLocality: SITE.city,
              addressRegion: 'Uttar Pradesh',
              addressCountry: 'IN',
            },
            areaServed: 'Lucknow',
            description: 'Digital marketing agency, technology solutions and professional courses in Lucknow, Uttar Pradesh.',
          })}
        </script>
      </Helmet>

      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/Home" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:slug" element={<ServiceDetail />} />
              <Route path="/course" element={<Courses />} />
              <Route path="/course/:slug" element={<CourseDetail />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/Contect-us" element={<ContactUs />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsConditions />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>

      <ToastContainer position="top-right" autoClose={4000} theme="light" />
    </HelmetProvider>
  );
}

export default App;
