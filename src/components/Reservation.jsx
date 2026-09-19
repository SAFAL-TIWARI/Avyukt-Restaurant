import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Clock, Send, CheckCircle2, AlertCircle, User, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TIME_SLOTS = [
  { time: '12:30 PM', period: 'Lunch' },
  { time: '01:00 PM', period: 'Lunch' },
  { time: '01:30 PM', period: 'Lunch' },
  { time: '02:00 PM', period: 'Lunch' },
  { time: '07:00 PM', period: 'Dinner' },
  { time: '07:30 PM', period: 'Dinner' },
  { time: '08:00 PM', period: 'Dinner' },
  { time: '08:30 PM', period: 'Dinner' },
  { time: '09:00 PM', period: 'Dinner' },
  { time: '09:30 PM', period: 'Dinner' },
  { time: '10:00 PM', period: 'Dinner' },
];

const Reservation = () => {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '07:30 PM',
    guests: '2',
    email: '',
  });

  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const timeDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target)) {
        setIsTimeDropdownOpen(false);
      }
    };
    if (isTimeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTimeDropdownOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsTimeDropdownOpen(false);
    };
    if (isTimeDropdownOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTimeDropdownOpen]);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Get today's date in local YYYY-MM-DD to restrict past dates in date picker
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = getTodayDate();

  // Auto-populate when user is logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      const userPhoneClean = (user.phone || '').replace(/\D/g, '').slice(-10);
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: userPhoneClean || prev.phone,
        email: user.email || '',
      }));
    }
  }, [isLoggedIn, user]);

  const handlePhoneChange = (e) => {
    // Strictly allow only numeric digits and max 10 digits
    const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phone: numericValue }));
    if (errorMsg) setErrorMsg('');
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setFormData(prev => ({ ...prev, date: selectedDate }));
    if (selectedDate && selectedDate < minDate) {
      setErrorMsg('Past dates cannot be selected for table booking.');
    } else if (errorMsg) {
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone || !formData.date) {
      setErrorMsg('Please complete your name, phone number, and booking date.');
      return;
    }

    // Validate 10 digit phone number
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit phone number (e.g. 9876543210).');
      toast.error('Please enter a valid 10-digit phone number.', 'Invalid Phone');
      return;
    }

    // Validate date is not in the past
    if (formData.date < minDate) {
      setErrorMsg('Past dates cannot be selected for table booking. Please choose today or an upcoming date.');
      toast.error('Please select today or a future date for your reservation.', 'Invalid Date');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        name: formData.name.trim(),
        phone: cleanPhone,
        email: formData.email || '',
        date: formData.date,
        time: formData.time || '07:30 PM',
        guests: formData.guests,
        isAnonymous: !isLoggedIn,
        userId: isLoggedIn ? (user?.uid || 'user') : 'guest',
        userRole: isLoggedIn ? (user?.role || 'customer') : 'guest',
      };

      await api.bookTable(payload);
      setSubmitted(true);
      toast.success('Your table booking request has been submitted!', 'Table Reserved');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit reservation. Please try again.');
      toast.error('Failed to submit reservation.', 'Booking Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="reservation" className="py-24  text-white relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Reservation Info */}
          <div className="space-y-8">
            <div>
              <span className="text-secondary font-semibold text-xs tracking-widest uppercase">
                Book a Table
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-title mt-2 text-white">
                Reserve Your Dining Experience
              </h2>
              <p className="text-gray-300 dark:text-gray-400 mt-4 text-sm leading-relaxed max-w-lg">
                Whether it's a romantic dinner, family celebration, or business lunch, we provide the perfect ambiance and culinary excellence.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-5">
                <div className="w-12 h-12 bg-primary-dark rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/20">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Restaurant Location</h3>
                  <p className="text-gray-300 dark:text-gray-400 text-sm">
                    Hotel Grand Ashok, 3rd Floor, Kundan Complex, Shehnai Garden, Vidisha (M.P.)
                  </p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="w-12 h-12 bg-primary-dark rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/20">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Operating Hours</h3>
                  <p className="text-gray-300 dark:text-gray-400 text-sm">
                    Mon - Sun: 11:00 AM - 11:00 PM
                  </p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="w-12 h-12 bg-primary-dark rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/20">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Phone Number</h3>
                  <p className="text-gray-300 dark:text-gray-400">+91 8319670523</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reservation Form */}
          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 p-8 lg:p-12 rounded-[2.5rem] shadow-2xl relative group text-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-colors pointer-events-none"></div>
            
            {/* Status Indicator: Verified Member vs Guest */}
            <div className="mb-4">
              {isLoggedIn ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <ShieldCheck size={14} />
                  <span>Verified Member Booking ({user?.name || user?.email})</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-gray-300 text-xs">
                  <User size={14} />
                  <span>Booking as Guest (or Sign in to track)</span>
                </div>
              )}
            </div>

            {submitted ? (
              <div className="py-12 text-center relative z-10">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-title">Reservation Requested!</h3>
                <p className="text-gray-300 text-xs mb-6 max-w-sm mx-auto">
                  Thank you! Our restaurant manager has received your reservation request and will confirm your table shortly.
                </p>
                <button
                  onClick={() => { 
                    setSubmitted(false); 
                    setFormData(prev => ({
                      ...prev,
                      date: '',
                      guests: '2',
                    }));
                  }}
                  className="bg-primary text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-primary-dark transition-colors"
                >
                  Book Another Table
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative space-y-5">
                {errorMsg && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-200 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 outline-none ring-2 ring-transparent focus:ring-primary transition-all text-white placeholder:text-gray-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-200 uppercase tracking-wider">Phone</label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        required
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 outline-none ring-2 ring-transparent focus:ring-primary transition-all text-white placeholder:text-gray-500 text-xs"
                      />
                      {formData.phone && (
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          formData.phone.length === 10 ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400'
                        }`}>
                          {formData.phone.length}/10
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-200 uppercase tracking-wider">Date</label>
                    <input 
                      type="date" 
                      required
                      min={minDate}
                      value={formData.date}
                      onChange={handleDateChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 outline-none ring-2 ring-transparent focus:ring-primary transition-all text-white text-xs"
                    />
                  </div>
                  <div className="relative" ref={timeDropdownRef}>
                    <label className="block text-xs font-bold mb-1.5 text-gray-200 uppercase tracking-wider">Time Slot</label>
                    <button
                      type="button"
                      onClick={() => setIsTimeDropdownOpen(prev => !prev)}
                      className={`w-full bg-white/5 border rounded-xl p-3.5 outline-none transition-all text-white text-xs flex items-center justify-between cursor-pointer ${
                        isTimeDropdownOpen 
                          ? 'border-primary ring-2 ring-primary/40 bg-white/10' 
                          : 'border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
                      }`}
                      aria-haspopup="listbox"
                      aria-expanded={isTimeDropdownOpen}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Clock size={13} className="text-primary shrink-0" />
                        <span className="font-semibold">{formData.time}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                          {TIME_SLOTS.find(s => s.time === formData.time)?.period || 'Dinner'}
                        </span>
                      </span>
                      <ChevronDown 
                        size={14} 
                        className={`text-gray-400 transition-transform duration-200 shrink-0 ${isTimeDropdownOpen ? 'rotate-180 text-primary' : ''}`} 
                      />
                    </button>

                    {/* Custom Animated Website Dropdown Menu */}
                    <AnimatePresence>
                      {isTimeDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 top-full mt-2 bg-zinc-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 max-h-64 overflow-y-auto"
                          role="listbox"
                        >
                          {/* Lunch Section */}
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/80 flex items-center justify-between border-b border-white/5 mb-1">
                            <span>Lunch Slots</span>
                            <span className="text-[9px] text-gray-400 normal-case">12:30 PM - 02:00 PM</span>
                          </div>
                          <div className="space-y-0.5 mb-2">
                            {TIME_SLOTS.filter(s => s.period === 'Lunch').map((slot) => {
                              const isSelected = formData.time === slot.time;
                              return (
                                <button
                                  key={slot.time}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, time: slot.time }));
                                    setIsTimeDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-primary text-white font-bold shadow-sm' 
                                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                  }`}
                                  role="option"
                                  aria-selected={isSelected}
                                >
                                  <span>{slot.time}</span>
                                  {isSelected && <Check size={13} className="shrink-0" />}
                                </button>
                              );
                            })}
                          </div>

                          {/* Dinner Section */}
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/80 flex items-center justify-between border-b border-white/5 mb-1">
                            <span>Dinner Slots</span>
                            <span className="text-[9px] text-gray-400 normal-case">07:00 PM - 10:00 PM</span>
                          </div>
                          <div className="space-y-0.5">
                            {TIME_SLOTS.filter(s => s.period === 'Dinner').map((slot) => {
                              const isSelected = formData.time === slot.time;
                              return (
                                <button
                                  key={slot.time}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, time: slot.time }));
                                    setIsTimeDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-primary text-white font-bold shadow-sm' 
                                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                  }`}
                                  role="option"
                                  aria-selected={isSelected}
                                >
                                  <span>{slot.time}</span>
                                  {isSelected && <Check size={13} className="shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-200 uppercase tracking-wider">Guests</label>
                    <input 
                      type="number" 
                      placeholder="2"
                      min="1"
                      max="20"
                      required
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 outline-none ring-2 ring-transparent focus:ring-primary transition-all text-white placeholder:text-gray-500 text-xs"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary w-full py-4 gap-3 shadow-primary/30 mt-2 text-xs uppercase tracking-wider font-bold cursor-pointer"
                >
                  {loading ? 'Submitting...' : 'Reserve My Spot'} <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reservation;
