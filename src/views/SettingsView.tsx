import React, { useState } from 'react';
import { User, Bell, Shield, Check, Camera, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../components/SupabaseProvider';
import { updateUserProfile, clearAllData } from '../supabase';
import { cn } from '../lib/utils';
import { ConfirmationModal } from '../components/ConfirmationModal';

const PRESET_AVATARS = [
  "https://picsum.photos/seed/manager/200/200",
  "https://picsum.photos/seed/alex/200/200",
  "https://picsum.photos/seed/sarah/200/200",
  "https://picsum.photos/seed/mike/200/200",
  "https://picsum.photos/seed/lisa/200/200",
  "https://picsum.photos/seed/david/200/200",
];

export function SettingsView() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || PRESET_AVATARS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateUserProfile(displayName, photoURL);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await clearAllData();
      console.log('All data has been successfully cleared.');
    } catch (error) {
      console.error('Failed to clear data:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-1">Configure your account and application preferences.</p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-4">
            <Check className="w-4 h-4" />
            <span className="text-sm font-bold">Settings saved successfully</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-slate-100 rounded-xl">
              <User className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Profile Information</h3>
              <p className="text-sm text-slate-500">Update your personal details and avatar.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <img 
                  src={photoURL} 
                  alt="Avatar Preview" 
                  className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Avatar</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPhotoURL(url)}
                    className={cn(
                      "w-10 h-10 rounded-lg overflow-hidden border-2 transition-all",
                      photoURL === url ? "border-brand-accent scale-110 shadow-md" : "border-transparent hover:border-slate-300"
                    )}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email Address</label>
                  <input 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-500 cursor-not-allowed outline-none"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Email cannot be changed for security reasons.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
              <p className="text-sm text-slate-500">Manage how you receive alerts and updates.</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Shipment Delays', desc: 'Get notified when a shipment is delayed by more than 2 hours.' },
              { label: 'Fleet Maintenance', desc: 'Alerts for scheduled and emergency vehicle maintenance.' },
              { label: 'Weekly Reports', desc: 'Receive a summary of fleet performance every Monday.' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <div className="w-12 h-6 bg-brand-accent rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Section */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-rose-50 rounded-xl">
              <Shield className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Security</h3>
              <p className="text-sm text-slate-500">Protect your account with advanced security features.</p>
            </div>
          </div>

          <button className="px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all">
            Enable Two-Factor Authentication
          </button>
        </div>

        {/* Danger Zone */}
        <div className="glass-card p-6 border-rose-100 bg-rose-50/30">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-rose-100 rounded-xl">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Danger Zone</h3>
              <p className="text-sm text-slate-500">Irreversible actions for your account and data.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-rose-100">
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">Reset Application Data</p>
              <p className="text-xs text-slate-500 max-w-md">
                This will permanently delete all shipments and vehicles from the database. 
                This action cannot be undone.
              </p>
            </div>
            <button 
              onClick={() => setIsResetModalOpen(true)}
              disabled={isResetting}
              className="px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center gap-2 disabled:opacity-50"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Reset All Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-all">
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-brand-accent text-white font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-blue-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      <ConfirmationModal 
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetData}
        title="Reset All Data?"
        message="This action will permanently delete all shipments and vehicles. You will not be able to recover this data. Are you sure you want to proceed?"
        confirmLabel="Yes, Reset Everything"
        cancelLabel="No, Keep Data"
        variant="danger"
      />
    </div>
  );
}
