import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Users, Flame, UtensilsCrossed, ChevronRight, Search, 
  Plus, Trash2, Edit3, Save, Undo2, X, Check, ChefHat, Sparkles
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, doc, getDoc, setDoc } from '../firebase/config';
import { useDebounce } from '../hooks/useDebounce';

const INITIAL_RECIPES = [
 
];

const CATEGORIES = ['All', 'Main Course', 'Dessert', 'Experience', 'Starters'];

const RecipesPage = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query parameter for active category
  const urlCategory = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState(urlCategory || 'All');

  useEffect(() => {
    if (urlCategory && CATEGORIES.includes(urlCategory)) {
      setSelectedCategory(urlCategory);
    }
  }, [urlCategory]);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('category', cat);
      return p;
    });
  };

  const [searchTerm, setSearchTerm] = useState('');

  // Recipes State with LocalStorage & Firestore fallback
  const [recipeList, setRecipeList] = useState(() => {
    try {
      const saved = localStorage.getItem('avyukt_recipes');
      return saved ? JSON.parse(saved) : INITIAL_RECIPES;
    } catch {
      return INITIAL_RECIPES;
    }
  });

  // Admin Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const snapshotRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // Recipe View Detail Modal State
  const [viewRecipeModal, setViewRecipeModal] = useState(null);

  // Add / Edit Recipe Modal State
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formChef, setFormChef] = useState('');
  const [formCategory, setFormCategory] = useState('Main Course');
  const [formTime, setFormTime] = useState('');
  const [formServes, setFormServes] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('Medium');
  const [formImage, setFormImage] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIngredients, setFormIngredients] = useState('');

  // Sync recipes from Firestore on mount
  useEffect(() => {
    if (!db) return;
    const fetchFirestoreRecipes = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'recipes'));
        if (snap.exists() && Array.isArray(snap.data().list) && snap.data().list.length > 0) {
          setRecipeList(snap.data().list);
          localStorage.setItem('avyukt_recipes', JSON.stringify(snap.data().list));
        }
      } catch (err) {
        console.warn('Firestore recipes sync note:', err.message);
      }
    };
    fetchFirestoreRecipes();
  }, []);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Memoized and debounced recipe filtering
  const filteredRecipes = useMemo(() => {
    const cleanSearch = debouncedSearch.toLowerCase().trim();
    return recipeList.filter(recipe => {
      const matchesSearch = !cleanSearch ||
        (recipe.title || '').toLowerCase().includes(cleanSearch) || 
        (recipe.chef || '').toLowerCase().includes(cleanSearch) ||
        (recipe.description || '').toLowerCase().includes(cleanSearch);
      const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [recipeList, debouncedSearch, selectedCategory]);

  // Admin: Start Edit Mode
  const handleStartEdit = () => {
    snapshotRef.current = JSON.parse(JSON.stringify(recipeList));
    setIsEditing(true);
    addToast({
      title: 'Recipe Edit Mode Active',
      message: 'You can now add, edit, or delete recipes. Click "Save Changes" when done or "Cancel" to revert.',
      type: 'info',
    });
  };

  // Admin: Cancel Edit Mode
  const handleCancelEdit = () => {
    if (snapshotRef.current) {
      setRecipeList(snapshotRef.current);
    }
    setIsEditing(false);
    addToast({
      title: 'Edit Cancelled',
      message: 'All unsaved recipe modifications have been reverted.',
      type: 'info',
    });
  };

  // Admin: Save All Changes
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      localStorage.setItem('avyukt_recipes', JSON.stringify(recipeList));
      if (db) {
        await setDoc(doc(db, 'settings', 'recipes'), {
          list: recipeList,
          updatedAt: new Date().toISOString(),
        });
      }
      setIsEditing(false);
      addToast({
        title: 'Recipes Published',
        message: 'All recipe updates have been permanently saved and published live.',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Save Warning',
        message: 'Saved to local browser storage.',
        type: 'warning',
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // Admin: Open Add Modal
  const handleOpenAddModal = () => {
    setEditingRecipeId(null);
    setFormTitle('');
    setFormChef('Chef Vikram');
    setFormCategory('Main Course');
    setFormTime('45 min');
    setFormServes('4');
    setFormDifficulty('Medium');
    setFormImage('/assets/recipes/paneer.jpeg');
    setFormDesc('');
    setFormIngredients('Paneer\nFresh Cream\nTomatoes\nSpices');
    setRecipeModalOpen(true);
  };

  // Admin: Open Edit Modal for a Recipe
  const handleOpenEditModal = (rec) => {
    setEditingRecipeId(rec.id);
    setFormTitle(rec.title || '');
    setFormChef(rec.chef || '');
    setFormCategory(rec.category || 'Main Course');
    setFormTime(rec.time || '');
    setFormServes(rec.serves || '');
    setFormDifficulty(rec.difficulty || 'Medium');
    setFormImage(rec.image || '');
    setFormDesc(rec.description || '');
    setFormIngredients(Array.isArray(rec.ingredients) ? rec.ingredients.join('\n') : (rec.ingredients || ''));
    setRecipeModalOpen(true);
  };

  // Admin: Submit Add or Edit Form
  const handleSubmitRecipeForm = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      addToast({ title: 'Title Required', message: 'Please enter recipe title.', type: 'warning' });
      return;
    }

    const ingArray = formIngredients
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const recipeData = {
      id: editingRecipeId || `rec_${Date.now()}`,
      title: formTitle.trim(),
      chef: formChef.trim() || 'Master Chef',
      category: formCategory,
      time: formTime.trim() || '45 min',
      serves: formServes.trim() || '2-4',
      difficulty: formDifficulty,
      image: formImage.trim() || '/assets/recipes/biryani.jpeg',
      description: formDesc.trim() || 'A signature delicacy from Avyukt kitchen.',
      ingredients: ingArray.length > 0 ? ingArray : ['Fresh herbs', 'House spices', 'Secret marinade'],
    };

    if (editingRecipeId) {
      setRecipeList(prev => prev.map(r => r.id === editingRecipeId ? recipeData : r));
      addToast({ title: 'Recipe Updated', message: `"${recipeData.title}" updated. Remember to Save Changes.`, type: 'success' });
    } else {
      setRecipeList(prev => [recipeData, ...prev]);
      addToast({ title: 'Recipe Added', message: `"${recipeData.title}" added. Click Save Changes to publish.`, type: 'success' });
    }

    setRecipeModalOpen(false);
  };

  // Admin: Delete Recipe
  const handleDeleteRecipe = (id) => {
    const toDelete = recipeList.find(r => r.id === id);
    if (!window.confirm(`Are you sure you want to delete "${toDelete?.title || 'this recipe'}"?`)) return;
    setRecipeList(prev => prev.filter(r => r.id !== id));
    addToast({
      title: 'Recipe Removed',
      message: `Deleted "${toDelete?.title || 'recipe'}". Click Save Changes to apply.`,
      type: 'info',
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 lg:pt-32 pb-20 bg-body dark:bg-zinc-950 min-h-screen transition-colors duration-300"
    >
      {/* Hero Section */}
      <section className="container mb-12 px-4">
        <div className="text-center space-y-4 mb-8">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-subtitle inline-flex items-center gap-2"
          >
            <ChefHat size={16} />
            <span>Avyukt Culinary Secrets</span>
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-6xl font-title font-bold text-title dark:text-white"
          >
            From Our <span className="text-primary italic">Kitchen</span> to Yours
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-sm md:text-base text-text/70 dark:text-white/60"
          >
            Discover the secret recipes and preparation techniques behind Avyukt's signature royal dishes. Recreate master culinary magic at home!
          </motion.p>
        </div>

        {/* Admin Controls Banner */}
        {isAdmin && (
          <div className="mb-6 flex items-center justify-end flex-wrap gap-3 bg-white/80 dark:bg-zinc-900/80 p-4 rounded-2xl border border-amber-950/10  dark:border-white/10 shadow-sm backdrop-blur-sm">
            

            <div className="flex items-center gap-2 flex-wrap">
              {!isEditing ? (
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary-dark transition-all"
                >
                  <Edit3 size={14} />
                  <span>Edit Recipes</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 transition-all"
                  >
                    <Plus size={14} />
                    <span>Add Recipe</span>
                  </button>

                  <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>

                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-text/70 dark:text-white/70 font-bold text-xs hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    <Undo2 size={14} />
                    <span>Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900/90 p-4 md:p-5 rounded-3xl shadow-lg border border-amber-950/10 dark:border-white/10 backdrop-blur-md">
          {/* Horizontal scrollbar for categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === cat 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'bg-gray-100 dark:bg-zinc-800 text-text/70 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input 
              type="text" 
              placeholder="Search recipes, chefs, ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-xs md:text-sm text-title dark:text-white transition-all outline-none"
            />
          </div>
        </div>
      </section>

      {/* Recipes Showcase */}
      <section className="container px-4">
        
        {/* ======================================================== */}
        {/* MOBILE VIEW (< md): Horizontal Small Cards as Requested */}
        {/* ======================================================== */}
        <div className="md:hidden space-y-3.5">
          <AnimatePresence mode="popLayout">
            {filteredRecipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-3 sm:p-4 border border-amber-950/10 dark:border-white/10 shadow-sm flex items-center gap-3.5 relative overflow-hidden group"
              >
                {/* Small Thumbnail on Left */}
                <div 
                  onClick={() => setViewRecipeModal(recipe)}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 relative bg-primary/10 cursor-pointer"
                >
                  <img 
                    src={recipe.image} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/recipes/biryani.jpeg';
                    }}
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-md bg-black/70 text-white backdrop-blur-sm">
                    {recipe.category}
                  </span>
                </div>

                {/* Info on Right */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <h3 
                      onClick={() => setViewRecipeModal(recipe)}
                      className="font-bold text-sm text-title dark:text-white truncate cursor-pointer hover:text-primary transition-colors"
                    >
                      {recipe.title}
                    </h3>

                    {/* Admin Action Buttons */}
                    {isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => handleOpenEditModal(recipe)}
                          title="Edit Recipe"
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          title="Delete Recipe"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-secondary font-medium italic mb-1">
                    by {recipe.chef}
                  </p>

                  <p className="text-xs text-text/60 dark:text-white/60 line-clamp-1 mb-2.5">
                    {recipe.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-text/50 dark:text-white/50">
                      <span className="flex items-center gap-0.5">
                        <Clock size={11} className="text-primary" /> {recipe.time}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Flame size={11} className="text-primary" /> {recipe.difficulty}
                      </span>
                    </div>

                    <button 
                      onClick={() => setViewRecipeModal(recipe)}
                      className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-0.5 transition-all"
                    >
                      <span>View</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ======================================================== */}
        {/* DESKTOP VIEW (>= md): Full Detailed Grid Cards           */}
        {/* ======================================================== */}
        <div className="hidden md:grid md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-xl border border-amber-950/10 dark:border-white/10 flex flex-col h-full hover:shadow-2xl transition-all"
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={recipe.image} 
                    alt={recipe.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/recipes/biryani.jpeg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  
                  <div className="absolute top-5 left-5">
                    <span className="px-3.5 py-1.5 bg-primary/90 text-white text-xs font-bold rounded-full backdrop-blur-md uppercase tracking-wider shadow-md">
                      {recipe.category}
                    </span>
                  </div>

                  {/* Admin Floating Controls */}
                  {isEditing && (
                    <div className="absolute top-5 right-5 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
                      <button
                        onClick={() => handleOpenEditModal(recipe)}
                        title="Edit Recipe"
                        className="p-2 rounded-xl bg-white/20 text-white hover:bg-primary transition-colors"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        title="Delete Recipe"
                        className="p-2 rounded-xl bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-7 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-2xl font-title font-bold text-title dark:text-white mb-1 group-hover:text-primary transition-colors">
                        {recipe.title}
                      </h3>
                      <p className="text-secondary font-medium italic text-sm">by {recipe.chef}</p>
                    </div>
                  </div>

                  <p className="text-text/70 dark:text-white/60 text-sm mb-6 line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>

                  <div className="grid grid-cols-3 gap-4 py-4 mb-6 border-y border-amber-950/10 dark:border-zinc-800">
                    <div className="flex flex-col items-center gap-1">
                      <Clock size={16} className="text-primary" />
                      <span className="text-[10px] uppercase tracking-wider text-text/40 dark:text-white/40 font-bold">Time</span>
                      <span className="text-xs font-bold text-title dark:text-white">{recipe.time}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Users size={16} className="text-primary" />
                      <span className="text-[10px] uppercase tracking-wider text-text/40 dark:text-white/40 font-bold">Serves</span>
                      <span className="text-xs font-bold text-title dark:text-white">{recipe.serves}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Flame size={16} className="text-primary" />
                      <span className="text-[10px] uppercase tracking-wider text-text/40 dark:text-white/40 font-bold">Level</span>
                      <span className="text-xs font-bold text-title dark:text-white">{recipe.difficulty}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UtensilsCrossed size={14} />
                      </div>
                      <span className="text-xs font-bold text-text/60 dark:text-white/60">
                        {Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 4} Ingredients
                      </span>
                    </div>

                    <button 
                      onClick={() => setViewRecipeModal(recipe)}
                      className="flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all"
                    >
                      <span>View Recipe</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredRecipes.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-amber-950/10 dark:border-white/10">
            <UtensilsCrossed size={40} className="mx-auto text-primary/40 mb-3" />
            <h3 className="text-xl font-title font-bold text-title dark:text-white mb-2">No recipes found</h3>
            <p className="text-text/60 dark:text-white/60 text-sm mb-4">Try adjusting your filters or search query.</p>
            {selectedCategory !== 'All' && (
              <button
                onClick={() => handleCategoryChange('All')}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all"
              >
                View All Categories
              </button>
            )}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* MODAL: View Full Recipe Details                          */}
      {/* ======================================================== */}
      <AnimatePresence>
        {viewRecipeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-amber-950/10 dark:border-white/10 relative my-8"
            >
              {/* Modal Header Image */}
              <div className="relative h-56 sm:h-72 overflow-hidden">
                <img 
                  src={viewRecipeModal.image} 
                  alt={viewRecipeModal.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <button
                  onClick={() => setViewRecipeModal(null)}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="absolute bottom-5 left-6 right-6">
                  <span className="px-3 py-1 bg-primary text-white text-[10px] font-extrabold uppercase rounded-full tracking-wider mb-2 inline-block">
                    {viewRecipeModal.category}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold font-title text-white">
                    {viewRecipeModal.title}
                  </h2>
                  <p className="text-sm text-secondary italic">Prepared with care by {viewRecipeModal.chef}</p>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-amber-950/5 dark:border-white/5 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text/40 dark:text-white/40 block">Time</span>
                    <span className="text-sm font-bold text-title dark:text-white">{viewRecipeModal.time}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text/40 dark:text-white/40 block">Servings</span>
                    <span className="text-sm font-bold text-title dark:text-white">{viewRecipeModal.serves}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text/40 dark:text-white/40 block">Difficulty</span>
                    <span className="text-sm font-bold text-title dark:text-white">{viewRecipeModal.difficulty}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text/50 dark:text-white/50 mb-2">
                    Culinary Overview
                  </h4>
                  <p className="text-sm text-text/80 dark:text-white/80 leading-relaxed">
                    {viewRecipeModal.description}
                  </p>
                </div>

                {/* Ingredients Checklist */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text/50 dark:text-white/50 mb-3 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary" />
                    <span>Key Ingredients Required</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(Array.isArray(viewRecipeModal.ingredients) ? viewRecipeModal.ingredients : [viewRecipeModal.ingredients]).map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 text-xs text-title dark:text-white font-medium">
                        <Check size={14} className="text-emerald-500 shrink-0" />
                        <span>{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setViewRecipeModal(null)}
                    className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
                  >
                    Close Recipe
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL: Admin Add / Edit Recipe Form                      */}
      {/* ======================================================== */}
      <AnimatePresence>
        {recipeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 border border-amber-950/10 dark:border-white/10 shadow-2xl relative my-8"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold font-title text-title dark:text-white">
                    {editingRecipeId ? 'Edit Recipe' : 'Add New Chef Recipe'}
                  </h3>
                  <p className="text-xs text-text/60 dark:text-white/60">
                    Publish an authentic secret recipe for customers.
                  </p>
                </div>
                <button
                  onClick={() => setRecipeModalOpen(false)}
                  className="p-2 text-text/40 hover:text-primary rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitRecipeForm} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                    Dish Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Shahi Paneer"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-primary outline-none text-xs dark:text-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                      Chef Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chef Vikram"
                      value={formChef}
                      onChange={(e) => setFormChef(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-primary outline-none text-xs dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-primary outline-none text-xs dark:text-white font-medium cursor-pointer"
                    >
                      <option value="Main Course">Main Course</option>
                      <option value="Dessert">Dessert</option>
                      <option value="Experience">Experience</option>
                      <option value="Starters">Starters</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                      Cook Time
                    </label>
                    <input
                      type="text"
                      placeholder="45 min"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full px-3 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-primary outline-none text-xs dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                      Servings
                    </label>
                    <input
                      type="text"
                      placeholder="2-4"
                      value={formServes}
                      onChange={(e) => setFormServes(e.target.value)}
                      className="w-full px-3 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-primary outline-none text-xs dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                      Difficulty
                    </label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value)}
                      className="w-full px-2 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-primary outline-none text-xs dark:text-white font-medium cursor-pointer"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                    Image Path or URL
                  </label>
                  <input
                    type="text"
                    placeholder="/assets/recipes/paneer.jpeg or https://..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-primary outline-none text-xs dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief history or flavor notes of this recipe..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-primary outline-none text-xs dark:text-white font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                    Ingredients (One per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="500g Paneer&#10;Fresh Cream&#10;Kashmiri Chilli Powder&#10;Ghee"
                    value={formIngredients}
                    onChange={(e) => setFormIngredients(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-primary outline-none text-xs dark:text-white font-medium resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                  >
                    {editingRecipeId ? 'Update Recipe' : 'Add Recipe to Catalog'}
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

export default RecipesPage;
