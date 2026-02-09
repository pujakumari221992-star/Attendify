
import React, { useState, useEffect, useRef } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  db,
  doc,
  setDoc,
  serverTimestamp
} from '../firebase';
import { useAppContext } from '../hooks/useAppContext';
import { useToast } from '../hooks/useToast';

interface AuthScreenProps {
  onLogin: () => void;
  initialView?: 'signin' | 'signup' | 'forgot' | 'verify';
  initialEmail?: string;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ initialView = 'signin', initialEmail = '' }) => {
  const [view, setView] = useState<'signin' | 'signup' | 'verify' | 'forgot'>(initialView);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [emailInUseError, setEmailInUseError] = useState(false);
  const { t } = useAppContext();
  const { showToast } = useToast();
  const prevInitialViewRef = useRef(initialView);

  useEffect(() => {
    if (initialView !== prevInitialViewRef.current) {
      setView(initialView);
      prevInitialViewRef.current = initialView;
    }
  }, [initialView]);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const AppLogo = () => (
    <div className="w-24 h-24 bg-gradient-to-br from-[#136A73] to-[#0D9488] rounded-[34px] flex items-center justify-center mb-8 shadow-2xl shadow-teal-900/30 border-4 border-white dark:border-slate-800 animate-scale-in shrink-0 relative overflow-hidden">
      <i className="fa-solid fa-check-double text-white text-5xl relative z-10"></i>
      <div className="absolute inset-0 bg-white/10 rotate-12 translate-x-4 translate-y-4"></div>
    </div>
  );

  const handleAuth = async () => {
    setError(null);
    setEmailInUseError(false);

    if (!email) return setError(t('auth_error_email_required'));

    setLoading(true);
    try {
      if (view === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        showToast(t('profile_reset_link_sent'), 'success');
        setView('signin');
        setLoading(false);
        return;
      }

      if (view === 'signup' && !fullName.trim()) {
        setLoading(false);
        return setError(t('auth_error_fullname_required'));
      }
      if (!password) {
        setLoading(false);
        return setError(t('auth_error_password_required'));
      }

      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      if (view === 'signup') {
        if (password.length < 6) throw { code: 'auth/weak-password' };
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), {
          fullName: fullName,
          email: cred.user.email,
          createdAt: serverTimestamp()
        }, { merge: true });
        await sendEmailVerification(cred.user);
        setView('verify');
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          await sendEmailVerification(cred.user);
          setView('verify');
        }
      }
    } catch (err: any) {
      switch (err.code) {
        case 'auth/network-request-failed': setError(t('auth_error_network_failed')); break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': setError(t('auth_error_invalid_credentials')); break;
        case 'auth/invalid-email': setError(t('auth_error_invalid_email')); break;
        case 'auth/too-many-requests': setError(t('auth_error_too_many_requests')); break;
        case 'auth/email-already-in-use': setError(t('auth_error_email_in_use')); setEmailInUseError(true); break;
        case 'auth/weak-password': setError(t('auth_error_weak_password')); break;
        default: setError(t('auth_error_generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async () => {
    setError(null);
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, "users", cred.user.uid), {
        fullName: cred.user.displayName,
        email: cred.user.email,
      }, { merge: true });
      if (!cred.user.emailVerified) {
        await sendEmailVerification(cred.user);
        setView('verify');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') setError(t('auth_error_social_failed'));
    } finally {
      setLoading(false);
    }
  };

  if (view === 'verify') {
    return (
      <div className="absolute inset-0 bg-white dark:bg-slate-950 p-8 flex flex-col items-center justify-center text-center animate-subtle-fade-in-up">
        <div className="w-24 h-24 bg-teal-50 dark:bg-teal-900/20 rounded-[40px] flex items-center justify-center mb-10"><i className="fa-solid fa-paper-plane text-[#136A73] text-4xl"></i></div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-slate-50 mb-4 tracking-tight">{t('auth_verify_email_title')}</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-10 px-4">{t('auth_verify_email_desc', { email: <span className="text-[#136A73] font-black">{email}</span> })}</p>
        <button onClick={() => window.location.reload()} className="w-full max-w-xs py-5 bg-[#136A73] text-white rounded-3xl font-black text-xs uppercase tracking-[2px] btn-3d shadow-xl shadow-teal-900/20 press-effect">{t('auth_ive_verified')}</button>
        <button onClick={() => signOut(auth).then(() => setView('signin'))} className="mt-8 text-xs font-black text-gray-400 uppercase tracking-widest underline underline-offset-8 press-effect">{t('auth_back_to_login')}</button>
      </div>
    );
  }

  const getTitle = () => {
    if (view === 'signup') return t('auth_create_account');
    if (view === 'forgot') return t('auth_reset_password');
    return t('auth_login');
  };

  const getDesc = () => {
    if (view === 'signup') return t('auth_create_account_desc');
    if (view === 'forgot') return t('auth_reset_desc');
    return t('auth_login_desc');
  };

  const getButtonText = () => {
    if (view === 'signup') return t('auth_create_account');
    if (view === 'forgot') return t('auth_send_link');
    return t('auth_login');
  };

  return (
    <div className="absolute inset-0 bg-gray-50 dark:bg-slate-950 p-8 flex flex-col items-center justify-center overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col items-center animate-subtle-fade-in-up">
        <AppLogo />
        <h1 className="text-4xl font-black text-gray-900 dark:text-slate-50 mb-2 tracking-tight">{getTitle()}</h1>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-10 font-black uppercase tracking-[2px] text-center">{getDesc()}</p>

        <div className="w-full space-y-4">
          {view === 'signup' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-4">{t('auth_full_name')}</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t('placeholder_full_name')} className="w-full h-14 bg-white dark:bg-slate-800 dark:text-white rounded-3xl px-6 font-bold text-base outline-none shadow-sm border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-[#136A73]/20 focus:border-[#136A73]" />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-4">{t('auth_email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('placeholder_email_example')} className="w-full h-14 bg-white dark:bg-slate-800 dark:text-white rounded-3xl px-6 font-bold text-base outline-none shadow-sm border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-[#136A73]/20 focus:border-[#136A73]" />
          </div>
          {view !== 'forgot' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-4">{t('auth_password')}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('placeholder_password_stars')} className="w-full h-14 bg-white dark:bg-slate-800 dark:text-white rounded-3xl px-6 font-bold text-base outline-none shadow-sm border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-[#136A73]/20 focus:border-[#136A73]" />
            </div>
          )}
        </div>

        {error && <div className="w-full mt-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest border border-red-100 dark:border-red-900/30 leading-relaxed">{error} {emailInUseError && <button onClick={() => { setView('signin'); setError(null); }} className="underline ml-1 press-effect">Login Instead</button>}</div>}
        
        {view !== 'forgot' && (
          <div className="flex justify-between items-center w-full mt-6">
            <label className="flex items-center gap-3 cursor-pointer group press-effect">
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-[#136A73] border-[#136A73]' : 'bg-transparent border-gray-200 dark:border-slate-700'}`}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="hidden" />
                {rememberMe && <i className="fa-solid fa-check text-white text-[10px]"></i>}
              </div>
              <span className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-gray-600 dark:group-hover:text-slate-300">{t('auth_remember_me')}</span>
            </label>
            <button onClick={() => setView('forgot')} className="text-[11px] font-black text-[#136A73] uppercase tracking-widest hover:underline underline-offset-4 press-effect">{t('auth_forgot')}</button>
          </div>
        )}

        <button onClick={handleAuth} disabled={loading} className="w-full py-5 bg-[#136A73] text-white rounded-3xl font-black text-xs uppercase tracking-[2px] mt-8 btn-3d shadow-2xl shadow-teal-900/20 press-effect">
          {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : getButtonText()}
        </button>

        {view !== 'forgot' && (
          <>
            <div className="flex items-center w-full my-8">
              <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800"></div>
              <span className="mx-6 text-[10px] font-black text-gray-300 dark:text-slate-700 uppercase tracking-[3px]">{t('common_or')}</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800"></div>
            </div>
            
            <button onClick={handleSocial} disabled={loading} className="w-full py-5 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-3xl font-black text-xs uppercase tracking-[2px] flex items-center justify-center gap-4 shadow-xl border border-gray-100 dark:border-slate-700 btn-3d press-effect">
              <i className="fa-brands fa-google text-lg"></i> {t('auth_signin_google')}
            </button>
          </>
        )}
        
        <div className="text-[11px] text-gray-400 dark:text-slate-500 mt-10 flex items-center justify-center gap-2 font-black uppercase tracking-widest">
          {view === 'forgot' ? (
            <button onClick={() => setView('signin')} className="text-[#136A73] hover:underline underline-offset-4 decoration-2 press-effect">
               {t('auth_back_to_login')}
            </button>
          ) : (
            <>
              <span>{view === 'signup' ? t('auth_already_have_account') : t('auth_new_user')}</span>
              <button onClick={() => setView(view === 'signup' ? 'signin' : 'signup')} className="text-[#136A73] hover:underline underline-offset-4 decoration-2 press-effect">
                {view === 'signup' ? t('auth_login') : t('auth_create_account')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
