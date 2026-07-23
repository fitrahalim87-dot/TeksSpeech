import React, { useState } from 'react';
import { ShieldCheck, Lock, Copy, Check, Key, Unlock, X, Sparkles } from 'lucide-react';
import { generateLicenseKey, setLicenseActivationState } from '../services/licenseService';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivatedSuccess: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  onActivatedSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Admin keygen inputs
  const [targetDeviceId, setTargetDeviceId] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setIsAuthenticated(false);
    setPin('');
    setPinError(false);
    setTargetDeviceId('');
    setGeneratedKey('');
    onClose();
  };

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '2587' || pin === 'Alfathur12$') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleDeviceKeyChange = (val: string) => {
    setTargetDeviceId(val);
    if (val.trim()) {
      const key = generateLicenseKey(val.trim());
      setGeneratedKey(key);
    } else {
      setGeneratedKey('');
    }
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBypassUnlockCurrentDevice = () => {
    setLicenseActivationState(true);
    onActivatedSuccess();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-yellow-500/10 text-slate-100">
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors p-2 rounded-xl hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {!isAuthenticated ? (
          /* PIN Entry Screen */
          <div className="space-y-6 text-center py-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Portal Admin AniKi</h2>
              <p className="text-xs text-slate-400 mt-1">Masukkan kata sandi admin untuk mengakses generator lisensi.</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Masukkan Kata Sandi / PIN"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(false);
                  }}
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-2xl text-center text-lg font-mono text-white placeholder-slate-600 focus:outline-none transition-all ${
                    pinError
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                      : 'border-slate-800 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                  }`}
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-red-400 mt-2 font-medium">Kata sandi admin salah!</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
              >
                Masuk Portal Admin
              </button>
            </form>
          </div>
        ) : (
          /* Admin Generator Dashboard */
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">Generator Lisensi AniKi</h3>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sistem Aktif & Terverifikasi
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  1. Kunci Alat User (Request Key)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: ANIKI-DEV-XXXX-YYYY"
                  value={targetDeviceId}
                  onChange={(e) => handleDeviceKeyChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-yellow-300 placeholder-slate-600 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  2. Kunci Lisensi Yang Dihasilkan
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={generatedKey || 'Sistem siap (masukkan Kunci Alat)'}
                    className="w-full px-4 py-3 pr-12 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:outline-none"
                  />
                  {generatedKey && (
                    <button
                      onClick={handleCopyKey}
                      className="absolute right-2 top-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      title="Salin Kunci"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {generatedKey && (
                <button
                  onClick={handleCopyKey}
                  className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-medium text-xs flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Kunci Berhasil Disalin! Siap dikirim ke WA User.
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Salin Kunci Lisensi ke Clipboard
                    </>
                  )}
                </button>
              )}

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleBypassUnlockCurrentDevice}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-slate-700"
                >
                  <Unlock className="w-4 h-4 text-amber-400" />
                  Buka Akses Langsung Untuk Perangkat Ini
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
