import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import Menu from '../components/Menu';
import Contact from '../components/Reservation';
import ScrollSequence from '../components/ScrollSequence';
import { motion } from 'framer-motion';

import { useLocation } from 'react-router-dom';

const Home = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <div className="relative min-h-[400vh]">
      {/* The Sticky Global Background */}
      <ScrollSequence frameCount={144} />

      {/* The Scrollable Content Sections */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Hero />
        <div className="relative">
          <About />
          <Menu />
          <Contact />
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
