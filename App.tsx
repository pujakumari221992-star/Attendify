
import React, { useState, useEffect, useMemo } from 'react';
import { TabType, Staff, AttendanceRecord, AttendanceStatus, Subscription, StaffLog, LogType, Holiday } from './types';
import StatsScreen from './screens/Stats';
import StaffScreen from './screens/Staff';
import ProfileScreen from './screens/Profile';
import AdminScreen from './screens/Admin';
import AuthScreen from './screens/Auth';
import SubscriptionScreen from './screens/Subscription';
import TermsScreen from './screens/Terms';
import PrivacyPolicyScreen from './screens/PrivacyPolicy';
import ScheduleScreen from './screens/Schedule';
import SplashScreen from './screens/Splash';
import HolidayGreeting from './screens/HolidayGreeting';
import AdManager from './services/AdManager';
import { auth, db, collection, doc, onSnapshot, query, where, addDoc, deleteDoc, updateDoc, serverTimestamp, signOut, storage, ref, uploadString, getDownloadURL } from './firebase';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { AppProvider, useAppContext } from './hooks/useAppContext';
import { ToastProvider, useToast } from './hooks/useToast';

const AppContent: React.FC = () => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => localStorage.getItem('ss_terms_accepted') === 'true');
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(() => localStorage.getItem('ss_privacy_accepted') === 'true');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [userUid, setUserUid] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  
  // Default tab state
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  
  // Navigation State
  const [scheduleTargetId, setScheduleTargetId] = useState<string | null>(null);

  const [subscription, setSubscription] = useState<Subscription>({ status: 'free', plan: 'Free', expiry: null, platform: 'android' });
  const [showTerms, setShowTerms] = useState(false);
  const [showSubScreen, setShowSubScreen] = useState(false);
  
  // Splash Screen State
  const [splashComplete, setSplashComplete] = useState(false);
  
  // Holiday State
  const [currentHoliday, setCurrentHoliday] = useState<Holiday | null>(null);

  const [staffList, setStaffList] = useState<Staff[]>(() => { try { return JSON.parse(localStorage.getItem('attendify_cache_staff') || '[]') } catch { return [] } });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => { try { return JSON.parse(localStorage.getItem('attendify_cache_attendance') || '[]') } catch { return [] } });
  
  const [logs, setLogs] = useState<StaffLog[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]); // For admin only
  const [isLoading, setIsLoading] = useState(true);
  
  const { t } = useAppContext();
  const { showToast } = useToast();

  useEffect(() => {
    AdManager.init();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!user.emailVerified) {
          setIsAuthenticated(false);
          setUnverifiedEmail(user.email);
        } else {
          setUserUid(user.uid);
          setUserEmail(user.email || '');
          setUserName(user.displayName || 'Business Owner');
          setIsAuthenticated(true);
          setUnverifiedEmail(null);
          
          // Check if Super Admin
          const isSuperAdmin = user.email === 'pujakumari221992@gmail.com';
          setIsAdmin(isSuperAdmin);

          // If super admin, show admin tab default, otherwise Stats
          if (isSuperAdmin) {
            setActiveTab('admin');
          } else {
            setActiveTab('stats');
          }
        }
      } else {
        setIsAuthenticated(false);
        setUnverifiedEmail(null);
        setUserUid('');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { localStorage.setItem('attendify_cache_staff', JSON.stringify(staffList)); }, [staffList]);
  useEffect(() => { localStorage.setItem('attendify_cache_attendance', JSON.stringify(attendanceRecords)); }, [attendanceRecords]);

  // Derived State for Premium
  const isPro = useMemo(() => subscription.status === 'active' && subscription.plan === 'Pro', [subscription]);

  // Sync Premium Status to AdManager
  useEffect(() => {
    AdManager.setPremium(isPro);
  }, [isPro]);

  // Automatic Holiday Detection Logic
  useEffect(() => {
    if (!splashComplete) return;

    const checkHoliday = () => {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        const month = today.getMonth() + 1; // 1-12
        const day = today.getDate();

        // Check Local Storage to ensure we only show once per day
        const lastSeenHoliday = localStorage.getItem('last_seen_holiday_date');
        if (lastSeenHoliday === dateString) return;

        let holiday: Holiday | null = null;

        // Detect major holidays
        const isHoli = (month === 3 && (day === 25 || day === 14 || day === 29)); // Typical Holi dates
        const isDiwali = (month === 11 && (day === 1 || day === 12)); // Typical Diwali dates
        const isNewYear = (month === 1 && day === 1);

        if (isHoli) {
             holiday = { id: 'holi', uid: 'sys', date: dateString, name: 'Happy Holi 🎨', greeting: 'May your life be filled with colors!', createdAt: null };
        } else if (isDiwali) {
             holiday = { id: 'diwali', uid: 'sys', date: dateString, name: 'Happy Diwali 🪔', greeting: 'Lighting up your life with prosperity!', createdAt: null };
        } else if (isNewYear) {
             holiday = { id: 'newyear', uid: 'sys', date: dateString, name: 'Happy New Year 🎉', greeting: 'Wishing you a successful year ahead!', createdAt: null };
        }
        
        if (holiday) {
            setCurrentHoliday(holiday);
            localStorage.setItem('last_seen_holiday_date', dateString);
        }
    };

    checkHoliday();
  }, [splashComplete]);

  useEffect(() => {
    if (!userUid) return;
    
    // Staff Listener
    const staffQuery = query(collection(db, "staff"), where("uid", "==", userUid));
    const unsubStaff = onSnapshot(staffQuery, (snapshot) => {
        setStaffList(snapshot.docs.map(d => ({ ...d.data() as Omit<Staff, 'id'>, id: d.id })));
    }, (error) => console.error("Staff sync error:", error));
    
    // Attendance Listener
    const attendanceQuery = query(collection(db, "attendance"), where("uid", "==", userUid));
    const unsubAttendance = onSnapshot(attendanceQuery, (snapshot) => {
        setAttendanceRecords(snapshot.docs.map(d => ({ ...d.data() as AttendanceRecord, id: d.id })));
    }, (error) => console.error("Attendance sync error:", error));

    // Logs Listener
    const logsQuery = query(collection(db, "logs"), where("uid", "==", userUid));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
        setLogs(snapshot.docs.map(d => ({ ...d.data() as StaffLog, id: d.id })));
    }, (error) => console.error("Logs sync error:", error));
    
    let unsubUsers = () => {};
    if (isAdmin) {
      const usersQuery = query(collection(db, "users"));
      unsubUsers = onSnapshot(usersQuery, snapshot => setAllUsers(snapshot.docs.map(d => ({ ...d.data(), id: d.id }))));
    }
    
    return () => { unsubStaff(); unsubAttendance(); unsubLogs(); unsubUsers(); };
  }, [userUid, isAdmin]);

  const handleAcceptTerms = () => {
    localStorage.setItem('ss_terms_accepted', 'true');
    setHasAcceptedTerms(true);
  };

  const handleAcceptPrivacy = () => {
    localStorage.setItem('ss_privacy_accepted', 'true');
    setHasAcceptedPrivacy(true);
  };

  const handleMarkAttendance = async (staffId: string, date: string, status: AttendanceStatus | null) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (date > todayStr) return showToast(t('attendance_future_error'), "error");

    const existingIndex = attendanceRecords.findIndex(r => r.staffId === staffId && r.date === date && r.uid === userUid);
    const existingRecord = existingIndex !== -1 ? attendanceRecords[existingIndex] : null;
    const oldStatus = existingRecord?.status || null;

    const previousRecords = [...attendanceRecords];
    const newRecords = [...attendanceRecords];
    
    if (status) {
        const optimisticRecord: AttendanceRecord = {
            id: existingRecord?.id || `temp-${Date.now()}`,
            staffId,
            date,
            status: status,
            timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 },
            created_at: existingRecord?.created_at || { seconds: Date.now() / 1000, nanoseconds: 0 },
            uid: userUid,
            checkInTime: existingRecord?.checkInTime || now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };

        if (existingIndex !== -1) {
            newRecords[existingIndex] = optimisticRecord;
        } else {
            newRecords.push(optimisticRecord);
        }
    } else {
        if (existingIndex !== -1) {
            newRecords.splice(existingIndex, 1);
        }
    }

    setAttendanceRecords(newRecords);

    try {
      if (existingRecord && existingRecord.id && !existingRecord.id.startsWith('temp-')) {
        if (status) {
            const updatePayload: any = { status: status, timestamp: serverTimestamp() };
            if (!existingRecord.checkInTime) {
                updatePayload.checkInTime = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
            await updateDoc(doc(db, "attendance", existingRecord.id), updatePayload);
        } else {
            await deleteDoc(doc(db, "attendance", existingRecord.id));
        }
      } else if (status) {
        await addDoc(collection(db, "attendance"), { 
            staffId, 
            date, 
            status: status, 
            timestamp: serverTimestamp(), 
            created_at: serverTimestamp(), 
            uid: userUid, 
            checkInTime: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
      }

      if (status && status !== oldStatus) {
         let logType = LogType.REGULAR;
         if (oldStatus && oldStatus !== status) logType = LogType.ATTENDANCE_CHANGE;
         else if (status === AttendanceStatus.LATE) logType = LogType.LATE_ARRIVAL;
         else if (status === AttendanceStatus.EARLY_EXIT) logType = LogType.EARLY_EXIT;
         else if (status === AttendanceStatus.OVERTIME) logType = LogType.OVERTIME;
         else if (status === AttendanceStatus.LEAVE || status === AttendanceStatus.SICK_LEAVE) logType = LogType.LEAVE;

         const staffName = staffList.find(s => s.id === staffId)?.name || 'Unknown Staff';

         await addDoc(collection(db, "logs"), {
            uid: userUid,
            staffId,
            staffName,
            type: logType,
            status,
            previousStatus: oldStatus,
            date,
            timestamp: serverTimestamp(),
            description: oldStatus ? `Changed from ${oldStatus} to ${status}` : `Marked as ${status}`
         });
      }

      showToast(t('attendance_marked_success'), "success");
    } catch(e) { 
      console.error("Attendance update failed:", e);
      setAttendanceRecords(previousRecords);
      showToast(t('attendance_update_failed'), 'error');
    }
  };

  const handleAddStaff = async (staffData: Omit<Staff, 'id' | 'uid' | 'createdAt' | 'avatar'> & {avatar?: string}) => {
    try {
      let avatarUrl = '';
      if (staffData.avatar) {
        const storageRef = ref(storage, `avatars/${userUid}/${Date.now()}`);
        const snapshot = await uploadString(storageRef, staffData.avatar, 'data_url');
        avatarUrl = await getDownloadURL(snapshot.ref);
      }
      
      await addDoc(collection(db, "staff"), { 
        ...staffData, 
        avatar: avatarUrl,
        uid: userUid, 
        createdAt: serverTimestamp() 
      });
      showToast(t('staff_create_success'), 'success');
    } catch (e) {
      showToast(t('staff_update_fail'), 'error');
    }
  };

  const handleStaffClick = (staff: Staff) => {
    setScheduleTargetId(staff.id);
    setActiveTab('schedule');
  };

  const mainContent = useMemo(() => {
    let content: React.ReactNode = null;

    switch(activeTab) {
      case 'stats': 
        content = <StatsScreen staffList={staffList} records={attendanceRecords} onSelectStaff={(s) => { setScheduleTargetId(s.id); setActiveTab('schedule'); }} />;
        break;
      case 'schedule': 
        content = <ScheduleScreen staffList={staffList} records={attendanceRecords} onMarkAttendance={handleMarkAttendance} initialTargetStaffId={scheduleTargetId} onClearTarget={() => setScheduleTargetId(null)} />;
        break;
      case 'staff': 
        content = <StaffScreen staffList={staffList} records={attendanceRecords} onStaffClick={handleStaffClick} onStaffAdd={handleAddStaff} isPro={isPro} />;
        break;
      case 'profile': 
        content = <ProfileScreen onLogout={() => signOut(auth)} isAdmin={isAdmin} subscription={subscription} userEmail={userEmail} userName={userName} onShowTerms={() => setShowTerms(true)} onShowSubscription={() => setShowSubScreen(true)} staffList={staffList} allUsers={allUsers} logs={logs} />;
        break;
      case 'admin': 
        content = isAdmin ? <AdminScreen allUsers={allUsers} staffList={staffList} /> : null;
        break;
      default:
        content = null;
    }
    
    if (!content) return null;

    return (
        <div key={activeTab} className="h-full w-full animate-fade-in">
            {content}
        </div>
    );
  }, [activeTab, staffList, attendanceRecords, isPro, userEmail, userName, isAdmin, allUsers, scheduleTargetId, logs]);

  const navItems = [
    { id: 'stats', icon: 'fa-chart-pie', label: 'nav_stats' },
    { id: 'schedule', icon: 'fa-calendar-days', label: 'nav_schedule' },
    { id: 'staff', icon: 'fa-users', label: 'nav_staff' },
    { id: 'profile', icon: 'fa-user-cog', label: 'nav_profile' }
  ];

  if (isAdmin) {
      // Add Admin Tab for Super Admin
      navItems.unshift({ id: 'admin', icon: 'fa-chart-line', label: 'nav_admin' });
  }

  return (
    <>
      {!isLoading && (
         <>
            {!hasAcceptedTerms ? (
                <TermsScreen onAccept={handleAcceptTerms} />
            ) : !hasAcceptedPrivacy ? (
                <PrivacyPolicyScreen onAccept={handleAcceptPrivacy} />
            ) : !isAuthenticated ? (
                <AuthScreen initialView={unverifiedEmail ? 'verify' : 'signin'} initialEmail={unverifiedEmail || ''} onLogin={() => {}} />
            ) : (
                <div className="h-full w-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden relative">
                  <main className="flex-1 w-full overflow-hidden relative z-0">{mainContent}</main>
                  <nav className="shrink-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-slate-800 shadow-2xl z-50 pb-safe">
                    <div className="flex items-center justify-around px-4 h-20 gap-1">
                      {navItems.map((item) => (
                        <button key={item.id} onClick={() => setActiveTab(item.id as TabType)} className={`flex flex-col items-center justify-center flex-1 h-full transition-all press-effect ${activeTab === item.id ? 'text-[#0F766E]' : 'text-gray-400'}`}>
                          <i className={`fa-solid ${item.icon} text-xl`}></i>
                          <span className="text-[10px] font-bold mt-1.5">{t(item.label)}</span>
                        </button>
                      ))}
                    </div>
                  </nav>

                  {showTerms && <div className="absolute inset-0 z-[300] bg-white dark:bg-slate-900 screen-fade"><TermsScreen onBack={() => setShowTerms(false)} /></div>}
                  {showSubScreen && <div className="absolute inset-0 z-[300] bg-white dark:bg-slate-900 screen-fade"><SubscriptionScreen onBack={() => setShowSubScreen(false)} isPro={isPro} onUpgrade={(s:any) => setSubscription(s)} subscription={subscription} userEmail={userEmail} /></div>}
                  
                  {currentHoliday && <HolidayGreeting holiday={currentHoliday} onDismiss={() => setCurrentHoliday(null)} />}
                </div>
            )}
         </>
      )}

      {!splashComplete && (
        <SplashScreen isAppReady={!isLoading} onComplete={() => setSplashComplete(true)} />
      )}
    </>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  </AppProvider>
);

export default App;
