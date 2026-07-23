import React, { useState, useEffect, useRef } from 'react';
import { Key, Copy, Check, ShieldCheck, MessageCircle, ArrowRight, Lock, Sparkles, CheckCircle2, Download, Upload, FileCode } from 'lucide-react';
import {
  getOrCreateDeviceId,
  activateLicense,
  getWhatsAppUrl,
  tryAsyncLicenseRestore,
  importLicenseBackupFile,
  downloadLicenseBackupFile,
} from '../services/licenseService';
import { AdminPortalModal } from './AdminPortalModal';

interface LicenseLockScreenProps {
  onActivated: () => void;
}

export const LicenseLockScreen: React.FC<LicenseLockScreenProps> = ({ onActivated }) => {
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [licenseInput, setLicenseInput] = useState('');
  const [copiedDevId, setCopiedDevId] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto restore check from IndexedDB if LocalStorage was cleared
  useEffect(() => {
    tryAsyncLicenseRestore().then((restored) => {
      if (restored) {
        onActivated();
      }
    });
  }, [onActivated]);

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedDevId(true);
    setTimeout(() => setCopiedDevId(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const url = getWhatsAppUrl(deviceId);
    window.open(url, '_blank');
  };

  const handleActivate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!licenseInput.trim()) {
      setErrorMessage('Harap masukkan Kunci Lisensi terlebih dahulu.');
      return;
    }

    const result = activateLicense(licenseInput);
    if (result.success) {
      setSuccessMessage(result.message);
      setTimeout(() => {
        onActivated();
      }, 1000);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const result = importLicenseBackupFile(content);
      if (result.success) {
        setSuccessMessage("File Cadangan Lisensi Berhasil Dipulihkan!");
        setTimeout(() => {
          onActivated();
        }, 1000);
      } else {
        setErrorMessage(result.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-yellow-400 selection:text-slate-950">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 space-y-8 animate-fade-in my-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-amber-400 tracking-wider uppercase backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            Textspeech by AniKi
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Gudang Konten <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">ANI KI</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm tracking-widest font-mono uppercase">
            Voice Generator & Video Creator AI Engine
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/80 space-y-6">
          
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                VERIFIKASI KODE LISENSI
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Aplikasi ini dilindungi sistem lisensi. Kirimkan Kunci Alat (Request Key) Anda ke WhatsApp Admin untuk mendapatkan Kunci Aktivasi.
              </p>
            </div>
            <div className="hidden sm:block">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                PROTECTED SYSTEM
              </span>
            </div>
          </div>

          {/* Device Key Box */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              KUNCI ALAT PERANGKAT ANDA:
            </label>
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
              <Key className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="flex-1 font-mono text-base sm:text-lg font-bold tracking-wider text-yellow-300 select-all overflow-x-auto">
                {deviceId}
              </div>
              <button
                type="button"
                onClick={handleCopyDeviceId}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shrink-0 active:scale-95"
                title="Salin Kunci Alat"
              >
                {copiedDevId ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* WhatsApp Action Button */}
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/50 hover:shadow-emerald-600/20 active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>KIRIM KUNCI ALAT KE WHATSAPP ADMIN</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* License Form */}
          <form onSubmit={handleActivate} className="space-y-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                MASUKKAN KUNCI LISENSI / AKTIVASI:
              </label>
              <input
                type="text"
                value={licenseInput}
                onChange={(e) => {
                  setLicenseInput(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="ANIKI-XXXXX-XXXXX"
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-2xl font-mono text-center text-base sm:text-lg tracking-widest text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/20 uppercase transition-all"
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium text-center animate-shake">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-amber-400/20"
            >
              AKTIFKAN SEKARANG
            </button>
          </form>

          {/* Backup Import Option */}
          <div className="pt-2 border-t border-slate-800/60">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".aniki,.json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Sudah punya file cadangan? Impor File Lisensi (.aniki)</span>
            </button>
          </div>

          {/* Secret Admin Trigger Footer */}
          <div className="pt-4 border-t border-slate-800/40 text-center flex items-center justify-between text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="hover:text-amber-400 transition-colors uppercase tracking-widest font-mono text-[10px]"
            >
              ADMIN SYSTEM PORTAL
            </button>
            <span className="font-mono text-[10px]">v1.2.0 • ANI KI SECURE</span>
          </div>
        </div>

        {/* Footer Credit */}
        <p className="text-center text-xs font-mono tracking-widest text-slate-500 uppercase">
          CREATE BY ANIKI
        </p>
      </div>

      {/* Admin Portal Modal */}
      <AdminPortalModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onActivatedSuccess={onActivated}
      />
    </div>
  );
};

