import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, LayoutGrid, List, Save, 
  ChefHat, Sparkles, X, ChevronLeft, ChevronRight, CheckCircle2,
  Edit3, Undo2, ArrowUp, ArrowDown, Search
} from 'lucide-react';
import MenuFlipBook from '../components/MenuFlipBook';
import AddToCartButton from '../components/AddToCartButton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, doc, getDoc, setDoc } from '../firebase/config';
import { menuCategories } from '../data/menuData';

const INITIAL_CATEGORIES = menuCategories;

const MenuPage = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  // Sanitize any corrupt prices from manual entry (e.g. "ef" -> "120")
  const sanitizeCategories = (cats) => {
    if (!Array.isArray(cats)) return [];
    return cats.map(cat => ({
      ...cat,
      items: (cat.items || []).map(item => {
        let price = item.price;
        const num = parseInt(String(price).replace(/[^\d]/g, ''), 10);
        if (isNaN(num) || num <= 0) {
          price = '₹120';
        } else {
          price = `₹${num}`;
        }
        return { ...item, price };
      })
    }));
  };

  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('avyukt_full_menu');
      return saved ? sanitizeCategories(JSON.parse(saved)) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [viewMode, setViewMode] = useState('list'); // Default list view as requested
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const menuSnapshotRef = useRef(null);
  const categoryScrollRefs = useRef({});
  const [saving, setSaving] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    const list = categories.map((cat, origIdx) => ({ ...cat, origIdx }));
    if (!menuSearchQuery.trim()) return list;
    const q = menuSearchQuery.toLowerCase().trim();
    return list
      .map(cat => {
        const catMatches = (cat.title || '').toLowerCase().includes(q);
        const matchingItems = (cat.items || []).map((item, origItemIdx) => ({ ...item, origItemIdx })).filter(item => {
          const nameMatches = (item.name || '').toLowerCase().includes(q);
          const descMatches = (item.desc || '').toLowerCase().includes(q);
          const priceMatches = String(item.price || '').toLowerCase().includes(q);
          return nameMatches || descMatches || priceMatches || catMatches;
        });
        return {
          ...cat,
          items: matchingItems
        };
      })
      .filter(cat => cat.items.length > 0);
  }, [categories, menuSearchQuery]);

  const handleCategoryScroll = (catIdx, direction) => {
    const el = categoryScrollRefs.current[catIdx];
    if (el) {
      const scrollAmt = direction === 'left' ? -320 : 320;
      el.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  // Add Item Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [targetCategoryIndex, setTargetCategoryIndex] = useState(0);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [addItemPosition, setAddItemPosition] = useState('end'); // 'start' (top) or 'end' (bottom)

  // Edit Item Modal State
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingCatIdx, setEditingCatIdx] = useState(null);
  const [editingItemIdx, setEditingItemIdx] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');
  const [editItemImage, setEditItemImage] = useState('');
  const [editItemPosition, setEditItemPosition] = useState(1);

  // Add Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [addCategoryPosition, setAddCategoryPosition] = useState('end'); // 'start' or 'end'

  // Edit Category Modal State
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategoryIdx, setEditingCategoryIdx] = useState(null);
  const [editCategoryTitle, setEditCategoryTitle] = useState('');
  const [editCategoryPosition, setEditCategoryPosition] = useState(1);

  // Sync menu from Firestore
  useEffect(() => {
    if (!db) return;
    const fetchMenu = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'fullMenu'));
        if (snap.exists() && snap.data().categories?.length > 0) {
          const sanitized = sanitizeCategories(snap.data().categories);
          setCategories(sanitized);
          localStorage.setItem('avyukt_full_menu', JSON.stringify(sanitized));
        }
      } catch (err) {
        console.warn('Firestore menu note:', err.message);
      }
    };
    fetchMenu();
  }, []);

  // Start Menu Edit Mode
  const handleStartEditMenu = () => {
    menuSnapshotRef.current = JSON.parse(JSON.stringify(categories));
    setIsEditingMenu(true);
    addToast({
      title: 'Menu Edit Mode Active',
      message: 'You can now add or delete categories and dishes. Click "Save Changes" to apply or "Cancel" to revert.',
      type: 'info',
    });
  };

  // Cancel Menu Edit & Revert to Snapshot
  const handleCancelEdit = () => {
    if (menuSnapshotRef.current) {
      setCategories(menuSnapshotRef.current);
    }
    setIsEditingMenu(false);
    addToast({
      title: 'Changes Reverted',
      message: 'Menu restored to previous saved state.',
      type: 'info',
    });
  };

  // Save full menu to Firestore and LocalStorage
  const handleSaveAllMenu = async (customList) => {
    const listToSave = customList || categories;
    setSaving(true);
    try {
      localStorage.setItem('avyukt_full_menu', JSON.stringify(listToSave));
      if (db) {
        await setDoc(doc(db, 'settings', 'fullMenu'), {
          categories: listToSave,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      setIsEditingMenu(false);
      addToast({
        title: 'Menu Updated & Saved',
        message: 'All categories and menu items have been updated across the website.',
        type: 'success',
      });
    } catch (err) {
      console.error('Error saving menu:', err);
      addToast({
        title: 'Save Failed',
        message: err.message || 'Could not save to cloud database.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Open Add Item Modal for a specific category
  const openAddItemModal = (catIdx) => {
    setTargetCategoryIndex(catIdx);
    setItemName('');
    setItemPrice('');
    setItemDesc('');
    setItemImage('');
    setAddItemPosition('end');
    setShowItemModal(true);
  };

  // Submit Add Item (updates in real time with numeric price only)
  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    const cleanNum = parseInt(String(itemPrice).replace(/[^0-9]/g, ''), 10);
    if (!itemName.trim() || isNaN(cleanNum) || cleanNum <= 0) {
      addToast({ title: 'Invalid Price', message: 'Please enter a valid numeric price (e.g. 150).', type: 'warning' });
      return;
    }

    const formattedPrice = `₹${cleanNum}`;
    const newItem = {
      name: itemName.trim(),
      price: formattedPrice,
      desc: itemDesc.trim() || 'Prepared fresh with royal spices and culinary mastery.',
      image: itemImage.trim() || '',
    };

    const updated = categories.map((cat, idx) => {
      if (idx === targetCategoryIndex) {
        const newItems = addItemPosition === 'start' 
          ? [newItem, ...cat.items]
          : [...cat.items, newItem];
        return {
          ...cat,
          items: newItems
        };
      }
      return cat;
    });

    setCategories(updated);
    setShowItemModal(false);
    addToast({
      title: 'Dish Added (Unsaved)',
      message: `"${newItem.name}" added to menu (${addItemPosition === 'start' ? 'top position' : 'end'}). Click "Save Changes" to publish.`,
      type: 'success',
    });
  };

  // Open Edit Item Modal
  const openEditItemModal = (catIdx, itemIdx) => {
    const item = categories[catIdx]?.items?.[itemIdx];
    if (!item) return;
    setEditingCatIdx(catIdx);
    setEditingItemIdx(itemIdx);
    setEditItemName(item.name || '');
    const num = String(item.price || '').replace(/[^0-9]/g, '');
    setEditItemPrice(num);
    setEditItemDesc(item.desc || '');
    setEditItemImage(item.image || '');
    setEditItemPosition(itemIdx + 1);
    setShowEditItemModal(true);
  };

  // Submit Edit Item
  const handleEditItemSubmit = (e) => {
    e.preventDefault();
    const cleanNum = parseInt(String(editItemPrice).replace(/[^0-9]/g, ''), 10);
    if (!editItemName.trim() || isNaN(cleanNum) || cleanNum <= 0) {
      addToast({ title: 'Invalid Price', message: 'Please enter a valid numeric price (e.g. 150).', type: 'warning' });
      return;
    }

    const formattedPrice = `₹${cleanNum}`;
    const updated = categories.map((cat, cIdx) => {
      if (cIdx === editingCatIdx) {
        const newItems = [...cat.items];
        // Remove item from previous position
        const [oldItem] = newItems.splice(editingItemIdx, 1);
        const updatedItem = {
          ...oldItem,
          name: editItemName.trim(),
          price: formattedPrice,
          desc: editItemDesc.trim() || 'Prepared fresh with royal spices and culinary mastery.',
          image: editItemImage.trim() || '',
        };
        // Insert into requested position
        const targetIdx = Math.max(0, Math.min(newItems.length, (Number(editItemPosition) || 1) - 1));
        newItems.splice(targetIdx, 0, updatedItem);

        return {
          ...cat,
          items: newItems
        };
      }
      return cat;
    });

    setCategories(updated);
    setShowEditItemModal(false);
    addToast({
      title: 'Dish Updated (Unsaved)',
      message: `"${editItemName.trim()}" details & order updated. Click "Save Changes" to publish.`,
      type: 'success',
    });
  };

  // Move Item within a category (earlier or later)
  const handleMoveItem = (catIdx, itemIdx, direction) => {
    const cat = categories[catIdx];
    if (!cat || !cat.items) return;
    const targetIdx = direction === 'prev' ? itemIdx - 1 : itemIdx + 1;
    if (targetIdx < 0 || targetIdx >= cat.items.length) return;

    const updated = categories.map((c, cIdx) => {
      if (cIdx === catIdx) {
        const newItems = [...c.items];
        const [moved] = newItems.splice(itemIdx, 1);
        newItems.splice(targetIdx, 0, moved);
        return { ...c, items: newItems };
      }
      return c;
    });

    setCategories(updated);
  };

  // Delete Item from a category (updates in real time)
  const handleDeleteItem = (catIdx, itemIdx, itemTitle) => {
    if (!window.confirm(`Delete "${itemTitle}" from menu?`)) return;
    const updated = categories.map((cat, idx) => {
      if (idx === catIdx) {
        return {
          ...cat,
          items: cat.items.filter((_, i) => i !== itemIdx)
        };
      }
      return cat;
    });
    setCategories(updated);
  };

  // Move Category Up or Down
  const handleMoveCategory = (catIdx, direction) => {
    const targetIdx = direction === 'up' ? catIdx - 1 : catIdx + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;
    const updated = [...categories];
    const [moved] = updated.splice(catIdx, 1);
    updated.splice(targetIdx, 0, moved);
    setCategories(updated);
    addToast({
      title: 'Category Reordered',
      message: `"${moved.title}" moved ${direction}. Click "Save Changes" to publish.`,
      type: 'info',
    });
  };

  // Open Edit Category Modal
  const openEditCategoryModal = (catIdx, currentTitle) => {
    setEditingCategoryIdx(catIdx);
    setEditCategoryTitle(currentTitle || '');
    setEditCategoryPosition(catIdx + 1);
    setShowEditCategoryModal(true);
  };

  // Submit Edit Category
  const handleEditCategorySubmit = (e) => {
    e.preventDefault();
    if (!editCategoryTitle.trim()) return;

    const updated = [...categories];
    const [oldCat] = updated.splice(editingCategoryIdx, 1);
    const updatedCat = {
      ...oldCat,
      title: editCategoryTitle.trim()
    };
    const targetIdx = Math.max(0, Math.min(updated.length, (Number(editCategoryPosition) || 1) - 1));
    updated.splice(targetIdx, 0, updatedCat);

    setCategories(updated);
    setShowEditCategoryModal(false);
    addToast({
      title: 'Category Updated (Unsaved)',
      message: `"${editCategoryTitle.trim()}" updated. Click "Save Changes" to publish.`,
      type: 'success',
    });
  };

  // Submit Add New Category (updates in real time)
  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCategoryTitle.trim()) return;

    const newCat = {
      title: newCategoryTitle.trim(),
      items: []
    };

    const updated = addCategoryPosition === 'start'
      ? [newCat, ...categories]
      : [...categories, newCat];

    setCategories(updated);
    setNewCategoryTitle('');
    setShowCategoryModal(false);
    addToast({
      title: 'Category Added (Unsaved)',
      message: `"${newCat.title}" created (${addCategoryPosition === 'start' ? 'top of menu' : 'bottom'}). Click "Save Changes" to publish.`,
      type: 'success',
    });
  };

  // Delete Category (updates in real time)
  const handleDeleteCategory = (catIdx, catTitle) => {
    if (!window.confirm(`Are you sure you want to delete category "${catTitle}" and all its dishes?`)) return;
    const updated = categories.filter((_, idx) => idx !== catIdx);
    setCategories(updated);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 lg:pt-32 pb-20 bg-body dark:bg-zinc-950 min-h-screen transition-colors duration-300"
    >
      {/* Hero Banner */}
      <section className="bg-primary py-16 lg:py-24 text-center text-white mb-12 shadow-md">
        <div className="container">
          <h1 className="text-4xl lg:text-6xl font-title font-bold text-secondary mb-4">Our Complete Menu</h1>
          <p className="text-lg lg:text-xl opacity-90">Explore our wide range of authentic royal dishes</p>
        </div>
      </section>

      {/* Interactive Menu Book Preview */}
      <section className="container mb-16 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="">
            <MenuFlipBook />
          </div>
        </div>
      </section>

      {/* Control Bar: View Changer (Grid / List) & Admin Controls */}
      <div className="sticky top-[88px] sm:top-[96px] z-30 mb-8 container px-4">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-amber-950/10 dark:border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: View Changer */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-text/60 dark:text-white/60 uppercase tracking-wider">View:</span>
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text/70 dark:text-white/70 hover:text-primary '
                }`}
                title="List View (Circular Items as shown in image)"
              >
                <List size={14} />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text/70 dark:text-white/70 hover:text-primary'
                }`}
                title="Grid View (Full Cards)"
              >
                <LayoutGrid size={14} />
                <span>Grid</span>
              </button>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="relative flex-1 max-w-md w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              placeholder="Search dishes, descriptions, categories..."
              className="w-full pl-9 pr-8 py-2 bg-gray-100 dark:bg-zinc-800 text-title dark:text-white placeholder:text-text/40 dark:placeholder:text-white/40 text-xs rounded-xl border border-black/5 dark:border-white/5 focus:border-primary/40 focus:outline-none transition-all"
            />
            {menuSearchQuery && (
              <button
                onClick={() => setMenuSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white p-0.5 rounded-full cursor-pointer"
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Right: Admin Management Controls */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {!isEditingMenu ? (
                <button
                  onClick={handleStartEditMenu}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-sm cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>Edit Menu</span>
                </button>
              ) : (
                <>
                  {/* Cancel Button in place of Edit Menu */}
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-200 dark:bg-zinc-800 text-title dark:text-white font-bold text-xs rounded-xl hover:bg-gray-300 dark:hover:bg-zinc-700 transition-all shadow-sm cursor-pointer"
                  >
                    <X size={14} />
                    <span>Cancel</span>
                  </button>

                  {/* Beside it: Save Changes Button */}
                  <button
                    onClick={() => handleSaveAllMenu()}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>

                  {/* Add Category Button */}
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-secondary text-title font-bold text-xs rounded-xl hover:bg-secondary/90 transition-all shadow-sm cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Category</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CATEGORIES SECTIONS */}
      <div className="container space-y-20">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-white/60 dark:bg-zinc-900/60 rounded-3xl border border-dashed border-amber-950/20 dark:border-white/10">
            <Search size={36} className="text-primary mx-auto mb-3" />
            <h4 className="text-base font-bold text-title dark:text-white mb-1">No dishes found</h4>
            <p className="text-xs text-text/60 dark:text-white/60 mb-4">
              No dishes or categories matched "{menuSearchQuery}".
            </p>
            <button
              onClick={() => setMenuSearchQuery('')}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark cursor-pointer transition-all"
            >
              Clear Search
            </button>
          </div>
        ) : (
          filteredCategories.map((category, catIdx) => {
            const actualCatIdx = category.origIdx ?? catIdx;
            return (
          <div key={actualCatIdx} className="space-y-8">
            
            {/* Category Header with Title, Scroll Arrows for Desktop, & Admin Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-950/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-title font-bold text-primary dark:text-secondary">
                  {category.title}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {category.items?.length || 0} items
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {/* Desktop Carousel Navigation Arrows for List View */}
                {viewMode === 'list' && (category.items?.length || 0) > 3 && (
                  <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
                    <button
                      onClick={() => handleCategoryScroll(actualCatIdx, 'left')}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-title dark:text-white transition-colors cursor-pointer"
                      title="Scroll Left"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => handleCategoryScroll(actualCatIdx, 'right')}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-title dark:text-white transition-colors cursor-pointer"
                      title="Scroll Right"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {/* Admin Category Actions: Add Dish + Reorder Up/Down + Rename Category + Delete Category - ONLY in edit mode */}
                {isAdmin && isEditingMenu && (
                  <>
                    <button
                      onClick={() => openAddItemModal(actualCatIdx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all shadow-sm cursor-pointer"
                      title={`Add new dish to ${category.title}`}
                    >
                      <Plus size={14} />
                      <span>Add Dish</span>
                    </button>

                    {/* Move Category Up / Down */}
                    <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-xl p-0.5 border border-amber-950/10 dark:border-white/10">
                      <button
                        disabled={actualCatIdx === 0}
                        onClick={() => handleMoveCategory(actualCatIdx, 'up')}
                        className="p-1.5 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-secondary disabled:opacity-25 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="Move Category Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        disabled={actualCatIdx === categories.length - 1}
                        onClick={() => handleMoveCategory(actualCatIdx, 'down')}
                        className="p-1.5 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-secondary disabled:opacity-25 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="Move Category Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => openEditCategoryModal(actualCatIdx, category.title)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
                      title={`Rename or reorder category "${category.title}"`}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteCategory(actualCatIdx, category.title)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                      title={`Delete category "${category.title}"`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Empty category state */}
            {category.items?.length === 0 && (
              <div className="text-center py-10 bg-white/60 dark:bg-zinc-900/60 rounded-3xl border border-dashed border-amber-950/20 dark:border-white/10">
                <p className="text-sm text-text/60 dark:text-white/60 mb-3">No dishes in this category yet.</p>
                {isAdmin && isEditingMenu && (
                  <button
                    onClick={() => openAddItemModal(actualCatIdx)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark cursor-pointer"
                  >
                    <Plus size={14} /> Add First Dish
                  </button>
                )}
              </div>
            )}

            {/* VIEW 1: CIRCULAR LIST VIEW (Matching the user's uploaded image!) */}
            {viewMode === 'list' ? (
              <div 
                ref={(el) => (categoryScrollRefs.current[actualCatIdx] = el)}
                className="flex gap-3 sm:gap-6 overflow-x-auto no-scrollbar pb-6 pt-2 scroll-smooth"
              >
                {category.items?.map((item, itemIdx) => {
                  const actualItemIdx = item.origItemIdx ?? itemIdx;
                  return (
                  <motion.div
                    key={`${actualCatIdx}-${actualItemIdx}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center shrink-0 w-28 sm:w-40 p-2 sm:p-4 transition-all group relative"
                  >
                    {/* Admin Edit, Reorder & Delete Item Buttons - ONLY when isEditingMenu */}
                    {isAdmin && isEditingMenu && (
                      <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-full p-0.5 sm:p-1 shadow-md border border-amber-950/10 dark:border-white/10 z-10">
                        <button
                          disabled={actualItemIdx === 0}
                          onClick={() => handleMoveItem(actualCatIdx, actualItemIdx, 'prev')}
                          className="p-1 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-secondary disabled:opacity-25 rounded-full transition-all cursor-pointer disabled:cursor-not-allowed"
                          title="Move dish earlier"
                        >
                          <ChevronLeft size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          disabled={actualItemIdx === (categories[actualCatIdx]?.items?.length - 1)}
                          onClick={() => handleMoveItem(actualCatIdx, actualItemIdx, 'next')}
                          className="p-1 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-secondary disabled:opacity-25 rounded-full transition-all cursor-pointer disabled:cursor-not-allowed"
                          title="Move dish later"
                        >
                          <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditItemModal(actualCatIdx, actualItemIdx)}
                          className="p-1 text-primary hover:text-primary-dark hover:bg-primary/10 rounded-full transition-all cursor-pointer"
                          title="Edit dish details & order"
                        >
                          <Edit3 size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(actualCatIdx, actualItemIdx, item.name)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-full transition-all cursor-pointer"
                          title="Delete dish"
                        >
                          <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Circular Image / Icon - reduced for mobile */}
                    <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-lg border-2 border-secondary/30 mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-300 bg-black/20 flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerHTML = `<span class="font-title font-bold text-xl sm:text-2xl text-primary dark:text-secondary">${item.name[0]}</span>`;
                          }}
                        />
                      ) : (
                        <span className="font-title font-bold text-xl sm:text-2xl text-primary dark:text-secondary">
                          {item.name[0]}
                        </span>
                      )}
                    </div>

                    {/* Dish Name */}
                    <h4 className="font-bold text-[11px] sm:text-sm text-title dark:text-white truncate max-w-[100px] sm:max-w-[140px] mb-0.5 sm:mb-1" title={item.name}>
                      {item.name}
                    </h4>

                    {/* Price */}
                    <span className="text-primary dark:text-secondary font-bold text-[11px] sm:text-xs mb-2 sm:mb-3">
                      {item.price}
                    </span>

                    {/* Add To Cart Button with + or - option */}
                    <div className="w-full mt-auto flex justify-center">
                      <AddToCartButton
                        item={{
                          id: item.id || `${actualCatIdx}-${actualItemIdx}-${item.name}`,
                          name: item.name,
                          title: item.name,
                          desc: item.desc || '',
                          price: item.price,
                          image: item.image || '/assets/paneer.jpeg',
                        }}
                        size="small"
                      />
                    </div>
                  </motion.div>
                );
                })}
              </div>
            ) : (
              /* VIEW 2: GRID VIEW (Horizontal scrollbar row on mobile, 2-column grid on desktop!) */
              <div className="flex overflow-x-auto no-scrollbar scroll-smooth gap-3.5 pb-3 sm:pb-0 sm:grid sm:grid-cols-2 lg:gap-8">
                {category.items?.map((item, itemIdx) => {
                  const actualItemIdx = item.origItemIdx ?? itemIdx;
                  return (
                  <div
                    key={`${actualCatIdx}-${actualItemIdx}`}
                    className="shrink-0 sm:shrink min-w-[240px] max-w-[260px] sm:min-w-0 sm:max-w-none flex gap-3 sm:gap-4 p-3 sm:p-6 bg-white/90 dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-amber-950/10 dark:border-white/10 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    {/* Admin Edit, Reorder & Delete Item Buttons - ONLY when isEditingMenu */}
                    {isAdmin && isEditingMenu && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-full p-1 sm:p-1.5 shadow-md border border-amber-950/10 dark:border-white/10 z-10">
                        <button
                          disabled={actualItemIdx === 0}
                          onClick={() => handleMoveItem(actualCatIdx, actualItemIdx, 'prev')}
                          className="p-1 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-secondary disabled:opacity-25 rounded-full transition-all cursor-pointer disabled:cursor-not-allowed"
                          title="Move dish earlier"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          disabled={actualItemIdx === (categories[actualCatIdx]?.items?.length - 1)}
                          onClick={() => handleMoveItem(actualCatIdx, actualItemIdx, 'next')}
                          className="p-1 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-secondary disabled:opacity-25 rounded-full transition-all cursor-pointer disabled:cursor-not-allowed"
                          title="Move dish later"
                        >
                          <ChevronRight size={14} />
                        </button>
                        <button
                          onClick={() => openEditItemModal(actualCatIdx, actualItemIdx)}
                          className="p-1 text-primary hover:text-primary-dark hover:bg-primary/10 rounded-full transition-all cursor-pointer"
                          title="Edit dish details & order"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(actualCatIdx, actualItemIdx, item.name)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-full transition-all cursor-pointer"
                          title="Delete dish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                    {/* Dish Initial or Image */}
                    <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center text-primary dark:text-secondary font-title font-bold text-xl sm:text-2xl bg-primary/5 dark:bg-white/5">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerHTML = `<span class="font-title font-bold text-xl sm:text-2xl text-primary">${item.name[0]}</span>`;
                          }}
                        />
                      ) : (
                        item.name[0]
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-4 sm:pr-6">
                      <div className="flex items-start justify-between gap-1.5 mb-1 flex-wrap">
                        <h3 className="font-bold text-title dark:text-gray-100 text-sm sm:text-lg leading-tight truncate">
                          {item.name}
                        </h3>
                        <span className="text-primary dark:text-secondary font-bold whitespace-nowrap text-xs sm:text-base">
                          {item.price}
                        </span>
                      </div>

                      {item.desc && (
                        <p className="text-[11px] sm:text-sm text-text/70 dark:text-gray-400 italic line-clamp-2 mb-2 sm:mb-3">
                          {item.desc}
                        </p>
                      )}

                      <div className="w-fit">
                        <AddToCartButton
                          item={{
                            id: item.id || `${actualCatIdx}-${actualItemIdx}-${item.name}`,
                            name: item.name,
                            title: item.name,
                            desc: item.desc || '',
                            price: item.price,
                            image: item.image || '/assets/placeholder-food.png',
                          }}
                          size="small"
                        />
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: ADD DISH / ITEM TO CATEGORY */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 border border-amber-950/10 dark:border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setShowItemModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-title dark:hover:text-white p-1"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-title font-bold text-title dark:text-white mb-1">
                Add Dish to {categories[targetCategoryIndex]?.title}
              </h3>
              <p className="text-xs text-text/60 dark:text-white/60 mb-6">
                Enter the dish details below. When saved, all visitors will see the updated menu.
              </p>

              <form onSubmit={handleAddItemSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Malai Kofta"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs dark:text-white border border-transparent focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="e.g. 150"
                      value={itemPrice}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^0-9]/g, '');
                        setItemPrice(digits);
                      }}
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                      }}
                      className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs dark:text-white border border-transparent focus:border-primary outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Short Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Crispy dumplings simmered in rich cashew and tomato gravy..."
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs dark:text-white border border-transparent focus:border-primary outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty or provide URL (e.g. /assets/paneer.jpeg)"
                    value={itemImage}
                    onChange={(e) => setItemImage(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs dark:text-white border border-transparent focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Placement Order
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddItemPosition('end')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        addItemPosition === 'end'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-gray-50 dark:bg-zinc-800 border-transparent text-text/60 dark:text-white/60'
                      }`}
                    >
                      At the End (Bottom)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddItemPosition('start')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        addItemPosition === 'start'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-gray-50 dark:bg-zinc-800 border-transparent text-text/60 dark:text-white/60'
                      }`}
                    >
                      At the Top (First)
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-zinc-800 text-text/70 dark:text-white/70 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark shadow-md"
                  >
                    Add Dish & Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD NEW CATEGORY */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 border border-amber-950/10 dark:border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setShowCategoryModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-title dark:hover:text-white p-1"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-title font-bold text-title dark:text-white mb-1">
                Add New Menu Category
              </h3>
              <p className="text-xs text-text/60 dark:text-white/60 mb-6">
                Create a new section like "Beverages", "Desserts", "Chef Specials", etc.
              </p>

              <form onSubmit={handleAddCategorySubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Category Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Desserts & Sweets"
                    value={newCategoryTitle}
                    onChange={(e) => setNewCategoryTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs dark:text-white border border-transparent focus:border-primary outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Placement Order
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddCategoryPosition('end')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        addCategoryPosition === 'end'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-gray-50 dark:bg-zinc-800 border-transparent text-text/60 dark:text-white/60'
                      }`}
                    >
                      At the End (Bottom)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddCategoryPosition('start')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        addCategoryPosition === 'start'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-gray-50 dark:bg-zinc-800 border-transparent text-text/60 dark:text-white/60'
                      }`}
                    >
                      At the Top (First)
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-zinc-800 text-text/70 dark:text-white/70 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-secondary text-title font-bold text-xs hover:bg-secondary/90 shadow-md"
                  >
                    Create Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: EDIT DISH / ITEM DETAILS */}
      <AnimatePresence>
        {showEditItemModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 border border-amber-950/10 dark:border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setShowEditItemModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-title dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <Edit3 className="text-primary" size={20} />
                <h3 className="text-xl font-title font-bold text-title dark:text-white">
                  Edit Item Details
                </h3>
              </div>
              <p className="text-xs text-text/60 dark:text-white/60 mb-6">
                Update dish name, price, order position, description or image.
              </p>

              <form onSubmit={handleEditItemSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Malai Kofta"
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs dark:text-white border border-transparent focus:border-primary outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="e.g. 150"
                      value={editItemPrice}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^0-9]/g, '');
                        setEditItemPrice(digits);
                      }}
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                      }}
                      className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs dark:text-white border border-transparent focus:border-primary outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Dish Order Position in current category */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Position in Category (1 to {categories[editingCatIdx]?.items?.length || 1})
                  </label>
                  <select
                    value={editItemPosition}
                    onChange={(e) => setEditItemPosition(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs dark:text-white border border-transparent focus:border-primary outline-none font-bold cursor-pointer"
                  >
                    {categories[editingCatIdx]?.items?.map((_, idx) => (
                      <option key={idx} value={idx + 1}>
                        Position {idx + 1} {idx === 0 ? '(First / Top)' : idx === (categories[editingCatIdx].items.length - 1) ? '(Last / End)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-text/50 dark:text-white/50 mt-1">
                    Select a number to change the display sequence of this dish.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Short Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Crispy dumplings simmered in rich cashew and tomato gravy..."
                    value={editItemDesc}
                    onChange={(e) => setEditItemDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs dark:text-white border border-transparent focus:border-primary outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty or provide URL (e.g. /assets/paneer.jpeg)"
                    value={editItemImage}
                    onChange={(e) => setEditItemImage(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs dark:text-white border border-transparent focus:border-primary outline-none"
                  />
                  {editItemImage && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">Preview:</span>
                      <img
                        src={editItemImage}
                        alt="Preview"
                        className="w-8 h-8 rounded-lg object-cover border border-amber-950/10"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditItemModal(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-zinc-800 text-text/70 dark:text-white/70 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark shadow-md cursor-pointer"
                  >
                    Update Dish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: EDIT / RENAME CATEGORY */}
      <AnimatePresence>
        {showEditCategoryModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 border border-amber-950/10 dark:border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setShowEditCategoryModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-title dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <Edit3 className="text-primary" size={20} />
                <h3 className="text-xl font-title font-bold text-title dark:text-white">
                  Edit Category Details
                </h3>
              </div>
              <p className="text-xs text-text/60 dark:text-white/60 mb-6">
                Update the name and order position of this menu section.
              </p>

              <form onSubmit={handleEditCategorySubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Category Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Desserts & Sweets"
                    value={editCategoryTitle}
                    onChange={(e) => setEditCategoryTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs dark:text-white border border-transparent focus:border-primary outline-none font-bold"
                  />
                </div>

                {/* Category Order Position */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Position in Menu (1 to {categories.length})
                  </label>
                  <select
                    value={editCategoryPosition}
                    onChange={(e) => setEditCategoryPosition(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs dark:text-white border border-transparent focus:border-primary outline-none font-bold cursor-pointer"
                  >
                    {categories.map((_, idx) => (
                      <option key={idx} value={idx + 1}>
                        Position {idx + 1} {idx === 0 ? '(Top of Menu)' : idx === categories.length - 1 ? '(Bottom of Menu)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditCategoryModal(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-zinc-800 text-text/70 dark:text-white/70 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark shadow-md cursor-pointer"
                  >
                    Update Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MenuPage;
