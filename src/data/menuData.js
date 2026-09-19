// Centralized menu data for search and display across the website

export const menuCategories = [
 
];

// Helper to get all items including dynamic dishes from local storage and firestore
export const getAllMenuItems = () => {
  let combinedCategories = menuCategories;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('avyukt_full_menu');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          combinedCategories = parsed;
        }
      }
    } catch (e) {
      // Use fallback
    }
  }

  let items = combinedCategories.flatMap(category =>
    (category.items || []).map(item => ({
      ...item,
      name: item.name || item.title,
      category: category.title || 'General',
      image: item.image || '/assets/paneer.jpeg',
    }))
  );

  // If full menu is empty or only has few items, also incorporate featured menu items
  if (typeof window !== 'undefined') {
    try {
      const featured = localStorage.getItem('avyukt_featured_menu');
      if (featured) {
        const parsed = JSON.parse(featured);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const featuredItems = parsed.map(item => ({
            ...item,
            name: item.title || item.name,
            category: item.category || 'Speciality',
            image: item.image || '/assets/paneer.jpeg'
          }));
          // Merge unique by title/name
          const existingNames = new Set(items.map(i => (i.name || '').toLowerCase()));
          featuredItems.forEach(fi => {
            if (fi.name && !existingNames.has(fi.name.toLowerCase())) {
              items.push(fi);
            }
          });
        }
      }
    } catch (e) {}
  }

  return items;
};

export const allMenuItems = getAllMenuItems();

// Search function: matches against name, desc, and category with no artificial limit
export const searchMenuItems = (query) => {
  if (!query || query.trim().length < 1) return [];
  const lowerQuery = query.toLowerCase().trim();
  const items = getAllMenuItems();

  return items.filter(item => {
    const searchableText = `${item.name || item.title || ''} ${item.desc || ''} ${item.category || ''}`.toLowerCase();
    const words = lowerQuery.split(/\s+/);
    return words.every(word => searchableText.includes(word));
  });
};
