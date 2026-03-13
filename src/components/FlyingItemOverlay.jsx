import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FlyingItemOverlay = ({ item }) => {
  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={item.id}
        initial={{ 
          opacity: 0.8, 
          scale: 0.5,
          x: item.start.x,
          y: item.start.y
        }}
        animate={{ 
          opacity: [0.8, 1, 0],
          scale: [0.5, 0.8, 0.2],
          x: item.end.x,
          y: item.end.y
        }}
        transition={{ 
          duration: 0.8, 
          ease: "easeInOut"
        }}
        className="fixed top-0 left-0 w-12 h-12 z-[9999] pointer-events-none"
        style={{ translateX: '-50%', translateY: '-50%' }}
      >
        <img 
          src={item.image} 
          alt="flying item" 
          className="w-full h-full object-cover rounded-full shadow-2xl border-2 border-primary"
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default FlyingItemOverlay;
