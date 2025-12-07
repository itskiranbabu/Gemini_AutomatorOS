
import React, { useState } from 'react';
import { Zap, Mail, Lock, Loader2, ArrowRight, Github } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { enterGuestMode } = useAuth();
  const { addToast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
        addToast('error', 'Supabase client not initialized. Check env vars.');
        return;
    }
    setLoading(true);

    try {
        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            addToast('success', 'Welcome back!');
        } else {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            addToast('success', 'Account created! Please check your email.');
        }
    } catch (error: any) {
        addToast('error', error.message || 'Authentication failed');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
       {/* Background Effects */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
       </div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20 mb-4">
                <Zap className="text-white" size={24} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
                {isLogin ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-slate-400 text-sm mt-2">
                {isLogin ? 'Enter your credentials to access your workspace.' : 'Start automating your workflow in seconds.'}
            </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                        placeholder="name@company.com"
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-brand-900/20 flex items-center justify-center mt-6"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
        </form>

        <div className="mt-6 flex flex-col items-center space-y-4">
            <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-slate-400 hover:text-brand-400 transition-colors"
            >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
            
            <div className="w-full flex items-center justify-center space-x-2 py-4 border-t border-slate-800/50">
                 <button 
                    onClick={enterGuestMode}
                    className="text-xs text-slate-500 hover:text-white flex items-center space-x-1 transition-colors"
                 >
                    <span>Continue as Guest (Demo Mode)</span>
                    <ArrowRight size={12} />
                 </button>
            </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-slate-600">
        <p>By continuing, you agree to AutomatorOS Terms of Service.</p>
      </div>
    </div>
  );
};
