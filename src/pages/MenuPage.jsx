import { motion } from 'framer-motion';
import MenuFlipBook from '../components/MenuFlipBook';
import AddToCartButton from '../components/AddToCartButton';

const MenuPage = () => {
  const categories = [
    {
      title: 'Indian Cuisine',
      items: [
        { name: 'Dum Aloo', price: '₹100', desc: 'Spiced baby potatoes cooked in a rich, creamy gravy.' },
        { name: 'Stuffed Tomato', price: '₹100', desc: 'Whole tomatoes stuffed with paneer and spices.' },
        { name: 'Paneer Masala', price: '₹110', desc: 'Cottage cheese in a spicy onion-tomato gravy.' },
        { name: 'Butter Paneer Masala', price: '₹120', desc: 'Rich, creamy, and mildly sweet tomato gravy with butter.' },
        { name: 'Kadhai Paneer', price: '₹120', desc: 'Paneer cooked with bell peppers and freshly ground spices.' },
        { name: 'Paneer Tikka Masala', price: '₹140', desc: 'Grilled paneer cubes in a spicy tikka gravy.' },
        { name: 'Kaju Curry', price: '₹140', desc: 'Rich cashew nut curry.' }
      ]
    },
    {
      title: 'Chinese Delights',
      items: [
        { name: 'Veg Noodles', price: '₹90', desc: 'Classic stir-fried noodles with veggies.' },
        { name: 'Veg Manchurian', price: '₹90', desc: 'Veg balls in spicy manchurian sauce.' },
        { name: 'Chilli Potato', price: '₹110', desc: 'Crispy potatoes tossed in spicy chilli sauce.' },
        { name: 'Paneer Dragon', price: '₹160', desc: 'Paneer cubes in a fiery dragon sauce.' }
      ]
    },
    {
      title: 'South Indian',
      items: [
        { name: 'Plain Dosa', price: '₹70', desc: 'Crispy rice crepe served with chutney and sambar.' },
        { name: 'Masala Dosa', price: '₹80', desc: 'Crispy rice crepe filled with spiced potato mash.' },
        { name: 'Paneer Dosa', price: '₹100', desc: 'Rice crepe stuffed with spiced paneer.' }
      ]
    },
    {
      title: 'Tandoor & Breads',
      items: [
        { name: 'Butter Naan', price: '₹30', desc: 'Soft leavened bread with butter.' },
        { name: 'Garlic Naan', price: '₹40', desc: 'Naan flavoured with garlic and herbs.' },
        { name: 'Tandoori Roti', price: '₹12', desc: 'Whole wheat bread cooked in tandoor.' }
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 lg:pt-32 pb-20 dark:bg-zinc-950 min-h-screen"
    >
      <section className="bg-primary py-16 lg:py-24 text-center text-white mb-16">
        <div className="container">
          <h1 className="text-4xl lg:text-6xl font-title font-bold text-secondary mb-4">Our Complete Menu</h1>
          <p className="text-lg lg:text-xl opacity-90">Explore our wide range of authentic dishes</p>
        </div>
      </section>

      <section className="container mb-24 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="bg-body dark:bg-zinc-900 shadow-2xl rounded-3xl p-4 lg:p-10 border border-black/5 dark:border-white/5">
            <MenuFlipBook />
          </div>
        </div>
      </section>

      <div className="container space-y-20">
        {categories.map((category, idx) => (
          <div key={idx} className="space-y-10">
            <div className="text-center">
              <h2 className="text-3xl font-title font-bold text-primary dark:text-secondary inline-block relative pb-2 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-secondary">
                {category.title}
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
              {category.items.map((item, i) => (
                <div key={i} className="flex gap-3 sm:gap-4 p-4 sm:p-6 bg-body dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-primary/10 dark:bg-secondary/10 shrink-0 flex items-center justify-center text-primary dark:text-secondary font-title font-bold text-xl sm:text-2xl">
                    {item.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-title dark:text-gray-100 text-base sm:text-lg leading-tight">{item.name}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-primary font-bold whitespace-nowrap text-sm sm:text-base">{item.price}</span>
                        <AddToCartButton item={{
                          id: `${idx}-${i}-${item.name}`,
                          title: item.name,
                          price: item.price,
                          image: '/assets/placeholder-food.png'
                        }} size="small" />
                      </div>
                    </div>
                    {item.desc && <p className="text-sm text-text dark:text-gray-400 italic line-clamp-2">{item.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default MenuPage;
