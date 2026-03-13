import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import Menu from '../components/Menu';
// import Gallery from '../components/Gallery';
import Contact from '../components/Reservation';
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      <About />
      <Menu />
      {/* <Gallery /> */}
      <Contact />
    </motion.div>
  );
};

export default Home;
