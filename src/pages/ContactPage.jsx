import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Instagram, Facebook, Send } from 'lucide-react';

const ContactPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 lg:pt-32 pb-20 dark:bg-zinc-950 min-h-screen"
    >
      <section className="bg-primary py-16 lg:py-24 text-center text-white mb-16">
        <div className="container">
          <h1 className="text-4xl lg:text-6xl font-title font-bold text-secondary mb-4">Contact Us</h1>
          <p className="text-lg lg:text-xl opacity-90">We'd love to hear from you</p>
        </div>
      </section>

      <div className="container grid lg:grid-cols-2 gap-16 items-start">
        {/* Contact Info & Map */}
        <div className="space-y-12">
          <div className="space-y-8">
            <h2 className="text-3xl font-title font-bold dark:text-white">Get in Touch</h2>
            <div className="grid gap-1">
              {[
                { icon: <MapPin />, title: "Visit Us", content: "Hotel Grand Ashok, Vidisha - 464001, Madhya Pradesh, India" },
                { icon: <Phone />, title: "Call Us", content: "+91 9039121277" },
                { icon: <Mail />, title: "Email Us", content: "rahul.baghel76@gmail.com" }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-5 items-start p-5 rounded-3xl group">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-title dark:text-white">{item.title}</h3>
                    <p className="text-text dark:text-gray-400">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl h-80 border-8 border-secondary/10">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7316.646039627791!2d77.79444694519044!3d23.520881666055843!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x397c050010a34e55%3A0xa3a073b6bff86f83!2savyukt%20restaurant!5e0!3m2!1sen!2sin!4v1773337676549!5m2!1sen!2sin" 
              className="w-full h-full transition-all duration-500"
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Restaurant Location"
            ></iframe>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-body dark:bg-zinc-900 p-8 lg:p-12 rounded-[3rem] shadow-2xl relative">
          <h2 className="text-3xl font-title font-bold dark:text-white mb-8">Send a Message</h2>
          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold dark:text-gray-200 ml-1">Your Name</label>
              <input type="text" className="w-full bg-white dark:bg-zinc-800 border-none rounded-2xl p-4 outline-none ring-2 ring-transparent focus:ring-primary transition-all dark:text-white" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold dark:text-gray-200 ml-1">Email Address</label>
              <input type="email" className="w-full bg-white dark:bg-zinc-800 border-none rounded-2xl p-4 outline-none ring-2 ring-transparent focus:ring-primary transition-all dark:text-white" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold dark:text-gray-200 ml-1">Message</label>
              <textarea rows="4" className="w-full bg-white dark:bg-zinc-800 border-none rounded-2xl p-4 outline-none ring-2 ring-transparent focus:ring-primary transition-all dark:text-white" placeholder="Tell us something..."></textarea>
            </div>
            <button type="button" className="btn btn-primary w-full py-4 gap-3">
              Send Message <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default ContactPage;
