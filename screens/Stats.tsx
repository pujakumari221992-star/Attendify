
import React, { useMemo, useState } from 'react';
import { Staff, AttendanceRecord, AttendanceStatus } from '../types';
import { AreaChart, Area, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAppContext } from '../hooks/useAppContext';
import { ATTENDANCE_COLORS, STATUS_TO_TRANSLATION_KEY } from '../constants';

const StatsScreen: React.FC<{
  staffList: Staff[], 
  records: AttendanceRecord[],
  onSelectStaff: (staff: Staff) => void,
}> = ({ staffList, records, onSelectStaff }) => {
  const { t, locale } = useAppContext();
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(staffList.length > 0 ? staffList[0].id : null);
  const [viewDate, setViewDate] = useState(new Date());

  const selectedStaff = useMemo(() => staffList.find(s => s.id === selectedStaffId), [staffList, selectedStaffId]);

  const statsData = useMemo(() => {
    if (!selectedStaff) return null;
    
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Filter records for the selected month
    const monthRecords = records.filter(r => r.staffId === selectedStaff.id && r.date.startsWith(monthStr));
    
    // STRICT COUNTING FOR GRAPHS
    const presentCount = monthRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absentCount = monthRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const lateCount = monthRecords.filter(r => r.status === AttendanceStatus.LATE).length;
    const halfDayCount = monthRecords.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
    // SICK LEAVE REMOVED from display

    // Working days calculation (includes late, half day as working)
    const workingDays = presentCount + lateCount + halfDayCount;
    
    // Salary Calculation
    const dailySalary = selectedStaff.monthlySalary / daysInMonth;
    const absentDeduction = absentCount * dailySalary;
    const halfDayDeduction = halfDayCount * (dailySalary / 2);
    // Late fine logic: 10% deduction for late
    const lateDeduction = lateCount * (dailySalary * 0.1); 

    const totalDeduction = absentDeduction + halfDayDeduction + lateDeduction;
    const finalSalary = selectedStaff.monthlySalary - totalDeduction;

    // A) PIE CHART: Distribution Percentages - Removed Sick Leave
    const distributionData = [
        { name: 'Present', value: presentCount, color: ATTENDANCE_COLORS[AttendanceStatus.PRESENT] },
        { name: 'Absent', value: absentCount, color: ATTENDANCE_COLORS[AttendanceStatus.ABSENT] },
        { name: 'Late', value: lateCount, color: ATTENDANCE_COLORS[AttendanceStatus.LATE] },
        { name: 'Half Day', value: halfDayCount, color: ATTENDANCE_COLORS[AttendanceStatus.HALF_DAY] },
    ].filter(d => d.value > 0);

    // B) BAR CHART: Absolute Totals - Removed Sick Leave
    const barData = [
        { name: 'Present', count: presentCount, fill: ATTENDANCE_COLORS[AttendanceStatus.PRESENT] },
        { name: 'Absent', count: absentCount, fill: ATTENDANCE_COLORS[AttendanceStatus.ABSENT] },
        { name: 'Late', count: lateCount, fill: ATTENDANCE_COLORS[AttendanceStatus.LATE] },
        { name: 'Half Day', count: halfDayCount, fill: ATTENDANCE_COLORS[AttendanceStatus.HALF_DAY] },
    ];

    return {
      workingDays,
      absentDays: absentCount,
      lateArrivals: lateCount,
      monthlySalary: selectedStaff.monthlySalary,
      dailySalary,
      totalDeduction,
      finalSalary,
      distributionData,
      barData
    };
  }, [selectedStaff, records, viewDate, t]);

  if (staffList.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 screen-fade">
        <div className="w-32 h-32 bg-gray-50 dark:bg-slate-800 rounded-[44px] flex items-center justify-center mb-10 shadow-inner">
            <i className="fa-solid fa-chart-line text-6xl text-gray-200 dark:text-slate-700"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-500">{t('stats_no_data_title')}</h3>
        <p className="text-sm text-gray-400 mt-2 px-8">{t('stats_no_data_desc')}</p>
      </div>
    );
  }
  
  const handleDateChange = (inc: number) => setViewDate(d => {
      const newDate = new Date(d);
      newDate.setMonth(d.getMonth() + inc);
      return newDate;
  });

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950 screen-fade">
       <header className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <button className="w-10 h-10 flex items-center justify-center"><i className="fa-solid fa-bars text-xl text-gray-500"></i></button>
        <select value={selectedStaffId || ''} onChange={(e) => setSelectedStaffId(e.target.value)} className="bg-transparent font-bold text-lg text-center outline-none dark:text-white">
          {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={() => selectedStaff && onSelectStaff(selectedStaff)} className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
          {selectedStaff?.name.charAt(0)}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-tab-safe">
        <div className="flex justify-between items-center">
            <button onClick={() => handleDateChange(-1)} className="w-10 h-10 flex items-center justify-center text-gray-400 press-effect"><i className="fa-solid fa-chevron-left"></i></button>
            <span className="font-bold text-gray-800 dark:text-white">{viewDate.toLocaleString(locale, { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => handleDateChange(1)} className="w-10 h-10 flex items-center justify-center text-gray-400 press-effect"><i className="fa-solid fa-chevron-right"></i></button>
        </div>

        {statsData && <>
            <div className="grid grid-cols-3 gap-4">
                <StatCard label={t('stats_working_days')} value={statsData.workingDays} />
                <StatCard label={t('stats_absent_days')} value={statsData.absentDays} />
                <StatCard label={t('stats_late_arrivals')} value={statsData.lateArrivals} />
            </div>

            {/* B) BAR CHART: Total Counts */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm">
                 <h3 className="font-bold text-sm text-gray-500 mb-4 uppercase tracking-wider">Monthly Totals</h3>
                 {statsData.barData.some(d => d.count > 0) ? (
                     <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statsData.barData}>
                                <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {statsData.barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                 ) : (
                    <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No attendance data yet</div>
                 )}
            </div>

            {/* A) PIE CHART: Distribution */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm">
                <h3 className="font-bold text-sm text-gray-500 mb-4 uppercase tracking-wider">Distribution</h3>
                {statsData.distributionData.length > 0 ? (
                    <div className="h-48 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statsData.distributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statsData.distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" iconSize={8} wrapperStyle={{fontSize: '10px'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data to display</div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm">
                <h3 className="font-bold text-sm text-gray-500 mb-4">{t('stats_salary_deductions')}</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-400">{t('stats_monthly_salary')}</p>
                        <p className="font-bold text-lg text-gray-800 dark:text-white">₹{statsData.monthlySalary.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">{t('stats_daily_salary')}</p>
                        <p className="font-bold text-lg text-gray-800 dark:text-white">₹{statsData.dailySalary.toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                    </div>
                </div>
                <div className="h-px bg-gray-100 dark:bg-slate-700 my-4"></div>
                 <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-xs text-red-500">{t('stats_total_deduction')}</p>
                        <p className="font-bold text-lg text-red-500">₹{statsData.totalDeduction.toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                    </div>
                    <div>
                        <p className="text-xs text-green-500">{t('stats_final_salary')}</p>
                        <p className="font-bold text-lg text-green-500">₹{statsData.finalSalary.toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                    </div>
                </div>
            </div>
        </>}
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: {label: string, value: number}) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl text-center shadow-sm">
        <p className="font-bold text-2xl text-gray-800 dark:text-white">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
    </div>
);

export default StatsScreen;
