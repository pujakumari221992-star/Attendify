
import React, { useMemo, useState } from 'react';
import { Staff } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';

const AdminScreen: React.FC<{allUsers: any[], staffList: Staff[]}> = ({ allUsers }) => {
  const { t, locale } = useAppContext();
  
  // Calculate mock revenue data based on user count (Simulation for Developer View)
  // In a real app, this would come from a payments collection
  const stats = useMemo(() => {
    const totalUsers = allUsers.length;
    // Simulate ~15% conversion rate for premium
    const premiumUsers = Math.floor(totalUsers * 0.15); 
    const estimatedRevenue = (premiumUsers * 500); // 500 per year assumption
    
    // Simulate source of income
    const sources = [
        { name: 'Yearly Plan', value: estimatedRevenue * 0.8 },
        { name: 'Monthly Plan', value: estimatedRevenue * 0.2 },
    ];

    return {
      totalUsers,
      premiumUsers,
      revenue: estimatedRevenue,
      sources
    };
  }, [allUsers]);

  const chartData = useMemo(() => {
    // Mock growth data based on total users
    const data = [];
    let currentUsers = Math.floor(stats.totalUsers * 0.5);
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const name = date.toLocaleString('default', { month: 'short' });
        // Add random growth
        currentUsers += Math.floor(Math.random() * 5); 
        data.push({ name, users: currentUsers, revenue: currentUsers * 50 }); // rough estimate
    }
    return data;
  }, [stats.totalUsers]);

  return (
    <div className="h-full bg-gray-50 dark:bg-slate-950 flex flex-col overflow-hidden screen-fade">
      <header className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <h1 className="font-black text-xl text-gray-900 dark:text-white tracking-tight">Developer Console</h1>
        <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center font-bold text-teal-700 dark:text-teal-400">
            <i className="fa-solid fa-code"></i>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-tab-safe">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Users</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalUsers}</p>
                <div className="mt-2 flex items-center text-xs font-bold text-green-500">
                    <i className="fa-solid fa-arrow-up mr-1"></i> 12%
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Est. Revenue</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">₹{stats.revenue.toLocaleString()}</p>
                 <div className="mt-2 flex items-center text-xs font-bold text-teal-500">
                    <i className="fa-solid fa-check-circle mr-1"></i> Active
                </div>
            </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 h-72">
            <div className="mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white">User Growth</h3>
                <p className="text-xs text-gray-400">New signups over last 6 months</p>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)', backgroundColor: '#1e293b', color: '#fff'}} 
                    labelStyle={{color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}}
                  />
                  <Area type="monotone" dataKey="users" stroke="#0F766E" strokeWidth={3} fill="url(#colorUsers)" />
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                </AreaChart>
            </ResponsiveContainer>
        </div>

        {/* Income Source Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 h-72">
             <div className="mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white">Income Source</h3>
                <p className="text-xs text-gray-400">Revenue split by plan type</p>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.sources} layout="vertical" margin={{left: 0, right: 30}}>
                    <XAxis type="number" hide />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff'}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                        <Cell fill="#0F766E" />
                        <Cell fill="#0D9488" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Recent Subscribers List */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Users</h3>
             <div className="space-y-4">
                 {allUsers.slice(0, 5).map((u, i) => (
                     <div key={i} className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-500">
                             {u.email?.charAt(0).toUpperCase()}
                         </div>
                         <div className="flex-1 min-w-0">
                             <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{u.fullName || 'User'}</p>
                             <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                         </div>
                         <span className="text-[9px] font-bold bg-green-100 text-green-600 px-2 py-1 rounded-md">Paid</span>
                     </div>
                 ))}
             </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;
