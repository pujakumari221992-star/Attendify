
import React, { useState, useMemo, useEffect } from 'react';
import { Staff, AttendanceRecord, AttendanceStatus } from '../types';
import { ATTENDANCE_COLORS, STATUS_TO_TRANSLATION_KEY } from '../constants';
import { useAppContext } from '../hooks/useAppContext';
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
        AdManager.showInterstitial(() => {
            if (status === currentStatus) {
                // Toggle OFF if clicked again
                onMark(staff.id, date, null);
            } else {
                // Set New Status
                onMark(staff.id, date, status);
            }
            onClose();
        });
    };

    const handleClear = () => {
         if (currentStatus === null || currentStatus === undefined) return;
         onMark(staff.id, date, null);
         onClose();
    };
    
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
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ATTENDANCE_COLORS[status] || '#ccc' }}></div>
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


const ScheduleScreen: React.FC<{
  staffList: Staff[], 
  records: AttendanceRecord[], 
  onMarkAttendance: (staffId: string, date: string, status: AttendanceStatus | null) => void,
  initialTargetStaffId?: string | null,
  onClearTarget?: () => void
}> = ({ staffList, records, onMarkAttendance, initialTargetStaffId, onClearTarget }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const { t, language } = useAppContext();

  // Auto-open modal if initialTargetStaffId is provided
  useEffect(() => {
    if (initialTargetStaffId) {
        const staff = staffList.find(s => s.id === initialTargetStaffId);
        if (staff) {
            setSelectedStaff(staff);
            // We consume the target, so clear it to prevent re-opening if we change dates
            if (onClearTarget) onClearTarget();
        }
    }
  }, [initialTargetStaffId, staffList, onClearTarget]);

  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let i = 1; i <= daysInMonth; i++) grid.push(i);
    const locale = language === 'hi' ? 'hi-IN' : language;
    return { grid, monthName: viewDate.toLocaleString(locale, { month: 'long' }), year };
  }, [viewDate, language]);

  const dayHeaders = useMemo(() => {
    const days = [];
    const locale = language === 'hi' ? 'hi-IN' : language;
    for (let i = 7; i <= 13; i++) {
        days.push(new Date(2024, 0, i).toLocaleString(locale, { weekday: 'short' }));
    }
    return days;
  }, [language]);

  const getDayRecordCount = (day: number | null) => {
    if (!day) return 0;
    const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return records.filter(r => (r.date === dateStr && (r.status === AttendanceStatus.PRESENT))).length;
  };
  
  const selectedDateRecords = useMemo(() => 
    records.filter(r => r.date === selectedDate),
  [records, selectedDate]);

  return (
    <div className="h-full bg-white dark:bg-slate-900 flex flex-col screen-fade">
      <header className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="w-10 h-10 flex items-center justify-center text-gray-500 rounded-full press-effect"><i className="fa-solid fa-chevron-left"></i></button>
        <h2 className="font-bold text-lg text-gray-800 dark:text-white">{calendarData.monthName} {calendarData.year}</h2>
        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="w-10 h-10 flex items-center justify-center text-gray-500 rounded-full press-effect"><i className="fa-solid fa-chevron-right"></i></button>
      </header>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-y-2">
          {dayHeaders.map((d, i) => <div key={i} className="text-xs font-bold text-gray-400 text-center">{d}</div>)}
          {calendarData.grid.map((d, i) => {
            const isSelected = d && selectedDate === `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const presentCount = getDayRecordCount(d);
            return (
              <button 
                key={i} 
                disabled={!d}
                onClick={() => d && setSelectedDate(`${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`)}
                className={`h-12 flex flex-col items-center justify-center rounded-xl relative transition-all press-effect ${d ? '' : 'opacity-0'}`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isSelected ? 'bg-[#0F766E] text-white font-bold' : 'text-gray-700 dark:text-slate-300'}`}>{d}</div>
                {presentCount > 0 && <div className="w-1 h-1 rounded-full bg-green-500 mt-1"></div>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 bg-gray-50 dark:bg-slate-950 rounded-t-3xl p-6 overflow-y-auto no-scrollbar pb-tab-safe">
        <h3 className="font-bold mb-4">{t('attendance_for_date', {date: new Date(selectedDate + 'T00:00:00').toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' })})}</h3>
        <div className="space-y-3">
          {staffList.map(staff => {
            const record = selectedDateRecords.find(r => r.staffId === staff.id);
            const status = record?.status;
            return (
              <div key={staff.id} onClick={() => setSelectedStaff(staff)} className="flex items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm press-effect border border-gray-100 dark:border-transparent">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center font-bold text-gray-500 dark:text-slate-300 mr-3 shrink-0 relative">
                    {staff.avatar ? <img src={staff.avatar} className="w-full h-full object-cover rounded-full" /> : staff.name.charAt(0)}
                    {status && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800" style={{backgroundColor: ATTENDANCE_COLORS[status]}}></div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 dark:text-slate-200 truncate">{staff.name}</p>
                  <p className="text-xs text-gray-500 truncate">{staff.role}</p>
                </div>
                <div className="flex items-center gap-2 text-sm shrink-0">
                  {status ? (
                     <>
                      <span className="font-semibold text-xs" style={{color: ATTENDANCE_COLORS[status] || '#999'}}>{t(STATUS_TO_TRANSLATION_KEY[status])}</span>
                      {record?.checkInTime && <span className="text-xs text-gray-400">({record.checkInTime})</span>}
                     </>
                  ) : (
                    <span className="text-xs font-bold text-gray-400">{t('not_marked')}</span>
                  )}
                  <i className="fa-solid fa-chevron-right text-xs text-gray-300 ml-2"></i>
                </div>
              </div>
            )
          })}
           {staffList.length === 0 && <p className="text-center text-sm text-gray-400 py-10">{t('staff_welcome_desc')}</p>}
        </div>
      </div>
      
      {selectedStaff && <MarkAttendanceModal staff={selectedStaff} date={selectedDate} records={records} onClose={() => setSelectedStaff(null)} onMark={onMarkAttendance} />}
    </div>
  );
};

export default ScheduleScreen;
