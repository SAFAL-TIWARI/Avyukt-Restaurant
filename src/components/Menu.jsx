import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Trash2, LayoutGrid, List, ChevronLeft, ChevronRight, X, Edit3, Save } from 'lucide-react';
import AddToCartButton from './AddToCartButton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, doc, getDoc, setDoc } from '../firebase/config';

const DEFAULT_FEATURED = [
  
];

const Menu = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const scrollRef = useRef(null);

  const [menuItems, setMenuItems] = useState(() => {
    try {
      const saved = localStorage.getItem('avyukt_featured_menu');
      return saved ? JSON.parse(saved) : DEFAULT_FEATURED;
    } catch {
      return DEFAULT_FEATURED;
    }
  });

  const [viewMode, setViewMode] = useState('list'); // Default list view as requested
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const featuredSnapshotRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');
  const [addPosition, setAddPosition] = useState('end'); // 'start' or 'end'

  // Edit Featured Item Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editPosition, setEditPosition] = useState(1);

  // Sync from Firestore
  useEffect(() => {
    if (!db) return;
    const fetchFeatured = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'featuredMenu'));
        if (snap.exists() && snap.data().items?.length > 0) {
          setMenuItems(snap.data().items);
          localStorage.setItem('avyukt_featured_menu', JSON.stringify(snap.data().items));
        }
      } catch (err) {
        console.warn('Featured menu fetch note:', err.message);
      }
    };
    fetchFeatured();
  }, []);

  const saveFeaturedItems = async (items) => {
    setMenuItems(items);
    localStorage.setItem('avyukt_featured_menu', JSON.stringify(items));
    if (db) {
      try {
        await setDoc(doc(db, 'settings', 'featuredMenu'), { items, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn('Could not save to firestore:', e);
      }
    }
  };

  const handleStartEditMenu = () => {
    featuredSnapshotRef.current = JSON.parse(JSON.stringify(menuItems));
    setIsEditingMenu(true);
    addToast({
      title: 'Edit Mode Active',
      message: 'You can now add or remove featured dishes. Click "Save Changes" to publish or "Cancel" to revert.',
      type: 'info',
    });
  };

  const handleCancelEdit = () => {
    if (featuredSnapshotRef.current) {
      setMenuItems(featuredSnapshotRef.current);
    }
    setIsEditingMenu(false);
    addToast({
      title: 'Changes Reverted',
      message: 'Featured menu restored to previous state.',
      type: 'info',
    });
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      await saveFeaturedItems(menuItems);
      setIsEditingMenu(false);
      addToast({
        title: 'Featured Menu Saved',
        message: 'All changes have been saved across the website.',
        type: 'success',
      });
    } catch (err) {
      addToast({ title: 'Save Failed', message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const cleanNum = parseInt(String(newPrice).replace(/[^0-9]/g, ''), 10);
    if (!newTitle.trim() || isNaN(cleanNum) || cleanNum <= 0) {
      addToast({ title: 'Invalid Price', message: 'Please enter a valid numeric price (e.g. 150).', type: 'warning' });
      return;
    }

    const formattedPrice = `₹${cleanNum}`;
    const newItem = {
      id: `feat_${Date.now()}`,
      title: newTitle.trim(),
      price: formattedPrice,
      description: newDesc.trim() || 'Prepared fresh with royal spices and culinary mastery.',
      image: newImage.trim() || '/assets/paneer.jpeg'
    };

    const updated = addPosition === 'start' ? [newItem, ...menuItems] : [...menuItems, newItem];
    setMenuItems(updated);
    addToast({
      title: 'Item Added (Unsaved)',
      message: `"${newItem.title}" added to Featured Menu (${addPosition === 'start' ? 'top/first position' : 'end'}). Click "Save Changes" to publish.`,
      type: 'success'
    });

    setNewTitle('');
    setNewPrice('');
    setNewDesc('');
    setNewImage('');
    setAddPosition('end');
    setShowAddModal(false);
  };

  const handleMoveItem = (index, direction) => {
    const targetIdx = direction === 'prev' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= menuItems.length) return;
    const updated = [...menuItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setMenuItems(updated);
  };

  const handleDeleteItem = (id, title) => {
    if (!window.confirm(`Delete "${title}" from featured menu?`)) return;
    const updated = menuItems.filter(item => item.id !== id);
    setMenuItems(updated);
  };

  const openEditModal = (item, index) => {
    setEditingItemId(item.id);
    setEditTitle(item.title || '');
    const numPrice = String(item.price || '').replace(/[^0-9]/g, '');
    setEditPrice(numPrice);
    setEditDesc(item.description || '');
    setEditImage(item.image || '');
    setEditPosition(index + 1);
    setShowEditModal(true);
  };

  const handleEditItemSubmit = (e) => {
    e.preventDefault();
    const cleanNum = parseInt(String(editPrice).replace(/[^0-9]/g, ''), 10);
    if (!editTitle.trim() || isNaN(cleanNum) || cleanNum <= 0) {
      addToast({ title: 'Invalid Price', message: 'Please enter a valid numeric price (e.g. 150).', type: 'warning' });
      return;
    }

    const formattedPrice = `₹${cleanNum}`;
    const updated = [...menuItems];
    const currentIdx = updated.findIndex(i => i.id === editingItemId);
    if (currentIdx !== -1) {
      const [oldItem] = updated.splice(currentIdx, 1);
      const updatedItem = {
        ...oldItem,
        title: editTitle.trim(),
        price: formattedPrice,
        description: editDesc.trim() || 'Prepared fresh with royal spices and culinary mastery.',
        image: editImage.trim() || '/assets/paneer.jpeg'
      };
      const targetIdx = Math.max(0, Math.min(updated.length, (Number(editPosition) || 1) - 1));
      updated.splice(targetIdx, 0, updatedItem);
      setMenuItems(updated);
    }

    setShowEditModal(false);
    addToast({
      title: 'Dish Updated (Unsaved)',
      message: `"${editTitle.trim()}" details & order updated. Click "Save Changes" to publish.`,
      type: 'success'
    });
  };

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="menu" className="section bg-transparent transition-colors duration-300 relative">
      <div className="container">
        
        {/* Section Header with View Mode Toggle & Admin Add */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="section-subtitle text-secondary font-semibold !text-left">Specialities</span>
            <h2 className="section-title text-white !text-left after:left-0 after:translate-x-0 mb-0">Our Featured Menu</h2>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            {/* View Mode Changer: Grid / List */}
            <div className="flex items-center bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-sm">
            <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title="List"
              >
                <List size={14} />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={14} />
                <span>Grid</span>
              </button>
              
            </div>

            {/* List Carousel Navigation Arrows (visible in list mode) */}
            {viewMode === 'list' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleScroll('left')}
                  className="w-8 h-8 rounded-full bg-black/10 backdrop-blur-md hover:bg-black/20 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => handleScroll('right')}
                  className="w-8 h-8 rounded-full bg-black/10 backdrop-blur-md hover:bg-black/20 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* Admin Edit / Cancel / Save / Add Dish Controls */}
            {isAdmin && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {!isEditingMenu ? (
                  <button
                    onClick={handleStartEditMenu}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-bold text-xs rounded-2xl hover:bg-primary-dark transition-all shadow-md cursor-pointer"
                  >
                    <Edit3 size={15} />
                    <span>Edit Menu</span>
                  </button>
                ) : (
                  <>
                    {/* Cancel Button in place of Edit Menu */}
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white/20 text-white font-bold text-xs rounded-2xl hover:bg-white/30 transition-all shadow-md cursor-pointer"
                    >
                      <X size={15} />
                      <span>Cancel</span>
                    </button>

                    {/* Beside it: Save Changes */}
                    <button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-2xl hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      <Save size={15} />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>

                    {/* Add Featured Dish */}
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-title font-bold text-xs rounded-2xl hover:bg-secondary/90 transition-all shadow-md cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>Add Featured Dish</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* VIEW 1: CIRCULAR LIST VIEW (Matching the user's uploaded image) */}
        {viewMode === 'list' ? (
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-6 overflow-x-auto no-scrollbar pb-6 pt-2 scroll-smooth"
          >
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col items-center text-center shrink-0 w-28 sm:w-44 bg-zinc-900/50 backdrop-blur-md p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl group relative"
              >
                {/* Admin Edit, Reorder & Delete Icon - ONLY when isEditingMenu */}
                {isAdmin && isEditingMenu && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/75 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-md z-10">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMoveItem(index, 'prev')}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-25 rounded-full transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Move dish earlier"
                    >
                      <ChevronLeft size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                    <button
                      disabled={index === menuItems.length - 1}
                      onClick={() => handleMoveItem(index, 'next')}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-25 rounded-full transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Move dish later"
                    >
                      <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(item, index)}
                      className="p-1 text-secondary hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                      title="Edit dish details & order"
                    >
                      <Edit3 size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-full transition-all cursor-pointer"
                      title="Delete dish"
                    >
                      <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                )}

                {/* Circular Dish Image - reduced for mobile */}
                <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-lg border-2 border-secondary/30 mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-300 bg-black/20 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/paneer.jpeg';
                    }}
                  />
                </div>

                {/* Dish Name */}
                <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1 mb-0.5 sm:mb-1 truncate max-w-[95px] sm:max-w-none" title={item.title}>
                  {item.title}
                </h4>

                {/* Price */}
                <span className="text-secondary font-bold text-[11px] sm:text-xs mb-2 sm:mb-3">
                  {item.price}
                </span>

                {/* Add To Cart Button with + or - */}
                <div className="w-full flex justify-center">
                  <AddToCartButton item={{ ...item, name: item.name || item.title, title: item.title || item.name, desc: item.desc || item.description || '' }} size="small" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* VIEW 2: NORMAL GRID CARDS VIEW - horizontal scrollbar row on mobile! */
          <div className="flex overflow-x-auto no-scrollbar scroll-smooth gap-4 pb-4 md:grid md:grid-cols-4 lg:grid-cols-4 md:gap-8">
            {menuItems.map((item, index) => (
              <motion.article 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="shrink-0 md:shrink min-w-[210px] max-w-[230px] md:min-w-0 md:max-w-none bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl hover:shadow-primary/20 transition-all duration-300 group flex flex-col h-full relative"
              >
                {/* Admin Edit, Reorder & Delete Icon - ONLY when isEditingMenu */}
                {isAdmin && isEditingMenu && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/75 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-md z-10">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMoveItem(index, 'prev')}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-25 rounded-full transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Move dish earlier"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      disabled={index === menuItems.length - 1}
                      onClick={() => handleMoveItem(index, 'next')}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-25 rounded-full transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Move dish later"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      onClick={() => openEditModal(item, index)}
                      className="p-1.5 text-secondary hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                      title="Edit dish details & order"
                    >
                      <Edit3 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-full transition-all cursor-pointer"
                      title="Delete dish"
                    >
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}

                <div className="h-36 sm:h-56 overflow-hidden relative">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/paneer.jpeg';
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-primary/90 text-white px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                    {item.price}
                  </div>
                </div>

                <div className="p-3.5 sm:p-6 flex flex-col flex-grow">
                  <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 text-white line-clamp-1">{item.title}</h3>
                  <p className="text-gray-300 text-xs sm:text-sm mb-4 sm:mb-6 flex-grow line-clamp-2">
                    {item.description}
                  </p>
                  <AddToCartButton item={{ ...item, name: item.name || item.title, title: item.title || item.name, desc: item.desc || item.description || '' }} />
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link to="/menu" className="btn btn-secondary text-white shadow-lg shadow-secondary/20">
            View Full Menu
          </Link>
        </div>
      </div>

      {/* Admin Add Dish Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-title font-bold text-white mb-1">Add Featured Dish</h3>
              <p className="text-xs text-gray-400 mb-6">Dish will display immediately in the Featured Menu section.</p>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">Dish Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Shahi Paneer"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white text-xs border border-transparent focus:border-secondary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">Price (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold text-sm">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="e.g. 220"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value.replace(/[^0-9]/g, ''))}
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                      }}
                      className="w-full pl-8 pr-4 py-3 bg-zinc-800 rounded-xl text-white text-xs border border-transparent focus:border-secondary outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">Short Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe flavor notes, ingredients, or cooking style..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white text-xs border border-transparent focus:border-secondary outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">Image URL </label>
                  <input
                    type="text"
                    placeholder="e.g. /assets/paneer.jpeg or https://..."
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white text-xs border border-transparent focus:border-secondary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">Placement Order</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddPosition('end')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        addPosition === 'end'
                          ? 'bg-secondary/20 border-secondary text-secondary'
                          : 'bg-zinc-800 border-transparent text-gray-400'
                      }`}
                    >
                      At the End (Right)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddPosition('start')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        addPosition === 'start'
                          ? 'bg-secondary/20 border-secondary text-secondary'
                          : 'bg-zinc-800 border-transparent text-gray-400'
                      }`}
                    >
                      At the Top (First)
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 text-gray-300 font-bold text-xs hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-secondary text-title font-bold text-xs hover:bg-secondary/90 shadow-lg shadow-secondary/20"
                  >
                    Add Dish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Edit Dish Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <Edit3 className="text-secondary" size={20} />
                <h3 className="text-xl font-title font-bold text-white">Edit Dish Details</h3>
              </div>
              <p className="text-xs text-gray-400 mb-6">Update dish details & order. Click "Save Changes" on the menu bar to publish.</p>

              <form onSubmit={handleEditItemSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">Dish Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Shahi Paneer"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white text-xs border border-transparent focus:border-secondary outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">Price (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold text-sm">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="e.g. 220"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value.replace(/[^0-9]/g, ''))}
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                      }}
                      className="w-full pl-8 pr-4 py-3 bg-zinc-800 rounded-xl text-white text-xs border border-transparent focus:border-secondary outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Position / Sequence Dropdown */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">
                    Position in Featured Menu (1 to {menuItems.length})
                  </label>
                  <select
                    value={editPosition}
                    onChange={(e) => setEditPosition(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white text-xs border border-transparent focus:border-secondary outline-none font-bold cursor-pointer"
                  >
                    {menuItems.map((_, idx) => (
                      <option key={idx} value={idx + 1}>
                        Position {idx + 1} {idx === 0 ? '(First / Top)' : idx === menuItems.length - 1 ? '(Last / End)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">Short Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe flavor notes, ingredients, or cooking style..."
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white text-xs border border-transparent focus:border-secondary outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">Image URL </label>
                  <input
                    type="text"
                    placeholder="e.g. /assets/paneer.jpeg or https://..."
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white text-xs border border-transparent focus:border-secondary outline-none"
                  />
                  {editImage && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">Preview:</span>
                      <img
                        src={editImage}
                        alt="Preview"
                        className="w-8 h-8 rounded-lg object-cover border border-white/10"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 text-gray-300 font-bold text-xs hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-secondary text-title font-bold text-xs hover:bg-secondary/90 shadow-lg shadow-secondary/20 cursor-pointer"
                  >
                    Update Dish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Menu;
