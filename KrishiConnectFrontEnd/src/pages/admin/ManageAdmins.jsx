import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader, UserPlus, ArrowLeft } from 'lucide-react';
import { authStore } from '../../store/authStore';
import { adminService } from '../../services/admin.service';
import toast from 'react-hot-toast';

export default function ManageAdmins() {
  const navigate = useNavigate();
  const user = authStore.getState().user;
  const isAdmin = user?.role === 'admin';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!isAdmin) {
      navigate('/settings', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = (form.name || '').trim();
    const email = (form.email || '').trim().toLowerCase();
    const password = (form.password || '').trim();

    const err = {};
    if (!name) err.name = 'Name is required';
    if (!email) err.email = 'Email is required';
    if (!password) err.password = 'Password is required';
    if (password.length < 6) err.password = 'Password must be at least 6 characters';
    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await adminService.createAdmin({ name, email, password });
      toast.success('Admin created successfully');
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create admin';
      toast.error(msg);
      if (err?.response?.data?.errors) {
        const e = {};
        err.response.data.errors.forEach((d) => {
          e[d.field] = d.message;
        });
        setErrors(e);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <Shield className="text-green-600 dark:text-green-400" size={28} />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Admin Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create a new admin user</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Full name"
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="text"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="admin@example.com"
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Min 6 characters"
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? <Loader size={20} className="animate-spin" /> : <UserPlus size={20} />}
              Create Admin
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
