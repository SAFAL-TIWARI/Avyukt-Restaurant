import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShoppingBag, 
  IndianRupee, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  Download,
  Calendar
} from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import SalesChart from '../components/dashboard/SalesChart';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import RecentOrdersTable from '../components/dashboard/RecentOrdersTable';

const DashboardPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-12 px-4 md:px-8 bg-body dark:bg-zinc-950 min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 font-title">
              Business Overview
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Welcome back! Here's what's happening at Avyukt Restaurant today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              <Calendar size={18} />
              Last 30 Days
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary dark:bg-primary-dark text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="Total Revenue" 
            value="₹1,28,430" 
            icon={IndianRupee} 
            trend="up" 
            trendValue="12" 
            color="bg-maroon-600 shadow-maroon-100" // Note: Maroon is primary
          />
          <StatsCard 
            title="Total Orders" 
            value="432" 
            icon={ShoppingBag} 
            trend="up" 
            trendValue="8" 
            color="bg-amber-500 shadow-amber-100" 
          />
          <StatsCard 
            title="New Customers" 
            value="89" 
            icon={Users} 
            trend="down" 
            trendValue="3" 
            color="bg-emerald-500 shadow-emerald-100" 
          />
          <StatsCard 
            title="Avg. Table Time" 
            value="45 min" 
            icon={Clock} 
            color="bg-sky-500 shadow-sky-100" 
          />
        </div>

        {/* Charts & Table Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Revenue Analysis</h2>
              <select className="bg-transparent border-none text-sm font-medium text-zinc-500 focus:ring-0">
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <SalesChart />
          </div>

          {/* Pie Chart */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">Sales by Category</h2>
            <CategoryPieChart />
          </div>

          {/* Table */}
          <div className="lg:col-span-3 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Recent Orders</h2>
              <button className="text-primary dark:text-amber-500 text-sm font-semibold flex items-center gap-1 hover:underline">
                View all orders <ChevronRight size={16} />
              </button>
            </div>
            <RecentOrdersTable />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
