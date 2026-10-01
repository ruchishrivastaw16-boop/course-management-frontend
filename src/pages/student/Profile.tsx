import { useState, useEffect } from 'react';
import {
  LayoutDashboard, GraduationCap, FileText, BarChart3,
  User as UserIcon, Mail, Save, Award, Phone, Calendar,
  CheckCircle, XCircle, Zap, RefreshCw,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';

const links = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'My Courses', icon: GraduationCap },
  { to: '/student/assignments', label: 'Assignments', icon: FileText },
  { to: '/student/grades', label: 'Grades', icon: BarChart3 },
  { to: '/student/profile', label: 'Profile', icon: UserIcon },
];

export default function Profile() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    phone: '',
  });

  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data;
    },
  });

  // Load user data into form
  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        bio: user.bio || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.put('/users/me', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Profile updated!');
      qc.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Update failed');
    },
  });

  const handleSave = () => {
    if (!form.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <DashboardLayout links={links} title="My Profile">
        <Spinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout links={links} title="My Profile">
      <div className="max-w-3xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {/* Cover Gradient */}
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600" />

          {/* Profile Info */}
          <div className="px-6 pb-6 -mt-16">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-5xl">
                  {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              </div>

              {/* Name + Role */}
              <div className="flex-1 text-center md:text-left md:pb-3">
                <h2 className="text-2xl font-bold text-gray-800">
                  {user?.full_name}
                </h2>
                <p className="text-sm text-gray-500 flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Mail size={14} /> {user?.email}
                </p>
                <div className="flex items-center gap-2 justify-center md:justify-start mt-2">
                  <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium capitalize">
                    <Award size={12} /> {user?.role}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    ● Active
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <div className="md:pb-3">
                <Button onClick={() => setEditing(!editing)}>
                  {editing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details / Edit Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-5 pb-3 border-b">
            {editing ? 'Edit Profile' : 'Profile Information'}
          </h3>

          {!editing ? (
            // VIEW MODE
            <div className="space-y-4">
              <InfoRow
                icon={UserIcon}
                label="Full Name"
                value={user?.full_name || 'Not set'}
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={user?.email || 'Not set'}
              />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={user?.phone || 'Not set'}
              />
              <InfoRow
                icon={Calendar}
                label="Member Since"
                value={
                  user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : 'N/A'
                }
              />

              {user?.bio && (
                <div className="pt-3 border-t">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">
                    BIO
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {user.bio}
                  </p>
                </div>
              )}
            </div>
          ) : (
            // EDIT MODE
            <div className="space-y-4">
              <Input
                label="Full Name *"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                placeholder="Your full name"
              />

              <Input
                label="Email (read-only)"
                value={user?.email || ''}
                readOnly
                className="bg-gray-50 cursor-not-allowed"
              />

              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {form.bio.length} / 500 characters
                </p>
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <Button
                  onClick={handleSave}
                  loading={updateMutation.isPending}
                >
                  <Save size={16} /> Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    if (user) {
                      setForm({
                        full_name: user.full_name || '',
                        bio: user.bio || '',
                        phone: user.phone || '',
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ⭐ Razorpay Status Card — NAYA */}
        <RazorpayStatusCard />
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// INFO ROW COMPONENT
// ═══════════════════════════════════════════════════════════
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RAZORPAY STATUS CARD — NAYA
// ═══════════════════════════════════════════════════════════
function RazorpayStatusCard() {
  const { data: debug, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['razorpay-debug'],
    queryFn: async () => {
      const { data } = await api.get('/payments/debug');
      return data;
    },
    retry: 0,
    staleTime: 0,
  });

  const handleRefresh = () => {
    refetch();
    toast.success('Refreshing...');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="text-yellow-500" size={20} />
          <h3 className="font-bold text-gray-800">Razorpay Status</h3>
        </div>
        <p className="text-sm text-gray-500">Checking...</p>
      </div>
    );
  }

  if (!debug) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="text-yellow-500" size={20} />
          <h3 className="font-bold text-gray-800">Razorpay Status</h3>
        </div>
        <p className="text-sm text-red-600">
          Unable to fetch status. Backend might be down.
        </p>
      </div>
    );
  }

  const isHealthy =
    debug.key_id_valid_prefix &&
    debug.secret_loaded &&
    debug.test_order_created;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-500" size={20} />
          <h3 className="font-bold text-gray-800">Razorpay Status</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${
              isHealthy
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            ● {isHealthy ? 'Healthy' : 'Error'}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              size={14}
              className={isFetching ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* Status Grid */}
      <div className="space-y-2">
        <StatusRow
          label="Key ID Loaded"
          value={debug.key_id_loaded || '—'}
          ok={!!debug.key_id_loaded}
        />
        <StatusRow
          label="Key Prefix Valid"
          value={debug.key_id_valid_prefix ? 'rzp_test_...' : 'Invalid'}
          ok={debug.key_id_valid_prefix}
        />
        <StatusRow
          label="Secret Loaded"
          value={
            debug.secret_loaded ? `Length: ${debug.secret_length}` : 'Empty'
          }
          ok={debug.secret_loaded}
        />
        <StatusRow
          label="Test Order Created"
          value={debug.test_order_id || 'Failed'}
          ok={debug.test_order_created}
        />
      </div>

      {/* Error */}
      {debug.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-medium text-red-800 mb-1">Error:</p>
          <p className="text-xs text-red-600 font-mono break-all">
            {debug.error}
          </p>
        </div>
      )}

      {/* Success note */}
      {isHealthy && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800">
            ✅ Razorpay is configured correctly. You can make payments.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Status Row Component ───
function StatusRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle size={14} className="text-green-500 shrink-0" />
        ) : (
          <XCircle size={14} className="text-red-500 shrink-0" />
        )}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span
        className={`text-xs font-mono max-w-xs truncate ${
          ok ? 'text-gray-600' : 'text-red-600'
        }`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}