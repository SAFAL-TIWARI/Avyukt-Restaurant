import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ShoppingBag, IndianRupee, Clock, 
  Calendar, CheckCircle2, XCircle, AlertCircle, 
  Truck, Utensils, MessageSquare, Star, Mail, Lock, ShieldCheck,
  Megaphone, Send, Tag, Sparkles, Trash2, LayoutGrid, List,
  Edit3, Check, ChevronRight, Phone, RefreshCw, ChevronDown, Gift, Flame,
  Reply, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import { db, collection, onSnapshot, doc, setDoc } from '../firebase/config';
import api from '../services/api';

const DashboardPage = () => {
  const { user, isAdmin, loginAsAdmin } = useAuth();
  const { addToast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [adminTab, setAdminTab] = useState(urlTab || 'orders'); // 'orders' | 'reservations' | 'feedbacks' | 'contacts' | 'broadcast'

  useEffect(() => {
    if (urlTab && ['orders', 'reservations', 'feedbacks', 'contacts', 'broadcast'].includes(urlTab)) {
      setAdminTab(urlTab);
    }
  }, [urlTab]);

  const handleAdminTabChange = (tabId) => {
    setAdminTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Admin login credentials state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active View Mode
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' (default grid)

  // Live Database Data
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeKitchenOrders: 0,
    deliveredOrders: 0,
    totalBookings: 0,
    totalFeedbacks: 0,
    totalContacts: 0,
  });

  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Quick Table Number Assignment state
  const [tableInputs, setTableInputs] = useState({});
  const [editingTableId, setEditingTableId] = useState(null);

  // Expanded items in list view (for mobile)
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Broadcast Offer State
  const [offerTitle, setOfferTitle] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerType, setOfferType] = useState('promo');
  const [offerPromoCode, setOfferPromoCode] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [isOfferDropdownOpen, setIsOfferDropdownOpen] = useState(false);
  const offerDropdownRef = useRef(null);

  const broadcastCategories = [
    { value: 'promo', label: 'Promo & Discount', icon: <Tag size={14} className="text-rose-500" />, desc: 'Discounts, percentage off, coupon vouchers' },
    { value: 'offer', label: 'Special Chef Offer', icon: <Flame size={14} className="text-amber-500" />, desc: 'Signature dishes & head chef specials' },
    { value: 'info', label: 'Announcement', icon: <Megaphone size={14} className="text-sky-500" />, desc: 'Hours, festival greetings, restaurant updates' },
    { value: 'reward', label: 'Rewards & Loyalty', icon: <Gift size={14} className="text-purple-500" />, desc: 'Customer points, free dessert, perks' },
  ];

  // Inquiry Reply State
  const [replyModalContact, setReplyModalContact] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (offerDropdownRef.current && !offerDropdownRef.current.contains(e.target)) {
        setIsOfferDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Load All Admin Data from API
  const loadAllAdminData = async (showLoading = false) => {
    if (showLoading) setLoadingData(true);
    try {
      const [statsRes, ordersRes, resRes, fbRes, contRes, notesRes] = await Promise.all([
        api.getAdminStats().catch(() => ({ stats: {} })),
        api.getAllOrders().catch(() => ({ orders: [] })),
        api.getAllReservations().catch(() => ({ bookings: [] })),
        api.getAllFeedbacks().catch(() => ({ feedbacks: [] })),
        api.getAllContacts().catch(() => ({ contacts: [] })),
        api.getUserNotifications('all').catch(() => ({ notifications: [] })),
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      if (ordersRes.orders) setOrders(ordersRes.orders);
      if (resRes.bookings) setReservations(resRes.bookings);
      if (fbRes.feedbacks) setFeedbacks(fbRes.feedbacks);
      if (contRes.contacts) setContacts(contRes.contacts);
      if (notesRes.notifications) {
        setBroadcasts(notesRes.notifications.filter(n => n.userId === 'all'));
      }
      setLastSyncTime(new Date());
    } catch (e) {
      console.warn('Silent sync error:', e);
    } finally {
      if (showLoading) setLoadingData(false);
    }
  };

  // Real-time updates: Firestore snapshot listeners + periodic fallback polling
  useEffect(() => {
    if (!isAdmin) return;

    // Initial load
    loadAllAdminData(true);

    // 1. Periodic background refresh every 3.5 seconds
    const interval = setInterval(() => {
      loadAllAdminData(false);
    }, 3500);

    // 2. Real-time Firestore listeners if direct connection exists
    const unsubscribes = [];
    if (db) {
      try {
        const unSubOrders = onSnapshot(collection(db, 'orders'), () => {
          loadAllAdminData(false);
        }, (err) => console.warn('Orders listener:', err.message));
        unsubscribes.push(unSubOrders);

        const unSubRes = onSnapshot(collection(db, 'tableBookings'), () => {
          loadAllAdminData(false);
        }, (err) => console.warn('Bookings listener:', err.message));
        unsubscribes.push(unSubRes);

        const unSubFb = onSnapshot(collection(db, 'feedbacks'), () => {
          loadAllAdminData(false);
        }, (err) => console.warn('Feedbacks listener:', err.message));
        unsubscribes.push(unSubFb);

        const unSubContact = onSnapshot(collection(db, 'contactMessages'), () => {
          loadAllAdminData(false);
        }, (err) => console.warn('Contacts listener:', err.message));
        unsubscribes.push(unSubContact);
      } catch (e) {
        console.warn('Real-time listener setup error:', e.message);
      }
    }

    // 3. Immediate refresh on window focus
    const handleFocus = () => loadAllAdminData(false);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      unsubscribes.forEach(unsub => typeof unsub === 'function' && unsub());
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAdmin]);

  // Admin Login Submit
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await loginAsAdmin(adminEmail, adminPassword);
      addToast({
        title: 'Admin Access Granted 👑',
        message: 'Welcome to the Avyukt Admin Command Center.',
        type: 'success',
      });
    } catch (err) {
      setLoginError(err.message || 'Invalid admin email or password');
    } finally {
      setLoginLoading(false);
    }
  };

  // Order Status Handler
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
      addToast({
        title: `Order #${orderId}`,
        message: `Status updated to "${newStatus}"`,
        type: 'success',
      });
      loadAllAdminData(false);
    } catch (e) {
      addToast({ title: 'Update Failed', message: e.message, type: 'error' });
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to permanently delete order #${orderId}?`)) return;
    try {
      await api.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      addToast({
        title: 'Order Deleted',
        message: `Order #${orderId} has been removed from database.`,
        type: 'success',
      });
      loadAllAdminData(false);
    } catch (e) {
      addToast({ title: 'Delete Failed', message: e.message, type: 'error' });
    }
  };

  // Admin Confirm Amount Received (Cash/UPI)
  const handleConfirmAmountReceived = async (orderId) => {
    try {
      await api.adminConfirmPayment(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, amountReceivedByAdmin: true, paymentStatus: 'paid' } : o));
      addToast({
        title: 'Payment Verified',
        message: `Amount confirmed for Order #${orderId}`,
        type: 'success',
      });
      loadAllAdminData(false);
    } catch (e) {
      addToast({ title: 'Payment Verification Failed', message: e.message, type: 'error' });
    }
  };

  // Reservation Status & Table Allotment Handler
  const handleUpdateReservation = async (resId, newStatus, tableNo) => {
    try {
      const res = reservations.find(r => r.id === resId);

      // Confirm button bug fix: prevent confirming if no table has been allotted yet
      if (newStatus === 'Confirmed') {
        const allottedTable = (res?.tableNo || '').trim();
        if (!allottedTable) {
          addToast({
            title: 'Table Not Allotted',
            message: 'Please allot a table number first using "Allot Table" before confirming this reservation.',
            type: 'warning',
          });
          return;
        }
      }

      const effectiveTableNo = (tableNo !== undefined && tableNo.trim() !== '') ? tableNo.trim() : (res?.tableNo || '');
      const payload = { 
        status: newStatus,
        userId: res?.userId,
        userEmail: res?.email,
      };
      if (effectiveTableNo) {
        payload.tableNo = effectiveTableNo;
      }
      await api.updateReservationStatus(resId, payload);

      // Also write directly to Firestore notifications collection if db is available
      if (db) {
        try {
          const targetUserId = res?.userId && res.userId !== 'guest' ? res.userId : null;
          const targetEmail = (res?.email || '').trim().toLowerCase();
          const notifId = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const notifData = {
            id: notifId,
            userId: targetUserId || 'all',
            userEmail: targetEmail,
            type: 'order',
            title: newStatus === 'Confirmed' 
              ? (effectiveTableNo ? `Table #${effectiveTableNo} Confirmed! 🍽️` : 'Table Booking Confirmed! 🎉')
              : 'Table Booking Declined',
            message: newStatus === 'Confirmed'
              ? `Your table reservation for ${res?.date || ''} at ${res?.time || ''} is CONFIRMED.${effectiveTableNo ? ` Your allotted table is #${effectiveTableNo}.` : ''} We look forward to hosting you!`
              : `Your table reservation request for ${res?.date || ''} at ${res?.time || ''} has been declined.`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'notifications', notifId), notifData);
        } catch (dbErr) {
          console.warn('Direct notification write error:', dbErr);
        }
      }

      setReservations(prev => prev.map(r => r.id === resId ? { 
        ...r, 
        status: newStatus,
        ...(effectiveTableNo ? { tableNo: effectiveTableNo } : {})
      } : r));
      setEditingTableId(null);
      addToast({
        title: `Reservation ${newStatus}`,
        message: `Booking marked as ${newStatus}${effectiveTableNo ? ` (Table #${effectiveTableNo})` : ''}. Customer notified!`,
        type: 'success',
      });
      loadAllAdminData(false);
    } catch (e) {
      addToast({ title: 'Action Failed', message: e.message, type: 'error' });
    }
  };

  // Allot Table Number to Reservation
  const handleAllotTableNumber = async (resId) => {
    const tableNo = (tableInputs[resId] !== undefined ? tableInputs[resId] : '').trim();
    if (!tableNo) {
      addToast({ title: 'Enter Table No.', message: 'Please provide a table number (e.g., 4 or T-12).', type: 'warning' });
      return;
    }
    const res = reservations.find(r => r.id === resId);
    try {
      const payload = { 
        tableNo,
        userId: res?.userId,
        userEmail: res?.email,
      };
      await api.updateReservationStatus(resId, payload);

      // Write direct notification to Firestore so customer receives table allotment notification immediately
      if (db) {
        try {
          const targetUserId = res?.userId && res.userId !== 'guest' ? res.userId : null;
          const targetEmail = (res?.email || '').trim().toLowerCase();
          const notifId = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const notifData = {
            id: notifId,
            userId: targetUserId || 'all',
            userEmail: targetEmail,
            type: 'order',
            title: `Table #${tableNo} Allotted! 🍽️`,
            message: `Table #${tableNo} has been assigned for your reservation on ${res?.date || ''} at ${res?.time || ''}.`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'notifications', notifId), notifData);
        } catch (dbErr) {
          console.warn('Direct notification write error:', dbErr);
        }
      }

      setReservations(prev => prev.map(r => r.id === resId ? { ...r, tableNo } : r));
      addToast({
        title: `Table #${tableNo} Allotted! 🍽️`,
        message: `Customer notified that Table #${tableNo} has been assigned. Click Confirm to finalize.`,
        type: 'success',
      });
      loadAllAdminData(false);
    } catch (e) {
      addToast({ title: 'Table Allotment Failed', message: e.message, type: 'error' });
    }
  };

  // Delete Reservation
  const handleDeleteReservation = async (resId) => {
    if (!window.confirm(`Delete reservation #${resId}?`)) return;
    try {
      await api.deleteReservation(resId);
      setReservations(prev => prev.filter(r => r.id !== resId));
      addToast({ title: 'Reservation Deleted', message: `Reservation #${resId} deleted.`, type: 'success' });
      loadAllAdminData(false);
    } catch (e) {
      addToast({ title: 'Delete Failed', message: e.message, type: 'error' });
    }
  };

  // Delete Feedback
  const handleDeleteFeedback = async (fbId) => {
    if (!window.confirm('Delete this feedback review?')) return;
    try {
      await api.deleteFeedback(fbId);
      setFeedbacks(prev => prev.filter(f => f.id !== fbId));
      addToast({ title: 'Feedback Deleted', message: 'Feedback entry removed.', type: 'success' });
      loadAllAdminData(false);
    } catch (e) {
      addToast({ title: 'Delete Failed', message: e.message, type: 'error' });
    }
  };

  // Inquiry Reply Handlers
  const handleOpenReplyModal = (contact) => {
    setReplyModalContact(contact);
    setReplyText(contact.adminReply || '');
  };

  const handleSendInquiryReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyModalContact) return;
    const trimmed = replyText.trim();
    if (!trimmed) {
      addToast({ title: 'Reply Empty', message: 'Please enter a response message for the customer.', type: 'warning' });
      return;
    }

    setReplySending(true);
    try {
      await api.replyToContact(replyModalContact.id, {
        replyMessage: trimmed,
        adminName: user?.name || 'Avyukt Restaurant Management',
      });

      // Direct write to Firestore notifications so customer receives immediate real-time update
      if (db) {
        try {
          const targetUserId = replyModalContact.userId && replyModalContact.userId !== 'guest' ? replyModalContact.userId : null;
          const targetEmail = (replyModalContact.email || '').trim().toLowerCase();
          const notifId = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const snippet = (replyModalContact.message || '').trim();
          const notifTitle = snippet 
            ? `Reply to Inquiry: "${snippet.length > 30 ? snippet.slice(0, 30) + '...' : snippet}"` 
            : 'Response to Your Inquiry - Avyukt Restaurant';

          const notifData = {
            id: notifId,
            userId: targetUserId || 'all',
            userEmail: targetEmail,
            type: 'announcement',
            title: notifTitle,
            message: `Dear ${replyModalContact.name},\n\n${trimmed}`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'notifications', notifId), notifData);
        } catch (dbErr) {
          console.warn('Direct notification write error:', dbErr);
        }
      }

      const repliedAt = new Date().toISOString();
      setContacts(prev => prev.map(c => c.id === replyModalContact.id ? {
        ...c,
        status: 'Replied',
        adminReply: trimmed,
        repliedAt,
      } : c));

      addToast({
        title: 'Reply Dispatched! ✉️',
        message: `Reply successfully sent to ${replyModalContact.name} via notifications and email.`,
        type: 'success',
      });
      setReplyModalContact(null);
      setReplyText('');
      loadAllAdminData(false);
    } catch (err) {
      addToast({ title: 'Reply Failed', message: err.message, type: 'error' });
    } finally {
      setReplySending(false);
    }
  };

  // Delete Contact Inquiry
  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Delete this contact inquiry?')) return;
    try {
      await api.deleteContact(contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
      addToast({ title: 'Inquiry Deleted', message: 'Inquiry message removed.', type: 'success' });
      loadAllAdminData(false);
    } catch (e) {
      addToast({ title: 'Delete Failed', message: e.message, type: 'error' });
    }
  };

  // Delete Broadcast
  const handleDeleteBroadcast = async (broadcastId) => {
    if (!window.confirm('Delete this broadcast announcement?')) return;
    try {
      await api.deleteNotification(broadcastId);
      setBroadcasts(prev => prev.filter(b => b.id !== broadcastId));
      addToast({ title: 'Broadcast Deleted', message: 'Broadcast announcement removed.', type: 'success' });
      loadAllAdminData(false);
    } catch (e) {
      addToast({ title: 'Delete Failed', message: e.message, type: 'error' });
    }
  };

  // Broadcast Offer Handler
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!offerTitle.trim() || !offerMessage.trim()) return;
    setBroadcasting(true);
    try {
      const res = await api.sendBroadcastNotification({
        title: offerTitle.trim(),
        message: offerMessage.trim(),
        type: offerType,
        promoCode: offerPromoCode.trim().toUpperCase(),
      });
      if (res.success) {
        addToast({
          title: 'Offer Broadcasted! 🚀',
          message: `Announcement "${offerTitle}" has been sent to all registered customers.`,
          type: 'success',
        });
        setOfferTitle('');
        setOfferMessage('');
        setOfferPromoCode('');
        if (res.notification) {
          setBroadcasts(prev => [res.notification, ...prev]);
        }
        loadAllAdminData(false);
      }
    } catch (err) {
      addToast({
        title: 'Broadcast Failed',
        message: err.message || 'Could not send offer',
        type: 'error',
      });
    } finally {
      setBroadcasting(false);
    }
  };

  // Helper to check if order action buttons should disappear:
  // "if the user confirmation come and admin clicked delivered button if payment received so all buttons disappear"
  const isOrderFullySettledOrDelivered = (order) => {
    if (order.orderStatus === 'Delivered') return true;
    if (order.orderReceivedByCustomer && (order.amountReceivedByAdmin || order.paymentStatus === 'paid')) return true;
    return false;
  };

  // If not logged in as Admin, show Admin Login Gate
  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center bg-body dark:bg-zinc-950 transition-colors">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-[2.5rem] p-8 md:p-10 border border-amber-950/10 dark:border-white/10 shadow-2xl"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>

          <h2 className="text-2xl font-title font-bold text-center text-title dark:text-white mb-2">
            Avyukt Admin Portal
          </h2>
          <p className="text-xs text-center text-text/60 dark:text-white/60 mb-6">
            Enter administrator credentials to manage live kitchen orders, table bookings, customer feedback, and offers.
          </p>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@avyukt.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-transparent focus:border-primary outline-none text-xs dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Admin Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-transparent focus:border-primary outline-none text-xs dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 text-xs uppercase tracking-wider mt-2 disabled:opacity-50 cursor-pointer"
            >
              {loginLoading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
          
          
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 bg-body dark:bg-zinc-950 transition-colors">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-title font-bold text-title dark:text-white">
                Avyukt Admin Command Center
              </h1>
              
            </div>
            <p className="text-xs md:text-sm text-text/60 dark:text-white/60 mt-1">
              Live orders pipeline, table bookings, customer sentiment & revenue metrics (updated automatically in real time)
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            

            <button
              onClick={() => loadAllAdminData(true)}
              className="px-4 py-2 bg-white/90 dark:bg-zinc-900/90 border border-amber-950/10 dark:border-white/10 rounded-2xl text-xs font-bold text-primary hover:bg-primary/5 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Manual Instant Sync"
            >
              <RefreshCw size={13} className={loadingData ? 'animate-spin text-primary' : ''} />
              <span>{loadingData ? 'Syncing...' : 'Sync DB'}</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Stats Cards - Single horizontal scrollbar row on mobile */}
        <div className="flex overflow-x-auto pb-3 pt-1 no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8 scroll-smooth">
          <div className="min-w-[240px] sm:min-w-0 flex-1 shrink-0 sm:shrink bg-white/90 dark:bg-zinc-900/90 p-5 md:p-6 rounded-3xl border border-amber-950/10 dark:border-white/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <IndianRupee size={24} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-text/50 dark:text-white/50 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-xl md:text-2xl font-bold text-title dark:text-white">₹{stats.totalRevenue?.toLocaleString('en-IN') || 0}</h3>
            </div>
          </div>

          <div className="min-w-[240px] sm:min-w-0 flex-1 shrink-0 sm:shrink bg-white/90 dark:bg-zinc-900/90 p-5 md:p-6 rounded-3xl border border-amber-950/10 dark:border-white/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-text/50 dark:text-white/50 uppercase tracking-wider">Total Orders</p>
              <h3 className="text-xl md:text-2xl font-bold text-title dark:text-white">{orders.length}</h3>
            </div>
          </div>

          <div className="min-w-[240px] sm:min-w-0 flex-1 shrink-0 sm:shrink bg-white/90 dark:bg-zinc-900/90 p-5 md:p-6 rounded-3xl border border-amber-950/10 dark:border-white/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Utensils size={24} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-text/50 dark:text-white/50 uppercase tracking-wider">Active Kitchen</p>
              <h3 className="text-xl md:text-2xl font-bold text-title dark:text-white">
                {orders.filter(o => ['Placed', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.orderStatus)).length}
              </h3>
            </div>
          </div>

          <div className="min-w-[240px] sm:min-w-0 flex-1 shrink-0 sm:shrink bg-white/90 dark:bg-zinc-900/90 p-5 md:p-6 rounded-3xl border border-amber-950/10 dark:border-white/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-text/50 dark:text-white/50 uppercase tracking-wider">Table Bookings</p>
              <h3 className="text-xl md:text-2xl font-bold text-title dark:text-white">{reservations.length}</h3>
            </div>
          </div>
        </div>

        {/* Admin Navigation Tabs Bar - Horizontal scrollable without edge cutoff */}
        <div className="w-full overflow-x-auto no-scrollbar pb-2 mb-6">
          
          <div className="flex gap-2 p-1.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-amber-950/10 dark:border-white/10 shadow-sm w-max min-w-full">
            {[
              { id: 'orders', label: `Orders (${orders.length})`, icon: <ShoppingBag size={15} /> },
              { id: 'reservations', label: `Table Bookings (${reservations.length})`, icon: <Calendar size={15} /> },
              { id: 'feedbacks', label: `Feedbacks (${feedbacks.length})`, icon: <Star size={15} /> },
              { id: 'contacts', label: `Inquiries (${contacts.length})`, icon: <MessageSquare size={15} /> },
              { id: 'broadcast', label: `Broadcast Offers (${broadcasts.length})`, icon: <Megaphone size={15} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleAdminTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  adminTab === tab.id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-text/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          
        </div>
        <div className="flex justify-end mb-4">
          {/* List / Grid View Switcher */}
            <div className="flex items-center bg-white/90 dark:bg-zinc-900/90 p-1 rounded-2xl border border-amber-950/10 dark:border-white/10 shadow-sm">
            <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
                title="List View (Compact Space-saving for Mobile)"
              >
                <List size={14} />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
                title="Grid View (Normal Details)"
              >
                <LayoutGrid size={14} />
                <span>Grid</span>
              </button>
              
            </div>
          
        </div>

        {/* TAB 1: LIVE ORDERS PIPELINE */}
        {adminTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="bg-white/90 dark:bg-zinc-900/90 p-12 rounded-3xl text-center border border-amber-950/10 dark:border-white/10">
                <ShoppingBag size={36} className="text-primary mx-auto mb-3" />
                <h4 className="text-base font-bold text-title dark:text-white mb-1">No orders received yet</h4>
                <p className="text-xs text-text/60 dark:text-white/60">New orders placed by customers stream directly onto this board in real time.</p>
              </div>
            ) : viewMode === 'list' ? (
              /* LIST VIEW: Compact space-saving rows for mobile */
              <div className="space-y-2.5">
                {orders.map((order) => {
                  const isSettled = isOrderFullySettledOrDelivered(order);
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <div
                      key={order.id}
                      className="bg-white/90 dark:bg-zinc-900/90 rounded-2xl border border-amber-950/10 dark:border-white/10 p-3.5 shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs md:text-sm text-title dark:text-white">{order.id}</span>
                          <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                            ₹{order.totalAmount}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.orderStatus === 'Delivered' 
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                              : order.orderStatus === 'Placed' 
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                          {isSettled ? (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-lg">
                              <CheckCircle2 size={13} /> Completed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              title="Mark Delivered"
                            >
                              Deliver
                            </button>
                          )}

                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="px-2 py-1 text-[11px] font-bold text-text/60 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                          >
                            {isExpanded ? 'Less' : 'Details'}
                          </button>

                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Order Details in List View */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-amber-950/10 dark:border-white/10 text-xs space-y-2">
                          <p className="text-text/70 dark:text-white/70">
                            <strong>Customer:</strong> {order.customerName} • 📞 {order.customerPhone} • {order.deliveryAddress}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {order.items?.map((item, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded text-[11px] text-text/80 dark:text-white/80">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                          </div>
                          {!isSettled && (
                            <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                              {['Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'].map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleUpdateOrderStatus(order.id, st)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                                    order.orderStatus === st
                                      ? 'bg-primary text-white shadow-sm'
                                      : 'bg-black/5 dark:bg-white/5 text-text/70 dark:text-white/70 hover:bg-black/10'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* GRID VIEW: Full detailed cards */
              <div className="space-y-4">
                {orders.map((order) => {
                  const isSettled = isOrderFullySettledOrDelivered(order);
                  return (
                    <div
                      key={order.id}
                      className="bg-white/90 dark:bg-zinc-900/90 p-5 md:p-6 rounded-[2rem] border border-amber-950/10 dark:border-white/10 shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 border-b border-amber-950/10 dark:border-white/10 pb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-base text-title dark:text-white">{order.id}</span>
                            <span className="text-xs font-bold text-primary px-2.5 py-0.5 bg-primary/10 rounded-full">
                              ₹{order.totalAmount}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">
                              {order.paymentMethod === 'razorpay' ? 'Razorpay Online' : 'Cash / Direct UPI'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              order.orderStatus === 'Delivered' 
                                ? 'bg-emerald-500/15 text-emerald-600' 
                                : 'bg-amber-500/15 text-amber-600'
                            }`}>
                              Status: {order.orderStatus}
                            </span>
                          </div>
                          <p className="text-xs text-text/60 dark:text-white/60">
                            <strong>Customer:</strong> {order.customerName} • 📞 {order.customerPhone} • {order.customerEmail || 'No email'}
                          </p>
                        </div>

                        {/* Status Update Buttons - Disappear once delivered / settled */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {isSettled ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5 shadow-sm">
                                <CheckCircle2 size={14} /> Delivered & Completed
                              </span>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                                title="Delete Order"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {['Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'].map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleUpdateOrderStatus(order.id, st)}
                                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                    order.orderStatus === st
                                      ? 'bg-primary text-white shadow-md'
                                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                                title="Delete Order"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {order.items?.map((item, idx) => (
                          <span key={idx} className="px-3 py-1 bg-black/5 dark:bg-zinc-800 rounded-lg text-xs text-text/70 dark:text-white/70 font-medium">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>

                      {/* Handshake: Amount Received Verification & Customer Received Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-amber-950/10 dark:border-white/10 text-xs">
                        <p className="text-text/60 dark:text-white/60">
                          <strong>Delivery To:</strong> {order.deliveryAddress}
                        </p>

                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Customer confirmation indicator */}
                          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 ${
                            order.orderReceivedByCustomer
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                          }`}>
                            {order.orderReceivedByCustomer ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                            {order.orderReceivedByCustomer ? 'Customer Confirmed Delivery' : 'Awaiting Customer Confirmation'}
                          </span>

                          {/* Admin Confirm Amount Received Button */}
                          {!order.amountReceivedByAdmin ? (
                            <button
                              onClick={() => handleConfirmAmountReceived(order.id)}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                            >
                              Confirm Amount Received
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 size={14} /> Payment Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TABLE BOOKINGS */}
        {adminTab === 'reservations' && (
          <div>
            {reservations.length === 0 ? (
              <div className="bg-white/90 dark:bg-zinc-900/90 p-12 rounded-3xl text-center border border-amber-950/10 dark:border-white/10">
                <Calendar size={36} className="text-primary mx-auto mb-3" />
                <h4 className="text-base font-bold text-title dark:text-white mb-1">No reservations yet</h4>
                <p className="text-xs text-text/60 dark:text-white/60">Requests submitted from the "Book a Table" section appear here.</p>
              </div>
            ) : viewMode === 'list' ? (
              /* LIST VIEW: Compact Table Bookings */
              <div className="space-y-2.5">
                {reservations.map((res) => {
                  const currentInput = tableInputs[res.id] !== undefined ? tableInputs[res.id] : (res.tableNo || '');
                  return (
                    <div
                      key={res.id}
                      className="bg-white/90 dark:bg-zinc-900/90 rounded-2xl border border-amber-950/10 dark:border-white/10 p-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-sm text-title dark:text-white">{res.name}</span>
                        <span className="text-text/60 dark:text-white/60">📞 {res.phone}</span>
                        <span className="text-text/60 dark:text-white/60">👥 {res.guests} Guests</span>
                        <span className="text-text/60 dark:text-white/60">📅 {res.date} • {res.time}</span>
                        {res.tableNo && (
                          <span className="px-2 py-0.5 rounded-lg bg-secondary/20 text-secondary-dark font-bold">
                            Table #{res.tableNo}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          res.status === 'Confirmed' ? 'bg-emerald-500/15 text-emerald-600' : res.status === 'Rejected' ? 'bg-red-500/15 text-red-600' : 'bg-amber-500/15 text-amber-600'
                        }`}>
                          {res.status || 'Pending'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 ml-auto flex-wrap">
                        {res.status === 'Confirmed' ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/20">
                            <CheckCircle2 size={13} /> Confirmed{res.tableNo ? ` • Table #${res.tableNo}` : ''}
                          </span>
                        ) : res.status === 'Rejected' ? (
                          <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 border border-rose-500/20">
                            <XCircle size={13} /> Declined
                          </span>
                        ) : (
                          <>
                            {/* Table Number Allotment inline */}
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="Table #"
                                value={currentInput}
                                onChange={(e) => setTableInputs({ ...tableInputs, [res.id]: e.target.value })}
                                className="w-16 px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg text-xs outline-none focus:border-primary border border-transparent font-bold text-center"
                              />
                              <button
                                onClick={() => handleAllotTableNumber(res.id)}
                                className="px-2 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-dark cursor-pointer"
                              >
                                Allot
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                if (!res.tableNo) {
                                  addToast({
                                    title: 'Table Not Allotted',
                                    message: 'Please allot a table number first using "Allot" before confirming this reservation.',
                                    type: 'warning',
                                  });
                                  return;
                                }
                                handleUpdateReservation(res.id, 'Confirmed', currentInput);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer ${
                                res.tableNo
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-emerald-600/50 text-white/80 hover:bg-emerald-600/70'
                              }`}
                              title={res.tableNo ? 'Confirm Booking' : 'Please allot a table number first to confirm'}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleUpdateReservation(res.id, 'Rejected')}
                              className="px-2.5 py-1 bg-red-50 text-red-600 dark:bg-red-950/40 rounded-lg text-[10px] font-bold hover:bg-red-100 cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDeleteReservation(res.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Booking"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* GRID VIEW: Detailed Table Bookings */
              <div className="space-y-4">
                {reservations.map((res) => {
                  const currentInput = tableInputs[res.id] !== undefined ? tableInputs[res.id] : (res.tableNo || '');
                  return (
                    <div
                      key={res.id}
                      className="bg-white/90 dark:bg-zinc-900/90 p-6 rounded-3xl border border-amber-950/10 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-base text-title dark:text-white">{res.name}</h4>
                          
                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            res.status === 'Confirmed' 
                              ? 'bg-emerald-500/15 text-emerald-600' 
                              : res.status === 'Rejected' 
                              ? 'bg-red-500/15 text-red-600' 
                              : 'bg-amber-500/15 text-amber-600'
                          }`}>
                            {res.status || 'Pending'}
                          </span>

                          {/* Member indicator */}
                          {res.isAnonymous || !res.userId || res.userId === 'guest' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-500">
                              Guest
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                              Member
                            </span>
                          )}

                          {/* Table Assigned Badge */}
                          {res.tableNo && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                              🍽️ Table #{res.tableNo}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-text/60 dark:text-white/60">
                          📞 {res.phone} • ✉️ {res.email || 'N/A'} • 👥 {res.guests} Guests • 📅 {res.date} at {res.time}
                        </p>
                        {res.notes && (
                          <p className="text-[11px] text-text/50 dark:text-white/50 mt-1 italic">
                            Special Request: "{res.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {res.status === 'Confirmed' ? (
                          <span className="px-3 py-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 rounded-xl text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 size={14} /> Confirmed{res.tableNo ? ` • Table #${res.tableNo}` : ''}
                          </span>
                        ) : res.status === 'Rejected' ? (
                          <span className="px-3 py-2 bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25 rounded-xl text-xs font-bold flex items-center gap-1.5">
                            <XCircle size={14} /> Declined
                          </span>
                        ) : (
                          <>
                            {/* Table Number Allotment Input & Button */}
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800/60 p-1.5 rounded-xl border border-black/5 dark:border-white/10">
                              <input
                                type="text"
                                placeholder="Table No. (e.g. 4)"
                                value={currentInput}
                                onChange={(e) => setTableInputs({ ...tableInputs, [res.id]: e.target.value })}
                                className="w-24 px-2.5 py-1.5 bg-white dark:bg-zinc-800 rounded-lg text-xs outline-none focus:border-primary border border-transparent font-bold text-center"
                              />
                              <button
                                onClick={() => handleAllotTableNumber(res.id)}
                                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-dark transition-colors shadow-sm cursor-pointer"
                              >
                                Allot Table
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                if (!res.tableNo) {
                                  addToast({
                                    title: 'Table Not Allotted',
                                    message: 'Please allot a table number first using "Allot Table" before confirming this reservation.',
                                    type: 'warning',
                                  });
                                  return;
                                }
                                handleUpdateReservation(res.id, 'Confirmed', currentInput);
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                                res.tableNo
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-emerald-600/50 text-white/80 hover:bg-emerald-600/70'
                              }`}
                              title={res.tableNo ? 'Confirm Booking' : 'Please allot a table first before confirming'}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleUpdateReservation(res.id, 'Rejected')}
                              className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-950/40 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {/* Delete Reservation Button */}
                        <button
                          onClick={() => handleDeleteReservation(res.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                          title="Delete Reservation"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOMER FEEDBACKS */}
        {adminTab === 'feedbacks' && (
          <div>
            {feedbacks.length === 0 ? (
              <div className="bg-white/90 dark:bg-zinc-900/90 p-12 rounded-3xl text-center border border-amber-950/10 dark:border-white/10">
                <Star size={36} className="text-amber-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-title dark:text-white mb-1">No customer feedback yet</h4>
                <p className="text-xs text-text/60 dark:text-white/60">Customer reviews and ratings submitted from the Feedback page will display here.</p>
              </div>
            ) : viewMode === 'list' ? (
              /* LIST VIEW: Compact Feedback rows */
              <div className="space-y-2">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="bg-white/90 dark:bg-zinc-900/90 p-3.5 rounded-2xl border border-amber-950/10 dark:border-white/10 shadow-sm flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg text-amber-600 font-bold shrink-0">
                        <Star size={13} className="fill-amber-500 text-amber-500" />
                        <span>{fb.rating}★</span>
                      </div>
                      <span className="font-bold text-title dark:text-white truncate">{fb.userName || 'Customer'}</span>
                      <span className="text-text/70 dark:text-white/70 truncate italic hidden sm:inline">"{fb.feedbackText || 'No comment'}"</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-text/40 dark:text-white/40">
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ''}
                      </span>
                      <button
                        onClick={() => handleDeleteFeedback(fb.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Feedback"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* GRID VIEW: Rich Feedback cards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="bg-white/90 dark:bg-zinc-900/90 p-6 rounded-3xl border border-amber-950/10 dark:border-white/10 shadow-sm relative group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-title dark:text-white">{fb.userName || 'Anonymous Guest'}</h4>
                          {fb.userId && fb.userId !== 'anonymous' && fb.userId !== 'guest' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                              Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500">
                              Anonymous
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-text/40 dark:text-white/40">{fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ''}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg text-amber-600 font-bold text-xs">
                          <Star size={14} className="fill-amber-500 text-amber-500" />
                          <span>{fb.rating} / 5</span>
                        </div>
                        <button
                          onClick={() => handleDeleteFeedback(fb.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Feedback"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-text/70 dark:text-white/70 mb-3 italic">
                      "{fb.feedbackText || 'No comment provided'}"
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {fb.tags?.map((tag, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-black/5 dark:bg-zinc-800 text-text/60 dark:text-white/60">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CONTACT INQUIRIES */}
        {adminTab === 'contacts' && (
          <div>
            {contacts.length === 0 ? (
              <div className="bg-white/90 dark:bg-zinc-900/90 p-12 rounded-3xl text-center border border-amber-950/10 dark:border-white/10">
                <MessageSquare size={36} className="text-primary mx-auto mb-3" />
                <h4 className="text-base font-bold text-title dark:text-white mb-1">No contact messages</h4>
                <p className="text-xs text-text/60 dark:text-white/60">Queries submitted on the Contact page will route here.</p>
              </div>
            ) : viewMode === 'list' ? (
              /* LIST VIEW: Compact Inquiries */
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white/90 dark:bg-zinc-900/90 p-3.5 rounded-2xl border border-amber-950/10 dark:border-white/10 shadow-sm flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-bold text-title dark:text-white shrink-0">{c.name}</span>
                      <span className="text-primary font-medium truncate shrink-0">{c.email}</span>
                      {c.status === 'Replied' ? (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Replied
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Pending
                        </span>
                      )}
                      <span className="text-text/60 dark:text-white/60 truncate hidden md:inline">{c.message}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-text/40 dark:text-white/40 hidden sm:inline">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                      </span>
                      <button
                        onClick={() => handleOpenReplyModal(c)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
                          c.status === 'Replied'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                            : 'bg-primary text-white hover:bg-primary-dark'
                        }`}
                        title={c.status === 'Replied' ? 'View / Send follow-up reply' : 'Reply to customer inquiry'}
                      >
                        <Reply size={12} />
                        <span>{c.status === 'Replied' ? 'Replied' : 'Reply'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Inquiry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* GRID VIEW: Detailed Inquiries */
              <div className="space-y-4">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white/90 dark:bg-zinc-900/90 p-6 rounded-3xl border border-amber-950/10 dark:border-white/10 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-bold text-sm text-title dark:text-white">{c.name}</h4>
                          {c.isAnonymous || !c.userId || c.userId === 'guest' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500">
                              Guest
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                              Member
                            </span>
                          )}
                          {c.status === 'Replied' ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Replied
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Pending Reply
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-primary font-medium">{c.email} • 📞 {c.phone || 'No phone'}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-text/40 dark:text-white/40">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                        </span>
                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Inquiry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-black/5 dark:bg-zinc-800/50 p-4 rounded-2xl">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-text/50 dark:text-white/50 mb-1">
                        Customer Query:
                      </p>
                      <p className="text-xs text-text/85 dark:text-white/85 leading-relaxed">
                        {c.message}
                      </p>
                    </div>

                    {/* Show Past Admin Reply if Available */}
                    {c.adminReply && (
                      <div className="mt-3 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1.5 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} />
                            <span>Response Sent to Customer &amp; Email</span>
                          </span>
                          {c.repliedAt && (
                            <span className="text-[10px] font-normal text-text/50 dark:text-white/50">
                              {new Date(c.repliedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-text/80 dark:text-white/80 whitespace-pre-line leading-relaxed font-sans">
                          {c.adminReply}
                        </p>
                      </div>
                    )}

                    {/* Action Footer */}
                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-amber-950/5 dark:border-white/5">
                      <button
                        onClick={() => handleOpenReplyModal(c)}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Reply size={14} />
                        <span>{c.status === 'Replied' ? 'Send Follow-up Reply' : 'Reply to Customer'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BROADCAST OFFERS & NOTIFICATIONS */}
        {adminTab === 'broadcast' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Create & Send Offer Card */}
            <div className="lg:col-span-6 bg-white/90 dark:bg-zinc-900/90 p-6 md:p-8 rounded-[2rem] border border-amber-950/10 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Megaphone size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-title dark:text-white">Broadcast New Offer</h3>
                  <p className="text-xs text-text/60 dark:text-white/60">Dispatched directly to all registered customers' Notifications tab</p>
                </div>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Offer / Notification Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Weekend Special — Flat 30% OFF!"
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-primary outline-none text-xs dark:text-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Professional Custom Dropdown */}
                  <div className="relative" ref={offerDropdownRef} style={{ zIndex: 70 }}>
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                      Category Type *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsOfferDropdownOpen(prev => !prev)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-black/10 dark:border-white/10 hover:border-primary focus:border-primary outline-none text-xs dark:text-white font-medium flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {broadcastCategories.find(c => c.value === offerType)?.icon}
                        <span className="font-bold">{broadcastCategories.find(c => c.value === offerType)?.label}</span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 text-gray-400 ${
                          isOfferDropdownOpen ? 'rotate-180 text-primary' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOfferDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/25 overflow-hidden z-[90] p-1.5 space-y-1"
                        >
                          {broadcastCategories.map((cat) => (
                            <button
                              key={cat.value}
                              type="button"
                              onClick={() => {
                                setOfferType(cat.value);
                                setIsOfferDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                                offerType === cat.value
                                  ? 'bg-primary/10 text-primary font-bold'
                                  : 'text-text/70 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-zinc-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`p-1.5 rounded-lg ${offerType === cat.value ? 'bg-primary/20' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                                  {cat.icon}
                                </span>
                                <div>
                                  <p className="font-bold">{cat.label}</p>
                                  <p className="text-[10px] text-text/50 dark:text-white/50">{cat.desc}</p>
                                </div>
                              </div>
                              {offerType === cat.value && <Check size={14} className="text-primary shrink-0" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">Coupon Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., WEEKEND30"
                      value={offerPromoCode}
                      onChange={(e) => setOfferPromoCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-black/10 dark:border-white/10 focus:border-primary outline-none text-xs dark:text-white font-bold tracking-wider"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Detailed Message / Description *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe the offer details, minimum order amount, valid dishes, or terms..."
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-primary outline-none text-xs dark:text-white font-medium resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={broadcasting}
                  className="w-full py-4 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
                >
                  {broadcasting ? (
                    'Broadcasting to all customers...'
                  ) : (
                    <>
                      <Send size={15} />
                      Broadcast to All Customers
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Broadcast History */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text/60 dark:text-white/60">
                  Active Broadcasts ({broadcasts.length})
                </h3>
              </div>

              {broadcasts.length === 0 ? (
                <div className="bg-white/90 dark:bg-zinc-900/90 p-10 rounded-[2rem] text-center border border-amber-950/10 dark:border-white/10">
                  <Megaphone size={32} className="text-gray-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-title dark:text-white">No active broadcasts</p>
                  <p className="text-[11px] text-text/50 dark:text-white/50 mt-0.5">
                    Use the form on the left to send an offer to all customers.
                  </p>
                </div>
              ) : viewMode === 'list' ? (
                /* Compact Broadcast List */
                <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                  {broadcasts.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white/90 dark:bg-zinc-900/90 p-3.5 rounded-2xl border border-amber-950/10 dark:border-white/10 shadow-sm flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-600">
                          {b.type || 'Offer'}
                        </span>
                        <span className="font-bold text-title dark:text-white truncate">{b.title}</span>
                        {b.promoCode && (
                          <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold text-[10px]">
                            {b.promoCode}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-text/40 dark:text-white/40">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''}
                        </span>
                        <button
                          onClick={() => handleDeleteBroadcast(b.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Broadcast"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Full Broadcast Cards */
                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {broadcasts.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white/90 dark:bg-zinc-900/90 p-5 rounded-2xl border border-amber-950/10 dark:border-white/10 shadow-sm relative group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            {b.type || 'Offer'}
                          </span>
                          <h4 className="font-bold text-sm text-title dark:text-white">{b.title}</h4>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-text/40 dark:text-white/40">
                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Active'}
                          </span>
                          <button
                            onClick={() => handleDeleteBroadcast(b.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete Broadcast"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-text/70 dark:text-white/70 leading-relaxed mb-2">
                        {b.message}
                      </p>
                      {b.promoCode && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-[11px]">
                          <Sparkles size={11} />
                          <span>Code: {b.promoCode}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* INQUIRY REPLY MODAL */}
        <AnimatePresence>
          {replyModalContact && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white dark:bg-zinc-900 border border-amber-950/15 dark:border-white/10 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-5 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Reply size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-title dark:text-white">
                        Reply to Customer Inquiry
                      </h3>
                      <p className="text-xs text-text/60 dark:text-white/60">
                        Dispatches in-app notification and email to customer
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!replySending) setReplyModalContact(null);
                    }}
                    className="p-1.5 text-gray-400 hover:text-text dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="overflow-y-auto space-y-4 pr-1 flex-1">
                  {/* Recipient Overview */}
                  <div className="bg-amber-950/5 dark:bg-white/5 p-3.5 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between items-center text-text/60 dark:text-white/60">
                      <span>Recipient:</span>
                      <span className="font-bold text-title dark:text-white">{replyModalContact.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-text/60 dark:text-white/60">
                      <span>Email:</span>
                      <span className="font-semibold text-primary">{replyModalContact.email}</span>
                    </div>
                    {replyModalContact.phone && (
                      <div className="flex justify-between items-center text-text/60 dark:text-white/60">
                        <span>Contact:</span>
                        <span>{replyModalContact.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Original Inquiry */}
                  <div className="border border-amber-950/10 dark:border-white/10 p-3.5 rounded-2xl bg-black/5 dark:bg-zinc-800/50">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                      Customer Inquiry:
                    </p>
                    <p className="text-xs text-text/80 dark:text-white/80 italic leading-relaxed">
                      &ldquo;{replyModalContact.message}&rdquo;
                    </p>
                  </div>

                  {/* Quick Preset Replies */}
                  <div>
                    <p className="text-[11px] font-bold text-text/60 dark:text-white/60 mb-1.5">
                      Quick Response Templates:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyText(
                            `Dear ${replyModalContact.name},\n\nThank you for reaching out to Avyukt Restaurant. Regarding your inquiry, our team has reviewed your query and we are happy to assist you.\n\nPlease let us know if you require any further details or personalized arrangements.\n\nWarm regards,\nAvyukt Restaurant Management Team\nPhone: +91 9039121277`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        General Assistance
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyText(
                            `Dear ${replyModalContact.name},\n\nThank you for reaching out regarding table bookings at Avyukt Restaurant! We would be delighted to host you.\n\nYou can easily reserve your preferred table directly on our website or call us directly at +91 9039121277 for instant table coordination.\n\nWarm regards,\nAvyukt Restaurant Team`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                      >
                        Table Booking Info
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyText(
                            `Dear ${replyModalContact.name},\n\nThank you for your interest in catering and private celebrations at Avyukt Restaurant. We offer comprehensive royal catering packages tailored to your preferences.\n\nPlease contact our event manager at +91 9039121277 so we can design your customized menu.\n\nWarm regards,\nAvyukt Management`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-sky-500/10 text-sky-800 dark:text-sky-300 hover:bg-sky-500/20 transition-colors cursor-pointer"
                      >
                        Events & Catering
                      </button>
                    </div>
                  </div>

                  {/* Reply Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-title dark:text-white mb-1.5">
                      Your Response Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Write a structured response to ${replyModalContact.name}...`}
                      className="w-full px-4 py-3 bg-amber-950/5 dark:bg-zinc-800 rounded-2xl border border-amber-950/10 dark:border-white/10 text-xs text-text dark:text-white outline-none focus:border-primary transition-all resize-none font-sans"
                    />
                    <div className="flex justify-between items-center mt-1 text-[11px] text-text/50 dark:text-white/50">
                      <span>Structured email with logo &amp; brand details will be delivered.</span>
                      <span>{replyText.length} chars</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-amber-950/10 dark:border-white/10 shrink-0">
                  <button
                    type="button"
                    disabled={replySending}
                    onClick={() => setReplyModalContact(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-text/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={replySending || !replyText.trim()}
                    onClick={handleSendInquiryReply}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {replySending ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Sending Reply...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Send Response</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default DashboardPage;

