import React, { useState, useMemo } from 'react';
import { Staff, AttendanceRecord, AttendanceStatus, StaffLog } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { ATTENDANCE_COLORS, STATUS_TO_TRANSLATION_KEY } from '../constants';
import AdManager from '../services/AdManager';

const MarkAttendanceModal: React.FC<{
  staff: Staff;
  date: string;
  records: AttendanceRecord[];
  onClose: () => void;
  onMark: (staffId: string, date: string, status: AttendanceStatus | null) => void;
}> = ({ staff, date, records, onClose, onMark }) => {
    const { t } = useAppContext();
    const currentStatus = records.find(r => r.staffId === staff.id && r.date === date)?.status;

    const handleMark = (status: AttendanceStatus) => {
        if (status === currentStatus) return; // Prevent toggle to null
        AdManager.showInterstitial(() => {
            onMark(staff.id, date, status);
            onClose();
        });
    };

    const handleClear = () => {
         if (currentStatus === null || currentStatus === undefined) return;
         onMark(staff.id, date, null);
         onClose();
    };
    
    // REMOVED SICK_LEAVE & EARLY_EXIT
    const attendanceTypes: AttendanceStatus[] = [
        AttendanceStatus.PRESENT,
        AttendanceStatus.ABSENT,
        AttendanceStatus.HALF_DAY,
        AttendanceStatus.LEAVE,
        AttendanceStatus.LATE,
        AttendanceStatus.OVERTIME,
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-[500] flex items-end justify-center backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-full rounded-t-3xl p-6 space-y-4 animate-panel-in max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-2"></div>
                <h3 className="text-center font-bold text-lg">{staff.name}</h3>
                <p className="text-center text-sm text-gray-500 -mt-2">{date}</p>
                <div className="grid grid-cols-1 gap-3 pt-2">
                    {attendanceTypes.map(status => (
                        <button key={status} onClick={() => handleMark(status)}
                            className={`flex items-center gap-3 p-4 rounded-xl font-bold text-left transition-all press-effect ${currentStatus === status ? 'bg-[#0F766E] text-white ring-2 ring-offset-2 ring-[#0F766E] dark:ring-offset-slate-800' : 'bg-gray-100 dark:bg-slate-700'}`}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ATTENDANCE_COLORS[status] }}></div>
                            <span>{t(STATUS_TO_TRANSLATION_KEY[status])}</span>
                            {currentStatus === status && <i className="fa-solid fa-check ml-auto"></i>}
                        </button>
                    ))}
                    <button onClick={handleClear} className="flex items-center gap-3 p-4 rounded-xl font-bold text-left transition-all press-effect bg-gray-50 dark:bg-slate-700/50 text-gray-500">
                        <i className="fa-solid fa-ban"></i>
                        <span>{t('not_marked')}</span>
                    </button>
                </div>
                 <p className="text-xs text-center text-gray-400 pt-2">{t('changes_saved_auto')}</p>
            </div>
        </div>
    );
};

