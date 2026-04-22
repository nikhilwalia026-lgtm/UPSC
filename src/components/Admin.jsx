import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AuthStore } from '../lib/data';
import { Shield, Key, User, Trash2 } from 'lucide-react';

export default function Admin() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setUsers(AuthStore.getUsers());
  }, []);

  const handleDelete = (id, username) => {
    if (username === 'owner') {
      alert("You cannot delete the master owner account.");
      return;
    }
    if (confirm(`Are you sure you want to permanently delete user "${username}" and all their data?`)) {
      AuthStore.deleteUser(id);
      setUsers(AuthStore.getUsers());
    }
  };

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
          <Shield size={24} />
        </div>
        <div>
          <h2 className="text-4xl font-display mb-1 text-white">Owner Dashboard</h2>
          <p className="text-muted text-sm tracking-wide">Administrative access to all registered user credentials</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-muted text-xs uppercase tracking-widest font-bold">
              <th className="p-5">User ID</th>
              <th className="p-5">Username</th>
              <th className="p-5">Password (Cleartext)</th>
              <th className="p-5">Role</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user, idx) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-5 text-sm text-muted font-mono">{user.id}</td>
                <td className="p-5">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-white/40" />
                    <span className="font-medium text-white/90">{user.username}</span>
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-white/40" />
                    <span className="font-mono text-amber-400/90">{user.password}</span>
                  </div>
                </td>
                <td className="p-5">
                  <span className={`text-xs px-2 py-1 rounded-lg border font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-white/5 border-white/10 text-muted'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-5 text-right">
                  {user.username !== 'owner' && (
                    <button 
                      onClick={() => handleDelete(user.id, user.username)}
                      className="p-2 text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">No users registered yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
