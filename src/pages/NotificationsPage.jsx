import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, ShoppingBag, Tag, Gift, 
  Info, CheckCircle2, Clock, Trash2, 
  ChevronDown, BellOff
} from 'lucide-react';

const NotificationsPage = () => {
  const [filter, setFilter] = useState('all');

  const allNotifications = [
    {
      id: 1,
      type: 'order',
      title: 'Order Delivered!',
      message: 'Your order #ORD-2024-8875 has been delivered. Enjoy your meal!',
      time: '10 min ago',
      read: false,
      icon: <ShoppingBag size={20} />,
      color: 'bg-green-500/10 text-green-600 border-green-500/20',
    },
    {
      id: 2,
      type: 'promo',
      title: '🎉 Weekend Special — 30% OFF!',
      message: 'Use code WEEKEND30 on your next order above ₹500. Valid till Sunday.',
      time: '2 hours ago',
      read: false,
      icon: <Tag size={20} />,
      color: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      id: 3,
      type: 'order',
      title: 'Order Confirmed',
      message: 'Your order #ORD-2024-8892 has been confirmed and is being prepared.',
      time: '3 hours ago',
      read: true,
      icon: <CheckCircle2 size={20} />,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    },
    {
      id: 4,
      type: 'reward',
      title: 'Loyalty Points Earned',
      message: 'You earned 45 loyalty points for your last order. Keep ordering!',
      time: 'Yesterday',
      read: true,
      icon: <Gift size={20} />,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    },
    {
      id: 5,
      type: 'info',
      title: 'New Menu Items Added',
      message: 'Check out our new Fusion Thali and Dragon Paneer Roll. Now available for ordering!',
      time: '2 days ago',
      read: true,
      icon: <Info size={20} />,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    },
    {
      id: 6,
      type: 'promo',
      title: 'First Order? Get 20% OFF!',
      message: 'Welcome to Avyukt! Use code WELCOME20 to get 20% off on your first online order.',
      time: '3 days ago',
      read: true,
      icon: <Tag size={20} />,
      color: 'bg-primary/10 text-primary border-primary/20',
    },
  ];

  const [notifications, setNotifications] = useState(allNotifications);

  const filteredNotifications = filter === 'all'
    ? notifications
    : filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'order', label: 'Orders' },
    { id: 'promo', label: 'Promos' },
    { id: 'reward', label: 'Rewards' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-title font-bold text-title dark:text-white mb-2">Notifications</h1>
            <p className="text-text/60 dark:text-white/60">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm font-bold text-primary hover:text-primary-dark transition-colors self-start sm:self-auto"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-white dark:bg-zinc-900 text-text/60 dark:text-white/60 border border-black/5 dark:border-white/10 hover:border-primary/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notif => (
                <motion.div
                  key={notif.id}
                  layout
                  variants={itemVariants}
                  exit={{ x: -80, opacity: 0, transition: { duration: 0.2 } }}
                  className={`relative bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl border transition-all group ${
                    notif.read
                      ? 'border-black/5 dark:border-white/5'
                      : 'border-primary/20 shadow-md shadow-primary/5'
                  }`}
                >
                  <div className="flex items-start gap-4 p-5">
                    {/* Unread dot */}
                    {!notif.read && (
                      <span className="absolute top-5 left-2 w-2 h-2 bg-primary rounded-full" />
                    )}

                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center ${notif.color}`}>
                      {notif.icon}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`font-bold text-sm truncate ${notif.read ? 'text-title/80 dark:text-white/80' : 'text-title dark:text-white'}`}>
                          {notif.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] text-text/40 dark:text-white/40 flex items-center gap-1">
                            <Clock size={10} />
                            {notif.time}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-text/60 dark:text-white/50 leading-relaxed line-clamp-2">{notif.message}</p>
                    </div>

                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center py-20"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                  <BellOff size={36} />
                </div>
                <h3 className="text-2xl font-title font-bold text-title dark:text-white mb-2">No notifications</h3>
                <p className="text-text/60 dark:text-white/60 max-w-xs">
                  {filter === 'all' ? 'You don\'t have any notifications yet.' : 'No notifications match this filter.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationsPage;
