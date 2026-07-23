import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  Zap, 
  MessageSquare, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  Wand2, 
  PlayCircle, 
  Loader2, 
  Music, 
  Download,
  Settings,
  Key,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  X,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GEMINI_VOICES, 
  STYLE_PRESETS 
} from './constants';
import { generateGeminiTts, generateAiScript } from './services/geminiService';
import { isLicenseActivated, downloadLicenseBackupFile } from './services/licenseService';
import { LicenseLockScreen } from './components/LicenseLockScreen';
import { AdminPortalModal } from './components/AdminPortalModal';

export default function App() {
  // License Activation State
  const [isActivated, setIsActivated] = useState<boolean>(() => isLicenseActivated());
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // App State
  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    return sessionStorage.getItem('textspeech_has_entered') === 'true';
  });
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [inputApiKey, setInputApiKey] = useState<string>('');
  const [showKeyInInput, setShowKeyInInput] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [apiKeySavedSuccess, setApiKeySavedSuccess] = useState<boolean>(false);

  // Main TTS Form State
  const [script, setScript] = useState('');
  const [styleInstruction, setStyleInstruction] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(GEMINI_VOICES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAiWriting, setIsAiWriting] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [history, setHistory] = useState<{id: string, name: string, url: string, timestamp: number}[]>([]);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Cooldown countdown timer effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Load API Key & History on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('textspeech_user_api_key');
    if (savedApiKey) {
      setUserApiKey(savedApiKey);
      setInputApiKey(savedApiKey);
    }

    const savedHistory = localStorage.getItem('textspeech_tts_history') || localStorage.getItem('bamz_tts_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('textspeech_tts_history', JSON.stringify(history));
  }, [history]);

  const handleSaveApiKey = (keyToSave?: string) => {
    const key = keyToSave !== undefined ? keyToSave.trim() : inputApiKey.trim();
    if (key) {
      localStorage.setItem('textspeech_user_api_key', key);
      setUserApiKey(key);
      setInputApiKey(key);
      setApiKeySavedSuccess(true);
      setTimeout(() => setApiKeySavedSuccess(false), 3000);
    } else {
      handleRemoveApiKey();
    }
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem('textspeech_user_api_key');
    setUserApiKey('');
    setInputApiKey('');
  };

  const handlePreviewVoice = async (e: React.MouseEvent, voiceId: string, voiceName: string) => {
    e.stopPropagation();
    if (previewingVoice) return;
    if (cooldownSeconds > 0) {
      setError(`Harap tunggu ${cooldownSeconds} detik lagi sebelum tes suara (Anti-Spam).`);
      return;
    }

    setPreviewingVoice(voiceId);
    setError(null);
    try {
      const sampleText = `Halo, saya ${voiceName}. Senang bisa membantu Anda.`;
      const url = await generateGeminiTts(sampleText, voiceId, "Say naturally: ", userApiKey);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setPreviewingVoice(null);
      };
      await audio.play();
      setCooldownSeconds(4); // Brief cooldown after preview
    } catch (err: any) {
      console.error("Preview failed", err);
      setError("Gagal tes suara: " + (err?.message || "Terjadi kesalahan."));
      setPreviewingVoice(null);
      setCooldownSeconds(12); // Cooldown on error
    }
  };

  const handleAiAutoWrite = async () => {
    if (isAiWriting) return;
    setIsAiWriting(true);
    setError(null);
    try {
      const generated = await generateAiScript(script || "a random funny topic", userApiKey);
      setScript(generated);
    } catch (err: any) {
      setError("Gagal menulis AI: " + err.message);
    } finally {
      setIsAiWriting(false);
    }
  };

  const handleGenerate = async () => {
    if (cooldownSeconds > 0) {
      setError(`Harap tunggu ${cooldownSeconds} detik lagi sebelum generate ulang (Anti-Spam).`);
      return;
    }

    if (!script) {
      setError("Script tidak boleh kosong!");
      return;
    }

    if (script.length > 25000) {
      setError("Script terlalu panjang! Maksimal 25.000 karakter.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);

    try {
      const url = await generateGeminiTts(script, selectedVoice, styleInstruction, userApiKey);
      setAudioUrl(url);
      setSuccess(true);
      setCooldownSeconds(6); // 6s cooldown on success to prevent rapid re-click spam
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat generate audio.");
      setCooldownSeconds(15); // 15s cooldown on error rate limits
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToHistory = () => {
    if (!audioUrl) return;
    
    const newEntry = {
      id: Date.now().toString(),
      name: fileName || `Audio ${new Date().toLocaleString()}`,
      url: audioUrl,
      timestamp: Date.now()
    };
    
    setHistory([newEntry, ...history]);
    setFileName('');
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(history.filter(item => item.id !== id));
  };

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const charCount = script.length;
  const estimasiWaktu = Math.ceil(charCount / 15);

  if (!isActivated) {
    return <LicenseLockScreen onActivated={() => setIsActivated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a1224] text-slate-200 font-sans selection:bg-yellow-400/30">
      
      {/* ----------------- LANDING SCREEN (If not entered yet) ----------------- */}
      {!hasEntered ? (
        <div className="min-h-screen flex flex-col justify-between items-center px-6 py-10 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/60 via-[#0a1224] to-[#050914]">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-400/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Top Brand Banner */}
          <div className="text-center space-y-3 z-10 max-w-2xl mt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full shadow-lg shadow-yellow-400/10 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                Gemini Flash TTS Engine
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              "Textspeech" <span className="text-yellow-400">by AniKi ID</span>
            </h1>
            <p className="text-sm md:text-base text-slate-300 font-medium tracking-wide">
              Yapping pakai teks pun jadi
            </p>
          </div>

          {/* Center Card */}
          <div className="w-full max-w-xl my-8 bg-[#101b33]/90 border border-blue-900/60 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 z-10 backdrop-blur-md">
            
            {/* Guide & Input API Key Section */}
            <div className="bg-[#09101f] rounded-2xl p-5 border border-yellow-400/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-yellow-400/10 rounded-xl border border-yellow-400/30">
                    <Key className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Masukkan API Key Gemini</h3>
                    <p className="text-[11px] text-slate-400">
                      {userApiKey ? "limit generatemu jauh lebih banyak" : "limit generatemu minim"}
                    </p>
                  </div>
                </div>
                {userApiKey ? (
                  <span className="text-[10px] font-bold font-mono px-2.5 py-1 bg-emerald-400/15 border border-emerald-400/40 text-emerald-400 rounded-lg flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> apikey on
                  </span>
                ) : (
                  <span className="text-[10px] font-bold font-mono px-2.5 py-1 bg-red-500/15 border border-red-500/40 text-red-400 rounded-lg flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> apikey off
                  </span>
                )}
              </div>

              {/* Tutorial Box */}
              <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-3.5 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-yellow-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" /> Cara Buat API Key Gratis:
                  </span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                  <li>Buka <strong className="text-white">Google AI Studio</strong> (gratis & tanpa kartu kredit).</li>
                  <li>Login dengan akun Google milikmu.</li>
                  <li>Klik tombol <strong className="text-yellow-400">"Create API key"</strong> lalu salin kodenya.</li>
                </ol>
                <div className="pt-1">
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/40 text-yellow-400 font-bold text-[11px] rounded-lg transition-all"
                  >
                    <span>Klik di sini untuk buat API key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Input Form */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showKeyInInput ? "text" : "password"}
                    placeholder="Tempelkan API Key-mu di sini (AIzaSy...)"
                    value={inputApiKey}
                    onChange={(e) => setInputApiKey(e.target.value)}
                    className="w-full bg-[#0a1224] border border-blue-900/50 rounded-xl pl-4 pr-10 py-3 text-xs text-white placeholder:text-slate-500 focus:border-yellow-400 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyInInput(!showKeyInInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showKeyInInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {inputApiKey ? (
                    <button
                      onClick={() => handleSaveApiKey()}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-yellow-400/20 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Simpan API Key
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500">Boleh dikosongkan jika ingin pakai default.</span>
                  )}

                  {userApiKey && (
                    <button
                      onClick={handleRemoveApiKey}
                      className="text-[11px] text-red-400 hover:text-red-300 underline"
                    >
                      Hapus Key Saya
                    </button>
                  )}
                </div>

                {apiKeySavedSuccess && (
                  <p className="text-[11px] text-yellow-400 font-semibold flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3.5 h-3.5" /> API Key berhasil disimpan!
                  </p>
                )}
              </div>
            </div>

            {/* Main Entry Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  if (inputApiKey.trim() && !userApiKey) {
                    handleSaveApiKey();
                  }
                  sessionStorage.setItem('textspeech_has_entered', 'true');
                  setHasEntered(true);
                }}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:scale-[1.01] active:scale-[0.99] text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-yellow-400/20 border border-yellow-300/40 flex items-center justify-center gap-2 transition-all"
              >
                <span>Masuk ke Aplikasi</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Kamu dapat langsung masuk & mengatur API Key kapan saja melalui menu Pengaturan.
              </p>
            </div>

          </div>

          {/* Footer Copyright */}
          <div className="text-center space-y-1.5 z-10 font-mono text-xs text-slate-400">
            <p className="font-semibold text-slate-300 text-xs tracking-wide">TextSpeech &copy; 2026</p>
            <p>
              <button
                type="button"
                onClick={() => setShowAdminModal(true)}
                className="text-[10px] text-slate-500 hover:text-slate-400 transition-colors focus:outline-none select-none cursor-default"
                title=""
              >
                by AniKi ID
              </button>
            </p>
            <p className="text-[10px] text-slate-500/80">Yapping pakai teks pun jadi.</p>
          </div>
        </div>
      ) : (

        /* ----------------- MAIN APP WORKSPACE ----------------- */
        <>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-[#0a1224]/85 backdrop-blur-md border-b border-yellow-400/20 shadow-lg shadow-black/40">
            <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src="/pwa-icon.svg" 
                    alt="Textspeech Logo" 
                    className="w-11 h-11 rounded-xl shadow-lg shadow-yellow-400/20 border border-yellow-400/30 object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tighter text-white uppercase flex items-center gap-1.5 flex-wrap">
                    "Textspeech" <span className="text-xs font-bold text-yellow-400 normal-case tracking-normal">by AniKi ID</span>
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                    Yapping pakai teks pun jadi
                  </p>
                </div>
              </div>

              {/* Right Settings Toggle */}
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#101b33] border border-blue-900/50 hover:border-yellow-400/40 transition-all text-xs font-bold text-slate-200 hover:text-yellow-400 shadow-md"
              >
                <Settings className="w-4 h-4 text-yellow-400" />
                <span className="hidden sm:inline">Pengaturan API Key</span>
                {userApiKey ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-400/30">apikey on</span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-mono font-bold border border-red-500/30">apikey off</span>
                )}
              </button>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

            {/* Warning Banner if API Key is not set */}
            {!userApiKey && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-400/10 border border-yellow-400/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-yellow-400/5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-400/20 rounded-xl border border-yellow-400/40 shrink-0">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Peringatan Kuota & Limit</h4>
                    <p className="text-xs text-slate-200 mt-0.5 font-medium">
                      Masukkan Api key mu Agar limit generatemu lebih banyak dan tidak error
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs rounded-xl transition-all shrink-0 flex items-center gap-1.5 shadow-md shadow-yellow-400/20"
                >
                  <Key className="w-3.5 h-3.5" />
                  Atur API Key
                </button>
              </motion.div>
            )}

            {/* Title Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl w-fit shadow-sm shadow-yellow-400/10">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Gemini Flash TTS</span>
              </div>

              {userApiKey && (
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-yellow-400" /> Menggunakan API Key Pribadi
                </span>
              )}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column - Config */}
              <div className="space-y-6">
                <section className="bg-[#101b33]/90 rounded-3xl border border-blue-900/50 shadow-xl p-6 space-y-6">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <h2 className="text-xs font-bold uppercase tracking-widest">Konfigurasi</h2>
                  </div>

                  {/* Voice Options */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Pilih Suara</label>
                    
                    <div className="space-y-6">
                      {/* Male Voices */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest">
                          <div className="w-4 h-[1px] bg-slate-800" />
                          Laki-laki
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {GEMINI_VOICES.filter(v => v.gender === 'Laki-laki' || (v.gender as string) === 'male').map((v) => (
                            <button
                              key={v.id}
                              onClick={() => setSelectedVoice(v.id)}
                              className={`flex flex-col items-start p-2 rounded-lg border transition-all text-left group relative ${
                                selectedVoice === v.id 
                                  ? 'bg-yellow-400/15 border-yellow-400 shadow-md shadow-yellow-400/20' 
                                  : 'bg-[#09101f] border-blue-900/30 hover:border-yellow-400/40'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`text-[11px] font-bold truncate ${selectedVoice === v.id ? 'text-yellow-400' : 'text-white'}`}>
                                  {v.name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span
                                    onClick={(e) => handlePreviewVoice(e, v.id, v.name)}
                                    className={`p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer ${previewingVoice === v.id ? 'text-yellow-400' : 'text-slate-500'}`}
                                    title="Test Suara"
                                  >
                                    {previewingVoice === v.id ? (
                                      <Loader2 className="w-2.5 h-2.5 animate-spin text-yellow-400" />
                                    ) : (
                                      <PlayCircle className="w-2.5 h-2.5" />
                                    )}
                                  </span>
                                  {selectedVoice === v.id && <CheckCircle className="w-2.5 h-2.5 text-yellow-400 shrink-0" />}
                                </div>
                              </div>
                              <p className="text-[8px] text-slate-500 mt-0.5 leading-tight group-hover:text-slate-400 transition-colors line-clamp-1">
                                {v.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Female Voices */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest">
                          <div className="w-4 h-[1px] bg-slate-800" />
                          Perempuan
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {GEMINI_VOICES.filter(v => v.gender === 'Perempuan' || (v.gender as string) === 'female').map((v) => (
                            <button
                              key={v.id}
                              onClick={() => setSelectedVoice(v.id)}
                              className={`flex flex-col items-start p-2 rounded-lg border transition-all text-left group relative ${
                                selectedVoice === v.id 
                                  ? 'bg-yellow-400/15 border-yellow-400 shadow-md shadow-yellow-400/20' 
                                  : 'bg-[#09101f] border-blue-900/30 hover:border-yellow-400/40'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`text-[11px] font-bold truncate ${selectedVoice === v.id ? 'text-yellow-400' : 'text-white'}`}>
                                  {v.name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span
                                    onClick={(e) => handlePreviewVoice(e, v.id, v.name)}
                                    className={`p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer ${previewingVoice === v.id ? 'text-yellow-400' : 'text-slate-500'}`}
                                    title="Test Suara"
                                  >
                                    {previewingVoice === v.id ? (
                                      <Loader2 className="w-2.5 h-2.5 animate-spin text-yellow-400" />
                                    ) : (
                                      <PlayCircle className="w-2.5 h-2.5" />
                                    )}
                                  </span>
                                  {selectedVoice === v.id && <CheckCircle className="w-2.5 h-2.5 text-yellow-400 shrink-0" />}
                                </div>
                              </div>
                              <p className="text-[8px] text-slate-500 mt-0.5 leading-tight group-hover:text-slate-400 transition-colors line-clamp-1">
                                {v.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expression Instruction */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Style Instruction</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        placeholder="Contoh: Berbisik, Marah..."
                        value={styleInstruction}
                        onChange={(e) => setStyleInstruction(e.target.value)}
                        className="w-full bg-[#09101f] border border-blue-900/40 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-yellow-400 outline-none transition-colors text-white"
                      />
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {STYLE_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => setStyleInstruction(p.instruction)}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[#09101f] border border-blue-900/40 text-slate-300 hover:bg-blue-950 hover:border-yellow-400/40 transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 px-4 py-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">Gratis & Cepat</span>
                  </div>
                </section>

                <section className="hidden md:block bg-[#101b33]/90 rounded-3xl border border-blue-900/50 p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                      <span>Panjang Karakter</span>
                      <span className={charCount > 25000 ? 'text-red-400' : 'text-slate-300'}>{charCount} / 25000</span>
                    </div>
                    <div className="h-1.5 bg-[#09101f] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((charCount / 25000) * 100, 100)}%` }}
                        className={`h-full transition-colors duration-500 ${charCount > 25000 ? 'bg-red-500' : 'bg-yellow-400'}`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-blue-900/40">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Estimasi Waktu</span>
                    <span className="text-xs font-mono text-slate-300">{estimasiWaktu} detik</span>
                  </div>
                </section>
              </div>

              {/* Right Column - Editor & Output */}
              <div className="md:col-span-2 space-y-6">
                <section className="bg-[#101b33]/90 rounded-3xl border border-blue-900/50 flex flex-col overflow-hidden shadow-2xl">
                  <div className="px-6 py-4 border-b border-blue-900/40 flex items-center justify-between bg-[#0b1428]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse shadow-sm shadow-yellow-400" />
                      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">Script Editor</h2>
                    </div>
                    <button 
                      onClick={handleAiAutoWrite}
                      disabled={isAiWriting}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-[10px] font-bold uppercase hover:bg-yellow-400/20 transition-all disabled:opacity-50"
                    >
                      {isAiWriting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      AI Auto-Write
                    </button>
                  </div>

                  <div className="relative flex-1 min-h-[220px]">
                    <textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      placeholder="Tulis teks yapping-mu di sini..."
                      className="w-full h-full bg-transparent p-8 text-lg md:text-xl outline-none resize-none placeholder:text-slate-600 text-white font-medium leading-relaxed"
                    />
                  </div>

                  <div className="p-6 bg-[#0b1428] border-t border-blue-900/40 space-y-4">
                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                          </div>
                          {(error.includes("API Key") || error.includes("Limit") || error.includes("Kuota") || error.includes("429")) && (
                            <button
                              onClick={() => setShowSettings(true)}
                              className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs rounded-xl transition-all shrink-0 flex items-center gap-1.5 shadow-md shadow-yellow-400/20"
                            >
                              <Key className="w-3.5 h-3.5" />
                              Atur API Key
                            </button>
                          )}
                        </motion.div>
                      )}

                      {success && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-3 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl text-yellow-400 text-sm"
                        >
                          <CheckCircle className="w-5 h-5 shrink-0 text-yellow-400" />
                          Audio berhasil digenerate!
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || cooldownSeconds > 0}
                      className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg tracking-tight transition-all duration-500 group relative overflow-hidden ${
                        isGenerating || cooldownSeconds > 0
                          ? 'bg-slate-800/80 text-slate-400 cursor-not-allowed border border-slate-700/60' 
                          : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-yellow-400/25 border border-yellow-300/50'
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                          <span>Sedang Memproses...</span>
                        </>
                      ) : cooldownSeconds > 0 ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                          <span className="text-amber-400 font-bold text-base">Tunggu {cooldownSeconds}s (Anti-Spam Cooldown)</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform text-slate-950" />
                          <span>Generate Suara Sekarang</span>
                        </>
                      )}
                    </button>
                  </div>
                </section>

                {/* Generated Audio Display */}
                <AnimatePresence>
                  {audioUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 40, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 40, scale: 0.95 }}
                      className="bg-[#101b33]/95 rounded-3xl border border-yellow-400/40 p-8 flex flex-col items-center text-center space-y-6 backdrop-blur-sm shadow-2xl shadow-yellow-400/10"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full animate-pulse" />
                        <div className="relative w-20 h-20 bg-[#09101f] border border-yellow-400/50 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/20">
                          <Music className="w-10 h-10 text-yellow-400" />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-black text-white">Audio Berhasil Dibuat</h3>
                        <p className="text-sm text-slate-400 mt-1">Siap untuk dimainkan atau disimpan.</p>
                      </div>

                      <div className="w-full max-w-md space-y-2 text-left">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nama Hasil Simpan</label>
                        <input 
                          type="text"
                          placeholder="Contoh: Textspeech Yapping..."
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          className="w-full bg-[#09101f] border border-blue-900/40 rounded-xl px-4 py-3 text-sm focus:border-yellow-400 outline-none transition-colors text-white"
                        />
                      </div>

                      <audio 
                        src={audioUrl} 
                        controls 
                        className="w-full max-w-md h-12 rounded-full brightness-110 contrast-125" 
                      />

                      <div className="flex flex-wrap justify-center gap-3">
                        <button
                          onClick={handleSaveToHistory}
                          className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-slate-950 rounded-xl text-sm font-bold hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Simpan ke Riwayat
                        </button>
                        <a 
                          href={audioUrl} 
                          download={`${fileName || 'textspeech'}.wav`}
                          className="flex items-center gap-2 px-6 py-3 bg-[#09101f] border border-blue-900/50 rounded-xl text-sm font-bold hover:bg-blue-950 transition-all hover:border-yellow-400/50 text-white"
                        >
                          <Download className="w-4 h-4" />
                          Download File
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* History Section */}
                {history.length > 0 && (
                  <section className="bg-[#101b33]/90 rounded-3xl border border-blue-900/50 overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-blue-900/40 bg-[#0b1428] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-yellow-400" />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">Riwayat Simpan</h2>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{history.length} Item</span>
                    </div>
                    <div className="divide-y divide-blue-900/30 max-h-[400px] overflow-y-auto">
                      {history.map((item) => (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#09101f] border border-blue-900/40 flex items-center justify-center shrink-0">
                              <Volume2 className="w-5 h-5 text-slate-400 group-hover:text-yellow-400 transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                              <p className="text-[10px] text-slate-500 uppercase font-medium">
                                {new Date(item.timestamp).toLocaleDateString()} &bull; {new Date(item.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a 
                              href={item.url} 
                              download={`${item.name}.wav`}
                              className="p-2 rounded-lg hover:bg-yellow-400/10 text-slate-400 hover:text-yellow-400 transition-all"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button 
                              onClick={() => handleDeleteHistory(item.id)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
                              title="Hapus"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </main>

          <footer className="max-w-4xl mx-auto px-6 py-12 text-center border-t border-blue-900/40 space-y-1.5 font-mono text-xs text-slate-400">
            <p className="font-semibold text-slate-300 text-xs tracking-wide">TextSpeech &copy; 2026</p>
            <p>
              <button
                type="button"
                onClick={() => setShowAdminModal(true)}
                className="text-[10px] text-slate-500 hover:text-slate-400 transition-colors focus:outline-none select-none cursor-default"
                title=""
              >
                by AniKi ID
              </button>
            </p>
            <p className="text-[10px] text-slate-500/80">Yapping pakai teks pun jadi.</p>
          </footer>
        </>
      )}

      {/* ----------------- SETTINGS MODAL ----------------- */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#101b33] border border-blue-900/60 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative space-y-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowSettings(false)}
                className="absolute right-5 top-5 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-400/15 border border-yellow-400/30 rounded-2xl">
                  <Key className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Pengaturan API Key Gemini</h3>
                  <p className="text-xs text-slate-400">
                    {userApiKey ? "limit generatemu jauh lebih banyak" : "limit generatemu minim"}
                  </p>
                </div>
              </div>

              {/* Status Badge & License Backup */}
              <div className="p-3.5 bg-[#09101f] border border-blue-900/40 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Key Gemini:</span>
                  {userApiKey ? (
                    <span className="font-bold font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-400/30">
                      <ShieldCheck className="w-4 h-4" /> apikey on
                    </span>
                  ) : (
                    <span className="font-bold font-mono text-red-400 flex items-center gap-1.5 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/30">
                      <AlertCircle className="w-4 h-4" /> apikey off
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-blue-900/30 flex items-center justify-between">
                  <span className="text-slate-400">Cadangan Lisensi (.aniki):</span>
                  <button
                    type="button"
                    onClick={() => downloadLicenseBackupFile()}
                    className="px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Cadangan Lisensi
                  </button>
                </div>
              </div>

              {/* Tutorial Step Box */}
              <div className="bg-blue-950/50 border border-blue-800/40 rounded-2xl p-4 space-y-2.5 text-xs text-slate-300">
                <h4 className="font-bold text-yellow-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> Panduan Membuat API Key (Gratis):
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                  <li>Buka website resmi <strong className="text-white">Google AI Studio</strong>.</li>
                  <li>Login menggunakan akun Google pribadi milikmu.</li>
                  <li>Klik tombol <strong className="text-yellow-400">"Create API key"</strong> di pojok kanan atas.</li>
                  <li>Salin kode API key lalu tempelkan di kolom input di bawah.</li>
                </ol>
                <div className="pt-2">
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/40 text-yellow-400 font-bold text-xs rounded-xl transition-all"
                  >
                    <span>Klik di sini untuk buat API key di Google AI Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Input & Action */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Masukkan / Ubah API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeyInInput ? "text" : "password"}
                    placeholder="AIzaSy..."
                    value={inputApiKey}
                    onChange={(e) => setInputApiKey(e.target.value)}
                    className="w-full bg-[#09101f] border border-blue-900/50 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:border-yellow-400 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyInInput(!showKeyInInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showKeyInInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {apiKeySavedSuccess && (
                  <p className="text-xs text-yellow-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> API Key berhasil disimpan!
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  {userApiKey && (
                    <button
                      onClick={() => {
                        handleRemoveApiKey();
                        setShowSettings(false);
                      }}
                      className="px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Key
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleSaveApiKey();
                      setShowSettings(false);
                    }}
                    className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-yellow-400/20"
                  >
                    Simpan & Tutup
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Portal Modal */}
      <AdminPortalModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onActivatedSuccess={() => setIsActivated(true)}
      />

    </div>
  );
}
