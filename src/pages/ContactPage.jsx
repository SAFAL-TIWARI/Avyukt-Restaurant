import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Send, CheckCircle2, AlertCircle, ShieldCheck, User } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ContactPage = () => {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isLoggedIn && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [isLoggedIn, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMsg('Please fill in your name, email, and inquiry message.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        message: formData.message,
        isAnonymous: !isLoggedIn,
        userId: isLoggedIn ? (user?.uid || 'user') : 'guest',
      };

      await api.submitContact(payload);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      toast.success('Your message has been received by our management team!', 'Message Dispatched');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send message.');
      toast.error('Failed to send message.', 'Submission Error');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-title font-bold dark:text-white">Send a Message</h2>
            
            
          </div>

          {submitted ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-2xl font-bold font-title text-title dark:text-white mb-2">Message Sent!</h3>
              <p className="text-xs text-text/60 dark:text-white/60 mb-6">
                Thank you for contacting Avyukt Restaurant. We have received your message and will respond promptly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="bg-primary text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-primary-dark transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider dark:text-gray-300 ml-1">Your Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border-none rounded-2xl p-3.5 outline-none ring-2 ring-transparent focus:ring-primary transition-all dark:text-white text-xs" 
                  placeholder="John Doe" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider dark:text-gray-300 ml-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border-none rounded-2xl p-3.5 outline-none ring-2 ring-transparent focus:ring-primary transition-all dark:text-white text-xs" 
                  placeholder="john@example.com" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider dark:text-gray-300 ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border-none rounded-2xl p-3.5 outline-none ring-2 ring-transparent focus:ring-primary transition-all dark:text-white text-xs" 
                  placeholder="1234567890" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider dark:text-gray-300 ml-1">Message</label>
                <textarea 
                  rows="4" 
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border-none rounded-2xl p-3.5 outline-none ring-2 ring-transparent focus:ring-primary transition-all dark:text-white text-xs resize-none" 
                  placeholder="Tell us about your event, query, or catering request..."
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary w-full py-4 gap-3 text-xs uppercase tracking-wider font-bold mt-2"
              >
                {loading ? 'Sending...' : 'Send Message'} <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ContactPage;
