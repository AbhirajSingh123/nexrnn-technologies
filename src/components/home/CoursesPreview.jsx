import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ACTIVE_COURSES } from '@/data/courses';
import CourseCard from '@/components/courses/CourseCard';
import SectionHeading from '@/components/shared/SectionHeading';
import Reveal from '@/components/shared/Reveal';

export default function CoursesPreview() {
  return (
    <section id="courses" className="section-padding bg-accent">
      <div className="container-section">
        <SectionHeading
          badge="Learn With Us"
          title="Courses & Training"
          description="Practical, career-focused courses designed around what employers and clients actually need."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {ACTIVE_COURSES.map((c, i) => (
            <CourseCard key={c.slug} course={c} index={i} />
          ))}
        </div>
        <Reveal className="text-center">
          <Link to="/course" className="btn-primary min-w-[220px]">
            Explore All Courses <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
