import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, BarChart3, MonitorSmartphone, FolderCheck, Award, Users2, CheckCircle2,
  ChevronDown, ArrowRight, ArrowLeft, PlayCircle,
} from 'lucide-react';
import { getCourseBySlug } from '@/data/courses';
import { getIcon } from '@/utils/iconMap';
import { SITE } from '@/constants/siteData';
import Reveal from '@/components/shared/Reveal';
import DemoVideo from '@/components/shared/DemoVideo';
import CertificateSample from '@/components/shared/CertificateSample';

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="card-base bg-white px-4 py-3 flex items-center gap-3">
      <Icon size={16} className="text-primary shrink-0" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
        <p className="text-sm font-bold text-secondary normal-case">{value}</p>
      </div>
    </div>
  );
}

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className="card-base mb-4 overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors ${isOpen ? 'bg-accent' : 'bg-white'}`}
      >
        <span className="text-base font-bold text-secondary normal-case">{item.q}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0 text-primary">
          <ChevronDown size={20} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-white border-t-2 border-secondary"
          >
            <p className="px-6 py-5 text-sm text-muted leading-relaxed normal-case">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CourseDetail() {
  const { slug } = useParams();
  const course = getCourseBySlug(slug);
  const [openFaq, setOpenFaq] = useState(0);

  if (!course) return <Navigate to="/course" replace />;

  const Icon = getIcon(course.icon);

  return (
    <>
      <Helmet>
        <title>{course.title} Course in Lucknow | {SITE.name}</title>
        <meta name="description" content={course.shortDescription} />
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section">
          <Link to="/course" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary mb-6 hover:underline underline-offset-4">
            <ArrowLeft size={15} /> All Courses
          </Link>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="w-16 h-16 bg-primary flex items-center justify-center mb-6">
                <Icon size={28} className="text-white" />
              </div>
              <h1 className="text-secondary text-4xl sm:text-5xl leading-[1.05] mb-5">{course.title}</h1>
              <p className="text-muted text-base leading-relaxed normal-case mb-7">{course.shortDescription}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoChip icon={Clock} label="Duration" value={course.duration} />
                <InfoChip icon={BarChart3} label="Level" value={course.level} />
                <InfoChip icon={MonitorSmartphone} label="Mode" value={course.mode} />
                <InfoChip icon={FolderCheck} label="Projects" value={course.projects} />
              </div>
            </div>

            <Reveal className="card-base bg-white p-7">
              <p className="text-xs font-bold uppercase tracking-wide text-muted mb-1">Course Fee</p>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-heading text-4xl text-primary">{course.price}</span>
                {course.originalPrice && (
                  <span className="text-base text-muted line-through normal-case">{course.originalPrice}</span>
                )}
              </div>
              {course.discountPercent && (
                <span className="inline-block bg-primary text-white text-[10px] font-bold uppercase px-2.5 py-1 mb-2">
                  {course.discountPercent}% OFF
                </span>
              )}
              {course.isDemoPrice && <p className="text-[11px] text-muted normal-case mb-5">Demo pricing — confirm with our team</p>}
              <div className="flex items-center gap-2 mb-2.5">
                <Award size={16} className="text-primary shrink-0" />
                <span className="text-sm text-secondary normal-case">Certificate on completion</span>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <Users2 size={16} className="text-primary shrink-0" />
                <span className="text-sm text-secondary normal-case">Mentorship included</span>
              </div>
              <Link to="/Contect-us" className="btn-primary w-full">
                Enroll Now <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding bg-accent">
        <div className="container-section grid lg:grid-cols-2 gap-8 items-start">
          <Reveal direction="left">
            <h2 className="text-2xl text-secondary mb-5 flex items-center gap-2">
              <PlayCircle size={22} className="text-primary" /> Course Demo Video
            </h2>
            <DemoVideo url={course.demoVideoUrl} title={`${course.title} demo video`} />
          </Reveal>
          {course.hasCertificateSample && (
            <Reveal direction="right" delay={0.1}>
              <h2 className="text-2xl text-secondary mb-5 flex items-center gap-2">
                <Award size={22} className="text-primary" /> Certificate Sample
              </h2>
              <CertificateSample courseName={course.title} />
            </Reveal>
          )}
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-section grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-2xl text-secondary mb-5">What You&rsquo;ll Learn</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {course.whatYouLearn.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-secondary/80 normal-case leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl text-secondary mb-5">Curriculum</h2>
              <div className="flex flex-wrap gap-2.5">
                {course.topics.map((topic) => (
                  <span key={topic} className="bg-accent border-2 border-secondary/15 px-4 py-2 text-sm font-semibold text-secondary normal-case">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl text-secondary mb-5">Frequently Asked Questions</h2>
              {course.faqs.map((item, i) => (
                <FAQItem key={item.q} item={item} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
              ))}
            </div>
          </div>

          <div>
            <Reveal className="card-base bg-accent p-7 sticky top-24">
              <h3 className="text-lg text-secondary normal-case mb-4">Who Should Take This Course</h3>
              <ul className="space-y-3">
                {course.whoShouldJoin.map((who) => (
                  <li key={who} className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-secondary/80 normal-case leading-relaxed">{who}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
