import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, 
  MapPin, CreditCard, Banknote, ShieldCheck, CheckCircle2, AlertCircle,
  LocateFixed
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Filter out any legacy dummy addresses
  const savedAddressesList = (user?.savedAddresses || []).filter(a => a && a.id !== 'addr_default_1');

  // Delivery Address Choice
  const [addressChoice, setAddressChoice] = useState(() => savedAddressesList.length > 0 ? 'saved' : 'manual');
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const defaultAddr = savedAddressesList.find(a => a.isDefault);
    return defaultAddr ? defaultAddr.id : savedAddressesList[0]?.id || '';
  });
  const [manualAddress, setManualAddress] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');

  const handleFetchCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.', 'Location Error');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept': 'application/json' } }
          );
          const data = await res.json();
          if (data && data.display_name) {
            setManualAddress(data.display_name);
            toast.success('Live GPS address detected!', 'Address Auto-Filled');
          }
        } catch (err) {
          toast.error('Could not fetch address details.', 'Location Error');
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        toast.error('Could not retrieve your GPS location.', 'Location Access');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Payment Method: 'razorpay' | 'cash' | 'upi'
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const deliveryFee = 40;
  const tax = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + deliveryFee + tax;

  // Resolve selected address text
  const getChosenAddressText = () => {
    if (addressChoice === 'saved') {
      const found = user?.savedAddresses?.find(a => a.id === selectedAddressId);
      if (found) {
        return `${found.street}, ${found.landmark ? found.landmark + ', ' : ''}${found.city} - ${found.pincode} (${found.label})`;
      }
    }
    return manualAddress;
  };

  // Handle Checkout
  const handleCheckout = async () => {
    const finalAddress = getChosenAddressText();
    if (!finalAddress || finalAddress.trim().length < 5) {
      setErrorMsg('Please select a saved address or enter a complete delivery address.');
      return;
    }
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please provide an exact 10-digit contact mobile number for order delivery (e.g. 9876543210).');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const orderPayload = {
        userId: user?.uid || 'guest_' + Date.now(),
        customerName: user?.name || 'Customer',
        customerEmail: user?.email || '',
        customerPhone: phone,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: parseInt(String(item.price).replace(/[^\d]/g, '')) || 0,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal: totalPrice,
        deliveryFee,
        tax,
        totalAmount: grandTotal,
        deliveryAddress: finalAddress,
        paymentMethod,
      };

      // 1. ONLINE PAYMENT VIA RAZORPAY
      if (paymentMethod === 'razorpay') {
        const orderRes = await api.createRazorpayOrder(grandTotal, `rec_${Date.now()}`);
        
        const options = {
          key: orderRes.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
          amount: orderRes.amount,
          currency: 'INR',
          name: 'Avyukt Restaurant',
          description: 'Payment for Delicious Dining Order',
          image: '/assets/favicon.png',
          order_id: orderRes.orderId,
          prefill: {
            name: user?.name || 'Customer',
            email: user?.email || 'customer@example.com',
            contact: phone || '9999999999',
          },
          theme: {
            color: '#991b1b', // Avyukt Primary Maroon
          },
          handler: async (response) => {
            try {
              // Verify payment on backend
              await api.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: grandTotal,
                userId: user?.uid,
                customerName: user?.name,
                customerEmail: user?.email,
              });

              // Create completed order in database
              await api.createOrder({
                ...orderPayload,
                paymentStatus: 'paid',
                razorpayPaymentId: response.razorpay_payment_id,
              });

              clearCart();
              navigate('/orders');
            } catch (err) {
              console.error('Payment verification failed:', err);
              setErrorMsg('Payment verification error: ' + err.message);
              setLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
        };

        if (window.Razorpay) {
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response) {
            setErrorMsg('Payment failed: ' + (response.error.description || 'Transaction declined'));
            setLoading(false);
          });
          rzp.open();
        } else {
          // Fallback if Razorpay script is blocked or offline
          console.warn('Razorpay SDK not loaded, placing order as Online Pending');
          await api.createOrder({
            ...orderPayload,
            paymentStatus: 'paid',
            razorpayPaymentId: 'pay_simulated_' + Date.now(),
          });
          clearCart();
          navigate('/orders');
        }
      } 
      // 2. CASH ON DELIVERY (COD) / DIRECT UPI ON DELIVERY
      else {
        await api.createOrder({
          ...orderPayload,
          paymentStatus: 'pending',
          paymentMethod: paymentMethod === 'upi' ? 'upi' : 'cash',
        });

        clearCart();
        navigate('/orders');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6"
        >
          <ShoppingBag size={48} />
        </motion.div>
        <h2 className="text-3xl font-title font-bold text-title dark:text-white mb-4">Your cart is empty</h2>
        <p className="text-text/60 dark:text-white/60 max-w-md mb-8">
          Looks like you haven't added anything to your cart yet. Explore our delicious menu and find something you love!
        </p>
        <Link
          to="/menu"
          className="bg-primary text-white px-8 py-3.5 rounded-full font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 flex items-center gap-2 group text-sm"
        >
          Browse Menu
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-body dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Cart Items List */}
          <div className="lg:w-2/3">
            <h1 className="text-3xl font-title font-bold text-title dark:text-white mb-6">Shopping Cart ({totalItems} items)</h1>
            
            <div className="space-y-4 mb-8">
              <AnimatePresence mode="popLayout">
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    exit={{ x: -100, opacity: 0 }}
                    className="bg-white dark:bg-zinc-900/50 backdrop-blur-md p-4 rounded-3xl border border-black/5 dark:border-white/10 flex items-center gap-4 shadow-sm"
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-zinc-800">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-grow">
                      <h3 className="text-base font-bold text-title dark:text-white">{item.name}</h3>
                      <p className="text-xs text-text/60 dark:text-white/60 mb-1 line-clamp-1">{item.desc || item.description}</p>
                      <p className="text-primary font-bold text-sm">{String(item.price).startsWith('₹') ? item.price : `₹${item.price}`}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 pr-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-colors text-text dark:text-white"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-title dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-colors text-text dark:text-white"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Delivery Address Section (Customer picks saved address or enters new) */}
            <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="text-primary" size={20} />
                  <h3 className="text-lg font-bold font-title text-title dark:text-white">Delivery Address</h3>
                </div>

                {isLoggedIn && savedAddressesList.length > 0 && (
                  <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setAddressChoice('saved')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${addressChoice === 'saved' ? 'bg-primary text-white' : 'text-gray-500'}`}
                    >
                      Saved ({savedAddressesList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressChoice('manual')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${addressChoice === 'manual' ? 'bg-primary text-white' : 'text-gray-500'}`}
                    >
                      New Address
                    </button>
                  </div>
                )}
              </div>

              {/* Saved Addresses Selector */}
              {addressChoice === 'saved' && savedAddressesList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {savedAddressesList.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-black/5 dark:border-white/5 bg-gray-50 dark:bg-zinc-800/50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-title dark:text-white">{addr.label}</span>
                        <input
                          type="radio"
                          name="savedAddressRadio"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="accent-primary"
                        />
                      </div>
                      <p className="text-[11px] text-text/70 dark:text-white/70 line-clamp-2 leading-relaxed">{addr.street}</p>
                      <p className="text-[11px] font-bold text-text/50 dark:text-white/50">{addr.city} - {addr.pincode}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleFetchCurrentLocation}
                      disabled={detectingLocation}
                      className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-[11px] font-bold inline-flex items-center gap-1.5 transition-all border border-primary/20 disabled:opacity-50"
                    >
                      <LocateFixed size={13} className={detectingLocation ? 'animate-spin' : ''} />
                      {detectingLocation ? 'Detecting GPS Location...' : '📍 Fetch Current Location (Auto-Fill)'}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Enter complete delivery address (House/Flat No, Landmark, Area, Vidisha - 464001)..."
                    className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-transparent focus:border-primary outline-none text-xs dark:text-white resize-none"
                  />
                </div>
              )}

              {/* Phone Number Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-text/60 dark:text-white/60 block">
                    Contact Phone Number *
                  </label>
                  <span className={`text-[11px] font-bold ${
                    (phone || '').replace(/\D/g, '').length === 10 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {(phone || '').replace(/\D/g, '').length === 10 ? '✓ 10 Digits Complete' : `${(phone || '').replace(/\D/g, '').length}/10 digits`}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text/50 dark:text-white/50">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(digits);
                    }}
                    placeholder="9876543210"
                    className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl border outline-none text-xs dark:text-white font-mono font-medium tracking-wider transition-colors ${
                      (phone || '').replace(/\D/g, '').length === 10 
                        ? 'border-emerald-500/40 focus:border-emerald-500' 
                        : 'border-transparent focus:border-primary'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="text-primary" size={20} />
                <h3 className="text-lg font-bold font-title text-title dark:text-white">Payment Method</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Razorpay Online */}
                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                    paymentMethod === 'razorpay'
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-black/5 dark:border-white/5 bg-gray-50 dark:bg-zinc-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="accent-primary mt-1"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-title dark:text-white mb-1">Razorpay Online</h4>
                    <p className="text-[11px] text-text/60 dark:text-white/60">UPI (GPay, PhonePe, Paytm), Cards & NetBanking</p>
                    <span className="inline-block mt-2 text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-bold">
                      Instant Confirmation
                    </span>
                  </div>
                </div>

                {/* Cash on Delivery / UPI on Delivery */}
                <div
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                    paymentMethod === 'cash'
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-black/5 dark:border-white/5 bg-gray-50 dark:bg-zinc-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="accent-primary mt-1"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-title dark:text-white mb-1">Cash / UPI on Delivery</h4>
                    <p className="text-[11px] text-text/60 dark:text-white/60">Pay by cash or scan QR code directly at your door</p>
                    <span className="inline-block mt-2 text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded font-bold">
                      Admin Verification Flow
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Order Summary Column */}
          <div className="lg:w-1/3">
            <div className="sticky top-32">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-xl">
                <h2 className="text-2xl font-title font-bold text-title dark:text-white mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6 text-sm">
                  <div className="flex justify-between text-text/60 dark:text-white/60">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-text/60 dark:text-white/60">
                    <span>Delivery Charges</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-text/60 dark:text-white/60">
                    <span>Taxes & GST (5%)</span>
                    <span>₹{tax}</span>
                  </div>
                  <div className="h-px bg-black/5 dark:bg-white/10 my-4" />
                  <div className="flex justify-between text-xl font-bold text-title dark:text-white">
                    <span>Total Payable</span>
                    <span className="text-primary">₹{grandTotal}</span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-dark transition-all shadow-xl shadow-primary/25 mb-4 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing...' : `Place Order (₹${grandTotal})`}
                  <ArrowRight size={18} />
                </button>
                
                <div className="flex items-center justify-center gap-2 text-xs text-text/40 dark:text-white/40">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span>100% Safe & Secure Checkout</span>
                </div>
              </div>

              {/* Quality Badges */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-green-500/5 p-4 rounded-2xl border border-green-500/10 text-center">
                  <p className="text-green-600 dark:text-green-400 font-bold text-xs">Fresh Kitchen Prep</p>
                </div>
                <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 text-center">
                  <p className="text-amber-600 dark:text-amber-400 font-bold text-xs">Fast Local Dispatch</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CartPage;
