import Hero from '@/components/home/Hero';
import StatsBand from '@/components/home/StatsBand';
import AboutTeaser from '@/components/home/AboutTeaser';
import ServicesPreview from '@/components/home/ServicesPreview';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import DigitalGrowthProcess from '@/components/home/DigitalGrowthProcess';
import TechnologySection from '@/components/home/TechnologySection';
import CoursesPreview from '@/components/home/CoursesPreview';
import WorkshopsPreview from '@/components/home/WorkshopsPreview';
import Portfolio from '@/components/home/Portfolio';
import Testimonials from '@/components/home/Testimonials';
import CTALeadSection from '@/components/home/CTALeadSection';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function Home() {
  const { settings } = useSiteSettings();

  return (
    <>
      <Hero />
      <StatsBand />
      <AboutTeaser />
      {settings.showServices && <ServicesPreview />}
      <WhyChooseUs />
      <DigitalGrowthProcess />
      <TechnologySection />
      {settings.showCourses && <CoursesPreview />}
      {settings.showWorkshops && <WorkshopsPreview />}
      <Portfolio />
      <Testimonials />
      <CTALeadSection />
    </>
  );
}
