import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc,
  collection,
  query,
  where 
} from '../firebase/config';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('avyukt_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  // Helper to generate reliable avatar with user initials
  const getAvatarUrl = (identifier = 'User') => {
    const cleanName = encodeURIComponent((identifier || 'User').split('@')[0]);
    return `https://ui-avatars.com/api/?name=${cleanName}&background=800000&color=ffffff&bold=true&size=128&rounded=true`;
  };

  // Sync user profile to Firestore (with cross-provider account preservation by email)
  const syncUserToFirestore = async (uid, userData) => {
    if (!db || !uid) return userData;
    try {
      const cleanEmail = (userData.email || '').trim().toLowerCase();
      const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();
      const isAdminUser = userData.role === 'admin' || 
        cleanEmail === adminEmail 
        
      // Canonical Admin profile handling: Always read/write to single admin_avyukt_master profile
      if (isAdminUser) {
        const canonicalUid = 'admin_avyukt_master';
        let adminData = null;
        try {
          const adminSnap = await getDoc(doc(db, 'users', canonicalUid));
          if (adminSnap.exists()) {
            adminData = adminSnap.data();
          }
        } catch (e) {
          console.warn('Admin Firestore read warning:', e.message);
        }

        const mergedAdmin = {
          uid: canonicalUid,
          name: adminData?.name || userData.name || 'Avyukt Restaurant Admin',
          email: adminEmail,
          role: 'admin',
          phone: (adminData?.phone || userData.phone || '9876543210').replace(/\D/g, '').slice(-10),
          location: adminData?.location || userData.location || 'Hotel Grand Ashok, 3rd Floor, Kundan Complex Shehnai Garden, Vidisha - 464001',
          avatar: adminData?.avatar || userData.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin_avyukt',
          savedAddresses: adminData?.savedAddresses && adminData.savedAddresses.length > 0 ? adminData.savedAddresses : (userData.savedAddresses || []),
          createdAt: adminData?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await setDoc(doc(db, 'users', canonicalUid), mergedAdmin, { merge: true });
        } catch (e) {
          console.warn('Admin Firestore write warning:', e.message);
        }

        return mergedAdmin;
      }

      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);

      let existingData = null;
      let primaryDocRef = userRef;
      let primaryUid = uid;

      // 1. Direct document check by session UID
      if (docSnap.exists()) {
        existingData = docSnap.data();
        primaryUid = existingData.uid || uid;
      } 
      
      // 2. Cross-provider lookup: Check if account exists with this email under another UID (e.g. Email/Password or Email OTP)
      if (cleanEmail) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            // Pick the primary doc (prefer doc that has custom profile data like location or phone)
            let chosenDoc = qSnap.docs[0];
            for (const d of qSnap.docs) {
              const dData = d.data();
              if (dData.location || dData.phone || (dData.savedAddresses && dData.savedAddresses.length > 0)) {
                chosenDoc = d;
                break;
              }
            }
            const foundData = chosenDoc.data();
            // If direct doc was empty or we found an existing established profile, merge with established profile
            if (!existingData || foundData.location || foundData.phone || foundData.savedAddresses?.length) {
              existingData = foundData;
              primaryDocRef = chosenDoc.ref;
              primaryUid = chosenDoc.id || foundData.uid || uid;
            }
          }
        } catch (qErr) {
          console.warn('Email lookup note:', qErr.message);
        }
      }

      if (existingData) {
        const isGoogle = userData.isGoogleAuth || !!userData.googlePhotoUrl;
        
        // Critical requirement: If user created account with email and set up profile,
        // when logging in with Google, they must enter the exact same profile.
        // NONE of the details should update EXCEPT their profile avatar from Google.
        let resolvedAvatar = existingData.avatar;
        if (isGoogle && userData.googlePhotoUrl) {
          resolvedAvatar = userData.googlePhotoUrl;
        } else if (!resolvedAvatar || resolvedAvatar.includes('dicebear')) {
          resolvedAvatar = userData.avatar || getAvatarUrl(existingData.name || cleanEmail);
        }

        const rawAddresses = existingData.savedAddresses || [];
        const cleanAddresses = rawAddresses.filter(a => a && a.id !== 'addr_default_1');

        const merged = {
          ...existingData,
          // STRICTLY PRESERVE all established user details:
          name: existingData.name || userData.name || cleanEmail.split('@')[0],
          phone: existingData.phone || '',
          location: existingData.location || '',
          savedAddresses: cleanAddresses,
          role: existingData.role || (cleanEmail === (import.meta.env.VITE_ADMIN_EMAIL || 'admin@avyukt.com') ? 'admin' : 'customer'),
          createdAt: existingData.createdAt || new Date().toISOString(),
          // ONLY update the profile avatar:
          avatar: resolvedAvatar,
          // Preserve primary UID for order and payment history consistency:
          uid: primaryUid,
          linkedGoogleUid: isGoogle ? uid : (existingData.linkedGoogleUid || null),
          updatedAt: new Date().toISOString(),
        };

        // Update the primary profile document in Firestore
        await setDoc(primaryDocRef, merged, { merge: true });

        // If the current session UID is distinct from the primary doc ID,
        // mirror the profile so lookups by current UID also succeed immediately
        if (primaryDocRef.id !== uid) {
          try {
            await setDoc(userRef, {
              ...merged,
              primaryProfileId: primaryUid,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          } catch (mErr) {
            console.warn('Mirror doc note:', mErr.message);
          }
        }

        return merged;
      }

      // Fresh new account setup (first time user ever logs in)
      const rawAddresses = userData.savedAddresses || [];
      const cleanAddresses = rawAddresses.filter(a => a && a.id !== 'addr_default_1');
      const cleanAvatar = userData.googlePhotoUrl || userData.avatar || getAvatarUrl(userData.name || cleanEmail || 'User');

      const fullData = {
        uid,
        ...userData,
        name: userData.name || (cleanEmail ? cleanEmail.split('@')[0] : 'Foodie'),
        phone: userData.phone || '',
        location: userData.location || '',
        avatar: cleanAvatar,
        role: cleanEmail === (import.meta.env.VITE_ADMIN_EMAIL || 'admin@avyukt.com') ? 'admin' : 'customer',
        savedAddresses: cleanAddresses,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, fullData);
      return fullData;
    } catch (err) {
      console.warn('Firestore sync note:', err.message);
      return userData;
    }
  };

  // Listen to Firebase auth state
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isGoogle = firebaseUser.providerData?.some(p => p.providerId === 'google.com');
        const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Foodie';
        const baseData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: displayName,
          avatar: firebaseUser.photoURL || getAvatarUrl(displayName),
          googlePhotoUrl: isGoogle ? (firebaseUser.photoURL || null) : null,
          isGoogleAuth: isGoogle,
          phone: firebaseUser.phoneNumber || '',
          role: firebaseUser.email === (import.meta.env.VITE_ADMIN_EMAIL || 'admin@avyukt.com') ? 'admin' : 'customer',
        };

        const synced = await syncUserToFirestore(firebaseUser.uid, baseData);
        setUser(synced);
        localStorage.setItem('avyukt_user', JSON.stringify(synced));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Google Authentication Only (Popup)
  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      throw new Error("Firebase Auth not initialized");
    }
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const baseData = {
      uid: fbUser.uid,
      email: fbUser.email,
      name: fbUser.displayName || fbUser.email?.split('@')[0],
      avatar: fbUser.photoURL || getAvatarUrl(fbUser.email),
      googlePhotoUrl: fbUser.photoURL || null,
      isGoogleAuth: true,
      phone: fbUser.phoneNumber || '',
      role: fbUser.email === (import.meta.env.VITE_ADMIN_EMAIL || 'admin@avyukt.com') ? 'admin' : 'customer',
    };

    const synced = await syncUserToFirestore(fbUser.uid, baseData);
    setUser(synced);
    localStorage.setItem('avyukt_user', JSON.stringify(synced));
    return synced;
  };

  // 2. Email & Password Sign Up
  const signupWithEmail = async (email, password, name) => {
    if (auth) {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const baseData = {
        uid: res.user.uid,
        email,
        name: name || email.split('@')[0],
        avatar: getAvatarUrl(email),
        phone: '',
      };
      const synced = await syncUserToFirestore(res.user.uid, baseData);
      setUser(synced);
      localStorage.setItem('avyukt_user', JSON.stringify(synced));
      return synced;
    } else {
      // Fallback
      const fallbackUser = {
        uid: 'user_' + Date.now(),
        email,
        name: name || email.split('@')[0],
        avatar: getAvatarUrl(email),
        role: 'customer',
        savedAddresses: [],
      };
      setUser(fallbackUser);
      localStorage.setItem('avyukt_user', JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  };

  // 3. Email & Password Sign In (Dual-engine authentication)
  const loginWithEmail = async (email, password) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    let synced = null;

    // 1. Try native Firebase Authentication
    if (auth) {
      try {
        const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const baseData = {
          uid: res.user.uid,
          email: cleanEmail,
          name: res.user.displayName || cleanEmail.split('@')[0],
          avatar: res.user.photoURL || getAvatarUrl(cleanEmail),
          phone: res.user.phoneNumber || '',
        };
        synced = await syncUserToFirestore(res.user.uid, baseData);
        setUser(synced);
        localStorage.setItem('avyukt_user', JSON.stringify(synced));
        // Sync password to backend for persistence across providers
        api.syncPassword(cleanEmail, password).catch(() => {});
        return synced;
      } catch (fbErr) {
        console.warn('Firebase Auth password sign-in note:', fbErr.message);
      }
    }

    // 2. Fallback to backend password verification (handles accounts unlinked by Google or created via OTP)
    try {
      const backendRes = await api.loginWithPassword(cleanEmail, password);
      if (backendRes.success && backendRes.user) {
        synced = await syncUserToFirestore(backendRes.user.uid, backendRes.user);
        setUser(synced);
        localStorage.setItem('avyukt_user', JSON.stringify(synced));
        if (backendRes.token) localStorage.setItem('avyukt_token', backendRes.token);
        return synced;
      }
    } catch (backendErr) {
      console.warn('Backend password verification note:', backendErr.message);
      throw backendErr;
    }

    throw new Error('Incorrect email or password. Please verify your credentials.');
  };

  // 4. Email OTP Flow
  const sendEmailOtp = async (email, type = 'any') => {
    return await api.sendEmailOtp(email, type);
  };

  const verifyEmailOtp = async (email, otp, name = '', type = 'any', password = '') => {
    const res = await api.verifyEmailOtp(email, otp, name, type, password);
    if (res.success && res.user) {
      const profile = {
        ...res.user,
        avatar: res.user.avatar || getAvatarUrl(email),
        savedAddresses: res.user.savedAddresses || [],
      };
      const synced = await syncUserToFirestore(res.user.uid, profile);
      setUser(synced);
      localStorage.setItem('avyukt_user', JSON.stringify(synced));
      if (res.token) localStorage.setItem('avyukt_token', res.token);
      return synced;
    }
    throw new Error(res.message || 'Failed to verify OTP');
  };

  // 4b. Phone OTP Authentication (Firebase Phone Auth with Recaptcha)
  const setupPhoneRecaptcha = (containerId = 'recaptcha-container') => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    if (typeof window !== 'undefined' && window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn('Recaptcha clear note:', e.message);
      }
    }
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired. Please retry.');
      }
    });
    if (typeof window !== 'undefined') {
      window.recaptchaVerifier = verifier;
    }
    return verifier;
  };

  const sendPhoneOtp = async (phoneNumber, appVerifier) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const verifier = appVerifier || setupPhoneRecaptcha('recaptcha-container');
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return confirmationResult;
  };

  const verifyPhoneOtp = async (confirmationResult, otpCode, name = '') => {
    if (!confirmationResult) throw new Error('No active phone OTP verification found. Please request OTP again.');
    const result = await confirmationResult.confirm(otpCode);
    const fbUser = result.user;
    const cleanDigits = (fbUser.phoneNumber || '').replace(/\D/g, '');
    const displayName = name || fbUser.displayName || `Customer ${cleanDigits ? cleanDigits.slice(-4) : ''}`;
    const baseData = {
      uid: fbUser.uid,
      phone: fbUser.phoneNumber || '',
      email: fbUser.email || '',
      name: displayName,
      avatar: fbUser.photoURL || getAvatarUrl(displayName),
      role: 'customer',
      savedAddresses: [],
    };
    const synced = await syncUserToFirestore(fbUser.uid, baseData);
    setUser(synced);
    localStorage.setItem('avyukt_user', JSON.stringify(synced));
    return synced;
  };

  // 5. Admin Login (from .env credentials)
  const loginAsAdmin = async (email, password) => {
    const res = await api.adminLogin(email, password);
    if (res.success && res.user) {
      const synced = await syncUserToFirestore(res.user.uid || 'admin_avyukt_master', res.user);
      setUser(synced);
      localStorage.setItem('avyukt_user', JSON.stringify(synced));
      if (res.token) localStorage.setItem('avyukt_token', res.token);
      return synced;
    }
    throw new Error(res.message || 'Invalid admin credentials');
  };

  // 6. Forgot Password
  const resetPassword = async (email) => {
    if (auth) {
      await sendPasswordResetEmail(auth, email);
    }
    return await api.forgotPassword(email);
  };

  // 7. Update User Profile
  const updateUser = async (updatedData) => {
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();
    const isAdminUser = user?.role === 'admin' || 
      user?.uid === 'admin_avyukt_master' || 
      user?.email?.toLowerCase() === adminEmail  
      

    const targetUid = isAdminUser ? 'admin_avyukt_master' : (user?.uid || 'user');

    const merged = { ...user, ...updatedData, uid: targetUid };
    if (isAdminUser) {
      merged.role = 'admin';
      merged.email = adminEmail;
    }

    setUser(merged);
    localStorage.setItem('avyukt_user', JSON.stringify(merged));

    // 1. Sync to backend database directly
    try {
      await api.updateProfile({
        uid: targetUid,
        email: merged.email,
        ...updatedData,
      });
    } catch (apiErr) {
      console.warn('Backend update profile note:', apiErr.message);
    }

    // 2. Direct client Firestore update
    if (db && targetUid) {
      try {
        await setDoc(doc(db, 'users', targetUid), {
          ...updatedData,
          uid: targetUid,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        if (user?.linkedGoogleUid && user.linkedGoogleUid !== targetUid) {
          try {
            await setDoc(doc(db, 'users', user.linkedGoogleUid), {
              ...updatedData,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) {}
        }
        if (user?.primaryProfileId && user.primaryProfileId !== targetUid) {
          try {
            await setDoc(doc(db, 'users', user.primaryProfileId), {
              ...updatedData,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Firestore update warning:', e.message);
      }
    }
    return merged;
  };

  // 8. Saved Addresses: Add Address
  const addSavedAddress = async (newAddress) => {
    const addressObj = {
      id: 'addr_' + Date.now(),
      label: newAddress.label || 'Home',
      street: newAddress.street,
      landmark: newAddress.landmark || '',
      city: newAddress.city,
      pincode: newAddress.pincode,
      isDefault: (user?.savedAddresses || []).length === 0,
    };

    const updatedAddresses = [...(user?.savedAddresses || []), addressObj];
    await updateUser({ savedAddresses: updatedAddresses });
    return addressObj;
  };

  // 9. Saved Addresses: Delete Address
  const deleteSavedAddress = async (addressId) => {
    const filtered = (user?.savedAddresses || []).filter(a => a.id !== addressId);
    await updateUser({ savedAddresses: filtered });
  };

  // 10. Saved Addresses: Set Default
  const setDefaultAddress = async (addressId) => {
    const updated = (user?.savedAddresses || []).map(a => ({
      ...a,
      isDefault: a.id === addressId
    }));
    await updateUser({ savedAddresses: updated });
  };

  // 11. Sign Out
  const logout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Signout note:', e.message);
      }
    }
    setUser(null);
    localStorage.removeItem('avyukt_user');
    localStorage.removeItem('avyukt_token');
  };

  const adminEmailConfig = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();
  const isAdmin = user?.role === 'admin' || 
    user?.uid === 'admin_avyukt_master' ||
    user?.email?.toLowerCase() === adminEmailConfig 

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin,
        loading,
        loginWithGoogle,
        signupWithEmail,
        loginWithEmail,
        sendEmailOtp,
        verifyEmailOtp,
        setupPhoneRecaptcha,
        sendPhoneOtp,
        verifyPhoneOtp,
        loginAsAdmin,
        resetPassword,
        updateUser,
        addSavedAddress,
        deleteSavedAddress,
        setDefaultAddress,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
