
import React, { useMemo } from 'react';
import { Staff, AttendanceRecord, AttendanceStatus, StaffLog } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import AdManager from '../services/AdManager';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';

const DashboardScreen: React.FC<{
  staffList: Staff[];
  records: AttendanceRecord[];
  logs: StaffLog[];
  onViewAllStaff: () => void;
  onMarkAttendance: (staff: Staff, date: string, status: AttendanceStatus) => void;
}> = ({ staffList, records, logs, onViewAllStaff, onMarkAttendance }) => {
  const { t } = useAppContext();

  const todayStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.date === todayStr);
    const present = todayRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absent = todayRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const late = todayRecords.filter(r => r.status === AttendanceStatus.LATE).length;
    const leave = todayRecords.filter(r => r.status === AttendanceStatus.LEAVE).length;
    return { present, absent, late, leave, total: staffList.length };
  }, [records, staffList]);

  // Mini Chart Data (Last 5 days attendance)
  const chartData = useMemo(() => {
      const data = [];
      for(let i=4; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const count = records.filter(r => r.date === dateStr && r.status === AttendanceStatus.PRESENT).length;
          data.push({ day: d.toLocaleDateString('en-US', {weekday: 'narrow'}), count });
      }
      return data;
  }, [records]);

  const StatCard: React.FC<{label: string, value: number, icon: string, colorClass: string, iconColor: string}> = ({ label, value, icon, colorClass, iconColor }) => (
    <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex-1 min-w-[45%]">
      <div className="flex flex-col gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
          <i className={`fa-solid ${icon} text-sm ${iconColor}`}></i>
        </div>
        <div>
          <p className={`text-xl font-black text-gray-900 dark:text-white`}>{value}</p>
          <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
        </div>
      </div>
    </div>
  );
  
  const QuickActionButton: React.FC<{label: string, icon: string, onClick: () => void}> = ({label, icon, onClick}) => (
      <button onClick={onClick} className="flex flex-col items-center gap-2 p-2 press-effect group">
          <div className="w-14 h-14 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-slate-700 group-active:scale-95 transition-transform shadow-sm">
              <i className={`fa-solid ${icon} text-xl text-teal-600 dark:text-teal-400`}></i>
          </div>
          <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400 text-center leading-tight">{label}</span>
      </button>
  )

  const handleMarkWithAd = (staff: Staff, status: AttendanceStatus) => {
    AdManager.showInterstitial(() => onMarkAttendance(staff, new Date().toISOString().split('T')[0], status));
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-slate-950 flex flex-col screen-fade">
      <header className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-gray-50 dark:border-slate-800 z-10 flex items-center justify-between">
        <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-slate-50 tracking-tight">Admin Panel</h1>
            <p className="text-xs text-gray-400 font-bold">{new Date().toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long'})}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <i className="fa-solid fa-user-shield text-teal-600 dark:text-teal-400"></i>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-tab-safe">
        
        {/* Top Stats Grid */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
             <div className="bg-[#136A73] p-4 rounded-3xl text-white shadow-lg min-w-[140px] flex flex-col justify-between">
                 <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><i className="fa-solid fa-users text-sm"></i></div>
                 <div>
                     <p className="text-3xl font-black">{todayStats.total}</p>
                     <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Total Staff</p>
                 </div>
             </div>
             
             <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <p className="text-xs text-gray-400 font-bold uppercase">Present</p>
                    <p className="text-xl font-black text-green-500">{todayStats.present}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <p className="text-xs text-gray-400 font-bold uppercase">Absent</p>
                    <p className="text-xl font-black text-red-500">{todayStats.absent}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <p className="text-xs text-gray-400 font-bold uppercase">Late</p>
                    <p className="text-xl font-black text-orange-500">{todayStats.late}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <p className="text-xs text-gray-400 font-bold uppercase">Leave</p>
                    <p className="text-xl font-black text-gray-500">{todayStats.leave}</p>
                </div>
             </div>
        </div>

        {/* Quick Actions */}
        <div>
            <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h3>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 flex justify-between">
                <QuickActionButton label="Add Staff" icon="fa-user-plus" onClick={onViewAllStaff} />
                <QuickActionButton label="Attendance" icon="fa-clipboard-check" onClick={() => {}} /> 
                <QuickActionButton label="Reports" icon="fa-file-csv" onClick={() => {}} />
                <QuickActionButton label="Settings" icon="fa-sliders" onClick={() => {}} />
            </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="flex gap-4">
            <div className="flex-1 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Activity</h3>
                    <span className="text-[10px] bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md font-bold text-gray-500">Live</span>
                </div>
                <div className="space-y-4">
                    {logs.slice(0, 3).map((log, i) => (
                        <div key={i} className="flex gap-3 items-start">
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-teal-500 shrink-0"></div>
                            <div>
                                <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{log.staffName}</p>
                                <p className="text-[10px] text-gray-400 leading-tight">{log.description}</p>
                            </div>
                            <span className="ml-auto text-[9px] font-bold text-gray-300">
                                {new Date(log.timestamp?.seconds * 1000 || Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    ))}
                    {logs.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No activity today</p>}
                </div>
            </div>
            
            {/* Mini Stats Chart */}
            <div className="w-1/3 bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center">
                 <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Trend (5d)</p>
                 <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 4 ? '#136A73' : '#E2E8F0'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </div>

        {/* Mark Attendance Shortcut */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800 dark:text-white">Quick Mark</h2>
            <button onClick={onViewAllStaff} className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest press-effect">View All</button>
          </div>
          <div className="space-y-3">
            {staffList.slice(0, 3).map(staff => (
               <div key={staff.id} className="flex items-center bg-gray-50 dark:bg-slate-900/50 p-2.5 rounded-2xl">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-xs font-bold flex items-center justify-center mr-3 shrink-0">
                   {staff.name.charAt(0)}
                 </div>
                 <p className="flex-1 font-bold text-xs text-gray-800 dark:text-slate-200 truncate">{staff.name}</p>
                 <div className="flex gap-2">
                   <button onClick={() => handleMarkWithAd(staff, AttendanceStatus.PRESENT)} className="w-8 h-8 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center press-effect"><i className="fa-solid fa-check text-xs"></i></button>
                   <button onClick={() => handleMarkWithAd(staff, AttendanceStatus.ABSENT)} className="w-8 h-8 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center press-effect"><i className="fa-solid fa-xmark text-xs"></i></button>
                 </div>
               </div>
            ))}
            {staffList.length === 0 && <p className="text-center text-xs text-gray-400 py-4">{t('staff_welcome_desc')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
