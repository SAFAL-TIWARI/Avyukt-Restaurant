import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown, Loader2, Navigation, UtensilsCrossed } from 'lucide-react';
import { searchMenuItems } from '../data/menuData';
import AddToCartButton from './AddToCartButton';

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
    }, 200);
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
    setFoodQuery(item.name);
    setShowFoodResults(false);
    navigate('/menu');
  };

  return (
    <section id="home" className="relative min-h-screen h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image and Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/assets/hero.jpeg" 
          alt="Avyukt Restaurant Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70"></div>
      </div>
      
      <div className="container relative z-10 text-center text-white pt-20 px-4">
        <span className="block font-title italic text-xl lg:text-3xl text-secondary mb-4 drop-shadow-md">
          Welcome to Avyukt
        </span>
        <h1 className="text-4xl lg:text-7xl mb-6 leading-tight drop-shadow-lg text-white">
          Authentic Flavours.<br /> Modern Ambience.
        </h1>
        <p className="text-sm lg:text-lg mb-10 max-w-2xl mx-auto opacity-90 drop-shadow-md">
          Experience a symphony of taste with our exquisite North Indian, Chinese, and Fusion cuisine in a warm, inviting atmosphere.
        </p>
        
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
          {/* Location Selector */}
          <div className="relative w-full md:w-auto md:min-w-[320px]" ref={suggestionRef}>
            <div className="flex items-center bg-white dark:bg-zinc-900 rounded-2xl px-5 py-4 shadow-2xl cursor-text transition-transform hover:scale-[1.01] focus-within:ring-2 focus-within:ring-primary/50">
              <MapPin 
                className={`mr-3 shrink-0 cursor-pointer transition-colors ${isLocating ? 'text-primary animate-pulse' : 'text-orange-600 hover:text-primary'}`} 
                size={24} 
                onClick={getCurrentLocation}
              />
              <input 
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Enter your delivery location"
                className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-white placeholder:text-gray-400 text-sm md:text-base text-left truncate"
              />
              {isLoading || isLocating ? (
                <Loader2 className="text-gray-400 animate-spin shrink-0" size={20} />
              ) : (
                <ChevronDown className="text-gray-500 shrink-0" size={20} />
              )}
            </div>

            {/* Location Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden z-50">
                <ul className="py-2">
                  <li 
                    onClick={getCurrentLocation}
                    className="px-5 py-4 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors group border-b border-gray-100 dark:border-zinc-800"
                  >
                    <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <Navigation size={18} className="text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-primary">Use current location</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Using GPS / Network</p>
                    </div>
                  </li>
                  {suggestions.map((suggestion, index) => {
                    const { name, city, state, country } = suggestion.properties;
                    return (
                      <li 
                        key={index}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="px-5 py-3 flex items-start gap-3 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors group"
                      >
                        <MapPin size={18} className="mt-1 text-gray-400 group-hover:text-primary shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {[city, state, country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                  {locationQuery.length > 2 && suggestions.length === 0 && !isLoading && (
                    <li className="px-5 py-4 text-center text-sm text-gray-500">
                      No results found for "{locationQuery}"
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Food Search Input */}
          <div className="relative w-full md:flex-1 max-w-2xl" ref={foodSearchRef}>
            <div className="flex items-center bg-white dark:bg-zinc-900 rounded-2xl px-5 py-4 shadow-2xl transition-transform hover:scale-[1.01] focus-within:ring-2 focus-within:ring-primary/50">
              <input 
                type="text"
                value={foodQuery}
                onChange={(e) => setFoodQuery(e.target.value)}
                onFocus={() => foodQuery.length > 0 && setShowFoodResults(true)} 
                placeholder="Search for Dish, item or more" 
                className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-white placeholder:text-gray-400 text-sm md:text-base"
              />
              <Search className="text-gray-400 shrink-0 hover:text-primary transition-colors cursor-pointer" size={22} />
            </div>

            {/* Food Search Results Dropdown */}
            {showFoodResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden z-50">
                <ul className="py-2">
                  {foodResults.length > 0 ? (
                    <>
                      {foodResults.map((item) => (
                        <li 
                          key={item.id}
                          onClick={() => handleSelectFood(item)}
                          className="px-5 py-3 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-primary/10">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.category}</p>
                          </div>
                          <span className="text-sm font-bold text-primary whitespace-nowrap mr-2">{item.price}</span>
                          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                            <AddToCartButton item={{ id: item.id, title: item.name, price: item.price, image: item.image }} size="small" />
                          </div>
                        </li>
                      ))}
                      <li 
                        onClick={() => { setShowFoodResults(false); navigate('/menu'); }}
                        className="px-5 py-3 text-center text-sm font-semibold text-primary hover:bg-primary/5 cursor-pointer transition-colors border-t border-gray-100 dark:border-zinc-800"
                      >
                        View full menu →
                      </li>
                    </>
                  ) : (
                    <li className="px-5 py-4 text-center">
                      <UtensilsCrossed size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm text-gray-500">No dishes found for "{foodQuery}"</p>
                      <button 
                        onClick={() => { setShowFoodResults(false); navigate('/menu'); }}
                        className="mt-2 text-xs font-semibold text-primary hover:underline"
                      >
                        Browse full menu
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
