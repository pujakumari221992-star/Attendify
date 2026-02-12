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
import StaffProfileScreen from './screens/StaffProfile';
import HolidayGreeting from './screens/HolidayGreeting';
import AdManager from './services/AdManager';
import { auth, db, collection, doc, onSnapshot, query, where, addDoc, deleteDoc, updateDoc, serverTimestamp, signOut, storage, ref, uploadString, getDownloadURL, getDoc, setDoc, writeBatch, getDocs, deleteObject } from './firebase';
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
  
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [scheduleTargetId, setScheduleTargetId] = useState<string | null>(null);
  const [viewingStaff, setViewingStaff] = useState<Staff | null>(null);

  const [subscription, setSubscription] = useState<Subscription>({ status: 'free', plan: 'Free', expiry: null, platform: 'android' });
  const [showTerms, setShowTerms] = useState(false);
  const [showSubScreen, setShowSubScreen] = useState(false);
  
  const [splashComplete, setSplashComplete] = useState(false);
  const [currentHoliday, setCurrentHoliday] = useState<Holiday | null>(null);

  const [staffList, setStaffList] = useState<Staff[]>(() => { try { return JSON.parse(localStorage.getItem('attendify_cache_staff') || '[]') } catch { return [] } });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => { try { return JSON.parse(localStorage.getItem('attendify_cache_attendance') || '[]') } catch { return [] } });
  
  const [logs, setLogs] = useState<StaffLog[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { t } = useAppContext();
  const { showToast } = useToast();

  useEffect(() => {
    AdManager.init();

    // Fetches the single, global Razorpay key set by the admin.
    const fetchRemoteConfig = async () => {
        try {
            const configDoc = await getDoc(doc(db, "config", "razorpay"));
            if (configDoc.exists() && configDoc.data().live_key_id) {
                localStorage.setItem('razorpay_live_key_id', configDoc.data().live_key_id);
            }
        } catch (error) {
            console.warn("Could not fetch remote config.", error);
        }
    };

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

          // Fetch the global config for all users
          await fetchRemoteConfig();

          const isSuperAdmin = user.email === 'pujakumari221992@gmail.com';
          setIsAdmin(isSuperAdmin);
          setActiveTab(isSuperAdmin ? 'admin' : 'stats');
          
          try {
             const userDoc = await getDoc(doc(db, "users", user.uid));
             if (userDoc.exists()) {
                 const userData = userDoc.data();
                 const sub = userData.subscription as Subscription;

                 if (sub && sub.status === 'active' && sub.expiry && sub.expiry < Date.now()) {
                     const expiredSub: Subscription = { ...sub, status: 'expired', plan: 'Free' };
                     setSubscription(expiredSub);
                     await setDoc(doc(db, "users", user.uid), { subscription: expiredSub }, { merge: true });
                 } else if (sub) {
                     setSubscription(sub);
                 }
             }
          } catch(e) {
              console.error("Failed to fetch or validate subscription", e);
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

  const isPro = useMemo(() => subscription.status === 'active' && subscription.plan === 'Pro', [subscription]);

  useEffect(() => {
    AdManager.setPremium(isPro);
  }, [isPro]);

  useEffect(() => {
    if (!splashComplete) return;
    const checkHoliday = () => {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const lastSeenHoliday = localStorage.getItem('last_seen_holiday_date');
        if (lastSeenHoliday === dateString) return;
        let holiday: Holiday | null = null;
        if (month === 3 && (day === 25 || day === 14 || day === 29)) holiday = { id: 'holi', uid: 'sys', date: dateString, name: 'Happy Holi 🎨', greeting: 'May your life be filled with colors!', createdAt: null };
        else if (month === 11 && (day === 1 || day === 12)) holiday = { id: 'diwali', uid: 'sys', date: dateString, name: 'Happy Diwali 🪔', greeting: 'Lighting up your life with prosperity!', createdAt: null };
        else if (month === 1 && day === 1) holiday = { id: 'newyear', uid: 'sys', date: dateString, name: 'Happy New Year 🎉', greeting: 'Wishing you a successful year ahead!', createdAt: null };
        if (holiday) {
            setCurrentHoliday(holiday);
            localStorage.setItem('last_seen_holiday_date', dateString);
        }
    };
    checkHoliday();
  }, [splashComplete]);

  useEffect(() => {
    if (!userUid) return;
    const staffQuery = query(collection(db, "staff"), where("uid", "==", userUid));
    const unsubStaff = onSnapshot(staffQuery, (snapshot) => setStaffList(snapshot.docs.map(d => ({ ...d.data() as Omit<Staff, 'id'>, id: d.id }))), (error) => console.error("Staff sync error:", error));
    const attendanceQuery = query(collection(db, "attendance"), where("uid", "==", userUid));
    const unsubAttendance = onSnapshot(attendanceQuery, (snapshot) => setAttendanceRecords(snapshot.docs.map(d => ({ ...d.data() as AttendanceRecord, id: d.id }))), (error) => console.error("Attendance sync error:", error));
    const logsQuery = query(collection(db, "logs"), where("uid", "==", userUid));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => setLogs(snapshot.docs.map(d => ({ ...d.data() as StaffLog, id: d.id }))), (error) => console.error("Logs sync error:", error));
    let unsubUsers = () => {};
    if (isAdmin) {
      const usersQuery = query(collection(db, "users"));
      unsubUsers = onSnapshot(usersQuery, snapshot => setAllUsers(snapshot.docs.map(d => ({ ...d.data(), id: d.id }))));
    }
    return () => { unsubStaff(); unsubAttendance(); unsubLogs(); unsubUsers(); };
  }, [userUid, isAdmin]);

  const handleAcceptTerms = () => { localStorage.setItem('ss_terms_accepted', 'true'); setHasAcceptedTerms(true); };
  const handleAcceptPrivacy = () => { localStorage.setItem('ss_privacy_accepted', 'true'); setHasAcceptedPrivacy(true); };

  const handleSubscriptionUpgrade = async (newSub: Subscription) => {
      setSubscription(newSub);
      setShowSubScreen(false);
      try {
          if (userUid) await setDoc(doc(db, "users", userUid), { subscription: newSub }, { merge: true });
      } catch (e) {
          showToast("Subscription active, but failed to save to server.", "error");
      }
  };

  const handleSubscriptionDowngrade = async () => {
    if (!userUid) return;
    const currentSub = subscription; // For optimistic UI rollback
    const freeSub: Subscription = {
        status: 'free',
        plan: 'Free',
        expiry: null,
        platform: subscription.platform, // Keep original platform
    };
    setSubscription(freeSub);
    setShowSubScreen(false);
    showToast("You've been downgraded to the Free plan.", 'info');
    try {
        await setDoc(doc(db, "users", userUid), { subscription: freeSub }, { merge: true });
    } catch (e) {
        showToast("Failed to update subscription. Please try again.", "error");
        setSubscription(currentSub); // Rollback state on error
    }
  };

  const handleMarkAttendance = async (staffId: string, date: string, status: AttendanceStatus | null) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (date > todayStr) return showToast(t('attendance_future_error'), "error");
    const existingIndex = attendanceRecords.findIndex(r => r.staffId === staffId && r.date === date && r.uid === userUid);
    const existingRecord = existingIndex !== -1 ? attendanceRecords[existingIndex] : null;
    const oldStatus = existingRecord?.status || null;
    const previousRecords = [...attendanceRecords];
    let newRecords = [...attendanceRecords];
    if (status) {
        const optimisticRecord: AttendanceRecord = { id: existingRecord?.id || `temp-${Date.now()}`, staffId, date, status, timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 }, created_at: existingRecord?.created_at || { seconds: Date.now() / 1000, nanoseconds: 0 }, uid: userUid, checkInTime: existingRecord?.checkInTime || now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
        if (existingIndex !== -1) newRecords[existingIndex] = optimisticRecord; else newRecords.push(optimisticRecord);
    } else if (existingIndex !== -1) newRecords.splice(existingIndex, 1);
    setAttendanceRecords(newRecords);
    try {
      if (existingRecord?.id && !existingRecord.id.startsWith('temp-')) {
        if (status) {
            const updatePayload: any = { status, timestamp: serverTimestamp() };
            if (!existingRecord.checkInTime) updatePayload.checkInTime = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            await updateDoc(doc(db, "attendance", existingRecord.id), updatePayload);
        } else await deleteDoc(doc(db, "attendance", existingRecord.id));
      } else if (status) await addDoc(collection(db, "attendance"), { staffId, date, status, timestamp: serverTimestamp(), created_at: serverTimestamp(), uid: userUid, checkInTime: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
      if (status && status !== oldStatus) {
         const staffName = staffList.find(s => s.id === staffId)?.name || 'Unknown Staff';
         await addDoc(collection(db, "logs"), { uid: userUid, staffId, staffName, type: oldStatus ? LogType.ATTENDANCE_CHANGE : LogType.REGULAR, status, previousStatus: oldStatus, date, timestamp: serverTimestamp(), description: oldStatus ? `Changed from ${oldStatus} to ${status}` : `Marked as ${status}` });
      }
      showToast(t('attendance_marked_success'), "success");
    } catch(e) { 
      setAttendanceRecords(previousRecords);
      showToast(t('attendance_update_failed'), 'error');
    }
  };
  
  const handleUpdateStaffNotes = async (staffId: string, notes: string) => {
    try {
        await updateDoc(doc(db, "staff", staffId), { notes });
        showToast(t('staff_notes_updated_success'), 'success');
    } catch (e) {
        showToast(t('staff_notes_updated_fail'), 'error');
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
      await addDoc(collection(db, "staff"), { ...staffData, avatar: avatarUrl, uid: userUid, createdAt: serverTimestamp() });
      showToast(t('staff_create_success'), 'success');
    } catch (e) { showToast(t('staff_update_fail'), 'error'); }
  };

  const handleDeleteStaff = async (staffToDelete: Staff) => {
    if (!staffToDelete) return;
    try {
      if (staffToDelete.avatar) {
        try {
          const url = new URL(staffToDelete.avatar);
          const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
          await deleteObject(ref(storage, path));
        } catch (storageError: any) { if(storageError.code !== 'storage/object-not-found') console.warn("Could not delete avatar:", storageError); }
      }
      const batch = writeBatch(db);
      batch.delete(doc(db, "staff", staffToDelete.id));
      const attendanceQuery = query(collection(db, "attendance"), where("staffId", "==", staffToDelete.id), where("uid", "==", userUid));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      attendanceSnapshot.forEach(d => batch.delete(d.ref));
      const logsQuery = query(collection(db, "logs"), where("staffId", "==", staffToDelete.id), where("uid", "==", userUid));
      const logsSnapshot = await getDocs(logsQuery);
      logsSnapshot.forEach(d => batch.delete(d.ref));
      await batch.commit();
      showToast(`${staffToDelete.name} has been deleted.`, 'success');
    } catch (e) { showToast('Failed to delete staff member.', 'error'); }
  };

  const handleViewStaffProfile = (staff: Staff) => { setViewingStaff(staff); };

  const mainContent = useMemo(() => {
    let content: React.ReactNode = null;
    switch(activeTab) {
      case 'stats': content = <StatsScreen staffList={staffList} records={attendanceRecords} onSelectStaff={handleViewStaffProfile} />; break;
      case 'schedule': content = <ScheduleScreen staffList={staffList} records={attendanceRecords} onMarkAttendance={handleMarkAttendance} initialTargetStaffId={scheduleTargetId} onClearTarget={() => setScheduleTargetId(null)} />; break;
      case 'staff': content = <StaffScreen staffList={staffList} records={attendanceRecords} onStaffClick={handleViewStaffProfile} onStaffAdd={handleAddStaff} onStaffDelete={handleDeleteStaff} isPro={isPro} />; break;
      case 'profile': content = <ProfileScreen onLogout={() => signOut(auth)} isAdmin={isAdmin} subscription={subscription} userEmail={userEmail} userName={userName} onShowTerms={() => setShowTerms(true)} onShowSubscription={() => setShowSubScreen(true)} staffList={staffList} allUsers={allUsers} logs={logs} />; break;
      case 'admin': content = isAdmin ? <AdminScreen allUsers={allUsers} staffList={staffList} /> : null; break;
    }
    return content ? <div key={activeTab} className="h-full w-full animate-fade-in">{content}</div> : null;
  }, [activeTab, staffList, attendanceRecords, isPro, userEmail, userName, isAdmin, allUsers, scheduleTargetId, logs]);

  const navItems = [
    { id: 'stats', icon: 'fa-chart-pie', label: 'nav_stats' },
    { id: 'schedule', icon: 'fa-calendar-days', label: 'nav_schedule' },
    { id: 'staff', icon: 'fa-users', label: 'nav_staff' },
    { id: 'profile', icon: 'fa-user-cog', label: 'nav_profile' }
  ];
  if (isAdmin) navItems.unshift({ id: 'admin', icon: 'fa-chart-line', label: 'nav_admin' });

  return (
    <>
      {!isLoading && (
         <>
            {!hasAcceptedTerms ? <TermsScreen onAccept={handleAcceptTerms} />
            : !hasAcceptedPrivacy ? <PrivacyPolicyScreen onAccept={handleAcceptPrivacy} />
            : !isAuthenticated ? <AuthScreen initialView={unverifiedEmail ? 'verify' : 'signin'} initialEmail={unverifiedEmail || ''} onLogin={() => {}} />
            : (
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
                  {showSubScreen && <div className="absolute inset-0 z-[300] bg-white dark:bg-slate-900 screen-fade"><SubscriptionScreen onBack={() => setShowSubScreen(false)} isPro={isPro} onUpgrade={handleSubscriptionUpgrade} onDowngrade={handleSubscriptionDowngrade} subscription={subscription} userEmail={userEmail} /></div>}
                  {currentHoliday && <HolidayGreeting holiday={currentHoliday} onDismiss={() => setCurrentHoliday(null)} />}
                </div>
            )}
            {viewingStaff && (
                <div className="absolute inset-0 z-[250] bg-gray-50 dark:bg-slate-950">
                    <StaffProfileScreen
                        staff={viewingStaff}
                        records={attendanceRecords}
                        logs={logs}
                        onClose={() => setViewingStaff(null)}
                        onMarkAttendance={handleMarkAttendance}
                        onUpdateNotes={handleUpdateStaffNotes}
                        isPro={isPro}
                    />
                </div>
            )}
         </>
      )}
      {!splashComplete && <SplashScreen isAppReady={!isLoading} onComplete={() => setSplashComplete(true)} />}
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