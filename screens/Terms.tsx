import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';

interface TermsScreenProps {
  onAccept?: () => void;
  onBack?: () => void;
}

const TermsScreen: React.FC<TermsScreenProps> = ({ onAccept, onBack }) => {
  const { t } = useAppContext();
  const [isChecked, setIsChecked] = useState(false);
  const isViewMode = !!onBack;

  return (
    <div className="h-full bg-white dark:bg-slate-950 flex flex-col screen-fade">
      <header className="px-4 py-3 bg-white dark:bg-slate-900 flex items-center sticky top-0 z-20 shadow-sm border-b border-gray-100 dark:border-slate-800">
        {isViewMode && <button onClick={onBack} className="w-10 h-10 flex items-center justify-center press-effect"><i className="fa-solid fa-arrow-left text-lg"></i></button>}
        <h1 className="flex-1 text-center font-bold text-lg text-gray-800 dark:text-white">{t('terms_title')}</h1>
        {isViewMode && <div className="w-10"></div>}
      </header>
      
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        
        {/* App Logo & Name Section */}
        <div className="flex flex-col items-center justify-center py-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#136A73] to-[#0D9488] rounded-[24px] flex items-center justify-center mb-4 shadow-lg border-2 border-white dark:border-slate-700">
                <i className="fa-solid fa-check-double text-white text-3xl"></i>
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Attendify</h2>
            <p className="text-sm text-gray-400 font-medium mt-1">Attendance Management App</p>
        </div>

        <div className="h-px bg-gray-100 dark:bg-slate-800 w-full"></div>

        <div className="space-y-8 text-gray-700 dark:text-slate-300 leading-relaxed text-sm">
          
          <section>
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">1. Introduction</h3>
            <p>Welcome to the Attendance Management App. By downloading, installing, or using this application, you agree to follow and be bound by these Terms and Conditions. If you do not agree, please do not use the app.</p>
            <p className="mt-2">This app is designed to help organizations manage staff attendance, time logs, and basic employee records efficiently.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">2. User Responsibilities</h3>
            <p>By using this app, you agree that:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>You will enter accurate staff and attendance data.</li>
                <li>You will use the app only for legal and workplace management purposes.</li>
                <li>You are responsible for maintaining the security of your device and data.</li>
                <li>You will not misuse, damage, or attempt to manipulate the system.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">3. Data Collection & Usage</h3>
            <p>The app may collect and store the following information:</p>
             <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Staff names and basic details</li>
                <li>Attendance status (Present, Absent, Half Day, Sick)</li>
                <li>Clock-in and clock-out times</li>
                <li>Salary-related data (if entered)</li>
                <li>Attendance history and reports</li>
            </ul>
            <p className="mt-2">This data is used only to manage attendance, generate reports, and improve functionality.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">4. Privacy & Security</h3>
            <p>We aim to keep your data secure.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Data may be stored locally on your device.</li>
                <li>Export features (such as CSV files) are controlled by the admin/user.</li>
                <li>We do not intentionally share your data with third parties.</li>
                <li>However, users are responsible for keeping their devices secure.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">5. Account & Access Rules</h3>
            <p>If login or profile features are used:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>You are responsible for keeping your login information safe.</li>
                <li>Do not share access with unauthorized users.</li>
                <li>The app owner/admin controls staff access and permissions.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">6. Restrictions</h3>
            <p>Users must NOT:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Enter false or misleading attendance records</li>
                <li>Attempt to hack, modify, or reverse-engineer the app</li>
                <li>Use the app for illegal activities</li>
                <li>Manipulate time logs or salary data dishonestly</li>
            </ul>
            <p className="mt-2">Violation may result in restricted access.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">7. Data Accuracy Disclaimer</h3>
            <p>The app records and displays data based on user input. We are not responsible for:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Incorrect attendance marking</li>
                <li>Wrong salary calculations due to wrong inputs</li>
                <li>Data loss caused by device damage, deletion, or system errors</li>
            </ul>
            <p className="mt-2">Users must regularly check and back up important data.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">8. Subscription & Payments (If Applicable)</h3>
            <p>If paid features are added in the future:</p>
             <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Some tools may require payment or subscription.</li>
                <li>All payments will be clearly shown before purchase.</li>
                <li>Fees are non-refundable unless stated otherwise.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">9. Termination of Access</h3>
            <p>We reserve the right to limit or stop access to the app if:</p>
             <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Terms are violated</li>
                <li>The app is misused</li>
                <li>Illegal activity is detected</li>
            </ul>
            <p className="mt-2">Users may also stop using the app at any time.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">10. Limitation of Liability</h3>
             <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>We are not responsible for:</li>
                <li>Business losses due to app errors</li>
                <li>Data loss from device failure</li>
                <li>Decisions made based on attendance reports</li>
            </ul>
            <p className="mt-2">Use the app at your own responsibility.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">11. Updates to Terms</h3>
            <p>These Terms & Conditions may be updated at any time to improve the app or comply with legal requirements. Continued use of the app means you accept the updated terms.</p>
          </section>

          <section>
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">12. Contact Information</h3>
            <p>For support, questions, or issues related to the app, users can contact the app owner/developer through the provided contact details inside the app.</p>
          </section>

        </div>
      </div>
      
      {!isViewMode && (
        <footer className="shrink-0 p-6 pb-safe bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800 press-effect border border-gray-100 dark:border-slate-700">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? 'bg-[#0F766E] border-[#0F766E]' : 'bg-transparent border-gray-300 dark:border-slate-600'}`}>
                <input type="checkbox" checked={isChecked} onChange={() => setIsChecked(!isChecked)} className="hidden" />
                {isChecked && <i className="fa-solid fa-check text-white text-xs"></i>}
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t('terms_checkbox_label')}</span>
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

export default TermsScreen;