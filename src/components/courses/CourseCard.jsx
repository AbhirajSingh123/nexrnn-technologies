import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, BarChart3, FolderCheck, Award, ArrowRight } from 'lucide-react';
import { getIcon } from '@/utils/iconMap';
import { useCourseEnrollModal } from '@/contexts/CourseEnrollContext';
import Reveal from '@/components/shared/Reveal';

export default function CourseCard({ course, index = 0 }) {
  const Icon = getIcon(course.icon);
  const { openCourseEnroll } = useCourseEnrollModal();

  return (
    <Reveal delay={(index % 3) * 0.08}>
      <motion.div whileHover={{ y: -4 }} className="card-base card-hover h-full flex flex-col overflow-hidden">
        <div className="bg-secondary p-7 flex items-center justify-center">
          <div className="w-14 h-14 bg-primary flex items-center justify-center">
            <Icon size={26} className="text-white" />
          </div>
        </div>
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl text-secondary normal-case mb-2">{course.title}</h3>
          <p className="text-sm text-muted leading-relaxed normal-case mb-4 flex-1">{course.shortDescription}</p>

          <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
            <span className="flex items-center gap-1.5 text-secondary/70">
              <Clock size={13} className="text-primary shrink-0" /> {course.duration}
            </span>
            <span className="flex items-center gap-1.5 text-secondary/70">
              <BarChart3 size={13} className="text-primary shrink-0" /> {course.level}
            </span>
            <span className="flex items-center gap-1.5 text-secondary/70">
              <FolderCheck size={13} className="text-primary shrink-0" /> {course.projects} Projects
            </span>
            <span className="flex items-center gap-1.5 text-secondary/70">
              <Award size={13} className="text-primary shrink-0" /> Certificate
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="font-heading text-2xl text-primary">{course.price}</span>
            {course.originalPrice && (
              <span className="text-sm text-muted line-through normal-case">{course.originalPrice}</span>
            )}
            {course.discountPercent && (
              <span className="bg-primary text-white text-[10px] font-bold uppercase px-2 py-0.5">
                {course.discountPercent}% OFF
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mb-5">
            {course.isDemoPrice && <span className="text-[10px] text-muted normal-case">Demo pricing</span>}
          </div>

          <div className="flex items-center gap-3 mt-auto">
            <Link to={`/course/${course.slug}`} className="btn-secondary flex-1 !px-4 !py-2.5 text-xs">
              View Course
            </Link>
            <button onClick={() => openCourseEnroll(course)} className="btn-primary flex-1 !px-4 !py-2.5 text-xs">
              Enroll Now <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </motion.div>
    </Reveal>
  );
}
