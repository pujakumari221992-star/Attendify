import React, { useState, useEffect } from 'react';
import { Staff, Subscription, StaffLog, LogType, AttendanceStatus } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { LANGUAGES } from '../languages';
import { resetPassword, auth, addDoc, collection, serverTimestamp, db, setDoc, doc, getDoc } from '../firebase';
import { useToast } from '../hooks/useToast';
import PrivacyPolicyScreen from './PrivacyPolicy';
import { ATTENDANCE_COLORS, LOG_TYPE_TO_TRANSLATION_KEY } from '../constants';

const TimeLogModal: React.FC<{
  staffList: Staff[];
  onClose: () => void;
}> = ({ staffList, onClose }) => {
    const { t } = useAppContext();
    const { showToast } = useToast();
    const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [timeIn, setTimeIn] = useState('');
    const [timeOut, setTimeOut] = useState('');
    const [logType, setLogType] = useState<LogType>(LogType.LATE_ARRIVAL);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!selectedStaffId) return;
        setLoading(true);
        try {
            const staff = staffList.find(s => s.id === selectedStaffId);
            const userUid = auth.currentUser?.uid;
            
            await addDoc(collection(db, "logs"), {
                uid: userUid,
                staffId: selectedStaffId,
                staffName: staff?.name || 'Unknown',
                type: logType,
                status: null,
                date,
                timeIn,
                timeOut,
                timestamp: serverTimestamp(),
                description: `${t(LOG_TYPE_TO_TRANSLATION_KEY[logType])} - In: ${timeIn || '--'} Out: ${timeOut || '--'}`
            });

            showToast(t('log_success'), 'success');
            onClose();
        } catch (e) {
            showToast('Failed to save log', 'error');
        } finally {
            setLoading(false);
        }
    };

    const types = [LogType.EARLY_ARRIVAL, LogType.LATE_ARRIVAL, LogType.EARLY_EXIT, LogType.LATE_EXIT];

    return (
        <div className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-[90%] max-w-sm rounded-3xl p-6 space-y-4 animate-scale-in shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{t('log_entry_title')}</h3>
                    <button onClick={onClose} className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center"><i className="fa-solid fa-times text-gray-500"></i></button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('log_select_staff')}</label>
                        <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} className="w-full h-12 bg-gray-50 dark:bg-slate-700 rounded-xl px-4 font-semibold outline-none dark:text-white border border-gray-200 dark:border-slate-600">
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full h-12 bg-gray-50 dark:bg-slate-700 rounded-xl px-4 font-semibold outline-none dark:text-white border border-gray-200 dark:border-slate-600" />

                    <div className="flex gap-3">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-bold text-gray-500">{t('log_in_time')}</label>
                            <input type="time" value={timeIn} onChange={e => setTimeIn(e.target.value)} className="w-full h-12 bg-gray-50 dark:bg-slate-700 rounded-xl px-2 font-semibold outline-none dark:text-white border border-gray-200 dark:border-slate-600 text-center" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-bold text-gray-500">{t('log_out_time')}</label>
                            <input type="time" value={timeOut} onChange={e => setTimeOut(e.target.value)} className="w-full h-12 bg-gray-50 dark:bg-slate-700 rounded-xl px-2 font-semibold outline-none dark:text-white border border-gray-200 dark:border-slate-600 text-center" />
                        </div>
                    </div>

                    <div className="space-y-1">
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('log_select_type')}</label>
                         <div className="grid grid-cols-2 gap-2">
                             {types.map(type => (
                                 <button key={type} onClick={() => setLogType(type)} className={`py-3 rounded-xl text-xs font-bold transition-all ${logType === type ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                                     {t(LOG_TYPE_TO_TRANSLATION_KEY[type])}
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>

                <button onClick={handleSave} disabled={loading} className="w-full py-4 bg-[#0F766E] text-white rounded-xl font-bold mt-2 press-effect shadow-lg">
                    {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : t('save_log')}
                </button>
            </div>
        </div>
    );
};

const LivePaymentSettings: React.FC = () => {
    const { t } = useAppContext();
    const { showToast } = useToast();
    const [keyId, setKeyId] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchKey = async () => {
            const storedId = localStorage.getItem('razorpay_live_key_id');
            if (storedId) {
                setKeyId(storedId);
                setIsConfigured(true);
                return;
            }
            try {
                const configDoc = await getDoc(doc(db, "config", "razorpay"));
                if (configDoc.exists()) {
                    const key = configDoc.data().live_key_id;
                    if (key) {
                        setKeyId(key);
                        localStorage.setItem('razorpay_live_key_id', key);
                        setIsConfigured(true);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch global payment key", e);
            }
        };
        fetchKey();
    }, []);

    const handleSave = async () => {
        if (!keyId || !keyId.startsWith('rzp_live_')) return showToast('Please enter a valid Razorpay Live Key ID', 'error');
        
        setIsLoading(true);
        try {
            await setDoc(doc(db, "config", "razorpay"), { live_key_id: keyId });
            localStorage.setItem('razorpay_live_key_id', keyId);
            setIsConfigured(true);
            showToast('Razorpay LIVE Key ID saved successfully for all users', 'success');
        } catch(e) {
            console.error("Failed to save key to Firestore:", e);
            showToast('Failed to save key to the database. Check connection.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <i className="fa-solid fa-rocket text-green-500 text-lg"></i>
                   <h3 className="font-bold text-gray-800 dark:text-slate-200">Global Payment Gateway</h3>
                </div>
                {isConfigured ? (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider animate-scale-in">
                        <i className="fa-solid fa-check-circle mr-1"></i> ACTIVE
                    </span>
                ) : (
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                        <i className="fa-solid fa-triangle-exclamation mr-1"></i> Setup Required
                    </span>
                )}
            </div>
            
            <div className="space-y-3">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Razorpay Live Key ID</label>
                    <input type="text" value={keyId} onChange={e => setKeyId(e.target.value)} className="w-full h-12 bg-gray-50 dark:bg-slate-700 rounded-xl px-4 font-semibold outline-none dark:text-white border border-gray-200 dark:border-slate-600 text-sm" placeholder="rzp_live_..." />
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 ml-1">This key will be used for all payments across the app.</p>
                 </div>
                 
                 <button onClick={handleSave} disabled={isLoading} className="w-full py-3 bg-[#136A73] text-white rounded-xl font-bold text-xs uppercase tracking-widest press-effect shadow-md shadow-teal-900/10 disabled:bg-gray-400">
                     {isLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Save Global Key'}
                 </button>
            </div>
        </div>
    );
};


const ProfileScreen: React.FC<{
  onLogout: () => void;
  isAdmin: boolean;
  subscription: Subscription;
  userEmail: string;
  userName: string;
  onShowTerms: () => void;
  onShowSubscription: () => void;
  staffList: Staff[];
  allUsers: any[];
  logs: StaffLog[];
}> = ({ onLogout, isAdmin, subscription, userEmail, userName, onShowTerms, onShowSubscription, staffList, allUsers, logs }) => {
  const [showLangModal, setShowLangModal] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTimeLogs, setShowTimeLogs] = useState(false);
  const { t, theme, toggleTheme, language, setLanguage } = useAppContext();
  const { showToast } = useToast();
  
  const handleResetPassword = async () => {
    try {
      await resetPassword(userEmail);
      showToast(t('profile_reset_link_sent'), 'success');
    } catch (e) {
      showToast(t('profile_reset_fail'), 'error');
    }
  };

  const NavItem: React.FC<{icon: string, label: string, value?: string, onClick?: () => void, hasToggle?: boolean, toggleState?: boolean}> = 
  ({ icon, label, value, onClick, hasToggle = false, toggleState = false }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 press-effect">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-center text-gray-400 text-lg"><i className={`fa-solid ${icon}`}></i></div>
        <span className="font-bold text-gray-800 dark:text-slate-200">{label}</span>
      </div>
      {hasToggle ? (
        <div className={`w-12 h-7 rounded-full p-1 transition-all ${toggleState ? 'bg-teal-500' : 'bg-gray-200 dark:bg-slate-700'}`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${toggleState ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-xs font-bold">{value}</span>
          <i className="fa-solid fa-chevron-right text-xs"></i>
        </div>
      )}
    </button>
  );
  
  // LOGS COMPONENT
  const RecentLogs = () => {
     const sortedLogs = [...logs].sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 10);
     if (sortedLogs.length === 0) return null;
     const getLogIcon = (type: LogType) => {
         switch(type) {
             case LogType.LATE_ARRIVAL: return 'fa-clock text-orange-500';
             case LogType.EARLY_EXIT: return 'fa-person-walking-arrow-right text-purple-500';
             case LogType.OVERTIME: return 'fa-briefcase text-blue-500';
             case LogType.LEAVE: return 'fa-umbrella-beach text-slate-500';
             case LogType.ATTENDANCE_CHANGE: return 'fa-pen-to-square text-teal-500';
             default: return 'fa-check-circle text-green-500';
         }
     }
     return (
         <div className="space-y-3">
             <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[3px] ml-4">{t('profile_activity_logs')}</h3>
             <div className="bg-white dark:bg-slate-800 rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-slate-700">
                 {sortedLogs.map((log, index) => {
                     const dateObj = log.timestamp ? new Date(log.timestamp.seconds * 1000) : new Date();
                     const timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                     const isToday = dateObj.toDateString() === new Date().toDateString();
                     return (
                         <div key={log.id} className="flex items-center gap-3 p-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0 animate-subtle-fade-in-up" style={{animationDelay: `${index * 50}ms`}}>
                             <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-700/50 flex items-center justify-center shrink-0">
                                 <i className={`fa-solid ${getLogIcon(log.type)}`}></i>
                             </div>
                             <div className="flex-1 min-w-0">
                                 <p className="font-bold text-sm text-gray-800 dark:text-white truncate">{log.staffName}</p>
                                 <p className="text-xs text-gray-500 truncate">{log.description}</p>
                             </div>
                             <div className="text-right shrink-0">
                                 <p className="text-[10px] font-bold text-gray-400">{isToday ? timeStr : dateObj.toLocaleDateString()}</p>
                                 {log.status && <div className="w-2 h-2 rounded-full ml-auto mt-1" style={{backgroundColor: ATTENDANCE_COLORS[log.status]}}></div>}
                             </div>
                         </div>
                     )
                 })}
             </div>
         </div>
     )
  }

  if (showPrivacy) {
    return <div className="absolute inset-0 z-[300] bg-white dark:bg-slate-900 screen-fade"><PrivacyPolicyScreen onBack={() => setShowPrivacy(false)} /></div>;
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-slate-950 flex flex-col screen-fade">
       <header className="px-6 py-6 bg-white dark:bg-slate-900 border-b border-gray-50 dark:border-slate-800 z-10">
        <h1 className="text-3xl font-black text-gray-900 dark:text-slate-50 tracking-tight">{t('nav_profile')}</h1>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-tab-safe">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-black">
            {userName ? userName.charAt(0) : userEmail.charAt(0)}
          </div>
          <div>
            <h2 className="font-black text-lg text-gray-900 dark:text-white">{userName || t('profile_default_user_name')}</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-bold truncate max-w-[200px]">{userEmail}</p>
          </div>
        </div>

        <div className="space-y-3">
             <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[3px] ml-4">{t('nav_schedule')}</h3>
             <NavItem icon="fa-user-clock" label={t('profile_lock_entry_log')} onClick={() => setShowTimeLogs(true)} />
        </div>

        <RecentLogs />

        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[3px] ml-4">{t('profile_account')}</h3>
          <NavItem icon="fa-crown" label={t('nav_pro')} value={t(subscription.plan === 'Pro' ? 'profile_pro_member' : 'profile_free_plan')} onClick={onShowSubscription} />
          {isAdmin && <LivePaymentSettings />}
        </div>
        
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[3px] ml-4">{t('profile_settings')}</h3>
          <NavItem icon="fa-language" label={t('profile_language')} value={language.toUpperCase()} onClick={() => setShowLangModal(true)} />
          <NavItem icon="fa-palette" label={t('profile_dark_mode')} onClick={toggleTheme} hasToggle={true} toggleState={theme === 'dark'} />
          <NavItem icon="fa-file-contract" label={t('profile_view_terms')} onClick={onShowTerms} />
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[3px] ml-4">{t('profile_support')}</h3>
          <NavItem icon="fa-circle-question" label={t('profile_help_center')} onClick={() => window.open('mailto:pujakumari221992@gmail.com', '_blank')} />
          <NavItem icon="fa-headset" label={t('profile_contact_us')} onClick={() => window.open('mailto:pujakumari221992@gmail.com', '_blank')} />
          <NavItem icon="fa-shield-halved" label={t('profile_privacy_policy')} onClick={() => setShowPrivacy(true)} />
        </div>
        
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[3px] ml-4">{t('profile_account_security')}</h3>
          <NavItem icon="fa-key" label={t('profile_update_password')} onClick={handleResetPassword} />
        </div>

        <button onClick={onLogout} className="w-full py-4 bg-white dark:bg-slate-800 text-red-500 rounded-2xl font-black text-sm uppercase tracking-widest press-effect shadow-sm border border-gray-100 dark:border-slate-700">
          {t('profile_logout')}
        </button>
      </div>

      {showLangModal && 
        <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-4 backdrop-blur-lg animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-6 space-y-4 animate-dialog-scale-in flex flex-col max-h-[90vh] shadow-2xl border border-white/5">
            <h2 className="text-xl font-black text-gray-900 dark:text-slate-50 text-center tracking-tight shrink-0">{t('profile_select_language')}</h2>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar pb-2">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => { setLanguage(lang.code); setShowLangModal(false); }} className={`w-full p-4 rounded-2xl font-bold text-left flex items-center justify-between transition-all press-effect ${language === lang.code ? 'bg-teal-500 text-white' : 'bg-gray-50 dark:bg-slate-800 dark:text-slate-300 hover:bg-gray-100'}`}>
                  <span>{lang.name}</span>
                  {language === lang.code && <i className="fa-solid fa-check-circle"></i>}
                </button>
              ))}
            </div>
            <button onClick={() => setShowLangModal(false)} className="w-full mt-2 py-4 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-[3px] press-effect shrink-0">{t('staff_cancel')}</button>
          </div>
        </div>
      }
      
      {showTimeLogs && <TimeLogModal staffList={staffList} onClose={() => setShowTimeLogs(false)} />}
    </div>
  );
};

export default ProfileScreen;