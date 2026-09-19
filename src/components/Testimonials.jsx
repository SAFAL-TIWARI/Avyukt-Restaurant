import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, Sparkles, CheckCircle2, MessageSquare, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { db, collection, onSnapshot } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const FeedbackCard = ({ item, userAvatars = {}, currentUser = null }) => {
  const name = item.userName || item.name || 'Valued Guest';
  const rating = Number(item.rating) || 5;
  
  // Format tags: join all selected options separated by commas
  let tag = '';
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    tag = item.tags
      .filter((t) => typeof t === 'string' && t.trim().length > 0)
      .join(', ');
  } else if (typeof item.tags === 'string' && item.tags.trim().length > 0) {
    tag = item.tags.trim();
  }

  if (!tag) {
    tag = item.userId && item.userId !== 'anonymous' && item.userId !== 'guest' 
      ? 'Verified Diner' 
      : 'Verified Guest';
  }

  const dish = item.dish || item.favoriteDish || null;
  const comment = item.feedbackText && item.feedbackText.trim()
    ? item.feedbackText
    : (item.tags && item.tags.length > 0 
        ? `Loved the ${Array.isArray(item.tags) ? item.tags.join(', ') : item.tags}! Wonderful royal dining experience.` 
        : 'Wonderful royal dining experience at Avyukt.');
  const isVerified = item.userId && item.userId !== 'anonymous' && item.userId !== 'guest';

  // Check if this feedback belongs to the currently logged-in user
  const isCurrentUser = Boolean(
    currentUser &&
    currentUser.uid &&
    currentUser.uid !== 'guest' &&
    currentUser.uid !== 'anonymous' &&
    (
      (item.userId &&
        item.userId !== 'anonymous' &&
        item.userId !== 'guest' &&
        (
          item.userId === currentUser.uid ||
          (currentUser.linkedGoogleUid && item.userId === currentUser.linkedGoogleUid) ||
          (currentUser.primaryProfileId && item.userId === currentUser.primaryProfileId)
        )
      ) ||
      (
        item.userEmail &&
        currentUser.email &&
        item.userEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
      )
    )
  );

  const normalizedEmail = (item.userEmail || '').trim().toLowerCase();
  const validUserId = item.userId && item.userId !== 'guest' && item.userId !== 'anonymous' ? item.userId : null;

  // Strict resolution: NEVER swap another user's avatar onto this feedback
  let avatar = null;

  // 1. If this review belongs to the current user, use their latest live profile photo
  if (isCurrentUser) {
    const liveAv = currentUser.avatar || currentUser.photoURL || currentUser.googlePhotoUrl;
    if (liveAv && !liveAv.includes('favicon.png') && !liveAv.includes('ui-avatars.com')) {
      avatar = liveAv;
    }
  }

  // 2. Check if a real updated photo exists in users collection for this specific reviewer
  if (!avatar) {
    const mappedByUid = validUserId ? userAvatars[validUserId] : null;
    const mappedByEmail = normalizedEmail ? userAvatars[normalizedEmail] : null;
    const mappedAvatar = mappedByUid || mappedByEmail;
    if (mappedAvatar && !mappedAvatar.includes('favicon.png') && !mappedAvatar.includes('ui-avatars.com')) {
      avatar = mappedAvatar;
    }
  }

  // 3. Use the original avatar stored directly on this feedback document
  if (!avatar && item.userAvatar && !item.userAvatar.includes('favicon.png')) {
    avatar = item.userAvatar;
  }

  // 4. Any mapped non-initials avatar
  if (!avatar) {
    avatar = (validUserId && userAvatars[validUserId]) || 
             (normalizedEmail && userAvatars[normalizedEmail]) || 
             item.userAvatar || 
             item.avatar;
  }

  // 5. Clean, personalized initials fallback based on THIS reviewer's name
  if (!avatar || avatar.includes('favicon.png')) {
    avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=800000&color=ffffff&bold=true&size=96`;
  }

  return (
    <div className="w-[280px] sm:w-[320px] md:w-[340px] p-5 sm:p-6 bg-zinc-900/75 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl hover:border-secondary/40 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between shrink-0 group select-none text-white">
      {/* Top Header: Avatar, Name, Rating */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-secondary/30 p-0.5 bg-black/30 shrink-0 mt-0.5">
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=800000&color=ffffff&bold=true&size=96`;
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm sm:text-base text-white truncate">
                {name}
              </h4>
              <p 
                className="text-[11px] text-secondary font-medium leading-snug line-clamp-2 break-words mt-0.5"
                title={tag}
              >
                {tag}
              </p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="flex items-center gap-0.5 shrink-0 bg-amber-500/15 px-2 py-1 rounded-full border border-amber-500/30 mt-0.5">
            {[...Array(Math.min(5, Math.max(1, rating)))].map((_, i) => (
              <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
            ))}
          </div>
        </div>

        {/* Testimonial Quote */}
        <div className="relative mb-4">
          <Quote size={16} className="text-secondary/40 mb-1 shrink-0" />
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed italic line-clamp-3">
            "{comment}"
          </p>
        </div>
      </div>

      {/* Footer: Dish / Tag & Verification */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-secondary truncate">
          {dish ? `🍽️ ${dish}` : '👑 Royal Dining'}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full shrink-0 border border-emerald-500/30">
          <CheckCircle2 size={10} />
          <span>{isVerified ? 'Verified Diner' : 'Verified Experience'}</span>
        </span>
      </div>
    </div>
  );
};

