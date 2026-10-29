import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

export const AUTH_TOKEN_KEY = 'pppk_oauth_access_token';
export const AUTH_EXPIRES_KEY = 'pppk_oauth_expires_at';
export const AUTH_USER_KEY = 'pppk_oauth_user_session';

export interface StoredUserSession {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface StoredSession {
  token: string;
  expiresAt: number;
  user: StoredUserSession | null;
  isValid: boolean;
}

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Read stored session from localStorage
export const getStoredSession = (): StoredSession | null => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const expiresAtStr = localStorage.getItem(AUTH_EXPIRES_KEY);
    const userJson = localStorage.getItem(AUTH_USER_KEY);

    if (!token || !expiresAtStr) {
      return null;
    }

    const expiresAt = Number(expiresAtStr);
    // Valid if current time is before expiresAt with a 1 minute buffer
    const isValid = !isNaN(expiresAt) && Date.now() < expiresAt - 60000;

    let user: StoredUserSession | null = null;
    if (userJson) {
      try {
        user = JSON.parse(userJson);
      } catch {
        // ignore JSON parse error
      }
    }

    return {
      token,
      expiresAt,
      user,
      isValid,
    };
  } catch (err) {
    console.warn('Gagal membaca sesi lokal:', err);
    return null;
  }
};

// Save session data to localStorage
export const saveSessionToStorage = (
  token: string,
  user: User | StoredUserSession,
  expiresInSeconds = 3600
) => {
  try {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_EXPIRES_KEY, String(expiresAt));

    const userSession: StoredUserSession = {
      uid: user.uid,
      displayName: user.displayName || null,
      email: user.email || null,
      photoURL: user.photoURL || null,
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userSession));
    cachedAccessToken = token;
  } catch (err) {
    console.warn('Gagal menyimpan sesi login:', err);
  }
};

// Clear session data from localStorage
export const clearSessionFromStorage = () => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EXPIRES_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    cachedAccessToken = null;
  } catch (err) {
    console.warn('Gagal menghapus sesi login:', err);
  }
};

// Initialize auth with auto-login from stored session
export const initAuth = (
  onAuthSuccess?: (user: User | StoredUserSession, token: string) => void,
  onAuthFailure?: () => void
) => {
  // 1. Immediately check stored session on initial mount
  const stored = getStoredSession();
  if (stored && stored.isValid && stored.user) {
    cachedAccessToken = stored.token;
    if (onAuthSuccess) {
      onAuthSuccess(stored.user, stored.token);
    }
  }

  // 2. Listen to Firebase auth state changes
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const currentStored = getStoredSession();
      if (cachedAccessToken && currentStored?.isValid) {
        saveSessionToStorage(
          cachedAccessToken,
          user,
          Math.max(60, Math.floor((currentStored.expiresAt - Date.now()) / 1000))
        );
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (currentStored && currentStored.isValid) {
        cachedAccessToken = currentStored.token;
        saveSessionToStorage(
          currentStored.token,
          user,
          Math.max(60, Math.floor((currentStored.expiresAt - Date.now()) / 1000))
        );
        if (onAuthSuccess) onAuthSuccess(user, currentStored.token);
      } else if (!isSigningIn) {
        // Token expired and not in middle of login popup
        clearSessionFromStorage();
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      const currentStored = getStoredSession();
      if (!currentStored || !currentStored.isValid) {
        clearSessionFromStorage();
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token dari Google OAuth');
    }

    cachedAccessToken = credential.accessToken;
    // Store token, expiration (1 hour standard OAuth), and user profile to localStorage
    saveSessionToStorage(credential.accessToken, result.user, 3600);

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) {
    const stored = getStoredSession();
    if (stored && stored.isValid) {
      return cachedAccessToken;
    }
  }
  const stored = getStoredSession();
  if (stored && stored.isValid) {
    cachedAccessToken = stored.token;
    return stored.token;
  }
  return null;
};

export const setAccessTokenInMemory = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  clearSessionFromStorage();
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out error:', err);
  }
};

export const getOAuthConfig = () => {
  return {
    clientId: firebaseConfig.oAuthClientId || '',
    apiKey: firebaseConfig.apiKey || '',
    projectId: firebaseConfig.projectId || '',
  };
};
