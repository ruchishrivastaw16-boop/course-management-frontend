import { useState } from 'react';
import {
  LayoutDashboard, UserCog, CheckSquare, BookOpen,
  GraduationCap, FileText, ClipboardCheck, DollarSign,
  Bell, BarChart3,
  Send,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: UserCog },
  { to: '/admin/approvals', label: 'Approvals', icon: CheckSquare },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/enrollments', label: 'Enrollments', icon: GraduationCap },
  { to: '/admin/assignments', label: 'Assignments', icon: ClipboardCheck },
  { to: '/admin/submissions', label: 'Submissions', icon: FileText },
  { to: '/admin/payments', label: 'Payments', icon: DollarSign },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

export default function Notifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/admin/notifications/broadcast', null, {
        params: { title, message },
      });
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(`Sent to ${data.sent_to} users!`);
      setTitle('');
      setMessage('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to send');
    },
  });

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message required');
      return;
    }
    broadcastMutation.mutate();
  };

  return (
    <DashboardLayout links={links} title="Broadcast Notifications">
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-6 pb-5 border-b">
          <Bell className="text-indigo-600" size={20} />
          <div>
            <h2 className="font-bold text-gray-800">Send Broadcast</h2>
            <p className="text-xs text-gray-500">
              Send notification to all users in the platform
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Notification Title"
            placeholder="e.g. Platform Maintenance"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
              placeholder="Enter the message for all users..."
            />
          </div>

          <Button
            onClick={handleSend}
            loading={broadcastMutation.isPending}
            className="w-full"
          >
            <Send size={16} /> Broadcast to All Users
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}