import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCourses } from '@/hooks/useCatalog';
import { SITE } from '@/constants/siteData';
import CourseCard from '@/components/courses/CourseCard';
import Reveal from '@/components/shared/Reveal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function Courses() {
  const { courses, loading } = useCourses();

  return (
    <>
      <Helmet>
        <title>Digital Marketing, AI & Website Development Courses in Lucknow | {SITE.name}</title>
        <meta
          name="description"
          content="Practical, career-focused courses in Digital Marketing, Artificial Intelligence and Website Development from NexRNN Technology, Lucknow."
        />
        <link rel="canonical" href={`${SITE.domain}/course`} />
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section text-center max-w-3xl mx-auto">
          <span className="badge-tag mb-5">Courses &amp; Professional Training</span>
          <h1 className="text-secondary text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-5">Explore Our Courses</h1>
          <p className="text-muted text-base leading-relaxed normal-case">
            Practical, industry-oriented training built to develop real, job-ready skills — not just theory.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-section">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
              {courses.map((course, i) => (
                <CourseCard key={course.slug} course={course} index={i} />
              ))}
            </div>
          )}

          <Reveal className="card-base bg-secondary text-white p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl mb-4">Not Sure Which Course Fits You?</h2>
            <p className="text-white/70 text-sm leading-relaxed normal-case mb-7 max-w-xl mx-auto">
              Talk to our team about your goals and we&rsquo;ll help you pick the right course to start with.
            </p>
            <Link to="/Contect-us" className="btn-primary min-w-[220px]">
              Talk to an Advisor <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
