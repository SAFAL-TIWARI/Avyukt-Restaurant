import React from 'react';
import { MapPin, Phone, Clock, Send } from 'lucide-react';

const Contact = () => {
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
            
            <form className="relative space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-200">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none ring-2 ring-transparent focus:ring-primary transition-all text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-200">Phone</label>
                  <input 
                    type="tel" 
                    placeholder="+91 00000 00000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none ring-2 ring-transparent focus:ring-primary transition-all text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-200">Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none ring-2 ring-transparent focus:ring-primary transition-all text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-200">Guests</label>
                  <input 
                    type="number" 
                    placeholder="2"
                    min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none ring-2 ring-transparent focus:ring-primary transition-all text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <button type="button" className="btn btn-primary w-full py-4 gap-3 shadow-primary/30">
                Reserve My Spot <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
