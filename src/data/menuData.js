// Centralized menu data for search and display across the website

export const menuCategories = [
  {
    title: 'Indian Cuisine',
    items: [
      { id: 'ind-1', name: 'Dum Aloo', price: '₹100', desc: 'Spiced baby potatoes cooked in a rich, creamy gravy.', image: '/assets/paneer.jpeg' },
      { id: 'ind-2', name: 'Stuffed Tomato', price: '₹100', desc: 'Whole tomatoes stuffed with paneer and spices.', image: '/assets/paneer.jpeg' },
      { id: 'ind-3', name: 'Paneer Masala', price: '₹110', desc: 'Cottage cheese in a spicy onion-tomato gravy.', image: '/assets/paneer.jpeg' },
      { id: 'ind-4', name: 'Butter Paneer Masala', price: '₹120', desc: 'Rich, creamy, and mildly sweet tomato gravy with butter.', image: '/assets/paneer.jpeg' },
      { id: 'ind-5', name: 'Kadhai Paneer', price: '₹120', desc: 'Paneer cooked with bell peppers and freshly ground spices.', image: '/assets/paneer.jpeg' },
      { id: 'ind-6', name: 'Paneer Tikka Masala', price: '₹140', desc: 'Grilled paneer cubes in a spicy tikka gravy.', image: '/assets/paneer.jpeg' },
      { id: 'ind-7', name: 'Kaju Curry', price: '₹140', desc: 'Rich cashew nut curry.', image: '/assets/paneer.jpeg' },
    ]
  },
  {
    title: 'Chinese Delights',
    items: [
      { id: 'chn-1', name: 'Veg Noodles', price: '₹90', desc: 'Classic stir-fried noodles with veggies.', image: '/assets/noodles.jpeg' },
      { id: 'chn-2', name: 'Veg Manchurian', price: '₹90', desc: 'Veg balls in spicy manchurian sauce.', image: '/assets/noodles.jpeg' },
      { id: 'chn-3', name: 'Chilli Potato', price: '₹110', desc: 'Crispy potatoes tossed in spicy chilli sauce.', image: '/assets/noodles.jpeg' },
      { id: 'chn-4', name: 'Paneer Dragon', price: '₹160', desc: 'Paneer cubes in a fiery dragon sauce.', image: '/assets/noodles.jpeg' },
      { id: 'chn-5', name: 'Veg Hakka Noodles', price: '₹100', desc: 'Classic wok-tossed noodles with fresh vegetables and aromatic Chinese spices.', image: '/assets/noodles.jpeg' },
    ]
  },
  {
    title: 'South Indian',
    items: [
      { id: 'si-1', name: 'Plain Dosa', price: '₹70', desc: 'Crispy rice crepe served with chutney and sambar.', image: '/assets/dosa.jpeg' },
      { id: 'si-2', name: 'Masala Dosa', price: '₹80', desc: 'Crispy rice crepe filled with spiced potato mash.', image: '/assets/dosa.jpeg' },
      { id: 'si-3', name: 'Paneer Dosa', price: '₹100', desc: 'Rice crepe stuffed with spiced paneer.', image: '/assets/dosa.jpeg' },
    ]
  },
  {
    title: 'Tandoor & Breads',
    items: [
      { id: 'tb-1', name: 'Butter Naan', price: '₹30', desc: 'Soft leavened bread with butter.', image: '/assets/paneer.jpeg' },
      { id: 'tb-2', name: 'Garlic Naan', price: '₹40', desc: 'Naan flavoured with garlic and herbs.', image: '/assets/paneer.jpeg' },
      { id: 'tb-3', name: 'Tandoori Roti', price: '₹12', desc: 'Whole wheat bread cooked in tandoor.', image: '/assets/paneer.jpeg' },
    ]
  },
  {
    title: 'Desserts',
    items: [
      { id: 'ds-1', name: 'Gulab Jamun', price: '₹40/2', desc: 'Soft, melt-in-your-mouth fried dumplings soaked in rose-flavored sugar syrup.', image: '/assets/jamun.jpeg' },
    ]
  }
];

// Flat list of all items for search
export const allMenuItems = menuCategories.flatMap(category =>
  category.items.map(item => ({
    ...item,
    category: category.title,
  }))
);

// Search function: fuzzy matches against name, desc, and category
export const searchMenuItems = (query) => {
  if (!query || query.trim().length < 1) return [];
  const lowerQuery = query.toLowerCase().trim();
  
  return allMenuItems
    .filter(item => {
      const searchableText = `${item.name} ${item.desc} ${item.category}`.toLowerCase();
      // Split query into words and check if all words match somewhere
      const words = lowerQuery.split(/\s+/);
      return words.every(word => searchableText.includes(word));
    })
    .slice(0, 6); // Limit results
};
