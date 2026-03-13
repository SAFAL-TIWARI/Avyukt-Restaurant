import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useScroll, useTransform, useSpring } from 'framer-motion';

const ScrollSequence = ({ frameCount = 142 }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Path helper
  const getFramePath = (index) => {
    // const frameNumber = String(index).padStart(3, '0');
    // return `/assets/scroll_dish/ezgif-frame-${frameNumber}.jpg`;
    
    // The frames in assets folder use a specific numbering: 86400 to 86541
    const frameNumber = String(86400 + index - 1).padStart(8, '0');
    return `/assets/scroll_dish/img${frameNumber}.jpg`;
  };

  // 2. Preload Images
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = [];
      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = getFramePath(i);
        imagePromises.push(new Promise((resolve) => {
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null); // Continue even if one fails
        }));
      }
      
      const loadedImages = await Promise.all(imagePromises);
      setImages(loadedImages.filter(img => img !== null));
      setIsLoaded(true);
    };

    loadImages();
  }, [frameCount]);

  // 3. Scroll Logic
  const { scrollYProgress } = useScroll({
    // We target the root scroll for a global background effect
    offset: ["start start", "end end"]
  });

  // Smooth out the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Map scroll (0-1) to frame index (0-143)
  const frameIndex = useTransform(smoothProgress, [0, 1], [0, frameCount - 1]);

  // 4. Canvas Drawing
  const drawImage = (index) => {
    if (!canvasRef.current || images.length === 0) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const img = images[Math.floor(index)];

    if (!img) return;

    // Clear and Draw (Object-fit: cover logic)
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.width;
    const ih = img.height;
    
    const ratio = Math.max(cw / iw, ch / ih);
    const x = (cw - iw * ratio) / 2;
    const y = (ch - ih * ratio) / 2;

    context.clearRect(0, 0, cw, ch);
    context.drawImage(img, x, y, iw * ratio, ih * ratio);
  };

  // Update canvas when frameIndex changes
  useEffect(() => {
    const unsubscribe = frameIndex.on("change", (latest) => {
      drawImage(latest);
    });
    return () => unsubscribe();
  }, [images, frameIndex]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      drawImage(frameIndex.get());
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, [images]);

  return (
    <div className="fixed inset-0 w-full h-screen pointer-events-none overflow-hidden bg-black z-0">
      {/* {!isLoaded && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black gap-4">
           <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           <p className="text-secondary font-medium tracking-widest uppercase animate-pulse">Preloading Culinary Magic...</p>
        </div>
      )} */}
      <canvas 
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ 
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
          filter: 'contrast(1.1) brightness(0.9)'
        }}
      />
      
      {/* Subtle vignette for depth */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]"></div>
    </div>
  );
};

export default ScrollSequence;