const Testimonials = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAvatars, setUserAvatars] = useState({});

  // 1. Fetch feedbacks purely from database
  useEffect(() => {
    let isMounted = true;

    const fetchFeedbacks = async () => {
      try {
        const res = await api.getAllFeedbacks();
        if (isMounted) {
          if (res && res.success && Array.isArray(res.feedbacks)) {
            setFeedbacks(res.feedbacks);
          } else if (Array.isArray(res)) {
            setFeedbacks(res);
          } else {
            setFeedbacks([]);
          }
        }
      } catch (err) {
        console.warn('Failed to load testimonials from DB:', err);
        if (isMounted) setFeedbacks([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFeedbacks();

    // Live sync feedbacks via Firestore
    let unsubscribe = null;
    if (db) {
      try {
        unsubscribe = onSnapshot(
          collection(db, 'feedbacks'),
          (snapshot) => {
            if (snapshot && !snapshot.empty) {
              const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              if (isMounted) {
                setFeedbacks(list);
                setLoading(false);
              }
            } else {
              fetchFeedbacks();
            }
          },
          (err) => {
            console.warn('Firestore feedbacks listener:', err.message);
          }
        );
      } catch (e) {
        // Fallback to API polling
      }
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 2. Real-time synchronization of all user profile avatars from Firestore
  // Whenever ANY user updates their profile avatar, it immediately reflects here
  useEffect(() => {
    if (!db) return;
    let unsubscribe = null;
    try {
      unsubscribe = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          if (!snapshot.empty) {
            const map = {};
            snapshot.docs.forEach((docSnap) => {
              const data = docSnap.data();
              const docId = docSnap.id;
              if (!docId || docId === 'guest' || docId === 'anonymous') return;

              const av = data.avatar || data.photoURL || data.googlePhotoUrl;
              if (!av) return;

              const isRealPhoto = !av.includes('favicon.png') && !av.includes('ui-avatars.com');

              // Map by docId (only if real photo or no photo set yet)
              if (isRealPhoto || !map[docId]) {
                map[docId] = av;
              }

              // Map by explicit uid
              if (data.uid && data.uid !== 'guest' && data.uid !== 'anonymous') {
                if (isRealPhoto || !map[data.uid]) {
                  map[data.uid] = av;
                }
              }

              // Map by email (do not overwrite existing real photo with placeholder)
              if (data.email) {
                const em = data.email.trim().toLowerCase();
                const existing = map[em];
                const existingIsReal = existing && !existing.includes('favicon.png') && !existing.includes('ui-avatars.com');
                if (isRealPhoto || !existingIsReal) {
                  map[em] = av;
                }
              }
            });
            setUserAvatars((prev) => ({ ...prev, ...map }));
          }
        },
        (err) => {
          console.warn('Firestore users avatar listener note:', err.message);
        }
      );
    } catch (e) {
      // Fallback
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sort feedbacks by newest first
  const sortedFeedbacks = [...feedbacks].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Distribute strictly real DB feedbacks into 2 rows
  let row1 = [];
  let row2 = [];

  if (sortedFeedbacks.length === 1) {
    row1 = [sortedFeedbacks[0]];
    row2 = [sortedFeedbacks[0]];
  } else if (sortedFeedbacks.length > 1) {
    row1 = sortedFeedbacks.filter((_, i) => i % 2 === 0);
    row2 = sortedFeedbacks.filter((_, i) => i % 2 !== 0);
    if (row2.length === 0) row2 = [...row1];
  }

  // Generate infinite tracks with enough duplicated cards for smooth CSS keyframe looping
  const makeInfiniteTrack = (items, minCount = 6) => {
    if (!items || items.length === 0) return [];
    let track = [...items];
    while (track.length < minCount) {
      track = [...track, ...items];
    }
    return [...track, ...track];
  };

  const row1Track = makeInfiniteTrack(row1);
  const row2Track = makeInfiniteTrack(row2);

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-transparent text-white relative overflow-hidden">
      {/* Subtle Luxury Ambient Glows */}
      <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Container - matches other section containers on Home */}
      <div className="container relative z-10 px-4 mb-14 text-center">
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-title font-bold text-white mb-4"
        >
          Loved by <span className="text-secondary italic">Royalty</span>, Cherished by Guests
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-xs sm:text-sm md:text-base text-gray-300 leading-relaxed"
        >
          Real stories and heartfelt impressions from food connoisseurs and families who experienced the opulent heritage of Avyukt.
        </motion.p>
      </div>

      {/* Marquee Tracks Container - Constrained to the EXACT same section container width as other sections */}
      <div className="container relative z-10">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin text-secondary" />
            <p className="text-xs font-medium">Loading guest reviews from database...</p>
          </div>
        ) : sortedFeedbacks.length === 0 ? (
          <div className="text-center py-12 px-6 bg-zinc-900/75 backdrop-blur-xl rounded-3xl border border-white/10 max-w-lg mx-auto shadow-xl">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-title text-white mb-2">
              No Reviews Yet
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mb-5">
              Be the first to share your dining experience and leave a reflection of your time at Avyukt!
            </p>
            <Link
              to="/feedback"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/25 cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>Write the First Review</span>
            </Link>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] py-2 space-y-6 sm:space-y-8">
            {/* ROW 1: Scrolls to the Left */}
            <div className="flex animate-marquee-left gap-4 sm:gap-6 pl-4 hover:[animation-play-state:paused]">
              {row1Track.map((item, idx) => (
                <FeedbackCard 
                  key={`r1_${item.id || idx}_${idx}`} 
                  item={item} 
                  currentUser={user}
                  userAvatars={userAvatars}
                />
              ))}
            </div>

            {/* ROW 2: Scrolls to the Right */}
            <div className="flex animate-marquee-right gap-4 sm:gap-6 pl-4 hover:[animation-play-state:paused]">
              {row2Track.map((item, idx) => (
                <FeedbackCard 
                  key={`r2_${item.id || idx}_${idx}`} 
                  item={item} 
                  currentUser={user}
                  userAvatars={userAvatars}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA: Share Experience */}
      <div className="container relative z-10 px-4 mt-12 text-center">
        <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-2 sm:p-2.5 bg-zinc-900/75 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg">
          <span className="text-xs font-semibold text-gray-200 px-3">
            Dined with us recently? We would love to hear your story!
          </span>
          <Link
            to="/feedback"
            className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/25 flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare size={14} />
            <span>Write a Review</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
