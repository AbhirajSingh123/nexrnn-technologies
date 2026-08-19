import { Award, ShieldCheck } from 'lucide-react';

export default function CertificateSample({ courseName = 'Course Name' }) {
  return (
    <div>
      <div className="card-base bg-white p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute inset-3 border-2 border-dashed border-primary/30 pointer-events-none" />
        <div className="relative text-center">
          <div className="w-14 h-14 bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Award size={26} className="text-primary" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted mb-2">Certificate of Completion</p>
          <p className="font-heading text-2xl sm:text-3xl text-secondary mb-1">NexRNN Technologies</p>
          <div className="h-px w-24 bg-primary/40 mx-auto my-4" />
          <p className="text-xs text-muted normal-case mb-1">This certifies that</p>
          <p className="font-heading text-xl text-secondary mb-3">[ Student Name ]</p>
          <p className="text-xs text-muted normal-case">has successfully completed the</p>
          <p className="text-sm font-bold text-primary normal-case">{courseName} Course</p>
          <div className="flex items-center justify-center gap-1.5 mt-5 text-[10px] text-muted normal-case">
            <ShieldCheck size={13} className="text-primary" /> Sample preview — not an issued certificate
          </div>
        </div>
      </div>
    </div>
  );
}
