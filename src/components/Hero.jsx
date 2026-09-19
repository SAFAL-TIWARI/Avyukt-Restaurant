import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown, Loader2, Navigation, UtensilsCrossed } from 'lucide-react';
import { searchMenuItems } from '../data/menuData';
import AddToCartButton from './AddToCartButton';
import { db, doc, getDoc } from '../firebase/config';

const Hero = () => {
  const navigate = useNavigate();

  // ── Location Search State ──
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  // ── Food Search State ──
  const [foodQuery, setFoodQuery] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [showFoodResults, setShowFoodResults] = useState(false);
  const foodSearchRef = useRef(null);

  // Sync menu from Firestore if not already loaded in local storage
  useEffect(() => {
    if (!db) return;
    const syncMenu = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'fullMenu'));
        if (snap.exists() && snap.data().categories?.length > 0) {
          localStorage.setItem('avyukt_full_menu', JSON.stringify(snap.data().categories));
        }
      } catch (err) {
        console.warn('Hero menu sync note:', err.message);
      }
    };
    syncMenu();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (foodSearchRef.current && !foodSearchRef.current.contains(event.target)) {
        setShowFoodResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Location: Debounced suggestion fetching ──
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (locationQuery.trim().length > 2 && !isLocating) {
        setIsLoading(true);
        try {
          const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(locationQuery)}&limit=5`);
          const data = await response.json();
          setSuggestions(data.features || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        if (locationQuery.trim().length === 0) {
          setShowSuggestions(false);
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [locationQuery, isLocating]);

  // ── Food: Local search with debounce ──
  useEffect(() => {
    const timer = setTimeout(() => {
      if (foodQuery.trim().length > 0) {
        const results = searchMenuItems(foodQuery);
        setFoodResults(results);
        setShowFoodResults(true);
      } else {
        setFoodResults([]);
        setShowFoodResults(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [foodQuery]);

  const handleSelectSuggestion = (suggestion) => {
    const { name, city, state, country } = suggestion.properties;
    const displayName = [name, city, state, country].filter(Boolean).join(', ');
    setLocationQuery(displayName);
    setShowSuggestions(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    setIsLoading(true);
    setShowSuggestions(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const { name, city, state, country } = data.features[0].properties;
            const displayName = [name, city, state, country].filter(Boolean).join(', ');
            setLocationQuery(displayName);
          } else {
            setLocationQuery(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.error("Error in reverse geocoding:", error);
          setLocationQuery(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setIsLocating(false);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Check your browser permissions.");
        setIsLocating(false);
        setIsLoading(false);
      }
    );
  };

  const handleSelectFood = (item) => {
    setFoodQuery(item.name || item.title);
    setShowFoodResults(false);
    navigate('/menu');
  };

  return (
    <section id="home" className="relative min-h-screen py-24 lg:py-32 flex items-center justify-center bg-transparent">
      <div className="container relative z-10 text-center text-white px-4">
        <span className="block font-title italic text-xl lg:text-3xl text-secondary mb-4 drop-shadow-md animate-fade-in-up">
          Welcome to Avyukt
        </span>
        <h1 className="text-4xl lg:text-7xl mb-6 leading-tight drop-shadow-lg text-white font-serif">
          Authentic Flavours.<br /> <span className="text-secondary italic">Modern</span> Ambience.
        </h1>
        <p className="text-sm lg:text-lg mb-10 max-w-2xl mx-auto opacity-90 drop-shadow-md text-gray-200">
          Experience a symphony of taste with our exquisite North Indian, Chinese, and Fusion cuisine in a warm, inviting atmosphere.
        </p>
        
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
          {/* Location Selector */}
          <div className="relative w-full md:w-auto md:min-w-[320px]" ref={suggestionRef}>
            <div className="flex items-center bg-zinc-900/60 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 shadow-2xl cursor-text transition-all hover:bg-zinc-900/80 focus-within:ring-2 focus-within:ring-primary/50">
              <MapPin 
                className={`mr-3 shrink-0 cursor-pointer transition-colors ${isLocating ? 'text-primary animate-pulse' : 'text-secondary hover:text-primary'}`} 
                size={24} 
                onClick={getCurrentLocation}
              />
              <input 
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Enter your delivery location"
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-400 text-sm md:text-base text-left truncate"
              />
              {isLoading || isLocating ? (
                <Loader2 className="text-gray-300 animate-spin shrink-0" size={20} />
              ) : (
                <ChevronDown className="text-gray-300 shrink-0" size={20} />
              )}
            </div>

            {/* Location Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 overflow-hidden z-50 text-left">
                <div className="max-h-64 sm:max-h-72 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                  <ul className="py-1">
                    <li 
                      onClick={getCurrentLocation}
                      className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/10 cursor-pointer transition-colors group"
                    >
                      <div className="p-2 bg-primary/20 rounded-full group-hover:bg-primary/30 transition-colors">
                        <Navigation size={16} className="text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-primary">Use current location</p>
                        <p className="text-xs text-gray-400">Using GPS / Network</p>
                      </div>
                    </li>
                    {suggestions.map((suggestion, index) => {
                      const { name, city, state, country } = suggestion.properties;
                      return (
                        <li 
                          key={index}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="px-5 py-3 flex items-start gap-3 hover:bg-white/10 cursor-pointer transition-colors group"
                        >
                          <MapPin size={18} className="mt-1 text-gray-400 group-hover:text-secondary shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-white">{name}</p>
                            <p className="text-xs text-gray-400">
                              {[city, state, country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Food Search Input */}
          <div className="relative w-full md:flex-1 max-w-2xl" ref={foodSearchRef}>
            <div className="flex items-center bg-zinc-900/60 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 shadow-2xl transition-all hover:bg-zinc-900/80 focus-within:ring-2 focus-within:ring-primary/50">
              <input 
                type="text"
                value={foodQuery}
                onChange={(e) => setFoodQuery(e.target.value)}
                onFocus={() => foodQuery.length > 0 && setShowFoodResults(true)} 
                placeholder="Search for Dish, item or more" 
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-400 text-sm md:text-base"
              />
              <Search className="text-gray-300 shrink-0 hover:text-secondary transition-colors cursor-pointer" size={22} />
            </div>

            {/* Food Search Results Dropdown with Responsive Height & Custom Vertical Scrollbar */}
            {showFoodResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 z-50 overflow-hidden text-left">
                {/* Result header count */}
                {foodResults.length > 0 && (
                  <div className="px-5 py-2.5 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold text-secondary">
                      Dishes Found ({foodResults.length})
                    </span>
                    <span className="text-[11px] text-gray-400">Scroll to view all</span>
                  </div>
                )}

                {/* Scrollable container with visible vertical scrollbar */}
                <div className="max-h-[300px] sm:max-h-[360px] md:max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-white/5 overscroll-contain">
                  {foodResults.length > 0 ? (
                    <ul className="py-1">
                      {foodResults.map((item) => (
                        <li 
                          key={item.id}
                          onClick={() => handleSelectFood(item)}
                          className="px-4 sm:px-5 py-3 flex items-center gap-3.5 hover:bg-white/10 cursor-pointer transition-colors group"
                        >
                          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-black/30 border border-white/10">
                            <img 
                              src={item.image || '/assets/paneer.jpeg'} 
                              alt={item.name || item.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/assets/paneer.jpeg';
                              }}
                            />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-bold text-white group-hover:text-secondary transition-colors truncate">
                              {item.name || item.title}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {item.category || 'Speciality'}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-secondary whitespace-nowrap mr-2">
                            {item.price}
                          </span>
                          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                            <AddToCartButton 
                              item={{ 
                                id: item.id, 
                                name: item.name || item.title, 
                                title: item.name || item.title, 
                                desc: item.desc || item.description || '', 
                                price: item.price, 
                                image: item.image || '/assets/paneer.jpeg' 
                              }} 
                              size="small" 
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-5 py-6 text-center">
                      <UtensilsCrossed size={26} className="mx-auto text-gray-500 mb-2" />
                      <p className="text-sm text-gray-300 font-medium">No dishes found for "{foodQuery}"</p>
                      <p className="text-xs text-gray-500 mt-1">Try searching for paneer, dal, naan, or biryani</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
