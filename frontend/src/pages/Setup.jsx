import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Rocket, Database, CheckCircle2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Setup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const navigate = useNavigate();

  const runSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/auth/setup`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setCredentials(data.admin);
        setStep(3);
        toast.success('System initialized successfully!');
      } else {
        toast.error(data.error || 'Setup failed');
      }
    } catch (error) {
      toast.error('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-3xl shadow-xl border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-primary p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <Rocket size={32} />
            </div>
            <h1 className="text-2xl font-black">System Setup Wizard</h1>
            <p className="text-white/80 font-bold text-xs uppercase tracking-widest mt-2">Initializing OrbX Retail Suite</p>
          </div>

          <div className="p-10">
            {step === 1 && (
              <div className="text-center animate-fade-in">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                  <Database size={40} />
                </div>
                <h2 className="text-xl font-black mb-3">Welcome to OrbX ERP</h2>
                <p className="text-muted font-medium mb-8">
                  It looks like this is the first time you're starting the system. 
                  We need to initialize the database, create default roles, and set up your Superadmin account.
                </p>
                <button 
                  onClick={() => setStep(2)}
                  className="btn btn-primary w-full py-4 rounded-2xl text-lg font-black shadow-lg shadow-primary/20"
                >
                  Start Initialization
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in">
                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                  <ShieldCheck className="text-primary" /> System Readiness
                </h3>
                <div className="space-y-4 mb-8">
                  {[
                    "Create 'Administrator', 'Warehouse', and 'Branch' roles",
                    "Configure Head Office (HQ) branch",
                    "Setup Superadmin account with full access",
                    "Initialize default module layouts",
                    "Configure document sequences (POS, INV, etc.)"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-border">
                      <CheckCircle2 size={18} className="text-success" />
                      <span className="text-sm font-bold text-muted">{item}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={runSetup}
                  disabled={loading}
                  className="btn btn-primary w-full py-4 rounded-2xl text-lg font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Initializing Database...</span>
                    </>
                  ) : (
                    <span>Confirm & Setup System</span>
                  )}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="text-center animate-fade-in">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 text-success">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-xl font-black mb-3">Setup Complete!</h2>
                <p className="text-muted font-medium mb-8">
                  Your system is ready. Please save these Superadmin credentials carefully.
                </p>

                <div className="bg-gray-50 border border-border rounded-2xl p-6 text-left space-y-4 mb-8">
                  <div>
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest block mb-1">Superadmin Email</label>
                    <div className="flex items-center justify-between bg-white border border-border p-3 rounded-xl">
                      <code className="text-primary font-black">{credentials?.email}</code>
                      <button onClick={() => copyToClipboard(credentials?.email)} className="text-muted hover:text-primary"><Copy size={16}/></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest block mb-1">Initial Password</label>
                    <div className="flex items-center justify-between bg-white border border-border p-3 rounded-xl">
                      <code className="text-primary font-black">{credentials?.password}</code>
                      <button onClick={() => copyToClipboard(credentials?.password)} className="text-muted hover:text-primary"><Copy size={16}/></button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/login')}
                  className="btn btn-primary w-full py-4 rounded-2xl text-lg font-black shadow-lg shadow-primary/20"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-center mt-8 text-xs font-bold text-muted uppercase tracking-widest">
          &copy; 2026 OrbX Systems. Secure Installation.
        </p>
      </div>
    </div>
  );
}
