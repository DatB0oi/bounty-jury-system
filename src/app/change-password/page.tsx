"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirm) {
      return setError('Passwords do not match');
    }

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-xl fw-bold mb-2">Update Password</h2>
        <p className="text-sm mb-4" style={{ color: '#aaa' }}>Please choose a new secure password.</p>
        
        {error && <p style={{ color: 'var(--ava-red)', marginBottom: '1rem' }}>{error}</p>}
        
        <form onSubmit={handleChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required 
              minLength={6}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Confirm Password</label>
            <input 
              type="password" 
              value={confirm} 
              onChange={e => setConfirm(e.target.value)} 
              required 
              minLength={6}
            />
          </div>
          <button type="submit" className="btn-primary mt-4">Save & Continue</button>
        </form>
      </div>
    </div>
  );
}
