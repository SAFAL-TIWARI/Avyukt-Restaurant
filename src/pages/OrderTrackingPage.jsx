import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Truck, CheckCircle2, Clock3, 
  Phone, User, ShieldAlert, Sparkles, Navigation, 
  Package, IndianRupee, RefreshCw, AlertCircle, 
  ChefHat, Play, Pause, RotateCcw, FastForward,
  ExternalLink, ChevronRight, Check, ShieldCheck, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, doc, onSnapshot } from '../firebase/config';
import api from '../services/api';
import { downloadOrderReceipt } from '../utils/receiptGenerator';

// Restaurant Coordinates (Vidisha, Madhya Pradesh - Hotel Grand Ashok / Avyukt Restaurant)
const RESTAURANT_COORDS = [23.5251, 77.8081];

// Default simulated customer coordinates (Vidisha residential area ~1.6km away)
const DEFAULT_CUSTOMER_COORDS = [23.5385, 77.8192];

// Simulated road waypoints between restaurant and customer
const ROUTE_WAYPOINTS = [
  [23.5251, 77.8081],
  [23.5268, 77.8095],
  [23.5292, 77.8118],
  [23.5315, 77.8139],
  [23.5342, 77.8162],
  [23.5365, 77.8178],
  [23.5385, 77.8192],
];

const ORDER_STEPS = [
  { id: 'Placed', label: 'Order Placed', desc: 'Received & sent to kitchen', icon: Clock3 },
  { id: 'Accepted', label: 'Chef Accepted', desc: 'Order confirmed by head chef', icon: ChefHat },
  { id: 'Preparing', label: 'In Kitchen', desc: 'Fresh ingredients being cooked', icon: RefreshCw },
  { id: 'Ready', label: 'Order Ready', desc: 'Packed hot & quality checked', icon: Package },
  { id: 'Out for Delivery', label: 'Out for Delivery', desc: 'Rider is on the way to you', icon: Truck },
  { id: 'Delivered', label: 'Delivered', desc: 'Order successfully delivered', icon: CheckCircle2 },
];

