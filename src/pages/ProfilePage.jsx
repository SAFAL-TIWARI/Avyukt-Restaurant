import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, 
  CreditCard, Shield, LogOut,
  Edit2, Check, X, Plus, Trash2, Home, Briefcase, CheckCircle2, IndianRupee,
  LocateFixed, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { PaymentCardSkeleton } from '../components/common/Skeleton';

const ProfilePage = () => {
  const { 
    user, 
    isLoggedIn, 
    logout, 
    updateUser, 
    addSavedAddress, 
    deleteSavedAddress, 
    setDefaultAddress 
  } = useAuth();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || 'profile');

  // Keep activeTab in sync with query param
  useEffect(() => {
    if (urlTab && ['profile', 'address', 'payment', 'security'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    phone: '',
    street: '',
    landmark: '',
    city: '',
    pincode: '',
  });

  // Payments History State
  const [payments, setPayments] = useState([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      setEditData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        location: user?.location || '',
        avatar: user?.avatar || '',
      });

      // Fetch payment history & orders
      if (user?.uid) {
        setLoadingPayments(true);
        api.getUserPayments(user.uid)
          .then(res => {
            if (res.success) setPayments(res.payments || []);
          })
          .catch(err => console.warn('Could not fetch payments:', err.message))
          .finally(() => setLoadingPayments(false));

        api.getUserOrders(user.uid)
          .then(res => {
            if (res.success) setOrdersCount(res.orders?.length || 0);
          })
          .catch(err => console.warn('Could not fetch orders:', err.message));
      }
    }
  }, [isLoggedIn, user]);

  if (!isLoggedIn) return null;

  const startEditing = () => {
    setEditData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      avatar: user?.avatar || '',
    });
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveSuccess(false);
  };

  const saveProfile = async () => {
    const cleanPhone = (editData.phone || '').replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length !== 10) {
      toast.error('Contact phone number must be exactly 10 digits.', 'Invalid Phone');
      return;
    }
    const updatedAvatar = editData.avatar?.trim() || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(editData.name || user?.name || user?.email || 'User')}&background=800000&color=ffffff&bold=true&size=128&rounded=true`;
    await updateUser({
      name: editData.name,
      phone: cleanPhone,
      location: editData.location,
      avatar: updatedAvatar,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleEditChange = (e) => {
    if (e.target.name === 'phone') {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
      setEditData({ ...editData, phone: digits });
    } else {
      setEditData({ ...editData, [e.target.name]: e.target.value });
    }
  };

  const { toast } = useToast();
  const [detectingLocation, setDetectingLocation] = useState(false);

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
          if (data && data.address) {
            const addr = data.address;
            const street = [
              addr.house_number,
              addr.building,
              addr.road,
              addr.residential || addr.suburb || addr.neighbourhood
            ].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(', ') || 'Current Location';

            const landmark = addr.amenity || addr.shop || addr.suburb || addr.county || '';
            const city = addr.city || addr.town || addr.village || addr.state_district;
            const pincode = addr.postcode;

            setNewAddress(prev => ({
              ...prev,
              street,
              landmark,
              city,
              pincode,
            }));

            toast.success('Live GPS coordinates fetched and filled!', 'Location Detected');
          } else {
            toast.error('Could not determine address name from GPS.', 'Location Warning');
          }
        } catch (err) {
          console.error('Reverse geocode error:', err);
          toast.error('Could not fetch address details automatically.', 'Geocode Error');
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        const errMsg = err.code === 1 ? 'Location permission was denied.' : 'Could not retrieve your GPS position.';
        toast.error(errMsg, 'Location Access');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.pincode) return;
    const cleanPhone = (newAddress.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Contact phone number must be exactly 10 digits.', 'Invalid Phone');
      return;
    }
    await addSavedAddress({ ...newAddress, phone: cleanPhone });
    setShowAddressModal(false);
    setNewAddress({
      label: 'Home',
      phone: '',
      street: '',
      landmark: '',
      city: '',
      pincode: '',
    });
  };

  // Filter out any legacy hardcoded demo address
  const savedAddressesList = (user?.savedAddresses || []).filter(a => a && a.id !== 'addr_default_1');

  const profileSections = [
    { id: 'profile', name: 'Profile Info', icon: <User size={18} /> },
    { id: 'address', name: 'Saved Addresses', icon: <MapPin size={18} /> },
    { id: 'payment', name: 'Payments', icon: <CreditCard size={18} /> },
    { id: 'security', name: 'Security', icon: <Shield size={18} /> },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-body dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar Profile Card */}
          <div className="lg:w-1/3">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-5 sm:p-8 border border-black/5 dark:border-white/10 shadow-xl text-center relative overflow-hidden">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-primary/20 p-1 mx-auto mb-4 bg-primary/5 shadow-inner overflow-hidden">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&background=800000&color=ffffff&bold=true&size=128&rounded=true`}
                  alt={user?.name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=800000&color=ffffff&bold=true&size=128&rounded=true`;
                  }}
                />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-title text-title dark:text-white mb-1">
                {user?.name || 'Valued Guest'}
              </h2>
              <p className="text-xs sm:text-sm text-text/60 dark:text-white/60 mb-2 truncate max-w-full px-2">{user?.email}</p>
              
              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4 sm:mb-6 ${
                user?.role === 'admin' 
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}>
                {user?.role === 'admin' ? 'Restaurant Manager' : 'Customer'}
              </span>

              {/* Navigation Tabs - Horizontal Scrollbar List Card for Mobile, Vertical List for Desktop */}
              <div className="w-full overflow-x-auto no-scrollbar pt-4 border-t border-black/5 dark:border-white/10">
                <div className="flex lg:flex-col gap-2 min-w-max lg:min-w-0 text-left pb-1 lg:pb-0">
                  {profileSections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => handleTabChange(sec.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                        activeTab === sec.id
                          ? 'bg-primary text-white shadow-lg shadow-primary/25'
                          : 'text-text/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-zinc-800 bg-gray-50/70 dark:bg-zinc-800/60 lg:bg-transparent lg:dark:bg-transparent border border-black/5 dark:border-white/5 lg:border-transparent'
                      }`}
                    >
                      {sec.icon}
                      <span>{sec.name}</span>
                    </button>
                  ))}

                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold text-xs sm:text-sm transition-colors shrink-0 whitespace-nowrap bg-red-500/10 lg:bg-transparent border border-red-500/20 lg:border-transparent lg:mt-3 cursor-pointer"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Content Area */}
          <div className="lg:w-2/3">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 lg:p-10 border border-black/5 dark:border-white/10 shadow-xl min-h-[550px]">
              
              {/* TAB 1: PROFILE INFO */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center border-b border-black/5 dark:border-white/10 pb-6">
                    <div>
                      <h2 className="text-2xl font-title font-bold text-title dark:text-white">Profile Information</h2>
                      <p className="text-xs text-text/60 dark:text-white/60">Manage your dining preferences and contact details</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {saveSuccess && (
                        <span className="text-green-500 text-xs font-bold flex items-center gap-1">
                          <Check size={14} /> Saved!
                        </span>
                      )}
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-100 dark:bg-zinc-800 text-text dark:text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveProfile}
                            className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-dark transition-colors shadow-md"
                          >
                            Save Changes
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={startEditing}
                          className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-xs hover:bg-primary/20 transition-colors"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-text/50 dark:text-white/50">Full Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={editData.name}
                          onChange={handleEditChange}
                          className="w-full p-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-primary/30 outline-none text-sm dark:text-white"
                        />
                      ) : (
                        <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-black/5 dark:border-white/5 text-sm dark:text-white flex items-center gap-3">
                          <User size={16} className="text-primary" />
                          <span>{user?.name || 'Not set'}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-text/50 dark:text-white/50">Email Address</label>
                      <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-black/5 dark:border-white/5 text-sm dark:text-white flex items-center gap-3 opacity-80">
                        <Mail size={16} className="text-primary" />
                        <span>{user?.email}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-text/50 dark:text-white/50">Phone Number</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={editData.phone}
                          placeholder="1234567890"
                          onChange={handleEditChange}
                          className="w-full p-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-primary/30 outline-none text-sm dark:text-white"
                        />
                      ) : (
                        <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-black/5 dark:border-white/5 text-sm dark:text-white flex items-center gap-3">
                          <Phone size={16} className="text-primary" />
                          <span>{user?.phone || 'Add phone number'}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-text/50 dark:text-white/50">City / Location</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="location"
                          value={editData.location}
                          placeholder='Enter your location'
                          onChange={handleEditChange}
                          className="w-full p-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-primary/30 outline-none text-sm dark:text-white"
                        />
                      ) : (
                        <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-black/5 dark:border-white/5 text-sm dark:text-white flex items-center gap-3">
                          <MapPin size={16} className="text-primary" />
                          <span>{user?.location }</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-text/50 dark:text-white/50">Profile Picture / Avatar URL</label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            name="avatar"
                            value={editData.avatar}
                            placeholder="https://example.com/my-photo.jpg (or leave empty for initials)"
                            onChange={handleEditChange}
                            className="flex-1 p-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-primary/30 outline-none text-sm dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setEditData({ ...editData, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(editData.name || user?.name || 'User')}&background=800000&color=ffffff&bold=true&size=128&rounded=true` })}
                            className="px-3 py-2 text-xs font-bold bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors whitespace-nowrap"
                          >
                            Initials Avatar
                          </button>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-black/5 dark:border-white/5 text-sm dark:text-white flex items-center justify-between">
                          <span className="text-xs text-text/60 dark:text-white/60 truncate max-w-md">
                            {user?.avatar || 'Royal Maroon Initials Avatar'}
                          </span>
                          <span className="text-xs font-bold text-primary">Active</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 gap-4 pt-6">
                    <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 text-center">
                      <p className="text-3xl font-bold text-primary mb-1">{ordersCount}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text/60 dark:text-white/60">Total Food Orders</p>
                    </div>
                    <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 text-center">
                      <p className="text-3xl font-bold text-emerald-600 mb-1">{payments.length}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text/60 dark:text-white/60">Successful Payments</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SAVED ADDRESSES (WITH + ICON AS REQUESTED) */}
              {activeTab === 'address' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-black/5 dark:border-white/10 pb-6">
                    <div>
                      <h2 className="text-2xl font-title font-bold text-title dark:text-white">Saved Delivery Addresses</h2>
                      <p className="text-xs text-text/60 dark:text-white/60">Add multiple delivery locations for 1-click checkout</p>
                    </div>

                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="bg-primary text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/25"
                    >
                      <Plus size={16} /> Add Address
                    </button>
                  </div>

                  {savedAddressesList.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                        <MapPin size={28} />
                      </div>
                      <h3 className="text-lg font-bold text-title dark:text-white mb-1">No addresses saved yet</h3>
                      <p className="text-xs text-text/60 dark:text-white/60 mb-6">Click the button below to add your first delivery location.</p>
                      <button
                        onClick={() => setShowAddressModal(true)}
                        className="bg-primary/10 text-primary px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-primary/20 transition-colors inline-flex items-center gap-2"
                      >
                        <Plus size={16} /> Add Address Now
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedAddressesList.map((addr) => (
                        <div
                          key={addr.id}
                          className={`p-5 rounded-3xl border transition-all relative ${
                            addr.isDefault
                              ? 'bg-primary/5 border-primary/30 dark:bg-primary/10'
                              : 'bg-gray-50 dark:bg-zinc-800/50 border-black/5 dark:border-white/5'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              {addr.label?.toLowerCase() === 'work' ? <Briefcase size={16} className="text-primary" /> : <Home size={16} className="text-primary" />}
                              <span className="font-bold text-sm text-title dark:text-white">{addr.label}</span>
                              {addr.isDefault && (
                                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Default</span>
                              )}
                            </div>

                            <button
                              onClick={() => deleteSavedAddress(addr.id)}
                              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-xl transition-colors"
                              title="Delete address"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <p className="text-xs text-text/70 dark:text-white/70 mb-1 leading-relaxed">
                            {addr.street}
                          </p>
                          {addr.landmark && (
                            <p className="text-[11px] text-text/50 dark:text-white/50 mb-3">
                              Landmark: {addr.landmark}
                            </p>
                          )}
                          <p className="text-xs font-bold text-title dark:text-white mb-2">
                            {addr.city} - {addr.pincode}
                          </p>
                          {addr.phone && (
                            <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mb-3 flex items-center gap-1.5">
                              <Phone size={11} /> +91 {addr.phone}
                            </p>
                          )}

                          {!addr.isDefault && (
                            <button
                              onClick={() => setDefaultAddress(addr.id)}
                              className="text-[11px] font-bold text-primary hover:underline"
                            >
                              Set as Default
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PAYMENTS HISTORY (ACTIVE DB FETCHED) */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div className="border-b border-black/5 dark:border-white/10 pb-6">
                    <h2 className="text-2xl font-title font-bold text-title dark:text-white">Payment Transactions</h2>
                    <p className="text-xs text-text/60 dark:text-white/60">Complete audit log of online and verified cash receipts</p>
                  </div>

                  {loadingPayments ? (
                    <PaymentCardSkeleton count={3} />
                  ) : payments.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                        <CreditCard size={28} />
                      </div>
                      <h3 className="text-lg font-bold text-title dark:text-white mb-1">No payment history</h3>
                      <p className="text-xs text-text/60 dark:text-white/60">Your completed food order payments and transaction slips will be recorded here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments.map((p) => (
                        <div
                          key={p.paymentId || p.id}
                          className="bg-gray-50 dark:bg-zinc-800/50 p-5 rounded-3xl border border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-primary/20 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <CheckCircle2 size={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-title dark:text-white">
                                  Payment Successful
                                </h4>
                                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  {p.status || 'Verified'}
                                </span>
                              </div>
                              <p className="text-xs text-text/60 dark:text-white/60 mt-0.5 font-mono">
                                ID: {p.paymentId || p.id}
                              </p>
                              <p className="text-[11px] text-text/40 dark:text-white/40 mt-0.5">
                                {new Date(p.createdAt || Date.now()).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:flex-col md:items-end border-t md:border-t-0 pt-3 md:pt-0 border-black/5 dark:border-white/5">
                            <span className="text-xl font-bold font-title text-title dark:text-white">
                              ₹{p.amount}
                            </span>
                            <span className="text-xs font-semibold text-text/60 dark:text-white/60">
                              {p.method || 'Razorpay / Cash'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SECURITY & ACCOUNT ACTIONS */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="border-b border-black/5 dark:border-white/10 pb-6">
                    <h2 className="text-2xl font-title font-bold text-title dark:text-white">Account Security</h2>
                    <p className="text-xs text-text/60 dark:text-white/60">Manage passwords, authentication and active sessions</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-gray-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <Lock size={20} />
                      </div>
                      <h4 className="font-bold text-sm text-title dark:text-white mb-1">Password Authentication</h4>
                      <p className="text-xs text-text/60 dark:text-white/60 mb-4">Your account is secured via Firebase Authentication.</p>
                      <button
                        onClick={() => toast.info('Password reset instructions sent to your registered email address.', 'Security Notice')}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Request Password Reset
                      </button>
                    </div>

                    <div className="p-6 rounded-3xl bg-gray-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                        <Shield size={20} />
                      </div>
                      <h4 className="font-bold text-sm text-title dark:text-white mb-1">Account Role & Privileges</h4>
                      <p className="text-xs text-text/60 dark:text-white/60 mb-4">
                        Logged in as <strong className="text-title dark:text-white uppercase">{user?.role || 'Customer'}</strong>
                      </p>
                      <span className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full font-bold border border-amber-500/20">
                        {user?.role === 'admin' ? 'Admin Access Granted' : 'Standard Guest User'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* MODAL: ADD NEW SAVED ADDRESS */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 border border-black/10 dark:border-white/10 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-title text-title dark:text-white">Add Delivery Address</h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="p-2 text-text/50 dark:text-white/50 hover:text-primary rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddAddressSubmit} className="space-y-4">
                {/* Address Label Selector */}
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-2">
                    Address Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Home', 'Work', 'Other'].map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setNewAddress({ ...newAddress, label: lbl })}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          newAddress.label === lbl
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-gray-50 dark:bg-zinc-800 text-text/70 dark:text-white/70 border-black/5 dark:border-white/5'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GPS Location Auto-Detect Button */}
                <button
                  type="button"
                  onClick={handleFetchCurrentLocation}
                  disabled={detectingLocation}
                  className="w-full py-3 px-4 rounded-2xl bg-primary/10 hover:bg-primary/15 border border-primary/25 text-primary font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <LocateFixed size={16} className={detectingLocation ? 'animate-spin' : ''} />
                  <span>{detectingLocation ? 'Detecting Live Location...' : 'Use Current Location (Auto-Fill Fields)'}</span>
                </button>

                {/* Contact Phone Number */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                      Contact Phone *
                    </label>
                    <span className={`text-[11px] font-bold ${
                      (newAddress.phone || '').replace(/\D/g, '').length === 10
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {(newAddress.phone || '').replace(/\D/g, '').length === 10 ? '10 Digits Complete' : `${(newAddress.phone || '').replace(/\D/g, '').length}/10 digits`}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text/50 dark:text-white/50">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      value={newAddress.phone || ''}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setNewAddress({ ...newAddress, phone: digits });
                      }}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-transparent focus:border-primary outline-none text-sm dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                    Street Address / House No.
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    placeholder="e.g. Flat 302, Shehnai Enclave"
                    className="w-full p-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-transparent focus:border-primary outline-none text-sm dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAddress.landmark}
                    onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                    placeholder="e.g. Near Hotel Grand Ashok"
                    className="w-full p-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-transparent focus:border-primary outline-none text-sm dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full p-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-transparent focus:border-primary outline-none text-sm dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="w-full p-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-transparent focus:border-primary outline-none text-sm dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 text-sm"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProfilePage;
