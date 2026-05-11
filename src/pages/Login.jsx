import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, register, loading, error } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    phone: '', confirmPassword: ''
  })

  const update = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    const ok = await login(form.email, form.password)
    if (ok) navigate('/')
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    const ok = await register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone
    })
    if (ok) navigate('/')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-aurora-navy flex items-center justify-center mb-3 shadow-lg">
            <span className="text-white font-display font-bold text-xl">A</span>
          </div>
          <h1 className="font-display text-2xl text-aurora-navy font-bold">Aurora Store</h1>
          <p className="text-gray-500 text-sm font-body mt-1">Your account</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-5 bg-gray-100 rounded-lg p-1">
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-body font-medium rounded-md transition-colors ${
                tab === t ? 'bg-white text-aurora-navy shadow-sm' : 'text-gray-500'
              }`}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="card p-6 shadow-md space-y-4">
            <div>
              <label className="block text-xs font-body font-medium text-gray-600 mb-1">Email *</label>
              <input name="email" type="email" value={form.email} onChange={update}
                placeholder="you@example.com" required className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-gray-600 mb-1">Password *</label>
              <input name="password" type="password" value={form.password} onChange={update}
                placeholder="••••••••" required className="input-field text-sm" />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700 font-body">
                ⚠️ {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <p className="text-center text-xs text-gray-400 font-body">
              No account?{' '}
              <button type="button" onClick={() => setTab('register')}
                className="text-aurora-mid underline">Register here</button>
            </p>
          </form>
        )}

        {/* Register */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="card p-6 shadow-md space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-body font-medium text-gray-600 mb-1">First Name *</label>
                <input name="firstName" value={form.firstName} onChange={update}
                  placeholder="John" required className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-gray-600 mb-1">Last Name *</label>
                <input name="lastName" value={form.lastName} onChange={update}
                  placeholder="Smith" required className="input-field text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-gray-600 mb-1">Email *</label>
              <input name="email" type="email" value={form.email} onChange={update}
                placeholder="you@example.com" required className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-gray-600 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={update}
                placeholder="(555) 000-0000" className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-gray-600 mb-1">Password *</label>
              <input name="password" type="password" value={form.password} onChange={update}
                placeholder="••••••••" required className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-gray-600 mb-1">Confirm Password *</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={update}
                placeholder="••••••••" required className="input-field text-sm" />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700 font-body">
                ⚠️ {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60">
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
            <p className="text-center text-xs text-gray-400 font-body">
              Already registered?{' '}
              <button type="button" onClick={() => setTab('login')}
                className="text-aurora-mid underline">Sign in</button>
            </p>
          </form>
        )}

        
      </div>
    </div>
  )
}