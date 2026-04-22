import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AuthStore } from '../lib/data';
import { Lock, User } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (isLogin) {
      const user = AuthStore.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password.');
      }
    } else {
      const newUser = AuthStore.register(username, password);
      if (newUser) {
        onLogin(newUser);
      } else {
        setError('Username already exists. Please choose another.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0f111a] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px]"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-10 rounded-[2rem] w-full max-w-md border border-white/10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display text-white mb-2 tracking-tight">UPSC AIR 1</h1>
          <p className="text-muted text-sm tracking-widest uppercase font-bold">Secure Access</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-xl mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input 
              type="text" 
              placeholder="Username" 
              className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="w-full btn-primary py-4 text-lg rounded-xl flex items-center justify-center font-bold tracking-wide"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-muted text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              className="ml-2 text-primary hover:text-white transition-colors font-semibold"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
