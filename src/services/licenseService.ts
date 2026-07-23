// License service using deterministic mathematical hash generation & multi-layer persistence

const SECRET_SALT = "ANIKI_TTS_SALT_2587_ALFATHUR_SECRET";
const LICENSE_STORAGE_KEY = "aniki_license_activated";
const LICENSE_KEY_STORAGE = "aniki_license_key";
const DEVICE_ID_KEY = "aniki_device_id";

// Cookie Helpers for Long-Term Storage (10 Years Expiry)
function setCookie(name: string, value: string, days: number = 3650) {
  try {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "; expires=" + date.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Strict`;
  } catch (e) {
    console.warn("Cookie set error", e);
  }
}

function getCookie(name: string): string | null {
  try {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  } catch (e) {
    console.warn("Cookie get error", e);
  }
  return null;
}

// IndexedDB Helper for Deep Storage Recovery
const IDB_NAME = "AnikiLicenseDB";
const IDB_STORE = "license_store";

function openIDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (!window.indexedDB) return resolve(null);
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function saveToIndexedDB(key: string, val: string) {
  const db = await openIDB();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(val, key);
  } catch (e) {
    console.warn("IDB Save error", e);
  }
}

async function getFromIndexedDB(key: string): Promise<string | null> {
  const db = await openIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Gets or creates a unique persistent Device Key for this user browser.
 * Checks LocalStorage -> Cookies -> IndexedDB for recovery.
 */
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY) || getCookie(DEVICE_ID_KEY);

  if (!deviceId) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let p1 = "";
    let p2 = "";
    for (let i = 0; i < 4; i++) {
      p1 += chars.charAt(Math.floor(Math.random() * chars.length));
      p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    deviceId = `ANIKI-DEV-${p1}-${p2}`;
  }

  // Persist across all 3 storage mechanisms
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  setCookie(DEVICE_ID_KEY, deviceId);
  saveToIndexedDB(DEVICE_ID_KEY, deviceId);

  return deviceId;
}

/**
 * Async recovery check: Attempt to restore license from IndexedDB if LocalStorage/Cookie were wiped
 */
export async function tryAsyncLicenseRestore(): Promise<boolean> {
  const storedDevId = await getFromIndexedDB(DEVICE_ID_KEY);
  const storedKey = await getFromIndexedDB(LICENSE_KEY_STORAGE);

  if (storedDevId) {
    localStorage.setItem(DEVICE_ID_KEY, storedDevId);
    setCookie(DEVICE_ID_KEY, storedDevId);
  }

  if (storedDevId && storedKey && verifyLicenseKey(storedDevId, storedKey)) {
    localStorage.setItem(LICENSE_STORAGE_KEY, "true");
    localStorage.setItem(LICENSE_KEY_STORAGE, storedKey);
    setCookie(LICENSE_STORAGE_KEY, "true");
    setCookie(LICENSE_KEY_STORAGE, storedKey);
    return true;
  }
  return false;
}

/**
 * Mathematical formula to compute the valid ANIKI- license key for a given device ID
 */
export function generateLicenseKey(deviceId: string): string {
  const cleanDev = deviceId.trim().toUpperCase();
  const combine = cleanDev + SECRET_SALT;
  
  let h1 = 5381;
  let h2 = 2166136261;

  for (let i = 0; i < combine.length; i++) {
    const code = combine.charCodeAt(i);
    h1 = ((h1 << 5) + h1) ^ code;
    h2 = (h2 ^ code) * 16777619;
  }

  // Convert to base36 positive uppercase strings
  const part1 = Math.abs(h1 >>> 0).toString(36).toUpperCase().padStart(5, '0').slice(-5);
  const part2 = Math.abs(h2 >>> 0).toString(36).toUpperCase().padStart(5, '0').slice(-5);

  return `ANIKI-${part1}-${part2}`;
}

/**
 * Validates whether the provided license key matches the device ID
 */
export function verifyLicenseKey(deviceId: string, inputLicenseKey: string): boolean {
  if (!inputLicenseKey) return false;
  const expectedKey = generateLicenseKey(deviceId);
  const cleanInput = inputLicenseKey.trim().toUpperCase();
  return cleanInput === expectedKey;
}

/**
 * Check if the app is currently activated on this device
 */
export function isLicenseActivated(): boolean {
  const deviceId = getOrCreateDeviceId();
  const isActivatedLS = localStorage.getItem(LICENSE_STORAGE_KEY) === "true";
  const isActivatedCookie = getCookie(LICENSE_STORAGE_KEY) === "true";
  const storedKey = localStorage.getItem(LICENSE_KEY_STORAGE) || getCookie(LICENSE_KEY_STORAGE);

  if ((isActivatedLS || isActivatedCookie) && storedKey && verifyLicenseKey(deviceId, storedKey)) {
    // Synchronize multi-layer state
    localStorage.setItem(LICENSE_STORAGE_KEY, "true");
    localStorage.setItem(LICENSE_KEY_STORAGE, storedKey);
    setCookie(LICENSE_STORAGE_KEY, "true");
    setCookie(LICENSE_KEY_STORAGE, storedKey);
    saveToIndexedDB(LICENSE_STORAGE_KEY, "true");
    saveToIndexedDB(LICENSE_KEY_STORAGE, storedKey);
    return true;
  }

  return false;
}

/**
 * Activate the device with the license key
 */
export function activateLicense(licenseKey: string): { success: boolean; message: string } {
  const deviceId = getOrCreateDeviceId();
  const cleanKey = licenseKey.trim().toUpperCase();

  if (verifyLicenseKey(deviceId, cleanKey)) {
    // Multi-layer persistence
    localStorage.setItem(LICENSE_STORAGE_KEY, "true");
    localStorage.setItem(LICENSE_KEY_STORAGE, cleanKey);
    setCookie(LICENSE_STORAGE_KEY, "true");
    setCookie(LICENSE_KEY_STORAGE, cleanKey);
    saveToIndexedDB(LICENSE_STORAGE_KEY, "true");
    saveToIndexedDB(LICENSE_KEY_STORAGE, cleanKey);
    saveToIndexedDB(DEVICE_ID_KEY, deviceId);

    return { success: true, message: "Lisensi berhasil diaktivasi!" };
  } else {
    return { success: false, message: "Kunci Lisensi tidak valid untuk Kunci Alat ini." };
  }
}

/**
 * Force activate/deactivate (for Admin)
 */
export function setLicenseActivationState(active: boolean) {
  const deviceId = getOrCreateDeviceId();
  if (active) {
    const key = generateLicenseKey(deviceId);
    localStorage.setItem(LICENSE_STORAGE_KEY, "true");
    localStorage.setItem(LICENSE_KEY_STORAGE, key);
    setCookie(LICENSE_STORAGE_KEY, "true");
    setCookie(LICENSE_KEY_STORAGE, key);
    saveToIndexedDB(LICENSE_STORAGE_KEY, "true");
    saveToIndexedDB(LICENSE_KEY_STORAGE, key);
  } else {
    localStorage.removeItem(LICENSE_STORAGE_KEY);
    localStorage.removeItem(LICENSE_KEY_STORAGE);
    setCookie(LICENSE_STORAGE_KEY, "", -1);
    setCookie(LICENSE_KEY_STORAGE, "", -1);
  }
}

/**
 * Generate WhatsApp message URL
 */
export function getWhatsAppUrl(deviceId: string): string {
  const phone = "6282259652587";
  const message = `Halo Admin, saya baru mendapatkan izin memakai tools "Textspeech by AniKi" mau minta Kunci Lisensi untuk masuk aplikasinya dong. Kunci Alat saya: ${deviceId}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Download Backup File (.aniki)
 */
export function downloadLicenseBackupFile() {
  const deviceId = getOrCreateDeviceId();
  const licenseKey = localStorage.getItem(LICENSE_KEY_STORAGE) || generateLicenseKey(deviceId);
  const data = {
    app: "Textspeech by AniKi",
    deviceId,
    licenseKey,
    createdAt: new Date().toISOString(),
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Aniki_License_Backup_${deviceId}.aniki`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import Backup File (.aniki)
 */
export function importLicenseBackupFile(fileContent: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(fileContent);
    if (!data.deviceId || !data.licenseKey) {
      return { success: false, message: "File cadangan lisensi tidak valid." };
    }

    // Set device ID & license key
    localStorage.setItem(DEVICE_ID_KEY, data.deviceId);
    setCookie(DEVICE_ID_KEY, data.deviceId);
    saveToIndexedDB(DEVICE_ID_KEY, data.deviceId);

    const result = activateLicense(data.licenseKey);
    return result;
  } catch (e) {
    return { success: false, message: "Gagal membaca file cadangan lisensi." };
  }
}

