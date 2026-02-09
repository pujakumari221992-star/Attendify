import React, { useState, useMemo } from 'react';
import { Staff, AttendanceRecord, AttendanceStatus } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { useToast } from '../hooks/useToast';

const SalaryScreen: React.FC<{ staffList: Staff[], records: AttendanceRecord[] }> = ({ staffList, records }) => {
  const { t, locale } = useAppContext();
  const { showToast } = useToast();
  const [viewDate, setViewDate] = useState(new Date());

  const handleDateChange = (increment: number) => {
    setViewDate(current => {
      const newDate = new Date(current);
      newDate.setMonth(newDate.getMonth() + increment);
      return newDate;
    });
  };

  const staffSalaryData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return staffList.map(staff => {
      const perDaySalary = staff.monthlySalary / daysInMonth;
      const staffRecords = records.filter(r => r.staffId === staff.id && r.date.startsWith(monthStr));
      
      const absentDays = staffRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
      const halfDays = staffRecords.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
      const lateDays = staffRecords.filter(r => r.status === AttendanceStatus.LATE).length;
      
      const absenceDeduction = absentDays * perDaySalary;
      const halfDayDeduction = halfDays * perDaySalary * 0.5;
      const lateFine = lateDays * perDaySalary * 0.1; // 10% penalty
      
      const totalDeductions = absenceDeduction + halfDayDeduction + lateFine;
      const netPayable = staff.monthlySalary - totalDeductions;
      
      return {
        ...staff,
        netPayable,
        totalDeductions
      };
    });
  }, [viewDate, staffList, records]);
  
  const monthName = viewDate.toLocaleString(locale, { month: 'long' });
  
  if (staffList.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 screen-fade">
        <div className="w-32 h-32 bg-gray-50 dark:bg-slate-800 rounded-[44px] flex items-center justify-center mb-10 shadow-inner">
          <i className="fa-solid fa-file-invoice-dollar text-6xl text-gray-200 dark:text-slate-700"></i>
        </div>
        <h3 className="text-2xl font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{t('salary_no_data_title')}</h3>
        <p className="text-[10px] text-gray-300 dark:text-slate-600 font-bold mt-4 uppercase tracking-[4px] px-8 leading-relaxed">{t('salary_no_data_desc')}</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-slate-950 flex flex-col screen-fade">
      <header className="px-6 py-6 bg-white dark:bg-slate-900 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-3xl font-black text-gray-900 dark:text-slate-50 tracking-tight">{t('salary_title')}</h1>
      </header>
      <div className="px-6 pt-6">
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <button onClick={() => handleDateChange(-1)} className="w-10 h-10 flex items-center justify-center rounded-full press-effect text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"><i className="fa-solid fa-chevron-left"></i></button>
          <span className="font-black text-sm uppercase tracking-widest text-gray-800 dark:text-slate-200">{monthName} {viewDate.getFullYear()}</span>
          <button onClick={() => handleDateChange(1)} className="w-10 h-10 flex items-center justify-center rounded-full press-effect text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"><i className="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3 pb-tab-safe">
        {staffSalaryData.map(staff => (
          <div key={staff.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#136A73] to-[#0D9488] flex items-center justify-center text-white font-black text-lg shrink-0">
              {staff.avatar ? <img src={staff.avatar} className="w-full h-full object-cover rounded-2xl" /> : staff.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 dark:text-white">{staff.name}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{staff.role}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-teal-600 dark:text-teal-400 text-lg">₹{Math.round(staff.netPayable).toLocaleString('en-IN')}</p>
              <p className="text-xs text-red-500 font-bold">- ₹{Math.round(staff.totalDeductions).toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalaryScreen;
