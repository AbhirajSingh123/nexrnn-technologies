import Hero from '@/components/home/Hero';
import StatsBand from '@/components/home/StatsBand';
import AboutTeaser from '@/components/home/AboutTeaser';
import ServicesPreview from '@/components/home/ServicesPreview';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import DigitalGrowthProcess from '@/components/home/DigitalGrowthProcess';
import TechnologySection from '@/components/home/TechnologySection';
import CoursesPreview from '@/components/home/CoursesPreview';
import Portfolio from '@/components/home/Portfolio';
import Testimonials from '@/components/home/Testimonials';
import CTALeadSection from '@/components/home/CTALeadSection';

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBand />
      <AboutTeaser />
      <ServicesPreview />
      <WhyChooseUs />
      <DigitalGrowthProcess />
      <TechnologySection />
      <CoursesPreview />
      <Portfolio />
      <Testimonials />
      <CTALeadSection />
    </>
  );
}
