import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ChevronDown, ChevronUp,
  Phone, Mail, MessageCircle, MapPin,
  ShoppingBag, CreditCard, Clock, Utensils,
  HelpCircle, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const quickLinks = [
    { icon: <ShoppingBag size={24} />, label: 'Track Order', desc: 'Check your order status', path: '/orders', color: 'bg-blue-500/10 text-blue-600 border-blue-500/15' },
    { icon: <CreditCard size={24} />, label: 'Payments', desc: 'Refund & payment issues', path: '#', color: 'bg-green-500/10 text-green-600 border-green-500/15' },
    { icon: <Clock size={24} />, label: 'Delivery', desc: 'Delivery time & fees', path: '#', color: 'bg-amber-500/10 text-amber-600 border-amber-500/15' },
    { icon: <Utensils size={24} />, label: 'Menu & Food', desc: 'Allergens & customization', path: '/menu', color: 'bg-primary/10 text-primary border-primary/15' },
  ];

  const faqs = [
    {
      category: 'Orders',
      questions: [
        { q: 'How do I track my order?', a: 'Go to "My Orders" from the profile menu. You can see real-time status of all active orders including preparation and delivery updates.' },
        { q: 'Can I cancel my order?', a: 'You can cancel an order within 2 minutes of placing it. After that, the kitchen starts preparing your food. Go to My Orders → Active Orders → Cancel.' },
        { q: 'How long does delivery take?', a: 'Typically 30–45 minutes depending on your location and order size. You\'ll see an estimated time on the order tracking screen.' },
      ]
    },
    {
      category: 'Payment & Refunds',
      questions: [
        { q: 'What payment methods do you accept?', a: 'We accept UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery. All online payments are processed securely via Stripe.' },
        { q: 'How do I get a refund?', a: 'Refunds are automatically processed within 5–7 business days for cancelled orders. For quality issues, contact us through the Feedback page and we\'ll resolve it within 24 hours.' },
      ]
    },
    {
      category: 'Account',
      questions: [
        { q: 'How do I update my profile?', a: 'Go to Profile from the navigation menu. Click "Edit Profile" to update your name, phone number, or delivery address.' },
        { q: 'How do loyalty points work?', a: 'You earn 1 point for every ₹10 spent. Accumulated points can be redeemed for discounts on future orders. Check your points balance on your Profile page.' },
      ]
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.map(cat => ({
        ...cat,
        questions: cat.questions.filter(
          faq => faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.questions.length > 0)
    : faqs;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-4xl font-title font-bold text-title dark:text-white mb-3">How can we help?</h1>
          <p className="text-text/60 dark:text-white/60 max-w-md mx-auto mb-8">
            Search our FAQ or browse by topic below. We're here to help!
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-text/30 dark:text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help topics..."
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/10 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 transition-all text-title dark:text-white placeholder:text-text/30"
            />
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14"
        >
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`p-5 rounded-2xl border text-center hover:scale-[1.03] hover:shadow-lg transition-all ${link.color}`}
            >
              <div className="flex justify-center mb-3">{link.icon}</div>
              <p className="font-bold text-sm mb-1">{link.label}</p>
              <p className="text-[11px] opacity-70">{link.desc}</p>
            </Link>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <div className="space-y-8">
          {filteredFaqs.map((category, catIdx) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * catIdx }}
            >
              <h2 className="text-sm font-bold text-text/40 dark:text-white/40 uppercase tracking-wider mb-4 ml-2">{category.category}</h2>
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/10 overflow-hidden divide-y divide-black/5 dark:divide-white/5">
                {category.questions.map((faq, idx) => {
                  const faqId = `${catIdx}-${idx}`;
                  const isOpen = openFaq === faqId;
                  return (
                    <div key={idx}>
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : faqId)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-primary/[0.02] transition-colors"
                      >
                        <span className={`font-bold text-sm pr-4 ${isOpen ? 'text-primary' : 'text-title dark:text-white'}`}>{faq.q}</span>
                        {isOpen ? <ChevronUp size={18} className="text-primary flex-shrink-0" /> : <ChevronDown size={18} className="text-text/30 dark:text-white/30 flex-shrink-0" />}
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <p className="px-5 pb-5 text-sm text-text/60 dark:text-white/50 leading-relaxed">{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {filteredFaqs.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <HelpCircle size={40} className="text-primary/30 mx-auto mb-4" />
              <h3 className="text-xl font-title font-bold text-title dark:text-white mb-2">No results found</h3>
              <p className="text-text/60 dark:text-white/60 text-sm">Try a different search term or browse the categories above.</p>
            </motion.div>
          )}
        </div>

        {/* Contact Support Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-14 bg-primary/5 border border-primary/10 rounded-3xl p-8 text-center"
        >
          <h3 className="text-xl font-title font-bold text-title dark:text-white mb-2">Still need help?</h3>
          <p className="text-sm text-text/60 dark:text-white/60 mb-6 max-w-md mx-auto">
            Our support team is available daily from 10 AM – 11 PM. Reach out and we'll get back to you quickly.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:+919039121277" className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border border-black/5 dark:border-white/10 text-sm font-bold text-title dark:text-white hover:border-primary/30 transition-all">
              <Phone size={16} className="text-primary" />
              Call Us
            </a>
            <a href="mailto:rahul.baghel76@gmail.com" className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border border-black/5 dark:border-white/10 text-sm font-bold text-title dark:text-white hover:border-primary/30 transition-all">
              <Mail size={16} className="text-primary" />
              Email Us
            </a>
            <a href="https://wa.me/919039121277" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border border-black/5 dark:border-white/10 text-sm font-bold text-title dark:text-white hover:border-primary/30 transition-all">
              <MessageCircle size={16} className="text-green-500" />
              WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpPage;
