import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, ShoppingBag, Tag, Gift, 
  Info, CheckCircle2, Clock, Trash2, 
  BellOff, Sparkles, Copy, Check, RefreshCw,
  ChevronDown, ChevronUp, Flame, Megaphone,
  CheckCheck, Utensils
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import { db, collection, query, where, onSnapshot } from '../firebase/config';
import api from '../services/api';
import { NotificationSkeleton } from '../components/common/Skeleton';

const CATEGORY_CONFIG = {
  all: {
    id: 'all',
    label: 'All Notifications',
    icon: Bell,
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
  },
  order: {
    id: 'order',
    label: 'Orders & Bookings',
    icon: ShoppingBag,
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  promo: {
    id: 'promo',
    label: 'Promo & Discounts',
    icon: Tag,
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  offer: {
    id: 'offer',
    label: 'Special Chef Offer',
    icon: Flame,
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  announcement: {
    id: 'announcement',
    label: 'Announcements',
    icon: Megaphone,
    badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  },
  reward: {
    id: 'reward',
    label: 'Rewards & Loyalty',
    icon: Gift,
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  unread: {
    id: 'unread',
    label: 'Unread Only',
    icon: CheckCheck,
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
  },
};

const determineCategory = (notif) => {
  if (notif.type === 'order') return 'order';
  const type = (notif.type || '').toLowerCase();
  const text = `${notif.title || ''} ${notif.message || ''}`.toLowerCase();

  if (type === 'offer' || text.includes('chef') || text.includes('special dish') || text.includes('signature') || text.includes('special offer')) {
    return 'offer';
  }
  if (type === 'reward' || text.includes('reward') || text.includes('loyalty') || text.includes('points') || text.includes('free dessert')) {
    return 'reward';
  }
  if (type === 'info' || type === 'announcement' || type === 'inquiry' || text.includes('announcement') || text.includes('notice') || text.includes('holiday') || text.includes('timing') || text.includes('inquiry') || text.includes('reply') || text.includes('response')) {
    return 'announcement';
  }
  return 'promo';
};

const NotificationsPage = () => {
  const { user, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get('filter');
  const [filter, setFilter] = useState(urlFilter || 'all');

  useEffect(() => {
    if (urlFilter && CATEGORY_CONFIG[urlFilter]) {
      setFilter(urlFilter);
    }
  }, [urlFilter]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSearchParams({ filter: newFilter });
  };

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const res = await api.getUserNotifications(user.uid, user?.email);
      if (res.success && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.warn('Could not fetch notifications via API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !user?.uid) return;

    fetchNotifications();

    if (db) {
      try {
        const qUser = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const unsubscribeUser = onSnapshot(qUser, () => {
          fetchNotifications();
        }, (err) => console.warn('Firestore live listener notice:', err.message));

        let unsubscribeEmail = () => {};
        if (user.email) {
          const qEmail = query(collection(db, 'notifications'), where('userEmail', '==', user.email.trim().toLowerCase()));
          unsubscribeEmail = onSnapshot(qEmail, () => {
            fetchNotifications();
          }, () => {});
        }

        const qBroadcast = query(collection(db, 'notifications'), where('userId', '==', 'all'));
        const unsubscribeBroadcast = onSnapshot(qBroadcast, () => {
          fetchNotifications();
        }, (err) => console.warn('Broadcast listener notice:', err.message));

        return () => {
          unsubscribeUser();
          unsubscribeEmail();
          unsubscribeBroadcast();
        };
      } catch (e) {
        console.warn('Live subscription fallback:', e.message);
      }
    }
  }, [isLoggedIn, user]);

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      let date = null;
      if (typeof isoString?.toDate === 'function') {
        date = isoString.toDate();
      } else if (isoString?.seconds) {
        date = new Date(isoString.seconds * 1000);
      } else if (typeof isoString === 'number') {
        date = new Date(isoString);
      } else {
        date = new Date(isoString);
      }
      if (!date || isNaN(date.getTime())) return 'Just now';

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      const timeFormatted = date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        if (diffMins < 1) return `Just now (${timeFormatted})`;
        if (diffMins < 60) return `${diffMins}m ago • ${timeFormatted}`;
        return `Today • ${timeFormatted}`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday • ${timeFormatted}`;
      }

      return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • ${timeFormatted}`;
    } catch {
      return 'Just now';
    }
  };

  // Group notifications belonging to the same single order & deduplicate
  const processCards = () => {
    const orderGroups = new Map();
    const otherCards = [];

    // 1. Deduplicate notifications & exclude superseded allotment-only notifications & enforce strict recipient privacy
    const seenContent = new Set();
    const cleanNotifications = [];
    const currentEmail = (user?.email || '').trim().toLowerCase();
    const currentUid = user?.uid;

    notifications.forEach((notif) => {
      const notifTitle = (notif.title || '').toLowerCase();
      const notifEmail = (notif.userEmail || '').trim().toLowerCase();

      // RECIPIENT PRIVACY FILTER:
      // If notification is tied to a specific userEmail that doesn't match this logged in user, SKIP!
      if (notifEmail && notifEmail !== 'all' && notifEmail !== currentEmail) {
        return;
      }

      // If notification is tied to a specific userId (not 'all') that doesn't match this logged in user, SKIP!
      if (notif.userId && notif.userId !== 'all' && notif.userId !== 'guest' && !notif.userId.startsWith('email_')) {
        if (currentUid && notif.userId !== currentUid) {
          return;
        }
      }

      // If notification was mistakenly saved with userId === 'all' but contains private user-specific content (inquiry reply, table, order),
      // only show it to the intended recipient!
      if (notif.userId === 'all') {
        const isPrivate = 
          notif.type === 'order' || 
          notif.type === 'contact' || 
          notifTitle.includes('inquiry') || 
          notifTitle.includes('reservation') || 
          notifTitle.includes('table #') || 
          notifTitle.includes('order #') ||
          (notifEmail && notifEmail !== 'all');

        if (isPrivate && (!currentEmail || notifEmail !== currentEmail)) {
          return; // Block leakage of private notification to other users
        }
      }

      // Only confirmed reservation notification should appear (exclude standalone allotment notifications)
      if (notifTitle.includes('allotted')) {
        return;
      }

      const contentKey = `${notif.title || ''}___${notif.message || ''}`;
      if (seenContent.has(contentKey)) {
        return; // Skip duplicate copy
      }
      seenContent.add(contentKey);
      cleanNotifications.push(notif);
    });

    cleanNotifications.forEach((notif) => {
      const text = `${notif.title || ''} ${notif.message || ''}`;
      const isOrder = notif.type === 'order' || 
        text.toLowerCase().includes('order') || 
        text.toLowerCase().includes('reservation') || 
        text.toLowerCase().includes('table #');

      if (isOrder) {
        let refKey = null;
        let displayRef = null;

        if (notif.orderId) {
          refKey = `ORDER_${notif.orderId.toUpperCase()}`;
          displayRef = `Order #${notif.orderId.toUpperCase()}`;
        } else {
          const orderMatch = text.match(/(?:Order|ORD)\s*#?([A-Za-z0-9_-]{4,})/i);
          if (orderMatch) {
            refKey = `ORDER_${orderMatch[1].toUpperCase()}`;
            displayRef = `Order #${orderMatch[1].toUpperCase()}`;
          } else {
            const resMatch = text.match(/(?:Reservation|RES)\s*#?([A-Za-z0-9_-]{4,})/i);
            if (resMatch) {
              refKey = `RES_${resMatch[1].toUpperCase()}`;
              displayRef = `Table Booking #${resMatch[1].toUpperCase()}`;
            } else {
              const tableMatch = text.match(/Table\s*#?(\d+)/i);
              if (tableMatch) {
                refKey = `TABLE_${tableMatch[1]}`;
                displayRef = `Table #${tableMatch[1]} Booking`;
              }
            }
          }
        }

        if (refKey) {
          if (!orderGroups.has(refKey)) {
            orderGroups.set(refKey, {
              isOrderGroup: true,
              id: refKey,
              displayRef,
              category: 'order',
              items: [],
            });
          }
          orderGroups.get(refKey).items.push(notif);
          return;
        }
      }

      // Standalone or broadcast notification
      otherCards.push({
        ...notif,
        isOrderGroup: false,
        category: determineCategory(notif),
      });
    });

    const finalizedOrderCards = Array.from(orderGroups.values()).map((grp) => {
      // Sort progression timeline: newest first
      grp.items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const latest = grp.items[0];
      const isAllRead = grp.items.every((item) => item.read);

      // Extract current status
      let currentStatus = 'Placed';
      const combinedText = grp.items.map(i => `${i.title} ${i.message}`).join(' ');
      if (combinedText.includes('Delivered') || combinedText.includes('Delivery Confirmed')) {
        currentStatus = 'Delivered';
      } else if (combinedText.includes('Out for Delivery')) {
        currentStatus = 'Out for Delivery';
      } else if (combinedText.includes('Ready for dispatch') || combinedText.includes('Ready')) {
        currentStatus = 'Ready';
      } else if (combinedText.includes('Preparing') || combinedText.includes('sizzling')) {
        currentStatus = 'Preparing';
      } else if (combinedText.includes('Accepted')) {
        currentStatus = 'Accepted';
      } else if (combinedText.includes('Confirmed') || combinedText.includes('CONFIRMED')) {
        currentStatus = 'Confirmed';
      } else if (combinedText.includes('Rejected') || combinedText.includes('could not be confirmed')) {
        currentStatus = 'Declined';
      }

      return {
        ...grp,
        read: isAllRead,
        createdAt: latest.createdAt,
        latestItem: latest,
        status: currentStatus,
        count: grp.items.length,
        allIds: grp.items.map(i => i.id),
      };
    });

    const allCards = [...finalizedOrderCards, ...otherCards];
    allCards.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return allCards;
  };

  const processedCards = processCards();

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredCards = processedCards.filter((card) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !card.read;
    return card.category === filter;
  });

  const getCategoryCount = (catId) => {
    if (catId === 'all') return processedCards.length;
    if (catId === 'unread') return processedCards.filter(c => !c.read).length;
    return processedCards.filter(c => c.category === catId).length;
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const unreadList = notifications.filter(n => !n.read);
      await Promise.all(unreadList.map(n => api.markNotificationRead(n.id).catch(() => {})));
    } catch (e) {
      console.warn('Error marking notifications as read:', e);
    }
  };

  const handleMarkCardAsRead = async (card) => {
    const idsToMark = card.isOrderGroup ? card.allIds : [card.id];
    setNotifications(prev => prev.map(n => idsToMark.includes(n.id) ? { ...n, read: true } : n));
    try {
      await Promise.all(idsToMark.map(id => api.markNotificationRead(id).catch(() => {})));
    } catch (e) {
      console.warn('Failed to mark read on server:', e);
    }
  };

  const handleDeleteCard = (card) => {
    const idsToDelete = card.isOrderGroup ? card.allIds : [card.id];
    setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.id)));
    idsToDelete.forEach(id => api.deleteNotification(id).catch(() => {}));
  };

  const toggleOrderAccordion = (id) => {
    setExpandedOrders(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast({
      title: 'Coupon Copied',
      message: `Code ${code} copied to clipboard. Enjoy your discount!`,
      type: 'success',
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'Out for Delivery':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
      case 'Ready':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'Preparing':
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'Confirmed':
      case 'Accepted':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Declined':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-primary/15 text-primary border-primary/30';
    }
  };

  const getCategoryVisuals = (category) => {
    switch (category) {
      case 'order':
        return {
          icon: <ShoppingBag size={18} />,
          badge: 'Order Progression',
          style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
        };
      case 'offer':
        return {
          icon: <Flame size={18} />,
          badge: 'Special Chef Offer',
          style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
        };
      case 'announcement':
        return {
          icon: <Megaphone size={18} />,
          badge: 'Announcement',
          style: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
        };
      case 'reward':
        return {
          icon: <Gift size={18} />,
          badge: 'Rewards & Loyalty',
          style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
        };
      default:
        return {
          icon: <Tag size={18} />,
          badge: 'Promo & Discount',
          style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
        };
    }
  };

  const selectedCategoryConfig = CATEGORY_CONFIG[filter] || CATEGORY_CONFIG.all;
  const SelectedIcon = selectedCategoryConfig.icon;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-body dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-title font-bold text-title dark:text-white">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-text/60 dark:text-white/60 mt-1">
              Consolidated order tracking updates and broadcasted offers from Avyukt.
            </p>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={fetchNotifications}
              disabled={loading}
              title="Refresh Notifications"
              className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 text-text/60 dark:text-white/60 hover:text-primary transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar: Professional Custom Dropdown & Quick Badges */}
        <div className="mb-6 space-y-3">
          
          {/* Top Row: Professional Category Dropdown Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            

            {/* Quick Summary Pill for Current Selection */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-text/60 dark:text-white/60">
              <span>Showing:</span>
              <strong className="text-title dark:text-white font-bold">{selectedCategoryConfig.label}</strong>
              <span>({filteredCards.length})</span>
            </div>
          </div>

          {/* Horizontal Category Badges for Instant 1-Click Access */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {Object.values(CATEGORY_CONFIG).map((cat) => {
              const IconComp = cat.icon;
              const isSelected = filter === cat.id;
              const count = getCategoryCount(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => handleFilterChange(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white dark:bg-zinc-900 text-text/70 dark:text-white/70 border border-black/5 dark:border-white/10 hover:border-primary/30'
                  }`}
                >
                  <IconComp size={13} />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-text/60 dark:text-white/60'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Notifications Feed */}
        {loading && notifications.length === 0 ? (
          <NotificationSkeleton count={4} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredCards.length > 0 ? (
                filteredCards.map((card) => {
                  
                  // ==================== ORDER GROUP CARD ====================
                  if (card.isOrderGroup) {
                    const isExpanded = expandedOrders[card.id];
                    return (
                      <motion.div
                        key={card.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                        onClick={() => !card.read && handleMarkCardAsRead(card)}
                        className={`relative bg-white dark:bg-zinc-900/90 rounded-3xl border transition-all p-5 shadow-sm hover:shadow-md ${
                          card.read
                            ? 'border-black/5 dark:border-white/10'
                            : 'border-primary/40 shadow-primary/5 bg-primary/[0.015]'
                        }`}
                      >
                        {/* Unread dot */}
                        {!card.read && (
                          <span className="absolute top-5 left-3 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-primary/20" />
                        )}

                        {/* Top Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-3 pl-3 sm:pl-0">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                              <ShoppingBag size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-sm text-title dark:text-white">
                                  {card.displayRef}
                                </h3>
                                <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border ${getStatusBadge(card.status)}`}>
                                  {card.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-text/50 dark:text-white/50">
                                Single Order Tracking • {card.count} status update{card.count > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {/* Time & Quick Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <span className="text-[11px] text-text/50 dark:text-white/50 font-medium flex items-center gap-1">
                              <Clock size={11} />
                              {formatTime(card.createdAt)}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCard(card);
                              }}
                              className="p-2 rounded-xl text-text/40 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                              title="Dismiss Order Notifications"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Latest Progression Update Summary */}
                        <div className="pt-3.5 pb-2">
                          <div className="bg-gray-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-black/5 dark:border-white/5">
                            <p className="text-xs font-bold text-title dark:text-white mb-1">
                              {card.latestItem.title}
                            </p>
                            <p className="text-xs text-text/70 dark:text-white/70 leading-relaxed">
                              {card.latestItem.message}
                            </p>
                          </div>
                        </div>

                        {/* Multi-Update Accordion Trigger */}
                        {card.count > 1 && (
                          <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrderAccordion(card.id);
                              }}
                              className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1.5 transition-colors py-1"
                            >
                              <span>{isExpanded ? 'Hide Status Progression' : `View Full Order Timeline (${card.count} Events)`}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            <span className="text-[10px] text-text/40 dark:text-white/40">
                              {isExpanded ? 'Showing complete journey' : 'Click to expand history'}
                            </span>
                          </div>
                        )}

                        {/* Accordion Timeline: Vertical Step Progression */}
                        <AnimatePresence>
                          {isExpanded && card.count > 1 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 space-y-3"
                            >
                              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500/30">
                                {card.items.map((event, idx) => (
                                  <div key={event.id || idx} className="relative">
                                    {/* Timeline Dot */}
                                    <span className={`absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                                      idx === 0 ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-gray-400'
                                    }`} />
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className="text-xs font-bold text-title dark:text-white">
                                        {event.title}
                                      </h4>
                                      <span className="text-[10px] text-text/40 dark:text-white/40 font-mono">
                                        {formatTime(event.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-text/60 dark:text-white/60 mt-0.5 leading-relaxed">
                                      {event.message}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </motion.div>
                    );
                  }

                  // ==================== BROADCAST / PROMO / CHEF OFFER / ANNOUNCEMENT / REWARD CARD ====================
                  const visuals = getCategoryVisuals(card.category);
                  return (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                      onClick={() => !card.read && handleMarkCardAsRead(card)}
                      className={`relative bg-white dark:bg-zinc-900/90 rounded-3xl border transition-all p-5 shadow-sm hover:shadow-md ${
                        card.read
                          ? 'border-black/5 dark:border-white/10'
                          : 'border-primary/40 shadow-primary/5 bg-primary/[0.015]'
                      }`}
                    >
                      {/* Unread dot */}
                      {!card.read && (
                        <span className="absolute top-5 left-3 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-primary/20" />
                      )}

                      <div className="flex items-start gap-4 pl-3 sm:pl-0">
                        {/* Visual Category Icon */}
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${visuals.style}`}>
                          {visuals.icon}
                        </div>

                        <div className="flex-grow min-w-0">
                          {/* Category Tag & Time */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md border ${visuals.style}`}>
                                {visuals.badge}
                              </span>
                              <h3 className={`font-bold text-sm truncate ${card.read ? 'text-title/80 dark:text-white/80' : 'text-title dark:text-white'}`}>
                                {card.title}
                              </h3>
                            </div>

                            <span className="text-[11px] text-text/50 dark:text-white/50 font-medium flex items-center gap-1 shrink-0">
                              <Clock size={11} />
                              {formatTime(card.createdAt)}
                            </span>
                          </div>

                          {/* Message Body */}
                          <p className="text-xs text-text/70 dark:text-white/70 leading-relaxed mb-3">
                            {card.message}
                          </p>

                          {/* Promo Code Box with 1-Click Copy */}
                          {card.promoCode && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                              <Sparkles size={12} />
                              <span>Code: <span className="tracking-wider">{card.promoCode}</span></span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyCode(card.promoCode);
                                }}
                                className="p-1 rounded-md hover:bg-primary/20 transition-colors ml-1"
                                title="Copy Promo Code"
                              >
                                {copiedCode === card.promoCode ? (
                                  <Check size={13} className="text-emerald-600" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delete Notification Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(card);
                          }}
                          className="p-2 rounded-xl text-text/40 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shrink-0"
                          title="Dismiss notification"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/10 p-8 shadow-sm"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                    <BellOff size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-title dark:text-white mb-1">
                    No notifications in this category
                  </h3>
                  <p className="text-xs text-text/60 dark:text-white/60 max-w-sm mb-4">
                    {filter === 'all'
                      ? 'You are all caught up! As soon as you place a food order or the restaurant broadcasts exclusive chef specials and promo discounts, updates will appear here.'
                      : `There are currently no active notifications under "${selectedCategoryConfig.label}".`}
                  </p>
                  {filter !== 'all' && (
                    <button
                      onClick={() => handleFilterChange('all')}
                      className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
                    >
                      View All Notifications
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default NotificationsPage;
