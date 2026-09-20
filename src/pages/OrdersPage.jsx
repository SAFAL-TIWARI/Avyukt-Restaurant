import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Package, CheckCircle2, Clock3, Truck, 
  ArrowRight, IndianRupee, AlertCircle, RefreshCw,
  Search, X, FileText
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, onSnapshot } from '../firebase/config';
import api from '../services/api';
import { OrderCardSkeleton } from '../components/common/Skeleton';
import { downloadOrderReceipt } from '../utils/receiptGenerator';

const formatOrderDateTime = (val) => {
  if (!val) return 'Recently';
  try {
    let d;
    if (typeof val?.toDate === 'function') d = val.toDate();
    else if (val?.seconds) d = new Date(val.seconds * 1000);
    else if (typeof val === 'number') d = new Date(val);
    else d = new Date(val);

    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Recently';
  }
};

const OrdersPage = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial section tab & query from URL search parameters (with sessionStorage fallback)
  const urlTab = searchParams.get('tab');
  const storedTab = typeof window !== 'undefined' ? sessionStorage.getItem('avyukt_orders_tab') : null;
  const initialTab = (urlTab === 'past' || urlTab === 'active')
    ? urlTab
    : (storedTab === 'past' || storedTab === 'active' ? storedTab : 'active');

  const initialQuery = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState(initialTab); // 'active' | 'past'
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // 1. Set up live Firestore listener if db is available
    if (db && user?.uid) {
      try {
        const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(list);
          setLoading(false);
        }, (err) => {
          console.warn('Firestore live listener warning, fetching via API:', err.message);
          fetchOrdersViaApi();
        });

        return () => unsubscribe();
      } catch (e) {
        console.warn('Fallback to API fetch:', e.message);
        fetchOrdersViaApi();
      }
    } else {
      fetchOrdersViaApi();
    }
  }, [isLoggedIn, user]);

  const fetchOrdersViaApi = async () => {
    if (!user?.uid) return;
    try {
      const res = await api.getUserOrders(user.uid);
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Customer clicks "Order Received"
  const handleConfirmReceived = async (orderId) => {
    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      await api.customerConfirmReceived(orderId);
      // Update local state if not immediately pushed
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderReceivedByCustomer: true, orderStatus: 'Delivered' } : o));
    } catch (err) {
      console.error('Error confirming order received:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const activeOrders = useMemo(() => orders.filter(o => !['Delivered', 'Cancelled'].includes(o.orderStatus)), [orders]);
  const pastOrders = useMemo(() => orders.filter(o => ['Delivered', 'Cancelled'].includes(o.orderStatus)), [orders]);
  const tabOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const displayedOrders = useMemo(() => {
    if (!searchQuery.trim()) return tabOrders;
    const q = searchQuery.toLowerCase().trim();
    return tabOrders.filter(o => 
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.orderStatus && o.orderStatus.toLowerCase().includes(q)) ||
      (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(q)) ||
      (o.items && o.items.some(it => (it.name || it.title || '').toLowerCase().includes(q))) ||
      (o.totalAmount && o.totalAmount.toString().includes(q))
    );
  }, [tabOrders, searchQuery]);

  const totalPages = Math.ceil(displayedOrders.length / PAGE_SIZE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return displayedOrders.slice(start, start + PAGE_SIZE);
  }, [displayedOrders, currentPage]);

  // Sync state when URL searchParams change (e.g. browser back/forward buttons or direct links)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'active' || tabParam === 'past') {
      setActiveTab(tabParam);
      try {
        sessionStorage.setItem('avyukt_orders_tab', tabParam);
      } catch (e) {}
    } else {
      // Ensure the URL search param has tab set so refreshing stays on the section
      const params = new URLSearchParams(searchParams);
      params.set('tab', initialTab);
      if (initialQuery) params.set('q', initialQuery);
      setSearchParams(params, { replace: true });
    }

    const qParam = searchParams.get('q');
    if (qParam !== null && qParam !== searchQuery) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  const updateQueryParams = (tab, q) => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (q && q.trim()) {
      params.set('q', q.trim());
    }
    setSearchParams(params, { replace: true });
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    try {
      sessionStorage.setItem('avyukt_orders_tab', tab);
    } catch (e) {}
    updateQueryParams(tab, searchQuery);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
    updateQueryParams(activeTab, value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    updateQueryParams(activeTab, '');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Placed':
        return { label: 'Order Placed', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: <Clock3 size={14} /> };
      case 'Accepted':
        return { label: 'Kitchen Accepted', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: <Clock3 size={14} /> };
      case 'Preparing':
        return { label: 'Cooking in Kitchen', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: <RefreshCw size={14} className="animate-spin" /> };
      case 'Ready':
        return { label: 'Order Ready', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: <CheckCircle2 size={14} /> };
      case 'Out for Delivery':
        return { label: 'Out for Delivery', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: <Truck size={14} /> };
      case 'Delivered':
        return { label: 'Delivered', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle2 size={14} /> };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-600', icon: <Clock3 size={14} /> };
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-body dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-title font-bold text-title dark:text-white mb-2">My Orders</h1>
            <p className="text-xs md:text-sm text-text/60 dark:text-white/60">
              Live status tracking & complete history from Avyukt Restaurant
            </p>
          </div>
          
          <Link
            to="/menu"
            className="flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all"
          >
            Browse Menu <ArrowRight size={16} />
          </Link>
        </div>

        {/* Unified Tab Switcher & Order Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-black/5 dark:border-white/10 mb-8 shadow-sm">
          <div className="flex items-center gap-2 p-0.5 shrink-0">
            <button
              onClick={() => handleTabSwitch('active')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer ${
                activeTab === 'active' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                  : 'text-text dark:text-white/60 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              Active Orders ({activeOrders.length})
            </button>
            <button
              onClick={() => handleTabSwitch('past')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer ${
                activeTab === 'past' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                  : 'text-text dark:text-white/60 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              Past Orders ({pastOrders.length})
            </button>
          </div>

          {/* Search Input inside the bar */}
          <div className="relative flex-1 sm:max-w-xs md:max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by order ID, dish name, address..."
              className="w-full pl-8 pr-7 py-2 bg-gray-50 dark:bg-zinc-800/80 rounded-xl text-xs text-title dark:text-white placeholder:text-text/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all border border-black/5 dark:border-white/5"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white p-0.5 rounded-full cursor-pointer"
                title="Clear Search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Orders Listing */}
        {loading ? (
          <OrderCardSkeleton count={3} />
        ) : displayedOrders.length === 0 ? (
          searchQuery ? (
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 text-center border border-black/5 dark:border-white/10 shadow-sm">
              <p className="text-sm font-semibold text-title dark:text-white mb-1">No orders found matching "{searchQuery}"</p>
              <p className="text-xs text-text/60 dark:text-white/60 mb-4">Try searching with a different order ID, dish name, or address.</p>
              <button
                onClick={handleClearSearch}
                className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-12 text-center border border-black/5 dark:border-white/10 shadow-sm">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <Package size={28} />
              </div>
              <h3 className="text-xl font-bold font-title text-title dark:text-white mb-2">
                {activeTab === 'active' ? 'No active orders right now' : 'No past orders found'}
              </h3>
              <p className="text-xs text-text/60 dark:text-white/60 mb-6 max-w-sm mx-auto">
                {activeTab === 'active' 
                  ? 'Hungry? Check our delicious menu and place an order today!' 
                  : 'Your delivered orders will appear here once completed.'}
              </p>
              <Link
                to="/menu"
                className="bg-primary text-white px-6 py-3 rounded-full font-bold text-xs hover:bg-primary-dark transition-all inline-flex items-center gap-2"
              >
                Browse Menu <ArrowRight size={16} />
              </Link>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {paginatedOrders.map((order) => {
                const badge = getStatusBadge(order.orderStatus);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-black/5 dark:border-white/10 pb-5">
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-bold text-lg text-title dark:text-white">{order.id}</h3>
                          
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${badge.color}`}>
                            {badge.icon}
                            {badge.label}
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            order.paymentStatus === 'paid' || order.amountReceivedByAdmin
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {order.paymentStatus === 'paid' || order.amountReceivedByAdmin ? 'Paid' : 'Payment Pending'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-text/50 dark:text-white/50">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} />
                            {formatOrderDateTime(order.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package size={13} />
                            {order.itemsCount || order.items?.length} Items
                          </span>
                        </div>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-2xl font-bold text-primary">₹{order.totalAmount}</p>
                        <p className="text-[11px] text-text/40 dark:text-white/40 mb-2">
                          Method: {order.paymentMethod === 'razorpay' ? 'Razorpay Online' : 'Cash on Delivery'}
                        </p>
                        <Link
                          to={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm group"
                        >
                          <Truck size={13} className="group-hover:animate-bounce" />
                          <span>Track Live Order</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>

                    {/* Ordered Items Summary */}
                    <div className="space-y-2 mb-5">
                      <div className="flex flex-wrap gap-2">
                        {order.items?.map((item, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/60 rounded-xl text-xs text-text/70 dark:text-white/70 border border-black/5 dark:border-white/5">
                            {item.quantity}x {item.name || item.title || 'Delicious Dish'} (₹{item.price * item.quantity})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Address & Handshake Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-black/5 dark:border-white/10 text-xs">
                      <div>
                        <p className="text-text/60 dark:text-white/60 max-w-md">
                          <strong className="text-title dark:text-white">Delivery Address:</strong> {order.deliveryAddress}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <button
                            onClick={() => downloadOrderReceipt(order)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary-dark hover:underline cursor-pointer transition-colors"
                            title="Download Tax Invoice Receipt"
                          >
                            <FileText size={12} />
                            <span>Download Receipt</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
                        {/* Customer Handshake Button - Only appears after admin clicks Delivered */}
                        {(order.orderStatus === 'Delivered' || order.orderStatus?.toLowerCase() === 'delivered') && !order.orderReceivedByCustomer && (
                          <button
                            onClick={() => handleConfirmReceived(order.id)}
                            disabled={actionLoading[order.id]}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-md shadow-emerald-600/20 whitespace-nowrap cursor-pointer"
                          >
                            {actionLoading[order.id] ? 'Updating...' : 'Confirm Order Received'}
                          </button>
                        )}

                        {order.orderReceivedByCustomer && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 size={16} /> Receipt Confirmed
                          </span>
                        )}
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-title dark:text-white cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-title dark:text-white cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default OrdersPage;
