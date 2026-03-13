import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, 
  CreditCard, Bell, Shield, LogOut,
  ChevronRight, Edit2, Camera, Check, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, isLoggedIn, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isLoggedIn) {
     window.location.href = '/login';
     return null;
  }

  const startEditing = () => {
    setEditData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '+91 98765 43210',
      location: user.location || 'Raisen, Madhya Pradesh',
    });
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveSuccess(false);
  };

  const saveProfile = () => {
    updateUser({
      name: editData.name,
      email: editData.email,
      phone: editData.phone,
      location: editData.location,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const profileSections = [
    { id: 'profile', name: 'Profile Info', icon: <User size={20} /> },
    { id: 'address', name: 'Saved Addresses', icon: <MapPin size={20} /> },
    { id: 'payment', name: 'Payments', icon: <CreditCard size={20} /> },
    { id: 'notification', name: 'Notifications', icon: <Bell size={20} /> },
    { id: 'security', name: 'Security', icon: <Shield size={20} /> },
  ];

  const profileFields = [
    { key: 'name', label: 'Full Name', icon: <User size={18} className="text-primary" />, type: 'text' },
    { key: 'email', label: 'Email Address', icon: <Mail size={18} className="text-primary" />, type: 'email' },
    { key: 'phone', label: 'Phone Number', icon: <Phone size={18} className="text-primary" />, type: 'tel' },
    { key: 'location', label: 'Location', icon: <MapPin size={18} className="text-primary" />, type: 'text' },
  ];

  const getDisplayValue = (key) => {
    if (key === 'phone') return user.phone || '+91 98765 43210';
    if (key === 'location') return user.location || 'Raisen, Madhya Pradesh';
    return user[key] || '';
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:flex-row gap-8"
        >
          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-black/5 dark:border-white/10 shadow-xl overflow-hidden">
              <div className="flex flex-col items-center text-center mb-10">
                <div className="relative mb-4 group">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl">
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform group-hover:bg-primary-dark">
                    <Camera size={14} />
                  </button>
                </div>
                <h2 className="text-2xl font-title font-bold text-title dark:text-white leading-tight">{user.name}</h2>
                <p className="text-sm text-text/60 dark:text-white/60 mb-2">{user.email}</p>
              </div>

              <div className="space-y-2">
                {profileSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                      activeTab === section.id
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'text-text dark:text-white/70 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <span className="font-bold text-sm">{section.name}</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>

              <div className="mt-10 pt-6 border-t border-black/5 dark:border-white/10">
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-bold text-sm"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:w-2/3">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 lg:p-12 border border-black/5 dark:border-white/10 shadow-xl min-h-[600px]">
              {activeTab === 'profile' && (
                <div className="space-y-10">
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-title font-bold text-title dark:text-white">Profile Settings</h2>
                    <div className="flex items-center gap-3">
                      <AnimatePresence>
                        {saveSuccess && (
                          <motion.span
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="text-green-500 text-sm font-bold flex items-center gap-1"
                          >
                            <Check size={16} /> Saved!
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={cancelEditing}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 text-text dark:text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                          <button
                            onClick={saveProfile}
                            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
                          >
                            <Check size={16} />
                            Save Changes
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={startEditing}
                          className="flex items-center gap-2 bg-primary/10 text-primary px-6 py-2.5 rounded-full font-bold text-sm hover:bg-primary/20 transition-colors"
                        >
                          <Edit2 size={16} />
                          Edit Profile
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {profileFields.map((field) => (
                      <motion.div key={field.key} variants={itemVariants} className="space-y-2">
                        <label className="text-sm font-bold text-text/40 dark:text-white/40 block ml-2">{field.label}</label>
                        {isEditing ? (
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                              {field.icon}
                            </div>
                            <input
                              type={field.type}
                              name={field.key}
                              value={editData[field.key]}
                              onChange={handleEditChange}
                              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border-2 border-primary/30 focus:border-primary focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all text-sm dark:text-white"
                            />
                          </div>
                        ) : (
                          <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-black/5 dark:border-white/5 flex items-center gap-3 dark:text-white">
                            {field.icon}
                            <span>{getDisplayValue(field.key)}</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Account Summary Statistics */}
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 text-center">
                      <p className="text-3xl font-bold text-primary mb-1">12</p>
                      <p className="text-[10px] font-bold text-text/60 dark:text-white/60 uppercase tracking-wider">Total Orders</p>
                    </div>
                    <div className="bg-orange-500/5 p-6 rounded-3xl border border-orange-500/10 text-center">
                      <p className="text-3xl font-bold text-orange-600 mb-1">450</p>
                      <p className="text-[10px] font-bold text-text/60 dark:text-white/60 uppercase tracking-wider">Points</p>
                    </div>
                    <div className="bg-blue-500/5 p-6 rounded-3xl border border-blue-500/10 text-center">
                      <p className="text-3xl font-bold text-blue-600 mb-1">2</p>
                      <p className="text-[10px] font-bold text-text/60 dark:text-white/60 uppercase tracking-wider">Active Bookings</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'profile' && (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                    {profileSections.find(s => s.id === activeTab)?.icon}
                  </div>
                  <h3 className="text-2xl font-title font-bold text-title dark:text-white mb-2">
                    {profileSections.find(s => s.id === activeTab)?.name}
                  </h3>
                  <p className="text-text/60 dark:text-white/60 max-w-sm">
                    This section is currently under development. Soon you'll be able to manage your {profileSections.find(s => s.id === activeTab)?.name.toLowerCase()} here!
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
