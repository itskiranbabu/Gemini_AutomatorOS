
import React, { useState, useEffect } from 'react';
import { User, Shield, CreditCard, Bell, Key, Save } from 'lucide-react';
import { useAutomator } from '../store/AutomatorContext';
import { useToast } from '../store/ToastContext';

export const Settings = () => {
  const { profile, updateProfile } = useAutomator();
  const { addToast } = useToast();
  
  // Local form state
  const [formData, setFormData] = useState(profile);
  
  // Sync when profile updates from context
  useEffect(() => {
      setFormData(profile);
  }, [profile]);

  const handleSave = () => {
      updateProfile(formData);
      addToast('success', 'Workspace settings saved successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8">Settings</h2>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 space-y-1">
          <button className="w-full flex items-center space-x-3 px-4 py-2 bg-brand-600/10 text-brand-400 border-l-2 border-brand-500 rounded-r-lg font-medium text-sm">
            <User size={16} />
            <span>General</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg transition-colors font-medium text-sm">
            <Shield size={16} />
            <span>Team & Roles</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg transition-colors font-medium text-sm">
            <Key size={16} />
            <span>API Keys</span>
          </button>
           <button className="w-full flex items-center space-x-3 px-4 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg transition-colors font-medium text-sm">
            <Bell size={16} />
            <span>Notifications</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg transition-colors font-medium text-sm">
            <CreditCard size={16} />
            <span>Billing</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {/* Profile Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Workspace Profile</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Workspace Name</label>
                <input 
                    type="text" 
                    value={formData.workspaceName}
                    onChange={(e) => setFormData({...formData, workspaceName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand-500 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Contact Email</label>
                <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand-500 transition-colors" 
                />
              </div>
               <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Plan</label>
                <input 
                    type="text" 
                    value={formData.plan}
                    disabled
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed" 
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleSave}
                className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 shadow-lg shadow-brand-900/20"
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          {/* API Keys */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">API Keys</h3>
              <button className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors">
                + Create New Key
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-brand-500/10 rounded-lg">
                    <Key size={16} className="text-brand-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">Production Key</div>
                    <div className="text-xs text-slate-500">Last used 2 hours ago</div>
                  </div>
                </div>
                <div className="font-mono text-xs text-slate-500">pk_live_...93d2</div>
              </div>
               <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <Key size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">Test Key</div>
                    <div className="text-xs text-slate-500">Never used</div>
                  </div>
                </div>
                <div className="font-mono text-xs text-slate-500">pk_test_...82a1</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
