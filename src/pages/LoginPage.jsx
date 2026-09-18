import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, ArrowRight, Eye, EyeOff, KeyRound, 
  CheckCircle2, AlertCircle, Mail, ArrowLeft 
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

const LoginPage = () => {
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    loginAsAdmin,
    sendEmailOtp, 
    verifyEmailOtp, 
    resetPassword 
  } = useAuth();
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Primary Login Mode: 'email' | 'forgot_password'
  const [loginMode, setLoginMode] = useState('email');
  // Email Sub-Mode: 'password' | 'otp'
  const [emailSubMode, setEmailSubMode] = useState('password');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // OTP State
  const [otpSent, setOtpSent] = useState(false);

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await loginWithGoogle();
      const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();
      const isUserAdmin = user?.role === 'admin' || 
        user?.email?.toLowerCase() === adminEmail

      if (isUserAdmin) {
        toast.success(`Welcome to Admin Portal, ${user.name || 'Admin'}!`, 'Admin Authenticated');
        navigate('/admin', { replace: true });
      } else {
        toast.success(`Welcome back, ${user.name || 'Foodie'}!`, 'Signed In');
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Google sign-in could not be completed';
      setErrorMsg(msg);
      toast.error(msg, 'Google Sign-In');
    } finally {
      setLoading(false);
    }
  };

  // 3. Email & Password Sign In
  const handleEmailPasswordSignIn = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();
      const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || '';
      const isTargetingAdmin = (cleanEmail === adminEmail || cleanEmail === '') && password === adminPass;

      let user;
      // If admin credentials, authenticate with backend admin login
      if (isTargetingAdmin) {
        try {
          user = await loginAsAdmin(cleanEmail, password);
        } catch (adminErr) {
          console.warn('Backend admin login fallback:', adminErr.message);
        }
      }

      if (!user) {
        user = await loginWithEmail(cleanEmail, password);
      }

      const isUserAdmin = user?.role === 'admin' || 
        user?.email?.toLowerCase() === adminEmail || 
        user?.email?.toLowerCase() === 'admin@gmail.com';

      if (isUserAdmin) {
        toast.success(`Welcome to Admin Portal, ${user.name || 'Admin'}!`, 'Admin Authenticated');
        navigate('/admin', { replace: true });
      } else {
        toast.success(`Welcome back, ${user.name || 'Foodie'}!`, 'Signed In');
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = err.message?.includes('auth/')
        ? 'Incorrect email or password. Please verify your credentials.'
        : (err.message || 'Login failed');
      setErrorMsg(msg);
      toast.error(msg, 'Sign In Failed');
    } finally {
      setLoading(false);
    }
  };

  // 4. Email OTP: Send
  const handleSendEmailOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await sendEmailOtp(cleanEmail, 'login');
      setOtpSent(true);
      setOtp(''); // Never autofill
      if (res && res.delivered) {
        toast.info(`OTP sent to ${cleanEmail}. Please check your inbox.`, 'Email OTP Sent');
      } else {
        toast.info(`OTP generated for ${cleanEmail}. Check your email or use Password login.`, 'OTP Ready');
      }
    } catch (err) {
      const isNotFound = err.message?.toLowerCase().includes('does not exist') || err.message?.toLowerCase().includes('not found');
      const msg = isNotFound 
        ? 'User does not exist with this email. Please sign up to create an account.'
        : (err.message || 'Failed to send Email OTP.');
      setErrorMsg(msg);
      toast.error(msg, isNotFound ? 'User Does Not Exist' : 'Email Error');
    } finally {
      setLoading(false);
    }
  };

  // 5. Email OTP: Verify
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const cleanEmail = email.trim().toLowerCase();
      const verifiedUser = await verifyEmailOtp(cleanEmail, otp.trim(), '', 'login');
      const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();
      const isUserAdmin = verifiedUser?.role === 'admin' || 
        cleanEmail === adminEmail || 
        cleanEmail === 'admin@gmail.com';

      if (isUserAdmin) {
        toast.success(`Welcome to Admin Portal, ${verifiedUser.name || 'Admin'}!`, 'Admin Authenticated');
        navigate('/admin', { replace: true });
      } else {
        toast.success(`Welcome back, ${verifiedUser.name || 'Foodie'}!`, 'Signed In');
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Email OTP Verification Error:', err);
      const isNotFound = err.message?.toLowerCase().includes('does not exist') || err.message?.toLowerCase().includes('not found');
      const msg = isNotFound 
        ? 'User does not exist with this email. Please sign up to create an account.'
        : (err.message || 'Invalid or expired OTP code.');
      setErrorMsg(msg);
      toast.error(msg, isNotFound ? 'User Does Not Exist' : 'Verification Error');
    } finally {
      setLoading(false);
    }
  };

  // 6. Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await resetPassword(cleanEmail);
      toast.success('Password reset link has been dispatched to your email.', 'Email Sent');
      setLoginMode('email');
      setEmailSubMode('password');
    } catch (err) {
      setErrorMsg(err.message || 'Could not dispatch password reset email.');
      toast.error('Could not send reset email', 'Reset Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-12 flex items-center justify-center bg-body dark:bg-zinc-950 relative overflow-hidden px-4">
      {/* Background Ambient Lights */}
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
              {loginMode === 'forgot_password' ? 'Reset Password' : 'Sign In to Avyukt'}
            </h1>
            <p className="text-text/70 dark:text-gray-400 text-xs">
              {loginMode === 'forgot_password'
                ? 'Enter your registered email address to receive password reset instructions.'
                : 'Welcome back! Sign in with your email or Google account to continue.'}
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

          {/* ============================================================ */}
          {/* EMAIL LOGIN (PASSWORD OR EMAIL OTP)                          */}
          {/* ============================================================ */}
          {loginMode === 'email' && (
            <div className="space-y-4">
              {/* Sub-mode selector */}
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setEmailSubMode('password'); setOtpSent(false); setErrorMsg(''); }}
                  className={`font-bold transition-colors ${emailSubMode === 'password' ? 'text-primary' : 'text-gray-400'}`}
                >
                  Password Sign-In
                </button>
                <span className="text-gray-300 dark:text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={() => { setEmailSubMode('otp'); setOtpSent(false); setErrorMsg(''); }}
                  className={`font-bold transition-colors ${emailSubMode === 'otp' ? 'text-primary' : 'text-gray-400'}`}
                >
                  Email OTP
                </button>
              </div>

              {emailSubMode === 'password' ? (
                /* Password Sign-In */
                <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
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

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => { setLoginMode('forgot_password'); setErrorMsg(''); }}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        placeholder="••••••••"
                        required
                        onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                        className="w-full pl-11 pr-11 py-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-transparent focus:border-primary/40 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all text-sm dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                    <ArrowRight size={18} />
                  </button>
                </form>
              ) : (
                /* Email OTP Sign-In */
                <form onSubmit={otpSent ? handleVerifyEmailOtp : handleSendEmailOtp} className="space-y-4">
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
                        disabled={otpSent}
                        onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-transparent focus:border-primary/40 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all text-sm dark:text-white disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {!otpSent ? (
                    <button 
                      type="submit" 
                      disabled={loading || !email}
                      className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                      {loading ? 'Sending OTP...' : 'Send Login OTP'}
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Enter 6-Digit Email Code
                        </label>
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          className="text-xs text-primary font-bold hover:underline"
                        >
                          Resend
                        </button>
                      </div>

                      <div className="relative group">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary" size={18} />
                        <input
                          type="text"
                          value={otp}
                          maxLength={6}
                          placeholder="••••••"
                          required
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setOtp(val);
                            setErrorMsg('');
                          }}
                          className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border-2 border-primary/40 focus:border-primary focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all text-sm dark:text-white tracking-widest font-bold"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                      >
                        {loading ? 'Verifying...' : 'Verify OTP & Sign In'}
                        <CheckCircle2 size={18} />
                      </button>
                    </motion.div>
                  )}
                </form>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: FORGOT PASSWORD                                       */}
          {/* ============================================================ */}
          {loginMode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                  Registered Email Address
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

              <button 
                type="submit" 
                disabled={loading || !email}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? 'Sending Link...' : 'Send Password Reset Link'}
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => { setLoginMode('email'); setErrorMsg(''); }}
                className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* Social Sign-In Divider */}
          {loginMode !== 'forgot_password' && (
            <>
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
                <span>Sign in with Google</span>
              </button>
            </>
          )}

          {/* Create Account Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-text/70 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
