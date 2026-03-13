import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Gallery = () => {
  // Use Vite's magic to get images
  const images = import.meta.glob('../assets/images/*.{jpeg,jpg,png,webp}', { eager: true, import: 'default' });
  const imageList = Object.values(images);

  const [selectedImg, setSelectedImg] = useState(null);

  return (
    <section id="gallery" className="section bg-body dark:bg-zinc-950">
      <div className="container">
        <div className="text-center mb-12">
          <span className="section-subtitle">Visual Showcase</span>
          <h2 className="section-title dark:text-white">Our Gallery</h2>
        </div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {imageList.map((src, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              onClick={() => setSelectedImg(src)}
              className="break-inside-avoid rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-secondary"
            >
              <img 
                src={src} 
                alt={`Gallery ${index}`} 
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImg(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setSelectedImg(null)}
            >
              <X size={32} />
            </button>
            <motion.img 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={selectedImg} 
              alt="Expanded view" 
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl border-4 border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Gallery;
