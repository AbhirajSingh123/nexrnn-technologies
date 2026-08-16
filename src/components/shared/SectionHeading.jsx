import Reveal from './Reveal';

export default function SectionHeading({ badge, title, description, align = 'center' }) {
  const alignment = align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left';

  return (
    <Reveal className={`flex flex-col ${alignment} max-w-2xl mb-12 md:mb-16`}>
      {badge && <span className="badge-tag mb-4">{badge}</span>}
      <div className="relative flex items-center gap-4 w-full justify-center">
        <span className="hidden sm:block h-px flex-1 bg-secondary/20" />
        <h2 className="bracket-corners relative border-2 border-secondary bg-white px-6 py-4 text-3xl sm:text-4xl md:text-5xl text-secondary leading-[1.05] shrink-0">
          {title}
        </h2>
        <span className="hidden sm:block h-px flex-1 bg-secondary/20" />
      </div>
      {description && <p className="mt-5 text-muted text-base leading-relaxed normal-case">{description}</p>}
    </Reveal>
  );
}