const StaffProfileScreen: React.FC<{
  staff: Staff;
  records: AttendanceRecord[];
  logs: StaffLog[];
  onClose: () => void;
  onMarkAttendance: (staffId: string, date: string, status: AttendanceStatus | null) => void;
  onUpdateNotes: (staffId: string, notes: string) => void;
  isPro: boolean;
}> = ({ staff, records, logs, onClose, onMarkAttendance, onUpdateNotes, isPro }) => {
  const [view, setView] = useState<'details' | 'calendar'>('details');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [notes, setNotes] = useState(staff.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const { t, locale, language } = useAppContext();

  const handleDateChange = (inc: number) => setCalendarDate(d => {
      const newDate = new Date(d);
      newDate.setMonth(d.getMonth() + inc);
      return newDate;
  });
  
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await onUpdateNotes(staff.id, notes);
    setIsSavingNotes(false);
  };

  const calendarData = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let i = 1; i <= daysInMonth; i++) grid.push(i);
    return { grid, monthName: calendarDate.toLocaleString(locale, { month: 'long' }), year };
  }, [calendarDate, locale]);

  const getStatusForDay = (day: number | null): AttendanceStatus | undefined => {
      if (!day) return undefined;
      const dateStr = `${calendarDate.getFullYear()}-${(calendarDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      return records.find((r: AttendanceRecord) => r.staffId === staff.id && r.date === dateStr)?.status;
  }

  const profileStats = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Filter records specifically for the viewed month to ensure stats are accurate
    const monthRecords = records.filter((r: AttendanceRecord) => r.staffId === staff.id && r.date.startsWith(monthStr));
    
    const lateArrivals = monthRecords.filter((r: AttendanceRecord) => r.status === AttendanceStatus.LATE).length;
    const productivityLoss = (lateArrivals * 0.5);
    const absentDays = monthRecords.filter((r: AttendanceRecord) => r.status === AttendanceStatus.ABSENT).length;
    
    // Calculate salary based on the specific month's days
    const dailySalary = staff.monthlySalary / daysInMonth; 
    
    const totalDeduction = (absentDays * dailySalary) + (monthRecords.filter((r:AttendanceRecord) => r.status === AttendanceStatus.HALF_DAY).length * dailySalary / 2);
    const finalSalary = Math.max(0, staff.monthlySalary - totalDeduction);
    
    return { lateArrivals, productivityLoss, totalDeduction, finalSalary };
  }, [staff, records, calendarDate]);


  return (
    <div className="h-full bg-gray-50 dark:bg-slate-950 flex flex-col screen-fade">
       <header className="p-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center"><i className="fa-solid fa-arrow-left text-lg"></i></button>
        <h1 className="font-bold text-lg text-gray-800 dark:text-white">{staff.name}</h1>
        <button className="w-10 h-10 flex items-center justify-center"><i className="fa-solid fa-ellipsis-v text-lg text-gray-500"></i></button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-action-safe">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-teal-500 text-white font-bold text-2xl flex items-center justify-center">
                {staff.avatar ? <img src={staff.avatar} className="w-full h-full object-cover rounded-full"/> : staff.name.split(' ').map((n:string)=>n[0]).join('')}
            </div>
            <div>
                <h2 className="font-bold text-xl text-gray-800 dark:text-white">{staff.name}</h2>
                <p className="text-sm text-gray-500">{staff.role} • {staff.shift}</p>
            </div>
        </div>

        {/* CALENDAR VIEW */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => handleDateChange(-1)} className="w-8 h-8 flex items-center justify-center text-gray-400"><i className="fa-solid fa-chevron-left"></i></button>
                <span className="font-bold text-gray-800 dark:text-white text-sm">{calendarData.monthName} {calendarData.year}</span>
                <button onClick={() => handleDateChange(1)} className="w-8 h-8 flex items-center justify-center text-gray-400"><i className="fa-solid fa-chevron-right"></i></button>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-gray-400 font-bold">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                {calendarData.grid.map((day, i) => {
                    const status = getStatusForDay(day);
                    const dateStr = day ? `${calendarData.year}-${(calendarDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` : null;
                    return (
                        <button key={i} disabled={!day} onClick={() => dateStr && setSelectedDate(dateStr)} className="h-10 flex items-center justify-center rounded-full relative press-effect">
                            {day && <span className="z-10">{day}</span>}
                            {status && <div className="absolute inset-0.5 rounded-full z-0" style={{backgroundColor: `${ATTENDANCE_COLORS[status]}30`, border: `2px solid ${ATTENDANCE_COLORS[status]}`}}></div>}
                        </button>
                    )
                })}
            </div>
        </div>
        
        {/* INSIGHT & DEDUCTIONS */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-start gap-4">
            <i className="fa-solid fa-chart-line text-teal-500 mt-1"></i>
            <div>
                <h4 className="font-bold text-gray-800 dark:text-white">{t('stats_monthly_insight')}</h4>
                <p className="text-sm text-gray-500 mt-1">{t('stats_insight_desc', {late: profileStats.lateArrivals, early: 0, loss: profileStats.productivityLoss})}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-sm text-gray-500 mb-4 uppercase tracking-wider">{t('stats_salary_deductions')}</h3>
            <div className="flex justify-between items-center text-red-500">
                <p className="font-bold">{t('stats_total_deduction')}</p>
                <p className="font-bold text-lg">₹ {profileStats.totalDeduction.toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
            </div>
            <div className="bg-gray-100 dark:bg-slate-700 mt-4 p-4 rounded-xl flex justify-between items-center">
                <p className="text-sm text-gray-800 dark:text-slate-200 font-bold">{t('stats_final_salary')}</p>
                <p className="font-bold text-xl text-teal-600 dark:text-teal-400">₹ {profileStats.finalSalary.toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
            </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-sm text-gray-500 mb-3 uppercase tracking-wider">{t('staff_notes_title')}</h3>
            <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('staff_notes_placeholder')}
            className="w-full h-32 bg-gray-50 dark:bg-slate-700 rounded-xl p-4 text-sm font-medium border-2 border-transparent focus:border-teal-500 outline-none resize-none dark:text-white"
            />
            <button 
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="w-full mt-3 py-3 bg-[#0F766E] text-white rounded-xl font-bold text-xs uppercase tracking-widest press-effect shadow-md shadow-teal-900/10 disabled:bg-gray-400 dark:disabled:bg-slate-600">
                {isSavingNotes ? <i className="fa-solid fa-spinner animate-spin"></i> : t('staff_notes_save')}
            </button>
        </div>
      </div>
      
      {selectedDate && <MarkAttendanceModal staff={staff} date={selectedDate} records={records} onClose={() => setSelectedDate(null)} onMark={onMarkAttendance} />}
    </div>
  );
};

export default StaffProfileScreen;