
import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';

interface PrivacyPolicyScreenProps {
  onBack?: () => void;
  onAccept?: () => void;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack, onAccept }) => {
  const { t } = useAppContext();
  const [isChecked, setIsChecked] = useState(false);
  const isViewMode = !!onBack;
  const isOnboardingMode = !!onAccept;
  
  return (
    <div className="h-full bg-white dark:bg-slate-950 flex flex-col screen-fade">
      <header className="shrink-0 flex items-center p-4 bg-white dark:bg-slate-950 z-10 border-b border-gray-50 dark:border-slate-800 sticky top-0">
        {isViewMode && <button onClick={onBack} className="p-2 press-effect"><i className="fa-solid fa-chevron-left text-xl text-gray-800 dark:text-white"></i></button>}
        {!isViewMode && <div className="w-10"></div>}
        <h1 className="flex-1 text-center font-black text-xl text-gray-800 dark:text-white uppercase tracking-widest">{t('privacy_title')}</h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 text-gray-600 dark:text-slate-300 leading-relaxed text-sm">
        <p className="font-bold text-gray-800 dark:text-white">Last Updated: Sunday, February 8</p>
        
        <p>Welcome to Attendify. Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect information when you use the Attendify Attendance Management App.</p>
        
        <p>By using this app, you agree to the practices described in this policy.</p>

        <section>
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-2">1. Information We Collect</h2>
          <p>Attendify may collect and store the following information to provide attendance management features:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Staff Information:</strong> Staff names, Basic employee details entered by the admin</li>
            <li><strong>Attendance Data:</strong> Present / Absent / Half Day / Sick status, Clock-in and clock-out times, Late entry or early exit records</li>
            <li><strong>Usage Data:</strong> App usage for improving performance and stability</li>
          </ul>
          <p className="mt-2 italic text-xs">Note: All data is entered by the organization/admin using the app.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-2">2. How We Use the Information</h2>
          <p>We use the collected data to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Manage staff attendance records</li>
            <li>Display attendance statistics and reports</li>
            <li>Generate CSV exports for admin use</li>
            <li>Improve app functionality and user experience</li>
          </ul>
          <p className="mt-2 font-bold text-gray-800 dark:text-white">We do NOT use this data for advertising.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-2">3. Data Storage</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Data may be stored locally on your device.</li>
            <li>If cloud features (Firebase/Database) are enabled, data may be securely stored online.</li>
            <li>Admins control what data is entered and stored.</li>
            <li>Users are responsible for keeping their device secure.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-2">4. Data Sharing</h2>
          <p>Attendify does NOT sell, rent, or share personal data with third parties.</p>
          <p className="mt-2">Data may only be shared:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>By the admin exporting reports (CSV)</li>
            <li>If required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-2">5. Security</h2>
          <p>We take reasonable steps to protect user data:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Secure storage practices</li>
            <li>Controlled access through login</li>
            <li>Protection against unauthorized access</li>
          </ul>
          <p className="mt-2">However, no digital system is 100% secure. Users should keep their devices protected.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-2">6. User Control</h2>
          <p>The app administrator has full control over:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Adding staff data</li>
            <li>Editing records</li>
            <li>Exporting reports</li>
            <li>Removing data</li>
          </ul>
          <p className="mt-2">Users can delete app data by uninstalling the app.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-2">7. Children's Privacy</h2>
          <p>Attendify is designed for workplace use and is not intended for children under 13. We do not knowingly collect data from children.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-2">8. Third-Party Services</h2>
          <p>If enabled, the app may use trusted third-party services such as:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Firebase (for database/storage)</li>
            <li>Google Sign-In (if used)</li>
          </ul>
          <p className="mt-2">These services may collect technical data according to their own privacy policies.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-2">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time to improve clarity, security, or legal compliance.</p>
          <p className="mt-1">Updated versions will be reflected with a new "Last Updated" date.</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-2">10. Contact Information</h2>
          <p>If you have any questions or concerns about this Privacy Policy, please contact:</p>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800">
             <p className="mb-1"><strong>App Name:</strong> Attendify</p>
             <p className="mb-1"><strong>Developer:</strong> Rajveer kumar</p>
             <p><strong>Email:</strong> <a href="mailto:pujakumari221992@gmail.com" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">pujakumari221992@gmail.com</a></p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-2">11. Consent</h2>
          <p>By using Attendify, you agree to this Privacy Policy and the handling of information as described above.</p>
        </section>
      </div>

      {isOnboardingMode && (
        <footer className="shrink-0 p-6 pb-safe bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800 press-effect border border-gray-100 dark:border-slate-700">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? 'bg-[#0F766E] border-[#0F766E]' : 'bg-transparent border-gray-300 dark:border-slate-600'}`}>
                <input type="checkbox" checked={isChecked} onChange={() => setIsChecked(!isChecked)} className="hidden" />
                {isChecked && <i className="fa-solid fa-check text-white text-xs"></i>}
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t('privacy_checkbox_label')}</span>
            </label>
            <button 
              onClick={onAccept}
              disabled={!isChecked}
              className="w-full py-4 rounded-xl font-bold text-white transition-all press-effect disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:text-gray-500 bg-[#0F766E] shadow-lg disabled:shadow-none"
            >
              {t('terms_accept_button')}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};

export default PrivacyPolicyScreen;
