import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Music, Users, Camera } from 'lucide-react';

const AboutPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 lg:pt-32 pb-20 dark:bg-zinc-950 transition-colors"
    >
      <section className="bg-primary py-16 lg:py-24 text-center text-white mb-20">
        <div className="container">
          <h1 className="text-4xl lg:text-6xl font-title font-bold text-secondary mb-4">About Us</h1>
          <p className="text-lg lg:text-xl opacity-90">Our story of tradition and taste</p>
        </div>
      </section>

      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-title font-bold dark:text-white">Our Story</h2>
            <span className="block text-secondary font-bold uppercase tracking-widest text-sm">Established in 2020</span>
            <p className="text-text dark:text-gray-400 leading-relaxed text-lg text-justify">
              Located in the heart of Hotel Grand Ashok, Vidisha, Avyukt Restaurant has been serving delightful culinary experiences since 2020. 
              We are a pure vegetarian establishment dedicated to bringing you authentic flavors across a diverse range of cuisines, including Indian, Chinese, Continental, Punjabi, and South Indian delicacies.
            </p>
            <p className="text-text dark:text-gray-400 leading-relaxed text-lg text-justify">
              Whether you are looking for a hearty breakfast, a cozy dine-in experience, or a special candlelight dinner under the stars with our rooftop seating and live music, Avyukt Restaurant is the perfect destination for every occasion.
            </p>
          </div>
          <div className="rounded-[3rem] overflow-hidden shadow-2xl border-8 border-secondary/10">
            <img 
              src="https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop" 
              alt="Restaurant Ambiance" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="text-center mb-16">
          <h2 className="section-title dark:text-white">Offerings & Amenities</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <Utensils size={32} />, title: "Dine-in, Takeaway & Delivery" },
            { icon: <Users size={32} />, title: "Pure Vegetarian" },
            { icon: <Music size={32} />, title: "Live Music & Rooftop Seating" },
            { icon: <Camera size={32} />, title: "Kid-Friendly Environment" }
          ].map((item, idx) => (
            <div key={idx} className="bg-body dark:bg-zinc-900 p-8 rounded-3xl text-center space-y-4 hover:shadow-xl transition-all border border-transparent hover:border-secondary/20">
              <div className="text-primary dark:text-secondary flex justify-center">{item.icon}</div>
              <h3 className="font-bold text-title dark:text-gray-200">{item.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AboutPage;
