import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Send, CheckCircle2, AlertCircle, User, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Reservation = () => {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    guests: '2',
    email: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-populate when user is logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      }));
    }
  }, [isLoggedIn, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.date) {
      setErrorMsg('Please complete your name, phone number, and booking date.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || '',
        date: formData.date,
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
    <section id="reservation" className="section bg-transparent">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Reservation Info */}
          <div>
            <span className="section-subtitle !text-left text-secondary font-semibold">Dine With Us</span>
            <h2 className="section-title !text-left after:left-0 after:translate-x-0 mb-8 text-white">
              Book a Table
            </h2>
            <p className="text-gray-200 dark:text-gray-300 mb-10 text-lg drop-shadow-sm">
              Reserve your spot for an unforgettable dining experience. Perfect for family dinners, dates, and celebrations.
            </p>

            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Our Location</h3>
                  <p className="text-gray-300 dark:text-gray-400">
                    Hotel Grand Ashok, 3rd Floor, Kundan Complex Shehnai Garden, Vidisha - 464001
                  </p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-secondary/20">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Opening Hours</h3>
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
          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 p-8 lg:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group text-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-colors"></div>
            
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
                  onClick={() => { setSubmitted(false); }}
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
                    <input 
                      type="tel" 
                      required
                      placeholder="+91 00000 00000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 outline-none ring-2 ring-transparent focus:ring-primary transition-all text-white placeholder:text-gray-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-200 uppercase tracking-wider">Date</label>
                    <input 
                      type="date" 
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 outline-none ring-2 ring-transparent focus:ring-primary transition-all text-white text-xs"
                    />
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
                  className="btn btn-primary w-full py-4 gap-3 shadow-primary/30 mt-2 text-xs uppercase tracking-wider font-bold"
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
