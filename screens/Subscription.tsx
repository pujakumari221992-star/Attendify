import React, { useState } from 'react';
import { Subscription } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { useToast } from '../hooks/useToast';
import { db, doc, getDoc, auth } from '../firebase';

declare var Razorpay: any;

const DowngradeConfirmationModal: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
  const { t } = useAppContext();
  return (
    <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 text-center animate-scale-in shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h3 className="font-black text-lg text-gray-900 dark:text-white">Downgrade to Free?</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
          You will lose access to Pro features like unlimited staff members and an ad-free experience. Are you sure?
        </p>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 font-bold rounded-xl press-effect">{t('btn_cancel')}</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-yellow-500 text-white font-bold rounded-xl press-effect shadow-lg shadow-yellow-500/20">Yes, Downgrade</button>
        </div>
      </div>
    </div>
  );
};


const SubscriptionScreen: React.FC<{
  onBack: () => void;
  isPro: boolean;
  onUpgrade: (sub: Subscription) => void;
  onDowngrade: () => void;
  subscription: Subscription;
  userEmail: string;
}> = ({ isPro, onUpgrade, userEmail, onBack, onDowngrade }) => {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const { t } = useAppContext();
  const { showToast } = useToast();

  const handleUpgrade = async () => {
    setLoading(true);

    let razorpayKeyId = localStorage.getItem('razorpay_live_key_id');

    // As a fallback, if the key isn't in local storage, fetch it directly.
    if (!razorpayKeyId) {
      try {
        const configDoc = await getDoc(doc(db, "config", "razorpay"));
        if (configDoc.exists() && configDoc.data().live_key_id) {
          razorpayKeyId = configDoc.data().live_key_id;
          localStorage.setItem('razorpay_live_key_id', razorpayKeyId);
        }
      } catch (error) {
        setLoading(false);
        showToast("Error fetching payment configuration. Check connection.", "error");
        return;
      }
    }

    if (!razorpayKeyId) {
        setLoading(false);
        showToast("Payment gateway has not been configured by the administrator yet.", "error");
        return;
    }

    if (!razorpayKeyId.startsWith('rzp_live_')) {
        setLoading(false);
        showToast("An invalid payment key is configured. Please contact support at pujakumari221992@gmail.com.", "error");
        return;
    }

    const amount = cycle === 'monthly' ? 199 : 500; 

    const options = {
      key: razorpayKeyId,
      amount: amount * 100,
      currency: "INR",
      name: "Attendify Premium",
      description: cycle === 'monthly' ? 'Monthly Plan - ₹199' : 'Yearly Plan - ₹500',
      image: "https://cdn-icons-png.flaticon.com/512/1043/1043444.png",
      handler: function (response: any) {
        const duration = cycle === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000;
        
        onUpgrade({ 
            status: 'active', 
            plan: 'Pro', 
            expiry: Date.now() + duration, 
            transactionId: response.razorpay_payment_id, 
            platform: 'web' 
        });
        
        setLoading(false);
        showToast("Subscription Activated Successfully!", "success");
      },
      prefill: {
        email: userEmail,
      },
      theme: {
        color: "#136A73"
      },
      modal: {
        ondismiss: function() {
            setLoading(false);
            showToast("Payment Cancelled", "info");
        }
      }
    };

    if (typeof Razorpay === 'undefined') {
        setLoading(false);
        showToast("Payment gateway failed to load. Check connection.", "error");
        return;
    }

    try {
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response: any){
            setLoading(false);
            showToast(response.error.description || "Payment Failed. Try Again.", "error");
        });
        rzp.open();
    } catch (e) {
        console.error("Razorpay SDK Error:", e);
        setLoading(false);
        showToast("Could not open payment gateway. Check connection or contact support at pujakumari221992@gmail.com.", "error");
    }
  };
  
  const handleConfirmDowngrade = () => {
    setShowDowngradeConfirm(false);
    onDowngrade();
  };

  const proFeatures = ['Unlimited Staff Members', 'Ad-free Experience', 'Priority Support', 'CSV Exports & Reports'];
  const freeFeatures = ['Up to 20 Staff', 'Ad-supported', 'Basic Analytics'];

  return (
    <div className="h-full bg-gray-50 dark:bg-slate-950 flex flex-col screen-fade">
      <header className="px-4 py-3 bg-white dark:bg-slate-900 flex items-center shadow-sm z-10">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center press-effect"><i className="fa-solid fa-arrow-left text-lg text-gray-700 dark:text-white"></i></button>
        <h1 className="flex-1 text-center font-bold text-lg text-gray-800 dark:text-white">{t('subscription_plans')}</h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('subscription_unlock_potential')}</h2>
          <p className="text-gray-500 text-sm mt-2">{t('subscription_choose_plan')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl flex relative shadow-sm border border-gray-100 dark:border-slate-700">
          <div className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-[#136A73] rounded-xl shadow-md transition-transform duration-300 ease-out ${cycle === 'yearly' ? 'translate-x-full' : 'translate-x-0'}`}></div>
          <button onClick={() => setCycle('monthly')} className={`flex-1 py-3 font-bold text-sm z-10 transition-colors ${cycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>{t('subscription_monthly')}</button>
          <button onClick={() => setCycle('yearly')} className={`flex-1 py-3 font-bold text-sm z-10 flex items-center justify-center gap-1 transition-colors ${cycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
            {t('subscription_yearly')}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${cycle === 'yearly' ? 'bg-white text-[#136A73]' : 'bg-[#136A73] text-white'}`}>Best Value</span>
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-[#136A73] to-[#0D9488] p-6 rounded-3xl shadow-xl relative text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          {cycle === 'yearly' && <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20">{t('subscription_recommended')}</div>}
          
          <p className="font-black text-white/80 text-sm uppercase tracking-widest mb-1">{t('subscription_pro_plan')}</p>
          <div className="flex items-end gap-1 mb-6">
              <p className="text-5xl font-black">
                ₹{cycle === 'monthly' ? '199' : '500'}
              </p>
              <span className="text-base font-medium text-white/70 mb-1.5">/{cycle === 'monthly' ? 'month' : 'year'}</span>
          </div>
          {cycle === 'yearly' && <p className="text-xs font-bold bg-white/20 inline-block px-2 py-1 rounded-lg mb-6">Full Year Access</p>}
          
          <ul className="space-y-4 mb-8">
            {proFeatures.map(feat => (
              <li key={feat} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-check text-[#136A73] text-[10px]"></i>
                </div>
                <span className="font-semibold text-sm">{feat}</span>
              </li>
            ))}
          </ul>
          <button onClick={handleUpgrade} disabled={isPro || loading} className="w-full py-4 bg-white text-[#136A73] rounded-xl font-black text-sm uppercase tracking-widest press-effect shadow-lg">
            {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : isPro ? "Plan Active" : "Get Premium"}
          </button>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700">
          <p className="font-bold text-gray-400 text-sm uppercase tracking-widest mb-1">{t('subscription_free_plan')}</p>
           <p className="text-4xl font-black text-gray-900 dark:text-white mb-6">
            ₹0 <span className="text-base font-medium text-gray-400">/month</span>
          </p>
          <ul className="space-y-3 mb-6">
            {freeFeatures.map(feat => (
              <li key={feat} className="flex items-center gap-3">
                <i className="fa-solid fa-check text-gray-300"></i>
                <span className="text-gray-600 dark:text-slate-400 text-sm font-medium">{feat}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => setShowDowngradeConfirm(true)} disabled={!isPro} className="w-full py-4 bg-gray-50 dark:bg-slate-700 text-gray-400 rounded-xl font-bold text-sm uppercase tracking-widest press-effect disabled:opacity-50 disabled:cursor-not-allowed">
            {isPro ? "Downgrade to Free" : "Current Plan"}
          </button>
        </div>
        
        <div className="text-center text-xs text-gray-400 space-y-2 pb-6">
          <p>Secure payment via Razorpay</p>
          <div className="flex justify-center gap-4">
            <a href="#" className="underline hover:text-gray-600">{t('terms_of_service')}</a>
            <a href="#" className="underline hover:text-gray-600">{t('refund_policy')}</a>
          </div>
        </div>
      </div>
      {showDowngradeConfirm && <DowngradeConfirmationModal onConfirm={handleConfirmDowngrade} onCancel={() => setShowDowngradeConfirm(false)} />}
    </div>
  );
};

export default SubscriptionScreen;