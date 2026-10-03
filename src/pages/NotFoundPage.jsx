import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Home, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

// 6 Signature dishes from Avyukt Restaurant
const DISH_ITEMS = [
  { id: 'paneer', name: 'Shahi Paneer', image: '/assets/paneer.jpeg' },
  { id: 'dosa', name: 'Crispy Dosa', image: '/assets/dosa.jpeg' },
  { id: 'biryani', name: 'Dum Biryani', image: '/assets/recipes/biryani.jpeg' },
  { id: 'thali', name: 'Royal Thali', image: '/assets/recipes/thali.jpeg' },
  { id: 'noodles', name: 'Hakka Noodles', image: '/assets/noodles.jpeg' },
  { id: 'jamun', name: 'Gulab Jamun', image: '/assets/jamun.jpeg' },
];

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const createDeck = () => {
  // Duplicate each dish to form 6 pairs (12 cards)
  const fullDeck = [...DISH_ITEMS, ...DISH_ITEMS].map((dish, index) => ({
    cardId: `${dish.id}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    dishId: dish.id,
    name: dish.name,
    image: dish.image,
  }));
  return shuffleArray(fullDeck);
};

const NotFoundPage = () => {
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedDishIds, setMatchedDishIds] = useState(new Set());
  const [isInitialPreview, setIsInitialPreview] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [moves, setMoves] = useState(0);

  const previewTimeoutRef = useRef(null);
  const mismatchTimeoutRef = useRef(null);
  const confettiIntervalRef = useRef(null);

  // Trigger professional bottom cracker confetti
  const launchCrackerConfetti = useCallback(() => {
    // Professional bottom burst crackers (from bottom left, center, and right)
    const end = Date.now() + 1500; // 2.5 seconds short duration
    const colors = ['#800000', '#D4AF37', '#FBBF24', '#F59E0B', '#FFFFFF', '#DC2626'];

    const frame = () => {
      // Bottom left cracker
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0.15, y: 0.95 },
        colors,
        startVelocity: 45,
        decay: 0.92,
        scalar: 1.1,
      });

      // Bottom right cracker
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 0.85, y: 0.95 },
        colors,
        startVelocity: 45,
        decay: 0.92,
        scalar: 1.1,
      });

      // Bottom center upward burst
      confetti({
        particleCount: 6,
        angle: 90,
        spread: 70,
        origin: { x: 0.5, y: 0.95 },
        colors,
        startVelocity: 50,
        decay: 0.92,
        scalar: 1.2,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  // Initialize or restart game
  const initGame = useCallback(() => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    if (mismatchTimeoutRef.current) clearTimeout(mismatchTimeoutRef.current);
    if (confettiIntervalRef.current) clearInterval(confettiIntervalRef.current);

    const newDeck = createDeck();
    setCards(newDeck);
    setSelectedCards([]);
    setMatchedDishIds(new Set());
    setGameWon(false);
    setMoves(0);
    setIsLocked(true);
    setIsInitialPreview(true);

    // Initial 1-second preview so user remembers where items are
    previewTimeoutRef.current = setTimeout(() => {
      setIsInitialPreview(false);
      setIsLocked(false);
    }, 1500);
  }, []);

  useEffect(() => {
    initGame();

    return () => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      if (mismatchTimeoutRef.current) clearTimeout(mismatchTimeoutRef.current);
      if (confettiIntervalRef.current) clearInterval(confettiIntervalRef.current);
    };
  }, [initGame]);

  // Card click handler following exact user specifications
  const handleCardClick = (card) => {
    // Disallow clicking during initial preview, when board is locked, or if card is already revealed/matched
    if (isInitialPreview || isLocked) return;
    if (matchedDishIds.has(card.dishId)) return;
    if (selectedCards.some((c) => c.cardId === card.cardId)) return;

    if (selectedCards.length === 0) {
      // First card chosen
      setSelectedCards([card]);
    } else if (selectedCards.length === 1) {
      // Second card chosen
      const firstCard = selectedCards[0];
      const secondCard = card;
      setSelectedCards([firstCard, secondCard]);
      setMoves((prev) => prev + 1);

      if (firstCard.dishId === secondCard.dishId) {
        // MATCH: pair stays visible permanently
        const updatedMatches = new Set(matchedDishIds);
        updatedMatches.add(firstCard.dishId);
        setMatchedDishIds(updatedMatches);
        setSelectedCards([]);

        // Check if all 6 pairs are found
        if (updatedMatches.size === DISH_ITEMS.length) {
          setGameWon(true);
          launchCrackerConfetti();
        }
      } else {
        // MISMATCH: shows for 1 second, then both disappear again
        setIsLocked(true);
        mismatchTimeoutRef.current = setTimeout(() => {
          setSelectedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-[85vh] pt-28 lg:pt-36 pb-20 flex items-center justify-center bg-body dark:bg-zinc-950 transition-colors duration-300">
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          {/* Left Column: 404 Info & Navigation */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">

            {/* Avyukt Brand Emblem Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-16 h-16 sm:w-20 sm:h-20   relative group overflow-hidden"
            >
              <img
                src="/favicon.png"
                alt="Avyukt Restaurant Logo"
                className="w-full h-full object-cover rounded-xl select-none"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/favicon.png';
                }}
              />

            </motion.div>

            {/* Headline */}
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-title text-primary dark:text-red-500 uppercase tracking-tight leading-none">
                404 - PAGE
              </h1>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-title text-primary dark:text-red-500 uppercase tracking-tight leading-none">
                NOT FOUND
              </h2>
            </div>

            {/* Description */}
            <div className="space-y-2 max-w-md">
              <p className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base leading-relaxed font-medium">
                The page you are looking for is not available or no longer exists.
              </p>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                While you are here, match all pairs of our signature dishes to satisfy your hunger!
              </p>
            </div>

            {/* Game Stats & Status */}
            <div className="flex items-center gap-3 py-1 text-xs sm:text-sm">
              <div className="px-3.5 py-1.5 rounded-full bg-amber-100/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300/50 dark:border-amber-700/50 font-semibold flex items-center gap-1.5">
                <span>Pairs: {matchedDishIds.size} / {DISH_ITEMS.length}</span>
              </div>

              {moves > 0 && (
                <div className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-zinc-700 text-xs font-medium">
                  Tries: {moves}
                </div>
              )}

              {isInitialPreview && (
                <span className="text-xs font-semibold text-primary dark:text-amber-400 animate-pulse">
                  Memorize the dishes...
                </span>
              )}
            </div>

            {/* Victory Callout if won */}
            <AnimatePresence>
              {gameWon && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full max-w-md p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/10 border border-secondary/40 text-left flex items-center gap-3 shadow-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
                    <Trophy size={20} className="text-amber-600 dark:text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-title dark:text-white">
                      Delicious Victory! 🎉
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate">
                      You matched all signature dishes in {moves} moves!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-7 py-3 rounded-full shadow-lg hover:shadow-primary/30 transition-all duration-200 active:scale-95"
              >
                <Home size={16} />
                <span>BACK TO HOME PAGE</span>
              </Link>

              <button
                type="button"
                onClick={initGame}
                disabled={isInitialPreview}
                className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs sm:text-sm px-4 py-3 rounded-full border border-neutral-300 dark:border-zinc-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Restart & Shuffle Dishes"
              >
                <RotateCcw size={16} />
                <span>Play Again</span>
              </button>
            </div>

          </div>

          {/* Right Column: 3x4 Circular Grid Food Memory Game */}
          <div className="lg:col-span-7 flex justify-center items-center">
            <div className="w-full max-w-lg sm:max-w-xl p-3 sm:p-5 rounded-3xl bg-neutral-50/50 dark:bg-zinc-900/40 border border-neutral-200/40 dark:border-white/5 backdrop-blur-sm shadow-xl">

              {/* 3 rows x 4 columns = 12 circular blocks */}
              <div className="grid grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {cards.map((card) => {
                  const isSelected = selectedCards.some((c) => c.cardId === card.cardId);
                  const isMatched = matchedDishIds.has(card.dishId);
                  const isRevealed = isInitialPreview || isSelected || isMatched;

                  return (
                    <button
                      key={card.cardId}
                      type="button"
                      onClick={() => handleCardClick(card)}
                      disabled={isInitialPreview || isLocked || isMatched}
                      aria-label={isRevealed ? card.name : 'Hidden dish circle'}
                      className="group relative aspect-square w-full rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/50 transition-transform duration-200 active:scale-95 disabled:cursor-default"
                    >
                      {/* Outer circular shell */}
                      <div className="w-full h-full rounded-full flex items-center justify-center p-1 transition-transform duration-300 group-hover:scale-[1.03]">
                        <AnimatePresence mode="wait">
                          {isRevealed ? (
                            /* Revealed / Matched State: Vibrant warm circular disc with dish image */
                            <motion.div
                              key="revealed"
                              initial={{ rotateY: 90, scale: 0.85, opacity: 0 }}
                              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                              exit={{ rotateY: -90, scale: 0.85, opacity: 0 }}
                              transition={{ duration: 0.28, ease: 'easeOut' }}
                              className={`w-full h-full rounded-full flex items-center justify-center p-1 sm:p-1.5 shadow-md relative overflow-hidden transition-all ${isMatched
                                  ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 ring-2 ring-amber-300 dark:ring-amber-500/70 shadow-amber-500/20'
                                  : 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 shadow-amber-400/20'
                                }`}
                            >
                              {/* Inner dish circular picture */}
                              <div className="w-full h-full rounded-full overflow-hidden bg-white/30 backdrop-blur-xs flex items-center justify-center border border-white/40 shadow-inner">
                                <img
                                  src={card.image}
                                  alt={card.name}
                                  className="w-full h-full object-cover rounded-full select-none pointer-events-none transition-transform duration-300 group-hover:scale-110"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/assets/paneer.jpeg';
                                  }}
                                />
                              </div>

                              {/* Subtle matched check/glow indicator */}
                              {isMatched && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute bottom-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm text-[9px] font-bold"
                                >
                                  ✓
                                </motion.div>
                              )}
                            </motion.div>
                          ) : (
                            /* Unrevealed State: Soft empty fine-dining plate circle */
                            <motion.div
                              key="hidden"
                              initial={{ rotateY: -90, scale: 0.85, opacity: 0 }}
                              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                              exit={{ rotateY: 90, scale: 0.85, opacity: 0 }}
                              transition={{ duration: 0.28, ease: 'easeOut' }}
                              className="w-full h-full rounded-full bg-neutral-200/90 dark:bg-zinc-800/90 border border-neutral-300/80 dark:border-zinc-700 flex items-center justify-center shadow-inner cursor-pointer hover:bg-neutral-300/80 dark:hover:bg-zinc-700/80 transition-colors"
                            >
                              {/* Embossed inner plate rim groove (matching reference style) */}
                              <div className="w-3/5 h-3/5 rounded-full border border-neutral-300 dark:border-zinc-700/80 bg-neutral-100/50 dark:bg-zinc-800/50 flex items-center justify-center shadow-xs">
                                <div className="w-2 h-2 rounded-full bg-neutral-300/70 dark:bg-zinc-700" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Game Helper Footer */}
              <div className="mt-4 pt-3 border-t border-neutral-200/60 dark:border-zinc-800 text-center">
                <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  {isInitialPreview ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      Quickly memorize the dish locations before they turn over!
                    </span>
                  ) : gameWon ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Congratulations! You solved the Avyukt Menu Puzzle!
                    </span>
                  ) : (
                    <span>
                      Click circles to flip and match pairs of Avyukt's authentic dishes.
                    </span>
                  )}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
