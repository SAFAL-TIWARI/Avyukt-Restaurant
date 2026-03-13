import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Calendar, Clock, 
  ChevronRight, ArrowRight, Package,
  CheckCircle2, Clock3, Truck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState('active');

  const orders = {
    active: [
      {
        id: 'ORD-2024-8892',
        date: 'Today, 12:45 PM',
        status: 'Preparing',
        itemsCount: 3,
        total: 840,
        items: ['Paneer Tikka', 'Butter Naan', 'Dal Makhani'],
        icon: <Clock3 className="text-orange-500" />,
        color: 'bg-orange-500/10 border-orange-500/20'
      },
      {
        id: 'ORD-2024-8890',
        date: 'Today, 12:30 PM',
        status: 'On the way',
        itemsCount: 1,
        total: 320,
        items: ['Margarita Pizza'],
        icon: <Truck className="text-blue-500" />,
        color: 'bg-blue-500/10 border-blue-500/20'
      }
    ],
    past: [
      {
        id: 'ORD-2024-8875',
        date: '10 Mar 2024, 08:30 PM',
        status: 'Delivered',
        itemsCount: 2,
        total: 560,
        items: ['Veg Burger', 'French Fries'],
        icon: <CheckCircle2 className="text-green-500" />,
        color: 'bg-green-500/10 border-green-500/20'
      },
      {
        id: 'ORD-2024-8850',
        date: '08 Mar 2024, 07:15 PM',
        status: 'Delivered',
        itemsCount: 4,
        total: 1240,
        items: ['Full Tandoori Chicken', 'Rumali Roti x4', 'Coke 1L'],
        icon: <CheckCircle2 className="text-green-500" />,
        color: 'bg-green-500/10 border-green-500/20'
      }
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-title font-bold text-title dark:text-white mb-2">My Orders</h1>
            <p className="text-text/60 dark:text-white/60">Check the status of your current and past orders</p>
          </div>
          
          <Link
            to="/menu"
            className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all"
          >
            Order Something New
            <ArrowRight size={20} />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/10 mb-8 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'active' 
                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                : 'text-text dark:text-white/60 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            Active Orders ({orders.active.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'past' 
                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                : 'text-text dark:text-white/60 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            Past Orders ({orders.past.length})
          </button>
        </div>

        {/* Orders List */}
        <motion.div
          key={activeTab}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence mode="wait">
            {orders[activeTab].length > 0 ? (
              orders[activeTab].map((order) => (
                <motion.div
                  key={order.id}
                  variants={itemVariants}
                  className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-4 rounded-2xl ${order.color}`}>
                        {order.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-title dark:text-white">{order.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'Delivered' ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text/40 dark:text-white/40">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {order.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Package size={12} />
                            {order.itemsCount} Items
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">₹{order.total}</p>
                      <button className="text-xs font-bold text-text/40 dark:text-white/40 hover:text-primary transition-colors flex items-center gap-1 ml-auto mt-1">
                        View Details
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {order.items.map((item, idx) => (
                      <span key={idx} className="px-4 py-2 bg-gray-50 dark:bg-zinc-800/50 rounded-xl text-xs text-text/60 dark:text-white/60 border border-black/5 dark:border-white/5">
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    {activeTab === 'active' ? (
                      <>
                        <button className="flex-grow bg-primary text-white py-4 rounded-2xl font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                          Track Order
                        </button>
                        <button className="px-6 py-4 bg-gray-100 dark:bg-zinc-800 text-text dark:text-white rounded-2xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="w-full bg-primary/10 text-primary py-4 rounded-2xl font-bold text-sm hover:bg-primary/20 transition-all">
                        Reorder Items
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
                  <ShoppingBag size={40} />
                </div>
                <h3 className="text-2xl font-title font-bold text-title dark:text-white mb-2">No orders yet</h3>
                <p className="text-text/60 dark:text-white/60 mb-8 max-w-sm mx-auto">
                  When you place an order, it will appear here. Start exploring our menu!
                </p>
                <Link
                  to="/menu"
                  className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-all"
                >
                  Go to Menu
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default OrdersPage;
