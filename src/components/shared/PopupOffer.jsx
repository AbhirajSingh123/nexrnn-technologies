import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const SHOW_DELAY_MS = 5000;
const AUTO_CLOSE_MS = 10000;

export default function PopupOffer() {
  const { settings, loading } = useSiteSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading || !settings.popupEnabled || !settings.popupImageUrl) return undefined;

    const showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(showTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, settings.popupEnabled, settings.popupImageUrl]);

  useEffect(() => {
    if (!visible) return undefined;
    const closeTimer = setTimeout(() => setVisible(false), AUTO_CLOSE_MS);
    return () => clearTimeout(closeTimer);
  }, [visible]);

  if (loading || !settings.popupEnabled || !settings.popupImageUrl) return null;

  const image = (
    <img src={settings.popupImageUrl} alt="Special offer" className="w-full h-auto block" />
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-secondary/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setVisible(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm border-2 border-secondary shadow-[8px_8px_0_#1D6FE0] bg-white overflow-hidden"
          >
            <button
              onClick={() => setVisible(false)}
              aria-label="Close"
              className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-secondary hover:text-white flex items-center justify-center text-secondary transition-colors z-10"
            >
              <X size={18} />
            </button>

            {settings.popupLink ? (
              <a href={settings.popupLink} target="_blank" rel="noopener noreferrer" onClick={() => setVisible(false)}>
                {image}
              </a>
            ) : (
              image
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
