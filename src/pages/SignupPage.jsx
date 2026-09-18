import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, User, ArrowRight, Eye, EyeOff, KeyRound, 
  CheckCircle2, AlertCircle, Mail, Edit3, RefreshCw, ShieldCheck 
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Official Multi-Color Google "G" Logo SVG
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

const SignupPage = () => {
  const { 
    loginWithGoogle, 
    signupWithEmail, 
    sendEmailOtp, 
    verifyEmailOtp 
  } = useAuth();
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // OTP State & Resend Timer
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown hook
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await loginWithGoogle();
      toast.success(`Welcome to Avyukt, ${user.name || 'Foodie'}!`, 'Account Created');
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Google sign-up could not be completed';
      setErrorMsg(msg);
      toast.error(msg, 'Google Sign-Up');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Initiate Signup - Validate Name, Email, Password & Dispatch Email OTP
  const handleInitiateSignup = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendEmailOtp(cleanEmail, 'signup');
      setOtpSent(true);
      setOtp('');
      setResendTimer(30);
      if (res && res.delivered) {
        toast.info(`Verification code sent to ${cleanEmail}. Please check your inbox.`, 'Email OTP Sent');
      } else {
        toast.info(`Verification code generated for ${cleanEmail}. Please enter the OTP to complete registration.`, 'OTP Ready');
      }
    } catch (err) {
      console.error('Signup OTP error:', err);
      let msg = err.message || 'Could not send verification code.';
      if (msg.toLowerCase().includes('already exists') || err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in instead.';
      }
      setErrorMsg(msg);
      toast.error(msg, 'Registration Error');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setErrorMsg('');
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await sendEmailOtp(cleanEmail, 'signup');
      setResendTimer(30);
      setOtp('');
      if (res && res.delivered) {
        toast.info(`New verification code sent to ${cleanEmail}.`, 'Code Resent');
      } else {
        toast.info(`New code generated. Check your email.`, 'Code Resent');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend code.');
      toast.error(err.message || 'Could not resend code', 'Email Error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Email OTP & Create/Link Account
  const handleVerifyAndCreate = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      // 1. Verify OTP with backend to create verified user doc and save password
      const verifiedUser = await verifyEmailOtp(cleanEmail, otp.trim(), name.trim(), 'signup', password);

      // 2. Also register in Firebase Auth with password for future password-based logins
      if (password) {
        try {
          await signupWithEmail(cleanEmail, password, name.trim());
        } catch (pErr) {
          console.warn('Firebase Auth email/password sync note:', pErr.message);
        }
      }

      toast.success(`Welcome to Avyukt Restaurant, ${verifiedUser.name || name}!`, 'Account Created Successfully');
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Email OTP Verification Error:', err);
      setErrorMsg(err.message || 'Invalid or expired verification code.');
      toast.error(err.message || 'Verification failed', 'Verification Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-12 flex items-center justify-center bg-body dark:bg-zinc-950 relative overflow-hidden px-4">
      {/* Ambient Background Lights */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 border border-black/5 dark:border-white/10 shadow-2xl relative z-10"
      >
        <div className="space-y-6">
          {/* Header Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-title font-bold text-title dark:text-white mb-2">
              Create Account
            </h1>
            <p className="text-text/70 dark:text-gray-400 text-xs">
              Join Avyukt Restaurant for authentic royal dining, member discounts & seamless table bookings.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Single Unified Registration Form */}
          <AnimatePresence mode="wait">
            {!otpSent ? (
              /* Phase 1: Enter Name, Email & Password */
              <motion.form 
                key="details-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleInitiateSignup} 
                className="space-y-4"
              >
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="text"
                      value={name}
                      placeholder="e.g. Rahul Sharma"
                      required
                      onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-transparent focus:border-primary/40 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all text-sm dark:text-white"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="email"
                      value={email}
                      placeholder="name@example.com"
                      required
                      onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-transparent focus:border-primary/40 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all text-sm dark:text-white"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                    Password (Min 6 chars)
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                      className="w-full pl-11 pr-11 py-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-transparent focus:border-primary/40 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all text-sm dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Create Account Button */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              /* Phase 2: OTP Verification Section */
              <motion.form 
                key="otp-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleVerifyAndCreate} 
                className="space-y-4"
              >
                {/* Account Summary Banner */}
                <div className="p-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Mail size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-text/60 dark:text-gray-400">
                        Code sent to
                      </p>
                      <p className="text-xs font-bold text-title dark:text-white truncate max-w-[190px]">
                        {email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setErrorMsg(''); }}
                    className="text-xs text-primary font-bold hover:underline px-2.5 py-1.5 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                </div>

                {/* OTP Input Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Enter 6-Digit Email Code
                    </label>
                    {resendTimer > 0 ? (
                      <span className="text-xs text-gray-400 font-medium">
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        <span>Resend Code</span>
                      </button>
                    )}
                  </div>

                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      value={otp}
                      maxLength={6}
                      placeholder="••••••"
                      required
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(val);
                        setErrorMsg('');
                      }}
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border-2 border-primary/40 focus:border-primary focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all text-base dark:text-white tracking-[0.4em] font-bold text-center"
                    />
                  </div>
                </div>

                {/* Complete Registration Button */}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Verify OTP & Create Account</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Social Sign-In Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-black/10 dark:border-white/10 w-full" />
            <span className="bg-white dark:bg-zinc-900 px-4 text-[11px] font-bold tracking-wider text-gray-400 uppercase absolute">
              Or continue with
            </span>
          </div>

          {/* Google Sign-In Button */}
          <button 
            type="button" 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-title dark:text-white py-3.5 rounded-2xl font-bold transition-all border border-black/5 dark:border-white/5 text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow active:scale-[0.99]"
          >
            <GoogleLogo />
            <span>Sign up with Google</span>
          </button>

          {/* Sign In Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-text/70 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
