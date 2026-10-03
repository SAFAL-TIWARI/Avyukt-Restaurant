import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Maximize2, Image as ImageIcon } from 'lucide-react';

// Authentic Avyukt restaurant moments & ambiance photographs
const GALLERY_IMAGES = [
  '/assets/images/interior.jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM.jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (1).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (5).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (6).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (7).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (8).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (9).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (10).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (11).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (12).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (13).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (14).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (15).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (16).jpeg',
  '/assets/images/WhatsApp Image 2026-03-12 at 8.44.22 PM (22).jpeg',
];

const GalleryPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  const total = GALLERY_IMAGES.length;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Automatic 2-second slide progression (pauses on hover or touch/mouse drag)
  useEffect(() => {
    if (isHovered || isDragging) return;

    const timer = setInterval(() => {
      handleNext();
    }, 2000); // exactly 2 seconds

    return () => clearInterval(timer);
  }, [isHovered, isDragging, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImg) {
        if (e.key === 'Escape') setSelectedImg(null);
        return;
      }
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, selectedImg]);

  // Mouse & finger swipe / drag gesture handling (phone gallery behavior)
  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const swipeThreshold = 40;
    const velocityThreshold = 250;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      handlePrev();
    }
  };

  // Helper to compute realistic 3D transform position for each card
  const getCardStyle = (index) => {
    // Determine shortest wrapped distance from currentIndex
    let diff = index - currentIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    // Realistic 3D positioning:
    // Front card (diff 0): centered, scaled 1, fully bright, top zIndex
    // Left card (diff -1): glides left-backward in 3D space with inwards tilt
    // Right card (diff +1): glides right-backward in 3D space with inwards tilt
    // Out-of-view cards: recessed further and transparent
    if (diff === 0) {
      return {
        x: '0%',
        scale: 1,
        rotateY: 0,
        opacity: 1,
        zIndex: 30,
        filter: 'brightness(1)',
        pointerEvents: 'auto',
      };
    } else if (diff === -1) {
      return {
        x: '-68%',
        scale: 0.84,
        rotateY: 22,
        opacity: 0.48,
        zIndex: 15,
        filter: 'brightness(0.65)',
        pointerEvents: 'auto',
      };
    } else if (diff === 1) {
      return {
        x: '68%',
        scale: 0.84,
        rotateY: -22,
        opacity: 0.48,
        zIndex: 15,
        filter: 'brightness(0.65)',
        pointerEvents: 'auto',
      };
    } else if (diff < -1) {
      return {
        x: '-130%',
        scale: 0.68,
        rotateY: 35,
        opacity: 0,
        zIndex: 5,
        filter: 'brightness(0.4)',
        pointerEvents: 'none',
      };
    } else {
      return {
        x: '130%',
        scale: 0.68,
        rotateY: -35,
        opacity: 0,
        zIndex: 5,
        filter: 'brightness(0.4)',
        pointerEvents: 'none',
      };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 lg:pt-32 pb-20 bg-body dark:bg-zinc-950 min-h-screen transition-colors duration-300 select-none overflow-x-hidden"
    >
      {/* Hero Banner Header */}
      <section className="bg-primary py-16 lg:py-24 text-center text-white mb-10 sm:mb-12 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl lg:text-6xl font-title font-bold text-secondary mb-4 tracking-tight">Gallery</h1>
          <p className="text-lg lg:text-xl opacity-90 max-w-2xl mx-auto">
            A glimpse into our royal dining ambiance
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── 3D Stage Auto-Carousel (Realistic Front-to-Back 9:16 Cards) ── */}
        <div 
          className="relative max-w-4xl mx-auto py-2 sm:py-6"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main 3D Viewport with Realistic Perspective */}
          <div 
            className="relative h-[480px] xs:h-[530px] sm:h-[590px] md:h-[640px] flex items-center justify-center overflow-hidden"
            style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
          >
            {GALLERY_IMAGES.map((src, index) => {
              let diff = index - currentIndex;
              if (diff > total / 2) diff -= total;
              if (diff < -total / 2) diff += total;

              // Only render relevant nearby cards to keep DOM lightweight and 60fps smooth
              if (Math.abs(diff) > 2) return null;

              const isCenter = diff === 0;
              const isLeft = diff === -1;
              const isRight = diff === 1;
              const style = getCardStyle(index);

              return (
                <motion.div
                  key={src}
                  initial={false}
                  animate={style}
                  transition={{
                    type: 'spring',
                    stiffness: 240,
                    damping: 26,
                    mass: 0.9,
                  }}
                  drag={isCenter ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    if (isLeft) handlePrev();
                    else if (isRight) handleNext();
                  }}
                  className={`absolute h-[420px] xs:h-[470px] sm:h-[530px] md:h-[580px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl transition-shadow ${
                    isCenter 
                      ? 'cursor-grab active:cursor-grabbing border-[3px] border-amber-400/90 dark:border-amber-400/80 shadow-amber-500/15' 
                      : 'cursor-pointer border-2 border-white/20'
                  }`}
                  style={{
                    transformOrigin: 'center center',
                    willChange: 'transform, opacity',
                  }}
                >
                  <img 
                    src={src} 
                    alt={`Avyukt Gallery Photo ${index + 1}`} 
                    className="w-full h-full object-cover select-none pointer-events-none"
                    loading={Math.abs(diff) <= 1 ? 'eager' : 'lazy'}
                  />

                  {/* Dark shading layer for side-receding cards */}
                  {!isCenter && (
                    <div className="absolute inset-0 bg-black/35 dark:bg-black/50 transition-opacity duration-300" />
                  )}

                  {/* Center Card Overlays */}
                  {isCenter && (
                    <>
                      {/* Top Right Expand Fullscreen Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImg(src);
                        }}
                        className="absolute top-3.5 right-3.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer z-40"
                        title="View Fullscreen"
                        aria-label="View Fullscreen"
                      >
                        <Maximize2 size={16} />
                      </button>


                    </>
                  )}
                </motion.div>
              );
            })}

            {/* Left Circular Navigation Button */}
            <button 
              onClick={handlePrev}
              aria-label="Previous Photo"
              className="absolute left-2 sm:left-6 md:left-10 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-neutral-900/80 hover:bg-neutral-900 active:scale-90 text-white shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-white/20 hover:border-white/40 cursor-pointer"
            >
              <ChevronLeft size={24} className="sm:w-7 sm:h-7 -ml-0.5" />
            </button>

            {/* Right Circular Navigation Button */}
            <button 
              onClick={handleNext}
              aria-label="Next Photo"
              className="absolute right-2 sm:right-6 md:right-10 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-neutral-900/80 hover:bg-neutral-900 active:scale-90 text-white shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-white/20 hover:border-white/40 cursor-pointer"
            >
              <ChevronRight size={24} className="sm:w-7 sm:h-7 -mr-0.5" />
            </button>

          </div>

          {/* Carousel Progress Dots */}
          <div className="mt-4 flex items-center justify-center gap-1.5 overflow-x-auto py-1 max-w-[280px] sm:max-w-md mx-auto scrollbar-none">
            {GALLERY_IMAGES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Jump to photo ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? 'w-6 bg-primary dark:bg-secondary' 
                    : 'w-2 bg-neutral-300 dark:bg-zinc-700 hover:bg-neutral-400'
                }`}
              />
            ))}
          </div>

        </div>

      </div>

      {/* ── Fullscreen Lightbox Modal ── */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={() => setSelectedImg(null)}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors cursor-pointer z-50" 
              onClick={() => setSelectedImg(null)}
              aria-label="Close Fullscreen"
            >
              <X size={26} />
            </button>

            {/* Modal Image */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-4xl max-h-[88vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImg} 
                alt="Enlarged view" 
                className="max-w-full max-h-[88vh] aspect-[9/16] rounded-2xl shadow-2xl object-cover border border-white/10"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default GalleryPage;
