import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Send, MessageSquare, 
  ThumbsUp, ChefHat, Truck, Sparkles,
  CheckCircle, Trash2, Loader2, X, AlertCircle, Calendar, User,
  ChevronDown, ChevronUp, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, collection, onSnapshot } from '../firebase/config';

const FeedbackPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // User's own feedbacks
  const [userFeedbacks, setUserFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedFeedbackIds, setExpandedFeedbackIds] = useState(new Set());
  const deletedFeedbackIdsRef = useRef(new Set());

  const toggleExpandFeedback = (id) => {
    setExpandedFeedbackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Mobile Tags Dropdown State
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const tagsDropdownRef = useRef(null);

  // Close tags dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(e.target)) {
        setIsTagsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const feedbackTags = [
    { label: 'Great Food', icon: <ChefHat size={14} /> },
    { label: 'Fast Delivery', icon: <Truck size={14} /> },
    { label: 'Excellent Service', icon: <ThumbsUp size={14} /> },
    { label: 'Good Packaging', icon: <Sparkles size={14} /> },
    { label: 'Value for Money', icon: <Star size={14} /> },
    { label: 'Friendly Staff', icon: <MessageSquare size={14} /> },
  ];

  // Helper to format date
  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  // Load feedbacks submitted by this user
  const loadUserFeedbacks = async (showLoader = false) => {
    try {
      if (showLoader) setLoadingFeedbacks(true);
      const res = await api.getAllFeedbacks();
      let allFbs = [];
      if (res && res.success && Array.isArray(res.feedbacks)) {
        allFbs = res.feedbacks;
      } else if (Array.isArray(res)) {
        allFbs = res;
      }

      // Locally saved IDs for guest feedback retention
      const localIds = JSON.parse(localStorage.getItem('avyukt_my_feedback_ids') || '[]');

      const myFbs = allFbs.filter((fb) => {
        // Exclude items deleted in this session to prevent race condition resurrecting them
        if (deletedFeedbackIdsRef.current.has(fb.id)) return false;
        if (user?.uid && fb.userId === user.uid) return true;
        if (user?.email && fb.userEmail && fb.userEmail.toLowerCase() === user.email.toLowerCase()) return true;
        if (localIds.includes(fb.id)) return true;
        return false;
      });

      setUserFeedbacks(myFbs);
    } catch (err) {
      console.warn('Failed to load user feedbacks:', err);
    } finally {
      if (showLoader) setLoadingFeedbacks(false);
    }
  };

  // Load and subscribe to real-time feedback updates
  useEffect(() => {
    loadUserFeedbacks(true);

    let unsubscribe = null;
    if (db) {
      try {
        unsubscribe = onSnapshot(collection(db, 'feedbacks'), () => {
          loadUserFeedbacks(false);
        });
      } catch (e) {
        // Fallback to initial fetch
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid, user?.email]);

  const toggleTag = (label) => {
    setSelectedTags((prev) =>
      prev.includes(label)
        ? prev.filter((t) => t !== label)
        : [...prev, label]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (rating === 0) {
      setErrorMessage('Please select a star rating to express your dining experience.');
      return;
    }

    // MANDATORY DESCRIPTION VALIDATION
    if (!feedbackText.trim()) {
      setErrorMessage('Please write a few words about your dining experience.');
      return;
    }

    setSubmitting(true);
    try {
      // Pass actual user profile avatar and info
      const profileAvatar = user?.avatar || user?.photoURL || user?.googlePhotoUrl || '';
      const userName = user?.name || (user?.email ? user.email.split('@')[0] : 'Valued Guest');
      const userId = user?.uid || 'guest';
      const userEmail = user?.email || '';

      const res = await api.submitFeedback({
        rating,
        tags: selectedTags,
        feedbackText: feedbackText.trim(),
        userId,
        userName,
        userEmail,
        userAvatar: profileAvatar,
      });

      // Save ID locally for session tracking
      if (res?.feedback?.id) {
        const localIds = JSON.parse(localStorage.getItem('avyukt_my_feedback_ids') || '[]');
        if (!localIds.includes(res.feedback.id)) {
          localStorage.setItem('avyukt_my_feedback_ids', JSON.stringify([...localIds, res.feedback.id]));
        }
      }

      setSubmitted(true);
      setRating(0);
      setSelectedTags([]);
      setFeedbackText('');
      if (addToast) {
        addToast({
          type: 'success',
          message: 'Thank you! Your feedback is now published in our dining testimonials.',
        });
      }
      loadUserFeedbacks();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setErrorMessage(err.message || 'Failed to submit feedback. Please check your connection.');
      if (addToast) {
        addToast({
          type: 'error',
          message: err.message || 'Failed to submit feedback',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFeedback = async (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // 1. Immediately track deleted ID to block race condition resurrection
    deletedFeedbackIdsRef.current.add(id);

    // 2. Instantly remove from UI in a single click (optimistic update)
    setUserFeedbacks((prev) => prev.filter((f) => f.id !== id));

    // 3. Instantly update localStorage
    try {
      const localIds = JSON.parse(localStorage.getItem('avyukt_my_feedback_ids') || '[]');
      localStorage.setItem('avyukt_my_feedback_ids', JSON.stringify(localIds.filter((itemId) => itemId !== id)));
    } catch (err) {}

    setDeletingId(id);

    // 4. Send delete request to backend and notify user
    try {
      await api.deleteFeedback(id);
      if (addToast) {
        addToast({
          type: 'info',
          message: 'Feedback deleted successfully.',
        });
      }
    } catch (err) {
      console.error('Failed to delete feedback:', err);
      // Revert if API failed
      deletedFeedbackIdsRef.current.delete(id);
      loadUserFeedbacks(false);
      if (addToast) {
        addToast({
          type: 'error',
          message: 'Could not delete feedback. Please try again.',
        });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 bg-body dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 border border-primary/20 shadow-inner">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-title font-bold text-title dark:text-white mb-2">
            Share Your Experience
          </h1>
          <p className="text-xs sm:text-sm text-text/60 dark:text-white/60 max-w-md mx-auto">
            Your feedback directly guides our chefs and royal hospitality team. Every review is featured on our home page!
          </p>
        </motion.div>

        {/* Success Alert Banner (Dismissible) */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="mb-8 p-4 sm:p-5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300 backdrop-blur-md shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CheckCircle size={22} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm truncate">Feedback Submitted Successfully!</p>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 truncate">
                    Your review with your profile avatar has been added to our live testimonials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="p-1.5 hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer shrink-0 text-emerald-700 dark:text-emerald-300"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Error Alert */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center justify-between gap-3 text-red-600 dark:text-red-400 text-xs sm:text-sm"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle size={18} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="p-1 hover:bg-red-500/20 rounded-lg cursor-pointer"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Submission Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 dark:bg-zinc-900/90 rounded-[2.5rem] p-6 sm:p-8 md:p-10 border border-amber-950/10 dark:border-white/10 shadow-xl backdrop-blur-xl"
        >
          {/* Submitting User Identity Preview with Avatar */}
          <div className="flex items-center justify-between gap-3 mb-8 pb-5 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/40 p-0.5 bg-primary/10 shrink-0 shadow-sm">
                <img
                  src={
                    user?.avatar ||
                    user?.photoURL ||
                    user?.googlePhotoUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'Guest')}&background=800000&color=ffffff&bold=true&size=96`
                  }
                  alt={user?.name || 'Guest Avatar'}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Guest')}&background=800000&color=ffffff&bold=true&size=96`;
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm text-title dark:text-white truncate">
                    {user?.name || 'Valued Guest'}
                  </span>
                  {user ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                      Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                      Guest
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text/50 dark:text-white/50 truncate">
                  {user?.email || 'Posting as guest diner'}
                </p>
              </div>
            </div>

            {!user && (
              <Link
                to="/login"
                className="text-[11px] font-bold text-primary dark:text-secondary hover:underline shrink-0"
              >
                Sign in to link account
              </Link>
            )}
          </div>

          {/* Star Rating (Mandatory) */}
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-text/50 dark:text-white/50 uppercase tracking-wider mb-3">
              Rate your experience <span className="text-red-500 font-bold">*</span>
            </p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRating(star);
                    setErrorMessage('');
                  }}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-125 active:scale-95 cursor-pointer p-1"
                >
                  <Star
                    size={36}
                    className={`transition-colors ${
                      star <= (hoveredStar || rating)
                        ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                        : 'text-gray-200 dark:text-zinc-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {(hoveredStar || rating) > 0 && (
                <motion.p
                  key={hoveredStar || rating}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400"
                >
                  {ratingLabels[hoveredStar || rating]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Tags */}
          <div className="mb-8" ref={tagsDropdownRef}>
            <p className="text-xs font-bold text-text/50 dark:text-white/50 uppercase tracking-wider mb-3 text-center">
              What stood out most? (Optional)
            </p>

            {/* Desktop View: Interactive Tag Buttons */}
            <div className="hidden sm:flex flex-wrap justify-center gap-2">
              {feedbackTags.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => toggleTag(tag.label)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTags.includes(tag.label)
                      ? 'bg-primary text-white shadow-md shadow-primary/25 scale-105'
                      : 'bg-black/5 dark:bg-zinc-800 text-text/70 dark:text-white/70 border border-black/5 dark:border-white/5 hover:border-primary/30'
                  }`}
                >
                  {tag.icon}
                  <span>{tag.label}</span>
                </button>
              ))}
            </div>

            {/* Mobile View: Dropdown Selector */}
            <div className="sm:hidden relative">
              <button
                type="button"
                onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-black/5 dark:bg-zinc-800/80 border border-black/10 dark:border-white/10 rounded-2xl text-xs font-bold text-title dark:text-white shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Sparkles size={15} className="text-primary shrink-0" />
                  <span className="truncate">
                    {selectedTags.length === 0
                      ? 'Choose what stood out...'
                      : `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-text/50 dark:text-white/50 transition-transform duration-200 shrink-0 ${
                    isTagsDropdownOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isTagsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-30 max-h-60 overflow-y-auto custom-scrollbar"
                  >
                    <div className="space-y-1">
                      {feedbackTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.label);
                        return (
                          <button
                            key={tag.label}
                            type="button"
                            onClick={() => toggleTag(tag.label)}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-white shadow-sm'
                                : 'hover:bg-black/5 dark:hover:bg-zinc-800 text-text/80 dark:text-white/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {tag.icon}
                              <span>{tag.label}</span>
                            </div>
                            {isSelected && <Check size={14} className="text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selected Tag Chips on Mobile */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {selectedTags.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold border border-primary/20"
                    >
                      <span>{label}</span>
                      <button
                        type="button"
                        onClick={() => toggleTag(label)}
                        className="p-0.5 hover:bg-primary/20 rounded-full cursor-pointer"
                        title="Remove tag"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Review Description (MANDATORY) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-text/70 dark:text-white/70">
                Your Review Description <span className="text-red-500 font-bold">*</span>
              </label>
              <span className={`text-[11px] font-semibold ${feedbackText.trim().length === 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {feedbackText.trim().length === 0 ? 'Required' : `${feedbackText.trim().length} chars`}
              </span>
            </div>
            <textarea
              value={feedbackText}
              onChange={(e) => {
                setFeedbackText(e.target.value);
                if (e.target.value.trim().length > 0) setErrorMessage('');
              }}
              placeholder="Tell us about the flavors, presentation, service, or atmosphere that made your visit memorable..."
              rows={4}
              required
              className={`w-full bg-black/[0.02] dark:bg-zinc-800/60 border rounded-2xl p-4 sm:p-5 outline-none transition-all text-xs sm:text-sm text-title dark:text-white placeholder:text-text/30 dark:placeholder:text-white/30 resize-none ${
                errorMessage && !feedbackText.trim()
                  ? 'border-red-500 ring-2 ring-red-500/20'
                  : 'border-black/10 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
         
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || rating === 0 || !feedbackText.trim()}
            className={`w-full py-4 sm:py-5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer ${
              rating > 0 && feedbackText.trim()
                ? 'bg-primary text-white shadow-xl shadow-primary/25 hover:bg-primary-dark active:scale-[0.98]'
                : 'bg-black/10 dark:bg-zinc-800 text-text/30 dark:text-white/20 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Publishing Review...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </motion.form>

        {/* ========================================================= */}
        {/* RESPONSIVE LIST: User's Own Submitted Feedbacks Section */}
        {/* ========================================================= */}
        <div className="mt-14 sm:mt-18">
          {/* Section Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-black/10 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-title font-bold text-title dark:text-white">
                  Your Submitted Feedbacks
                </h2>
                <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {userFeedbacks.length}
                </span>
              </div>
              <p className="text-xs text-text/60 dark:text-white/60 mt-0.5">
                Past reviews and ratings you shared for Avyukt Restaurant
              </p>
            </div>

            <Link
              to="/#testimonials"
              className="text-xs font-bold text-primary dark:text-secondary hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View on Home Page</span>
              <span>→</span>
            </Link>
          </div>

          {/* Feedbacks Content */}
          {loadingFeedbacks ? (
            <div className="p-8 text-center bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-black/5 dark:border-white/5 flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span className="text-xs text-text/50 dark:text-white/50">Loading your feedback history...</span>
            </div>
          ) : userFeedbacks.length === 0 ? (
            <div className="p-8 sm:p-10 text-center bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-black/10 dark:border-white/10 backdrop-blur-sm">
              <MessageSquare size={36} className="text-text/30 dark:text-white/30 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-title dark:text-white mb-1">
                No Feedbacks Submitted Yet
              </h3>
              <p className="text-xs text-text/50 dark:text-white/50 max-w-sm mx-auto">
                Share your experience using the form above. Your review and profile avatar will appear here and in our royal testimonials!
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {userFeedbacks.map((fb) => {
                const isExpanded = expandedFeedbackIds.has(fb.id);
                const text = fb.feedbackText || 'Wonderful dining experience at Avyukt.';
                const isLongText = text.length > 90 || text.includes('\n');

                return (
                  <div
                    key={fb.id}
                    className="p-4 sm:p-5 md:p-6 bg-white/90 dark:bg-zinc-900/90 rounded-2xl sm:rounded-3xl border border-amber-950/10 dark:border-white/10 shadow-sm hover:shadow-md transition-all backdrop-blur-md flex flex-col gap-3 min-w-0 overflow-hidden"
                  >
                    {/* Top Bar: Profile Avatar, Name, Rating, Date, Delete Action */}
                    <div className="flex items-start sm:items-center justify-between gap-2.5 min-w-0">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-primary/30 p-0.5 bg-primary/10 shrink-0">
                          <img
                            src={
                              ((user?.uid && fb.userId === user.uid) ||
                               (user?.email && fb.userEmail && fb.userEmail.toLowerCase() === user.email.toLowerCase()))
                                ? (user?.avatar || user?.photoURL || user?.googlePhotoUrl || fb.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fb.userName || user?.name || 'User')}&background=800000&color=ffffff&bold=true&size=96`)
                                : (fb.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fb.userName || 'User')}&background=800000&color=ffffff&bold=true&size=96`)
                            }
                            alt={fb.userName || 'User Avatar'}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fb.userName || user?.name || 'User')}&background=800000&color=ffffff&bold=true&size=96`;
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-title dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span className="truncate max-w-[120px] sm:max-w-none">{fb.userName || 'You'}</span>
                            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                              Verified
                            </span>
                          </h4>
                          <p className="text-[10px] sm:text-[11px] text-text/50 dark:text-white/50 flex items-center gap-1 mt-0.5">
                            <Calendar size={11} className="shrink-0" />
                            <span>{formatDate(fb.createdAt)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Rating Badge */}
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl border border-amber-500/20 text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400">
                          <div className="hidden sm:flex items-center gap-0.5">
                            {[...Array(fb.rating || 5)].map((_, i) => (
                              <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
                            ))}
                          </div>
                          <Star size={11} className="sm:hidden text-amber-400 fill-amber-400" />
                          <span>{fb.rating}.0</span>
                        </div>

                        {/* Delete Button - Instant single click */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFeedback(fb.id, e)}
                          disabled={deletingId === fb.id}
                          className="p-1.5 sm:p-2 text-text/40 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Delete your review"
                        >
                          {deletingId === fb.id ? (
                            <Loader2 size={15} className="animate-spin text-red-500" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Few lines of description with Read more / Show less toggle */}
                    <div className="relative pl-3 border-l-2 border-primary/40 py-0.5 min-w-0">
                      <p
                        className={`text-xs sm:text-sm text-text/80 dark:text-white/80 leading-relaxed italic break-words [overflow-wrap:anywhere] whitespace-pre-wrap ${
                          !isExpanded ? 'line-clamp-2 sm:line-clamp-3' : ''
                        }`}
                      >
                        "{text}"
                      </p>
                      {isLongText && (
                        <button
                          type="button"
                          onClick={() => toggleExpandFeedback(fb.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary dark:text-secondary hover:underline mt-1.5 cursor-pointer select-none transition-colors"
                        >
                          <span>{isExpanded ? 'Show less' : 'Read more...'}</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </div>

                    {/* Tags */}
                    {fb.tags && fb.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {fb.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-lg bg-primary/5 dark:bg-zinc-800 text-primary dark:text-secondary border border-primary/10 shrink-0"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FeedbackPage;
