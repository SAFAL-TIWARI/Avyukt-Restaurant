import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Flame, UtensilsCrossed, ChevronRight, Search } from 'lucide-react';

const recipes = [
  {
    id: 1,
    title: "Signature Hyderabadi Biryani",
    chef: "Chef Vikram",
    time: "90 min",
    serves: "4-6",
    difficulty: "Advanced",
    image: "/assets/recipes/biryani.png",
    category: "Main Course",
    ingredients: [
      "1kg Long grain Basmati Rice",
      "1kg Tender Goat Meat",
      "200g Fried Onions (Birista)",
      "1 cup Fresh Mint & Coriander",
      "Saffron soaked in warm milk",
      "Ghee & Whole Spices"
    ],
    description: "Our legendary Biryani, slow-cooked in 'Dum' style with aged basmati rice and hand-picked spices."
  },
  {
    id: 2,
    title: "Avyukt Special Royal Thali",
    chef: "Chef Meera",
    time: "120 min",
    serves: "2",
    difficulty: "Expert",
    image: "/assets/recipes/thali.png",
    category: "Experience",
    ingredients: [
      "Selection of 3 House Curries",
      "Dal Makhani",
      "Jeera Rice & Garlic Naan",
      "Fresh Raita & Salad",
      "Gulab Jamun dessert",
      "Roasted Papad"
    ],
    description: "A complete royal experience featuring a curated selection of our most loved regional delicacies."
  },
  {
    id: 3,
    title: "Paneer Butter Masala",
    chef: "Chef Arjun",
    time: "40 min",
    serves: "3-4",
    difficulty: "Medium",
    image: "/assets/recipes/paneer.png",
    category: "Main Course",
    ingredients: [
      "500g Fresh Malai Paneer",
      "4 Large Tomatoes (pureed)",
      "1/2 cup Fresh Cream",
      "Cashew paste",
      "Kashmiri Red Chilli Powder",
      "Kasuri Methi"
    ],
    description: "Velvety smooth tomato gravy with succulent paneer cubes, finished with a touch of fresh cream."
  },
  {
    id: 4,
    title: "Stuffed Gulab Jamun",
    chef: "Chef Priya",
    time: "60 min",
    serves: "6-8",
    difficulty: "Medium",
    image: "/assets/recipes/jamun.png",
    category: "Dessert",
    ingredients: [
      "500g Khoya (Mawa)",
      "100g Paneer",
      "Sugar Syrup with Cardamom",
      "Saffron strands",
      "Crushed Rose petals",
      "Pistachio for stuffing"
    ],
    description: "Soft, melt-in-your-mouth milk solid dumplings stuffed with nuts and soaked in aromatic syrup."
  }
];

const RecipesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Main Course', 'Dessert', 'Experience'];

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         recipe.chef.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 lg:pt-32 pb-20 dark:bg-zinc-950"
    >
      {/* Hero Section */}
      <section className="container mb-16">
        <div className="text-center space-y-4 mb-12">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-subtitle"
          >
            Culinary Secrets
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-6xl font-title text-title dark:text-white"
          >
            From Our <span className="text-primary italic">Kitchen</span> to Yours
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-text dark:text-gray-400"
          >
            Discover the artistry behind Avyukt's signature dishes. Our master chefs share their 
            carefully guarded recipes for you to recreate the magic at home.
          </motion.p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white dark:bg-zinc-900/50 p-6 rounded-3xl shadow-xl dark:border dark:border-white/5 backdrop-blur-md">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'bg-gray-100 dark:bg-zinc-800 text-text dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search recipes or chefs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-zinc-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all outline-none"
            />
          </div>
        </div>
      </section>

      {/* Recipes Grid */}
      <section className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl dark:shadow-none dark:border dark:border-white/5 flex flex-col h-full"
              >
                {/* Image Container */}
                <div className="relative h-72 overflow-hidden">
                  <img 
                    src={recipe.image} 
                    alt={recipe.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-6 left-6">
                    <span className="px-4 py-1.5 bg-primary/90 text-white text-xs font-bold rounded-full backdrop-blur-md uppercase tracking-wider">
                      {recipe.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-title dark:text-white mb-1">{recipe.title}</h3>
                      <p className="text-secondary font-medium italic text-sm">by {recipe.chef}</p>
                    </div>
                  </div>

                  <p className="text-text dark:text-gray-400 text-sm mb-6 line-clamp-2">
                    {recipe.description}
                  </p>

                  <div className="grid grid-cols-3 gap-4 py-4 mb-6 border-y border-gray-100 dark:border-zinc-800">
                    <div className="flex flex-col items-center gap-1">
                      <Clock size={16} className="text-primary" />
                      <span className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold">Time</span>
                      <span className="text-xs font-bold dark:text-white">{recipe.time}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Users size={16} className="text-primary" />
                      <span className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold">Serves</span>
                      <span className="text-xs font-bold dark:text-white">{recipe.serves}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Flame size={16} className="text-primary" />
                      <span className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold">Level</span>
                      <span className="text-xs font-bold dark:text-white">{recipe.difficulty}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {/* Ingredient icons as visual flavor */}
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center border-2 border-white dark:border-zinc-900">
                        <UtensilsCrossed size={12} className="text-secondary" />
                      </div>
                    </div>
                    <button className="flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all">
                      View Recipe <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredRecipes.length === 0 && (
          <div className="text-center py-20">
            <UtensilsCrossed size={48} className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-xl dark:text-white mb-2">No recipes found</h3>
            <p className="text-text dark:text-gray-400">Try adjusting your filters or search term.</p>
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default RecipesPage;
