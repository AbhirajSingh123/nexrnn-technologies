import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import RootLayout from '@/layouts/RootLayout';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import Home from '@/pages/Home';
import { SITE, SOCIAL_LINKS } from '@/constants/siteData';
import 'react-toastify/dist/ReactToastify.css';

const Services = lazy(() => import('@/pages/Services'));
const ServiceDetail = lazy(() => import('@/pages/services/ServiceDetail'));
const Courses = lazy(() => import('@/pages/Courses'));
const CourseDetail = lazy(() => import('@/pages/course/CourseDetail'));
const Workshops = lazy(() => import('@/pages/Workshops'));
const WorkshopDetail = lazy(() => import('@/pages/workshop/WorkshopDetail'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogDetail = lazy(() => import('@/pages/blog/BlogDetail'));
const EnrollmentSuccess = lazy(() => import('@/pages/EnrollmentSuccess'));
const EnrollmentPaymentStatus = lazy(() => import('@/pages/EnrollmentPaymentStatus'));
const AboutUs = lazy(() => import('@/pages/AboutUs'));
const ContactUs = lazy(() => import('@/pages/ContactUs'));
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy'));
const TermsConditions = lazy(() => import('@/pages/legal/TermsConditions'));
const RefundPolicy = lazy(() => import('@/pages/legal/RefundPolicy'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminLeadsContact = lazy(() => import('@/pages/admin/AdminLeadsContact'));
const AdminLeadsServices = lazy(() => import('@/pages/admin/AdminLeadsServices'));
const AdminLeadsCourses = lazy(() => import('@/pages/admin/AdminLeadsCourses'));
const AdminLeadsWorkshops = lazy(() => import('@/pages/admin/AdminLeadsWorkshops'));
const AdminPayments = lazy(() => import('@/pages/admin/AdminPayments'));
const AdminServicesList = lazy(() => import('@/pages/admin/AdminServicesList'));
const AdminServiceForm = lazy(() => import('@/pages/admin/AdminServiceForm'));
const AdminCoursesList = lazy(() => import('@/pages/admin/AdminCoursesList'));
const AdminCourseForm = lazy(() => import('@/pages/admin/AdminCourseForm'));
const AdminWorkshopsList = lazy(() => import('@/pages/admin/AdminWorkshopsList'));
const AdminWorkshopForm = lazy(() => import('@/pages/admin/AdminWorkshopForm'));
const AdminBlogPostsList = lazy(() => import('@/pages/admin/AdminBlogPostsList'));
const AdminBlogPostForm = lazy(() => import('@/pages/admin/AdminBlogPostForm'));
const AdminClientReviewsList = lazy(() => import('@/pages/admin/AdminClientReviewsList'));
const AdminClientReviewForm = lazy(() => import('@/pages/admin/AdminClientReviewForm'));
const AdminPortfolioList = lazy(() => import('@/pages/admin/AdminPortfolioList'));
const AdminPortfolioForm = lazy(() => import('@/pages/admin/AdminPortfolioForm'));
const AdminTestimonialsList = lazy(() => import('@/pages/admin/AdminTestimonialsList'));
const AdminTestimonialForm = lazy(() => import('@/pages/admin/AdminTestimonialForm'));
const AdminSiteSettings = lazy(() => import('@/pages/admin/AdminSiteSettings'));

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
        <title>{`${SITE.name} — ${SITE.tagline}`}</title>
        <meta
          name="description"
          content="NexRNN Technology is a digital marketing agency and technology solutions company in Lucknow offering Google Ads, Meta Ads, SEO, website development, and practical digital marketing, AI and web development courses."
        />
        <meta property="og:title" content={SITE.name} />
        <meta property="og:description" content={SITE.tagline} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE.domain} />
        <meta property="og:locale" content="en_IN" />
        <link rel="canonical" href={SITE.domain} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'ProfessionalService',
                '@id': `${SITE.domain}/#organization`,
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
                sameAs: Object.values(SOCIAL_LINKS).filter((url) => url && url !== '#'),
              },
              {
                '@type': 'WebSite',
                '@id': `${SITE.domain}/#website`,
                url: SITE.domain,
                name: SITE.name,
                publisher: { '@id': `${SITE.domain}/#organization` },
                inLanguage: 'en-IN',
              },
            ],
          })}
        </script>
      </Helmet>

      <AdminAuthProvider>
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
                <Route path="/workshop" element={<Workshops />} />
                <Route path="/workshop/:slug" element={<WorkshopDetail />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route path="/enrollment-success" element={<EnrollmentSuccess />} />
                <Route path="/enrollment-payment-status" element={<EnrollmentPaymentStatus />} />
                {/*
                  Safety-net aliases: if a payment gateway return_url ever ends up
                  misconfigured with an extra path segment (e.g. SITE_URL secret
                  accidentally set to ".../course"), these still resolve instead
                  of hitting the /course/:slug or /workshop/:slug catch-all and
                  showing a confusing "not found" page.
                */}
                <Route path="/course/enrollment-payment-status" element={<EnrollmentPaymentStatus />} />
                <Route path="/course/enrollment-success" element={<EnrollmentSuccess />} />
                <Route path="/workshop/enrollment-payment-status" element={<EnrollmentPaymentStatus />} />
                <Route path="/workshop/enrollment-success" element={<EnrollmentSuccess />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/Contect-us" element={<ContactUs />} />
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-and-conditions" element={<TermsConditions />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path={ADMIN_ROUTES.login} element={<AdminLogin />} />
              <Route element={<AdminProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path={ADMIN_ROUTES.dashboard} element={<AdminDashboard />} />
                  <Route path={ADMIN_ROUTES.leadsContact} element={<AdminLeadsContact />} />
                  <Route path={ADMIN_ROUTES.leadsServices} element={<AdminLeadsServices />} />
                  <Route path={ADMIN_ROUTES.leadsCourses} element={<AdminLeadsCourses />} />
                  <Route path={ADMIN_ROUTES.leadsWorkshops} element={<AdminLeadsWorkshops />} />
                  <Route path={ADMIN_ROUTES.payments} element={<AdminPayments />} />
                  <Route path={ADMIN_ROUTES.services} element={<AdminServicesList />} />
                  <Route path={ADMIN_ROUTES.serviceEditPath} element={<AdminServiceForm />} />
                  <Route path={ADMIN_ROUTES.serviceNew} element={<AdminServiceForm />} />
                  <Route path={ADMIN_ROUTES.courses} element={<AdminCoursesList />} />
                  <Route path={ADMIN_ROUTES.courseEditPath} element={<AdminCourseForm />} />
                  <Route path={ADMIN_ROUTES.courseNew} element={<AdminCourseForm />} />
                  <Route path={ADMIN_ROUTES.workshops} element={<AdminWorkshopsList />} />
                  <Route path={ADMIN_ROUTES.workshopEditPath} element={<AdminWorkshopForm />} />
                  <Route path={ADMIN_ROUTES.workshopNew} element={<AdminWorkshopForm />} />
                  <Route path={ADMIN_ROUTES.blogPosts} element={<AdminBlogPostsList />} />
                  <Route path={ADMIN_ROUTES.blogPostEditPath} element={<AdminBlogPostForm />} />
                  <Route path={ADMIN_ROUTES.blogPostNew} element={<AdminBlogPostForm />} />
                  <Route path={ADMIN_ROUTES.clientReviews} element={<AdminClientReviewsList />} />
                  <Route path={ADMIN_ROUTES.clientReviewEditPath} element={<AdminClientReviewForm />} />
                  <Route path={ADMIN_ROUTES.clientReviewNew} element={<AdminClientReviewForm />} />
                  <Route path={ADMIN_ROUTES.portfolio} element={<AdminPortfolioList />} />
                  <Route path={ADMIN_ROUTES.portfolioEditPath} element={<AdminPortfolioForm />} />
                  <Route path={ADMIN_ROUTES.portfolioNew} element={<AdminPortfolioForm />} />
                  <Route path={ADMIN_ROUTES.testimonials} element={<AdminTestimonialsList />} />
                  <Route path={ADMIN_ROUTES.testimonialEditPath} element={<AdminTestimonialForm />} />
                  <Route path={ADMIN_ROUTES.testimonialNew} element={<AdminTestimonialForm />} />
                  <Route path={ADMIN_ROUTES.siteSettings} element={<AdminSiteSettings />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AdminAuthProvider>

      <ToastContainer position="top-right" autoClose={4000} theme="light" />
    </HelmetProvider>
  );
}

export default App;
