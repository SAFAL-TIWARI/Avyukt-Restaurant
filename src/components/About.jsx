import React from 'react';
import { Check } from 'lucide-react';

const About = () => {
  return (
    <section id="about" className="section bg-transparent">
      <div className="container grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="relative">
          <div className="rounded-3xl overflow-hidden border-8 border-secondary/20 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 bg-zinc-900/50 backdrop-blur-sm">
            <img src="/assets/images/interior.jpeg" alt="Interior" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary rounded-2xl flex items-center justify-center text-white text-center p-4 shadow-xl">
            <p className="font-bold text-sm">Authentic Tastes Since 2020</p>
          </div>
        </div>

        <div>
          <span className="section-subtitle !text-left text-secondary font-semibold">Our Story</span>
          <h2 className="section-title !text-left after:left-0 after:translate-x-0 mb-8 text-white">
            Tradition Meets <br /> Innovation
          </h2>
          <p className="text-gray-200 dark:text-gray-300 mb-6 text-justify lg:text-lg drop-shadow-sm">
            Founded with a passion for hospitality, <b className="text-secondary font-bold">Avyukt Restaurant</b> brings you the finest vegetarian culinary delights. We believe in using fresh, locally sourced ingredients to create dishes that comfort the soul and excite the palate.
          </p>
          <p className="text-gray-200 dark:text-gray-300 mb-8 text-justify lg:text-lg drop-shadow-sm">
            From the rich gravies of North India to the zesty stir-frys of China, our menu is a celebration of diverse flavors, served in an ambiance designed for your comfort.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {['Authentic Recipes', 'Premium Ambience', 'Pure Vegetarian', 'Fresh Ingredients'].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <div className="bg-primary/20 p-1 rounded-full">
                  <Check size={16} className="text-primary" />
                </div>
                <span className="font-medium text-white dark:text-gray-200">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
