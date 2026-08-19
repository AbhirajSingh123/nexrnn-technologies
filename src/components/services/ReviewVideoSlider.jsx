import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { PlayCircle } from 'lucide-react';
import { REVIEW_VIDEOS } from '@/data/reviewVideos';
import Reveal from '@/components/shared/Reveal';
import SectionHeading from '@/components/shared/SectionHeading';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function ReviewVideoSlot({ video }) {
  const embedUrl = getYouTubeEmbedUrl(video.youtubeUrl);

  return (
    <div className="card-base overflow-hidden bg-white">
      <div className="aspect-[9/16] max-h-[420px] bg-secondary flex flex-col items-center justify-center relative">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={`${video.name} review`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <>
            <PlayCircle size={36} className="text-white/30 mb-2" />
            <p className="text-white/60 text-xs font-semibold normal-case">Video coming soon</p>
          </>
        )}
        {video.isDemo && (
          <span className="absolute top-3 right-3 bg-white/90 text-secondary text-[9px] font-bold uppercase tracking-wide px-2 py-1">
            Demo
          </span>
        )}
      </div>
      <div className="p-4 text-center">
        <p className="text-sm font-bold text-secondary normal-case">{video.name}</p>
        <p className="text-xs text-muted normal-case">{video.role}</p>
      </div>
    </div>
  );
}

export default function ReviewVideoSlider() {
  return (
    <section className="section-padding bg-accent">
      <div className="container-section">
        <SectionHeading
          badge="Client Reviews"
          title="What Our Clients Say"
          description="Video reviews from clients we've worked with — demo slots shown below until real client videos are added."
        />
        <Reveal>
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={20}
            slidesPerView={1.2}
            breakpoints={{
              480: { slidesPerView: 1.6 },
              640: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3.2 },
              1280: { slidesPerView: 4 },
            }}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation
            className="pb-12 review-video-swiper"
          >
            {REVIEW_VIDEOS.map((video) => (
              <SwiperSlide key={video.id}>
                <ReviewVideoSlot video={video} />
              </SwiperSlide>
            ))}
          </Swiper>
        </Reveal>
      </div>
    </section>
  );
}
