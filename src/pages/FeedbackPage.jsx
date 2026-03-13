import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Send, MessageSquare, 
  ThumbsUp, ChefHat, Truck, Sparkles,
  CheckCircle
} from 'lucide-react';

const FeedbackPage = () => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const feedbackTags = [
    { label: 'Great Food', icon: <ChefHat size={14} /> },
    { label: 'Fast Delivery', icon: <Truck size={14} /> },
    { label: 'Excellent Service', icon: <ThumbsUp size={14} /> },
    { label: 'Good Packaging', icon: <Sparkles size={14} /> },
    { label: 'Value for Money', icon: <Star size={14} /> },
    { label: 'Friendly Staff', icon: <MessageSquare size={14} /> },
  ];

  const toggleTag = (label) => {
    setSelectedTags(prev =>
      prev.includes(label)
        ? prev.filter(t => t !== label)
        : [...prev, label]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitted(true);
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (submitted) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center bg-gray-50 dark:bg-zinc-950 transition-colors">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-8"
          >
            <CheckCircle size={48} />
          </motion.div>
          <h2 className="text-3xl font-title font-bold text-title dark:text-white mb-4">Thank You!</h2>
          <p className="text-text/60 dark:text-white/60 mb-8">
            Your feedback has been submitted successfully. We truly appreciate you taking the time to help us improve!
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSubmitted(false); setRating(0); setSelectedTags([]); setFeedbackText(''); }}
              className="px-6 py-3 bg-primary/10 text-primary rounded-2xl font-bold text-sm hover:bg-primary/20 transition-colors"
            >
              Submit Another
            </button>
            <a href="/" className="px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25">
              Back to Home
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-4xl font-title font-bold text-title dark:text-white mb-3">Share Your Feedback</h1>
          <p className="text-text/60 dark:text-white/60 max-w-md mx-auto">
            Your opinion matters! Help us serve you better by sharing your experience.
          </p>
        </motion.div>

        {/* Feedback Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 border border-black/5 dark:border-white/10 shadow-xl"
        >
          {/* Star Rating */}
          <div className="text-center mb-10">
            <p className="text-sm font-bold text-text/40 dark:text-white/40 uppercase tracking-wider mb-4">Rate your experience</p>
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-125 active:scale-95"
                >
                  <Star
                    size={40}
                    className={`transition-colors ${
                      star <= (hoveredStar || rating)
                        ? 'text-amber-400 fill-amber-400'
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
                  className="text-sm font-bold text-amber-600"
                >
                  {ratingLabels[hoveredStar || rating]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Tags */}
          <div className="mb-8">
            <p className="text-sm font-bold text-text/40 dark:text-white/40 uppercase tracking-wider mb-4 text-center">What did you like?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {feedbackTags.map(tag => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => toggleTag(tag.label)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    selectedTags.includes(tag.label)
                      ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                      : 'bg-gray-50 dark:bg-zinc-800 text-text/60 dark:text-white/60 border border-black/5 dark:border-white/5 hover:border-primary/30'
                  }`}
                >
                  {tag.icon}
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Feedback */}
          <div className="mb-8">
            <p className="text-sm font-bold text-text/40 dark:text-white/40 uppercase tracking-wider mb-4">Tell us more (optional)</p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share the details of your experience..."
              rows={4}
              className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5 rounded-2xl p-5 outline-none focus:border-primary transition-colors text-sm text-title dark:text-white placeholder:text-text/30 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={rating === 0}
            className={`w-full py-5 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              rating > 0
                ? 'bg-primary text-white shadow-xl shadow-primary/25 hover:bg-primary-dark active:scale-[0.98]'
                : 'bg-gray-200 dark:bg-zinc-800 text-text/30 dark:text-white/20 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
            Submit Feedback
          </button>
        </motion.form>

        {/* Bottom Note */}
        <p className="text-center text-[11px] text-text/30 dark:text-white/20 mt-6 max-w-sm mx-auto">
          Your feedback is anonymous and helps us improve our food quality, service, and overall dining experience.
        </p>
      </div>
    </div>
  );
};

export default FeedbackPage;
