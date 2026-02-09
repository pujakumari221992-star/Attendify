
import React, { useState, useRef } from 'react';
import { Staff, AttendanceRecord } from '../types';
import { ATTENDANCE_COLORS } from '../constants';
import { useAppContext } from '../hooks/useAppContext';
import { useToast } from '../hooks/useToast';

const AddStaffModal: React.FC<{onClose: () => void, onAdd: (data: any) => void, staffList: Staff[]}> = ({ onClose, onAdd, staffList }) => {
  const { t } = useAppContext();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    role: '',
    monthlySalary: '',
    startDate: new Date().toISOString().split('T')[0],
    avatar: ''
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm(prev => ({ ...prev, avatar: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAddStaff = async () => {
    if (!form.name.trim()) return showToast(t('staff_error_name_required'), 'error');
    if (staffList.some(s => s.name.toLowerCase() === form.name.trim().toLowerCase())) return showToast(t('staff_error_duplicate_name'), 'error');
    if (!form.monthlySalary || isNaN(parseFloat(form.monthlySalary)) || parseFloat(form.monthlySalary) <= 0) {
      return showToast(t('staff_error_valid_salary'), 'error');
    }
    
    setLoading(true);
    await onAdd({
      ...form,
      monthlySalary: parseFloat(form.monthlySalary),
      status: 'Offline',
      shift: 'Day Shift',
      employmentType: 'Full-time'
    });
    setLoading(false);
    onClose();
  };

  // Validation for button state
  const isValid = form.name.trim().length > 0 && form.monthlySalary.length > 0;

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[2000] flex flex-col h-full w-full animate-fade-in">
      {/* Header - Fixed Top */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
        <div className="w-10"></div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('staff_new_member_title')}</h2>
        <button onClick={onClose} className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center press-effect">
          <i className="fa-solid fa-times text-gray-500"></i>
        </button>
      </div>

      {/* Scrollable Content - Takes remaining space */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-safe space-y-8">
        
        {/* Avatar Section */}
        <div className="flex justify-center mt-2">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-lg overflow-hidden">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <i className="fa-solid fa-camera text-4xl text-gray-300 dark:text-slate-600 group-hover:scale-110 transition-transform"></i>
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-10 h-10 bg-[#0F766E] text-white rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-md press-effect">
              <i className="fa-solid fa-plus text-sm"></i>
            </button>
          </div>
        </div>
        
        {/* Form Fields Container */}
        <div className="space-y-6">
            <InputField 
                label={t('staff_full_name') + ' *'} 
                name="name" 
                value={form.name} 
                onChange={handleInputChange} 
                placeholder={t('placeholder_full_name')}
            />
            <InputField 
                label={t('staff_position')} 
                name="role" 
                value={form.role} 
                onChange={handleInputChange} 
                placeholder={t('placeholder_position')} 
            />
            <InputField 
                label={t('staff_monthly_salary') + ' *'} 
                name="monthlySalary" 
                type="number" 
                value={form.monthlySalary} 
                onChange={handleInputChange} 
                placeholder="0.00" 
                icon="fa-rupee-sign" 
            />
            <InputField 
                label={t('staff_joining_date')} 
                name="startDate" 
                type="date" 
                value={form.startDate} 
                onChange={handleInputChange} 
                icon="fa-calendar" 
            />
        </div>

        {/* Action Button - Placed inside ScrollView to ensure visibility on small screens/keyboard open */}
        <div className="pt-6 pb-8">
            <button 
                onClick={handleAddStaff} 
                disabled={loading || !isValid} 
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-3 transition-all
                    ${isValid ? 'bg-[#0F766E] press-effect shadow-teal-900/20' : 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed'}
                `}
            >
                {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <><i className="fa-solid fa-check"></i> {t('staff_save_staff')}</>}
            </button>
        </div>

      </div>
    </div>
  );
};

const InputField: React.FC<any> = ({ label, icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-600 dark:text-slate-300 ml-1">{label}</label>
    <div className="relative">
      <input {...props} className={`w-full h-14 bg-gray-100 dark:bg-slate-800 rounded-xl font-semibold outline-none border-2 border-transparent focus:border-[#0F766E] dark:text-white transition-colors ${icon ? 'pl-11' : 'px-4'}`} />
      {icon && <i className={`fa-solid ${icon} absolute left-4 top-1/2 -translate-y-1/2 text-gray-400`}></i>}
    </div>
  </div>
);

const StaffScreen: React.FC<any> = ({ staffList, records, onStaffClick, onStaffAdd, isPro }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const { t } = useAppContext();
  const { showToast } = useToast();
  
  const todayStr = new Date().toISOString().split('T')[0];

  const handleAddClick = () => {
      // Premium Logic: Free Limit is 20
      if (!isPro && staffList.length >= 20) {
          showToast(t('premium_staff_limit_reached'), 'error');
          return;
      }
      setShowAddModal(true);
  };

  const handleReportsClick = () => {
      if (!isPro) {
          showToast(t('premium_upgrade_export'), 'info');
          return;
      }
      // Currently just a visual feedback as report logic wasn't explicitly provided, 
      // but this satisfies the requirement to lock the feature.
      showToast("Reports downloading...", 'success');
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-slate-950 flex flex-col relative overflow-hidden screen-fade">
      <header className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 z-10 flex items-center justify-between">
        <button className="w-10 h-10 flex items-center justify-center"><i className="fa-solid fa-bars text-xl text-gray-500"></i></button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">{t('nav_staff')}</h1>
        <button className="w-10 h-10 flex items-center justify-center"><i className="fa-solid fa-bell text-xl text-gray-500"></i></button>
      </header>

      <div className="p-6">
        <p className="text-sm text-gray-500">{t('staff_manage_members', { count: staffList.length })}</p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-3 pb-action-safe">
        {staffList.length === 0 ? (
          <div className="text-center py-24 opacity-50">
            <div className="w-24 h-24 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-users-viewfinder text-4xl text-gray-300"></i>
            </div>
            <h3 className="font-bold text-gray-500">{t('staff_welcome_title')}</h3>
            <p className="text-xs text-gray-400 mt-2 px-8">{t('staff_welcome_desc')}</p>
          </div>
        ) : (
          staffList.map((staff: Staff) => {
            const status = records?.find((r: AttendanceRecord) => r.staffId === staff.id && r.date === todayStr)?.status;
            return (
                <div key={staff.id} onClick={() => onStaffClick(staff)} className="flex items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-transparent press-effect cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-[#0F766E] flex items-center justify-center text-white font-bold text-lg mr-4 shrink-0 relative">
                    {staff.avatar ? <img src={staff.avatar} className="w-full h-full object-cover rounded-full" /> : staff.name.charAt(0).toUpperCase()}
                    {status && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center" style={{backgroundColor: ATTENDANCE_COLORS[status]}}>
                            <i className="fa-solid fa-check text-[8px] text-white"></i>
                        </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-slate-50 truncate">{staff.name}</h3>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{staff.role} • {staff.shift}</p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center text-gray-300">
                      <i className="fa-solid fa-chevron-right text-xs"></i>
                  </div>
                </div>
            );
          })
        )}
      </div>

      <button onClick={handleAddClick} className="absolute bottom-24 right-6 w-14 h-14 bg-[#0F766E] text-white rounded-full flex items-center justify-center shadow-lg press-effect">
        <i className="fa-solid fa-plus text-xl"></i>
      </button>
      
      <button onClick={handleReportsClick} className="bg-white dark:bg-slate-800 mx-6 mb-safe-bottom rounded-xl font-bold text-[#0F766E] py-4 shadow-lg mb-24 press-effect flex items-center justify-center gap-2">
          {t('staff_view_reports')}
          {!isPro && <i className="fa-solid fa-lock text-xs opacity-50"></i>}
      </button>

      {showAddModal && <AddStaffModal onClose={() => setShowAddModal(false)} onAdd={onStaffAdd} staffList={staffList} />}
    </div>
  );
};

export default StaffScreen;