const formatDateTime = (val) => {
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

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const { user, isAdmin, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [adminUpdating, setAdminUpdating] = useState(false);

  // User's other orders for quick switching
  const [userOrders, setUserOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('tracking'); // 'tracking' | 'details' | 'other_orders'

  // Interactive Live Map Simulation States
  const [riderProgress, setRiderProgress] = useState(0.45); // 0 to 1
  const [isSimulating, setIsSimulating] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1); // 1x, 2x, 4x
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  // Fetch / Listen to order in real-time
  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);

    let unsubscribe = null;

    if (db) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        unsubscribe = onSnapshot(
          orderRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = { id: docSnap.id, ...docSnap.data() };
              setOrder(data);
              setLoading(false);
            } else {
              // Try API fallback
              fetchOrderViaApi(orderId);
            }
          },
          (err) => {
            console.warn('Firestore snapshot error, falling back to API:', err.message);
            fetchOrderViaApi(orderId);
          }
        );
      } catch (e) {
        console.warn('Fallback to API fetch:', e.message);
        fetchOrderViaApi(orderId);
      }
    } else {
      fetchOrderViaApi(orderId);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orderId]);

  const fetchOrderViaApi = async (id) => {
    try {
      const res = await api.getOrderById(id);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setError('Order not found.');
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('Unable to load order details. Please verify your order ID.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch other orders of this user for fast switching
  useEffect(() => {
    if (user?.uid) {
      api.getUserOrders(user.uid)
        .then(res => {
          if (res.success && res.orders) {
            setUserOrders(res.orders);
          }
        })
        .catch(err => console.warn('Could not load user orders list:', err));
    }
  }, [user?.uid]);

  // Filter other orders for this user (excluding current order)
  const otherOrders = useMemo(() => {
    return userOrders.filter(o => o.id !== order?.id);
  }, [userOrders, order?.id]);

  // Reset activeTab if on other_orders and no other orders exist
  useEffect(() => {
    if (activeTab === 'other_orders' && otherOrders.length === 0) {
      setActiveTab('details');
    }
  }, [activeTab, otherOrders.length]);

  // Authorization Check
  const isAuthorized = useMemo(() => {
    if (!order) return false;
    if (isAdmin) return true;
    if (!user) return false;
    // Allow if user uid matches, or email matches, or guest created in same session
    return (
      order.userId === user.uid || 
      (order.customerEmail && user.email && order.customerEmail.toLowerCase() === user.email.toLowerCase())
    );
  }, [order, user, isAdmin]);

  // Step calculations
  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    const idx = ORDER_STEPS.findIndex(s => s.id === order.orderStatus);
    return idx >= 0 ? idx : 0;
  }, [order]);

  // Calculate current rider coordinates along waypoints based on progress
  const currentRiderCoords = useMemo(() => {
    if (ROUTE_WAYPOINTS.length < 2) return RESTAURANT_COORDS;
    const totalSegments = ROUTE_WAYPOINTS.length - 1;
    const scaled = riderProgress * totalSegments;
    const segIndex = Math.min(Math.floor(scaled), totalSegments - 1);
    const segFraction = scaled - segIndex;

    const start = ROUTE_WAYPOINTS[segIndex];
    const end = ROUTE_WAYPOINTS[segIndex + 1];

    const lat = start[0] + (end[0] - start[0]) * segFraction;
    const lng = start[1] + (end[1] - start[1]) * segFraction;
    return [lat, lng];
  }, [riderProgress]);

  // Live simulation tick
  useEffect(() => {
    if (!isSimulating || order?.orderStatus === 'Delivered') return;

    const interval = setInterval(() => {
      setRiderProgress(prev => {
        if (prev >= 1) return 0; // loop back for demo
        return Math.min(1, prev + 0.008 * simSpeed);
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed, order?.orderStatus]);

  // Leaflet Map Initialization & Updates
  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const map = window.L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(RESTAURANT_COORDS, 14);

      // OpenStreetMap Tiles with sleek theme
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Custom Restaurant Icon
      const restIcon = window.L.divIcon({
        className: 'custom-rest-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; background: rgba(128, 0, 0, 0.25); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 34px; height: 34px; background: #800000; border: 2.5px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.35); color: #fff; font-size: 16px;">
              👑
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      // Custom Customer Home Icon
      const homeIcon = window.L.divIcon({
        className: 'custom-home-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: relative; width: 34px; height: 34px; background: #059669; border: 2.5px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.35); color: #fff; font-size: 15px;">
              🏠
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      // Custom Rider Icon
      const riderIcon = window.L.divIcon({
        className: 'custom-rider-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 40px; height: 40px; background: rgba(245, 158, 11, 0.3); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
            <div style="position: relative; width: 36px; height: 36px; background: #d97706; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(217, 119, 6, 0.4); color: #ffffff; font-size: 16px;">
              🛵
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      // Add markers
      window.L.marker(RESTAURANT_COORDS, { icon: restIcon })
        .addTo(map)
        .bindPopup('<strong>Avyukt Restaurant</strong><br/>Hotel Grand Ashok, Vidisha');

      window.L.marker(DEFAULT_CUSTOMER_COORDS, { icon: homeIcon })
        .addTo(map)
        .bindPopup(`<strong>Delivery Destination</strong><br/>${order?.deliveryAddress || 'Customer Address'}`);

      const riderMarker = window.L.marker(RESTAURANT_COORDS, { icon: riderIcon })
        .addTo(map)
        .bindPopup('<strong>Royal Delivery Partner</strong><br/>On the way!');

      riderMarkerRef.current = riderMarker;

      // Draw polyline route
      const polyline = window.L.polyline(ROUTE_WAYPOINTS, {
        color: '#800000',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round',
      }).addTo(map);

      polylineRef.current = polyline;

      // Fit bounds to show entire route with padding
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

      mapInstanceRef.current = map;
    }

    // Update Rider Marker Position
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng(currentRiderCoords);
    }
  }, [currentRiderCoords, order?.deliveryAddress]);

  // Handlers for centering map
  const handleCenterRider = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(currentRiderCoords, 16, { animate: true });
    }
  };

  const handleCenterRoute = () => {
    if (mapInstanceRef.current && polylineRef.current) {
      mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40], animate: true });
    }
  };

  // Customer Confirmation Handshake
  const handleConfirmReceived = async () => {
    if (!order?.id) return;
    setConfirmingReceipt(true);
    try {
      await api.customerConfirmReceived(order.id);
      setOrder(prev => ({
        ...prev,
        orderReceivedByCustomer: true,
        orderStatus: 'Delivered',
      }));
      setRiderProgress(1);
      addToast('Thank you! Your order delivery receipt has been confirmed.', 'success');
    } catch (err) {
      console.error('Error confirming receipt:', err);
      addToast('Failed to confirm delivery. Please try again.', 'error');
    } finally {
      setConfirmingReceipt(false);
    }
  };

  // Admin Quick Status Controls
  const handleAdminStatusChange = async (newStatus) => {
    if (!order?.id) return;
    setAdminUpdating(true);
    try {
      await api.updateOrderStatus(order.id, newStatus);
      setOrder(prev => ({ ...prev, orderStatus: newStatus }));
      addToast(`Order status updated to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Error updating status:', err);
      addToast('Failed to update status.', 'error');
    } finally {
      setAdminUpdating(false);
    }
  };

  // Admin Confirm Payment
  const handleAdminConfirmPayment = async () => {
    if (!order?.id) return;
    setAdminUpdating(true);
    try {
      await api.adminConfirmPayment(order.id);
      setOrder(prev => ({ ...prev, amountReceivedByAdmin: true, paymentStatus: 'paid' }));
      addToast('Payment verified successfully!', 'success');
    } catch (err) {
      console.error('Error confirming payment:', err);
      addToast('Failed to confirm payment.', 'error');
    } finally {
      setAdminUpdating(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 bg-body dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-title font-bold text-lg text-title dark:text-white">Connecting to live order telemetry...</p>
          <p className="text-xs text-text/50 dark:text-white/50">Fetching GPS coordinates & status updates</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error || !order) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 bg-body dark:bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-600 mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold font-title text-title dark:text-white">Order Not Found</h2>
          <p className="text-xs text-text/60 dark:text-white/60">
            {error || `We couldn't locate order #${orderId}. It might have been deleted or the ID is incorrect.`}
          </p>
          <div className="pt-2 flex gap-3 justify-center">
            <Link
              to="/orders"
              className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-dark transition-all inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> My Orders
            </Link>
            <Link
              to="/menu"
              className="px-5 py-2.5 bg-black/5 dark:bg-white/5 rounded-xl font-bold text-xs text-text dark:text-white hover:bg-black/10 transition-all"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Unauthorized Access Guard Screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 bg-body dark:bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-amber-500/20 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold font-title text-title dark:text-white">Access Restricted</h2>
          <p className="text-xs text-text/60 dark:text-white/60 leading-relaxed">
            Order <span className="font-bold text-title dark:text-white">#{order.id}</span> is private and can only be tracked by the customer who placed it or restaurant administrators.
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-500/20 text-left text-[11px] text-amber-800 dark:text-amber-200">
            <strong>Logged in as:</strong> {user?.email || 'Guest User'}<br/>
            If you placed this order under another account, please switch accounts.
          </div>
          <div className="pt-2 flex gap-3 justify-center">
            <Link
              to="/orders"
              className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-dark transition-all inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> View My Orders
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 bg-black/5 dark:bg-white/5 rounded-xl font-bold text-xs text-text dark:text-white hover:bg-black/10 transition-all"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main Tracking Page
  const remainingMinutes = Math.max(2, Math.round((1 - riderProgress) * 25));
  const remainingDistance = ((1 - riderProgress) * 2.4).toFixed(1);

  return (
    <div className="min-h-screen pt-28 pb-20 px-3 sm:px-4 md:px-6 bg-body dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Breadcrumb & Live Sync Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              to="/orders"
              className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-title dark:text-white"
              title="Back to Orders"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold font-title text-title dark:text-white">
                  Tracking Order #{order.id}
                </h1>
                {isAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center gap-1">
                    <ShieldCheck size={12} /> Admin Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text/50 dark:text-white/50 flex items-center gap-2">
                <span>Placed on {formatDateTime(order.createdAt)}</span>
                •
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Live Telemetry Active
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              order.orderStatus === 'Delivered'
                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                : order.orderStatus === 'Out for Delivery'
                ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            }`}>
              {order.orderStatus === 'Delivered' ? <CheckCircle2 size={14} /> : <Truck size={14} />}
              {order.orderStatus}
            </span>

            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              order.paymentStatus === 'paid' || order.amountReceivedByAdmin
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-amber-500/10 text-amber-600'
            }`}>
              ₹{order.totalAmount} • {order.paymentStatus === 'paid' || order.amountReceivedByAdmin ? 'Paid' : 'Pay on Delivery'}
            </span>

            {/* Subtle Download Receipt Link */}
            <button
              onClick={() => downloadOrderReceipt(order)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary hover:text-primary-dark hover:underline cursor-pointer bg-primary/10 hover:bg-primary/20 transition-colors"
              title="Download Tax Invoice Receipt"
            >
              <FileText size={13} />
              <span>Receipt</span>
            </button>
          </div>
        </div>

        {/* Admin Quick Control Toolbar (Visible only when Admin views) */}
        {isAdmin && (
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-semibold">
              <ShieldCheck size={16} className="text-purple-600" />
              <span>Admin Actions: Live Order Management</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {order.orderStatus === 'Delivered' ? (
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={14} /> Delivered & Completed
                  </span>
                  {!order.amountReceivedByAdmin && (
                    <button
                      onClick={handleAdminConfirmPayment}
                      disabled={adminUpdating}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-[11px] hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
                    >
                      Verify Payment
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {['Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleAdminStatusChange(st)}
                      disabled={adminUpdating || order.orderStatus === st}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                        order.orderStatus === st
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-text/70 dark:text-white/70 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/30'
                      }`}
                    >
                      {st}
                    </button>
                  ))}

                  {!order.amountReceivedByAdmin && (
                    <button
                      onClick={handleAdminConfirmPayment}
                      disabled={adminUpdating}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-[11px] hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
                    >
                      Verify Payment
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm text-xs font-bold">
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 py-2 rounded-xl text-center transition-all ${
              activeTab === 'tracking' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-text/70 dark:text-white/70 hover:bg-black/5'
            }`}
          >
            Live Map & Status
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 rounded-xl text-center transition-all ${
              activeTab === 'details' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-text/70 dark:text-white/70 hover:bg-black/5'
            }`}
          >
            Order Details ({order.items?.length || 0})
          </button>
          {otherOrders.length > 0 && (
            <button
              onClick={() => setActiveTab('other_orders')}
              className={`flex-1 py-2 rounded-xl text-center transition-all ${
                activeTab === 'other_orders' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-text/70 dark:text-white/70 hover:bg-black/5'
              }`}
            >
              Other Orders ({otherOrders.length})
            </button>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Real-Time Map & Rider Telemetry (Desktop: 7 cols) */}
          <div className={`lg:col-span-7 space-y-6 ${activeTab !== 'tracking' ? 'hidden lg:block' : ''}`}>
            
            {/* Real-time Map Box */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
              
              {/* Map Header / Live Status Banner */}
              <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500/5 via-primary/5 to-transparent">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="font-bold text-sm text-title dark:text-white">Real-Time Delivery Route</h3>
                  </div>
                  <p className="text-[11px] text-text/60 dark:text-white/60">
                    Live GPS simulation from Avyukt Kitchen to your doorstep
                  </p>
                </div>

                {/* ETA Badge */}
                <div className="text-right">
                  <span className="text-xs text-text/50 dark:text-white/50 block">Est. Arrival</span>
                  <span className="text-lg font-bold text-primary">
                    {order.orderStatus === 'Delivered' ? 'Delivered' : `${remainingMinutes} Mins`}
                  </span>
                </div>
              </div>

              {/* Leaflet Map Canvas */}
              <div className="relative w-full h-[320px] sm:h-[400px] bg-zinc-200 dark:bg-zinc-800 z-0">
                <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '320px' }}></div>

                {/* On-Map Quick Controls */}
                <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
                  <button
                    onClick={handleCenterRider}
                    className="p-2.5 bg-white dark:bg-zinc-900 text-title dark:text-white rounded-xl shadow-lg border border-black/10 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                    title="Center on Rider"
                  >
                    <Navigation size={16} className="text-amber-600" />
                  </button>
                  <button
                    onClick={handleCenterRoute}
                    className="p-2.5 bg-white dark:bg-zinc-900 text-title dark:text-white rounded-xl shadow-lg border border-black/10 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                    title="Fit Route"
                  >
                    <MapPin size={16} className="text-primary" />
                  </button>
                </div>

                {/* Bottom Overlay Telemetry Pill */}
                <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[400] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-black/10 dark:border-white/10 flex items-center justify-between sm:justify-start gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-text/50 dark:text-white/50 block uppercase tracking-wider font-semibold">Distance</span>
                    <span className="font-bold text-title dark:text-white">{remainingDistance} km left</span>
                  </div>
                  <div className="h-6 w-[1px] bg-black/10 dark:border-white/10"></div>
                  <div>
                    <span className="text-[10px] text-text/50 dark:text-white/50 block uppercase tracking-wider font-semibold">Speed</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">28 km/h</span>
                  </div>
                  <div className="h-6 w-[1px] bg-black/10 dark:border-white/10"></div>
                  <div>
                    <span className="text-[10px] text-text/50 dark:text-white/50 block uppercase tracking-wider font-semibold">Route Progress</span>
                    <span className="font-bold text-primary">{Math.round(riderProgress * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Demo Map Simulation Control Bar */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-900/80 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all cursor-pointer shadow-sm"
                  >
                    {isSimulating ? <Pause size={13} /> : <Play size={13} />}
                    {isSimulating ? 'Pause GPS' : 'Play GPS'}
                  </button>
                  <button
                    onClick={() => setRiderProgress(0)}
                    className="p-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text/70 dark:text-white/70 rounded-xl transition-all cursor-pointer"
                    title="Reset to Restaurant"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={() => setSimSpeed(s => (s === 1 ? 2 : s === 2 ? 4 : 1))}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-black/5 dark:bg-white/5 text-text/70 dark:text-white/70 rounded-xl font-bold hover:bg-black/10 transition-all cursor-pointer text-[11px]"
                  >
                    <FastForward size={12} /> {simSpeed}x Speed
                  </button>
                </div>

               
              </div>
            </div>

            {/* Delivery Driver Details Card */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-13 h-13 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-lg border border-amber-500/20">
                    🛵
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-title dark:text-white">Vikram Sen</h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                      ★ 4.9 (180+ deliveries)
                    </span>
                  </div>
                  <p className="text-xs text-text/60 dark:text-white/60">
                    Avyukt Royal Express Rider • Hero Electric (MP-04-AX-8912)
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    Insulated thermal hot-bag equipped
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <a
                  href="tel:+911234567890"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Phone size={14} /> Call Driver
                </a>
              </div>
            </div>

            {/* Customer Handshake Confirmation Section - Only appears after admin clicks Delivered */}
            {(order.orderStatus === 'Delivered' || order.orderStatus?.toLowerCase() === 'delivered' || order.orderReceivedByCustomer) && (
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-title dark:text-white flex items-center gap-2">
                      Delivery Handshake & Confirmation
                    </h4>
                    <p className="text-xs text-text/60 dark:text-white/60 mt-0.5">
                      {order.orderReceivedByCustomer 
                        ? 'You have confirmed delivery of this order.' 
                        : 'Your food has arrived! Click to confirm receipt.'}
                    </p>
                  </div>

                  {order.orderReceivedByCustomer ? (
                    <span className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5">
                      <CheckCircle2 size={16} /> Receipt Confirmed by Customer
                    </span>
                  ) : (
                    <button
                      onClick={handleConfirmReceived}
                      disabled={confirmingReceipt}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {confirmingReceipt ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Confirming...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={15} /> Confirm Order Received
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Status Timeline & Order Summary Breakdown (Desktop: 5 cols) */}
          <div className={`lg:col-span-5 space-y-6 ${activeTab === 'tracking' ? 'hidden lg:block' : ''}`}>

            {/* ORDER STATUS TIMELINE CARD */}
            <div className={`bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm space-y-5 ${
              activeTab !== 'details' ? 'hidden lg:block' : ''
            }`}>
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4">
                <div>
                  <h3 className="font-bold text-base text-title dark:text-white">Order Timeline</h3>
                  <p className="text-xs text-text/50 dark:text-white/50">Stage-by-stage culinary progression</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full">
                  Step {Math.min(currentStepIndex + 1, ORDER_STEPS.length)} of {ORDER_STEPS.length}
                </span>
              </div>

              {/* Visual Vertical Timeline */}
              <div className="space-y-4 relative before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {ORDER_STEPS.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const isPending = idx > currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="relative flex items-start gap-4">
                      {/* Node Circle */}
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-primary text-white ring-4 ring-primary/20 shadow-md shadow-primary/30'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}>
                        {isCompleted ? (
                          <Check size={16} strokeWidth={3} />
                        ) : isCurrent ? (
                          <Icon size={16} className={step.id === 'Preparing' ? 'animate-spin' : ''} />
                        ) : (
                          <Icon size={16} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <h5 className={`font-bold text-xs sm:text-sm ${
                            isCurrent
                              ? 'text-primary dark:text-primary-light font-extrabold'
                              : isCompleted
                              ? 'text-title dark:text-white'
                              : 'text-zinc-400 dark:text-zinc-600'
                          }`}>
                            {step.label}
                          </h5>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md uppercase tracking-wider animate-pulse">
                              Current
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] mt-0.5 ${
                          isPending ? 'text-zinc-400 dark:text-zinc-600' : 'text-text/60 dark:text-white/60'
                        }`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ORDER ITEMS & BREAKDOWN CARD */}
            <div className={`bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm space-y-4 ${
              activeTab !== 'details' ? 'hidden lg:block' : ''
            }`}>
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-title dark:text-white">
                    Order Items ({order.items?.length || 0})
                  </h3>
                  <span className="text-xs text-text/50 dark:text-white/50">
                    • ₹{order.totalAmount}
                  </span>
                </div>
                <button
                  onClick={() => downloadOrderReceipt(order)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-dark hover:underline cursor-pointer "
                  title="Download Tax Invoice Receipt"
                >
                  <FileText size={12} />
                  <span>Download Receipt</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-black/5 dark:border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-[11px]">
                        {item.quantity}x
                      </span>
                      <span className="font-medium text-title dark:text-white">
                        {item.name || item.title || 'Delicious Dish'}
                      </span>
                    </div>
                    <span className="font-bold text-title dark:text-white">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Summary Breakdown */}
              <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-1.5 text-xs text-text/70 dark:text-white/70">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal || order.totalAmount}</span>
                </div>
                {order.deliveryFee !== undefined && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
                  </div>
                )}
                {order.tax !== undefined && (
                  <div className="flex justify-between">
                    <span>Taxes (5% GST)</span>
                    <span>₹{order.tax}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-black/5 dark:border-white/10 font-bold text-sm text-title dark:text-white">
                  <span>Grand Total</span>
                  <span className="text-primary text-base">₹{order.totalAmount}</span>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="pt-3 border-t border-black/5 dark:border-white/10 text-xs space-y-1">
                <p className="text-text/70 dark:text-white/70">
                  <strong className="text-title dark:text-white">Deliver To:</strong> {order.deliveryAddress}
                </p>
                <p className="text-text/60 dark:text-white/60">
                  <strong className="text-title dark:text-white">Customer:</strong> {order.customerName} • {order.customerPhone}
                </p>
                {order.specialInstructions && (
                  <p className="text-text/50 dark:text-white/50 italic">
                    Note: "{order.specialInstructions}"
                  </p>
                )}
              </div>
            </div>

            {/* SWITCH TO OTHER ORDERS (IF ANY) */}
            {otherOrders.length > 0 && (
              <div className={`bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm space-y-3 ${
                activeTab !== 'other_orders' ? 'hidden lg:block' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-text/50 dark:text-white/50">
                    Your Other Orders ({otherOrders.length})
                  </h4>
                  <Link to="/orders" className="text-primary font-bold text-xs hover:underline">
                    View All
                  </Link>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {otherOrders.map(other => (
                    <Link
                      key={other.id}
                      to={`/orders/${other.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all border border-black/5 dark:border-white/5 text-xs group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-title dark:text-white">{other.id}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            other.orderStatus === 'Delivered'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {other.orderStatus}
                          </span>
                        </div>
                        <span className="text-[11px] text-text/50 dark:text-white/50">
                          ₹{other.totalAmount} • {other.items?.length || 1} Items
                        </span>
                      </div>
                      <span className="text-primary group-hover:translate-x-1 transition-transform">
                        <ChevronRight size={16} />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderTrackingPage;
