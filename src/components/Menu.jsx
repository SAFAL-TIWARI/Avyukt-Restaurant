import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AddToCartButton from './AddToCartButton';

const Menu = () => {
  const menuItems = [
    {
      id: 1,
      title: 'Paneer Tikka Masala',
      price: '₹200',
      description: 'Char-grilled cottage cheese cubes simmered in a rich, spiced tomato gravy.',
      image: '/assets/paneer.jpeg'
    },
    {
      id: 2,
      title: 'Veg Hakka Noodles',
      price: '₹100',
      description: 'Classic wok-tossed noodles with fresh vegetables and aromatic Chinese spices.',
      image: '/assets/noodles.jpeg'
    },
    {
      id: 3,
      title: 'Masala Dosa',
      price: '₹130',
      description: 'Crispy golden crepe filled with spiced potato mash, served with coconut chutney and sambar.',
      image: '/assets/dosa.jpeg'
    },
    {
      id: 4,
      title: 'Gulab Jamun',
      price: '₹40/2',
      description: 'Soft, melt-in-your-mouth fried dumplings soaked in rose-flavored sugar syrup.',
      image: '/assets/jamun.jpeg'
    }
  ];

  return (
    <section id="menu" className="section bg-transparent transition-colors duration-300">
      <div className="container">
        <div className="text-center mb-12">
          <span className="section-subtitle text-secondary font-semibold">Specialities</span>
          <h2 className="section-title text-white">Our Featured Menu</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {menuItems.map((item, index) => (
            <motion.article 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl hover:shadow-primary/20 transition-all duration-300 group flex flex-col h-full"
            >
              <div className="h-56 overflow-hidden relative">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-primary/90 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  {item.price}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-gray-300 text-sm mb-6 flex-grow">
                  {item.description}
                </p>
                <AddToCartButton item={item} />
              </div>
            </motion.article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/menu" className="btn btn-secondary text-white shadow-lg shadow-secondary/20">
            View Full Menu
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Menu;
