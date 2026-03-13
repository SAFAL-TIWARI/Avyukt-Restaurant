import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    login(formData);
    navigate('/');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-body dark:bg-zinc-950 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-6 relative z-10"
      >
        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/20 dark:border-white/10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-title font-bold text-title dark:text-white mb-3">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-text dark:text-gray-400 text-sm">
              {isLogin 
                ? 'Please enter your details to sign in' 
                : 'Join us for a premium dining experience'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      required={!isLogin}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all text-sm dark:text-white"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  required
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all text-sm dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Password
                </label>
                {isLogin && (
                  <Link to="#" className="text-xs text-primary hover:underline">
                    Forgot Password?
                  </Link>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  required
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all text-sm dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full py-4 rounded-2xl group text-sm font-bold tracking-wide mt-4">
              <span className="flex items-center justify-center gap-2">
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-gray-200 dark:bg-zinc-800" />
            <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">or continue with</span>
            <div className="h-[1px] flex-1 bg-gray-200 dark:bg-zinc-800" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors shadow-sm">
              <Chrome size={18} />
              <span className="text-xs font-bold">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors shadow-sm">
              <Github size={18} />
              <span className="text-xs font-bold">GitHub</span>
            </button>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-text dark:text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-bold hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
