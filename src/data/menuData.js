// Centralized menu data for search and display across the website

export const menuCategories = [
 
];

// Helper to get all items including dynamic dishes
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

  return combinedCategories.flatMap(category =>
    (category.items || []).map(item => ({
      ...item,
      category: category.title || 'General',
      image: item.image || '/assets/paneer.jpeg',
    }))
  );
};

export const allMenuItems = getAllMenuItems();

// Search function: fuzzy matches against name, desc, and category
export const searchMenuItems = (query) => {
  if (!query || query.trim().length < 1) return [];
  const lowerQuery = query.toLowerCase().trim();
  const items = getAllMenuItems();

  return items
    .filter(item => {
      const searchableText = `${item.name || ''} ${item.desc || ''} ${item.category || ''}`.toLowerCase();
      const words = lowerQuery.split(/\s+/);
      return words.every(word => searchableText.includes(word));
    })
    .slice(0, 8);
};
