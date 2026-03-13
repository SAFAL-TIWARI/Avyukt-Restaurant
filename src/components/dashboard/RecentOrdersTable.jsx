import React from 'react';

const orders = [
  { id: '#ORD-001', customer: 'John Doe', item: 'Butter Chicken Thali', amount: '₹350', status: 'Delivered' },
  { id: '#ORD-002', customer: 'Sarah Smith', item: 'Paneer Tikka', amount: '₹220', status: 'Processing' },
  { id: '#ORD-003', customer: 'Rahul Kumar', item: 'Mango Lassi', amount: '₹80', status: 'Cancelled' },
  { id: '#ORD-004', customer: 'Priya Raj', item: 'Dal Makhani', amount: '₹180', status: 'Delivered' },
  { id: '#ORD-005', customer: 'Amit Singh', item: 'Chicken Biryani', amount: '₹280', status: 'Delivered' },
];

const RecentOrdersTable = () => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-zinc-100 dark:border-zinc-800">
            <th className="pb-3 font-semibold text-zinc-500 dark:text-zinc-400 text-sm">Order ID</th>
            <th className="pb-3 font-semibold text-zinc-500 dark:text-zinc-400 text-sm">Customer</th>
            <th className="pb-3 font-semibold text-zinc-500 dark:text-zinc-400 text-sm">Item</th>
            <th className="pb-3 font-semibold text-zinc-500 dark:text-zinc-400 text-sm">Amount</th>
            <th className="pb-3 font-semibold text-zinc-500 dark:text-zinc-400 text-sm">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {orders.map((order) => (
            <tr key={order.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <td className="py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">{order.id}</td>
              <td className="py-4 text-sm text-zinc-600 dark:text-zinc-400">{order.customer}</td>
              <td className="py-4 text-sm text-zinc-600 dark:text-zinc-400">{order.item}</td>
              <td className="py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{order.amount}</td>
              <td className="py-4">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentOrdersTable;
