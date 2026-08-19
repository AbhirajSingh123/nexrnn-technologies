import { PlayCircle } from 'lucide-react';

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

export default function DemoVideo({ url, title = 'Demo Video' }) {
  const embedUrl = getYouTubeEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="card-base bg-secondary aspect-video flex flex-col items-center justify-center text-center px-6">
        <PlayCircle size={40} className="text-white/30 mb-3" />
        <p className="text-white/70 text-sm font-semibold normal-case">Demo video coming soon</p>
      </div>
    );
  }

  return (
    <div className="card-base overflow-hidden aspect-video">
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
