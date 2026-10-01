import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CreditCard, Lock, CheckCircle, Shield, ArrowLeft, AlertCircle,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string;
  price: number;
  is_free: boolean;
  thumbnail?: string;
  instructor_name?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);

  // Fetch course
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['checkout-course', courseId],
    queryFn: async (): Promise<Course> => {
      const { data: courses } = await api.get('/courses/');
      const found = courses.find((c: any) => Number(c.id) === Number(courseId));
      if (!found) throw new Error('Course not found');
      const { data: detail } = await api.get(`/courses/${found.slug}`);
      return detail;
    },
    enabled: !!courseId,
  });

  // ═══════════════════════════════════════════════════════════
  // 🎯 RAZORPAY PAYMENT FLOW
  // ═══════════════════════════════════════════════════════════
  const handlePayment = async () => {
    if (!course || !user) {
      toast.error('Please login first');
      return;
    }

    // Check Razorpay script loaded
    if (!window.Razorpay) {
      toast.error('Razorpay not loaded. Please refresh the page.');
      return;
    }

    setProcessing(true);

    try {
      // ═══ STEP 1: Create order on backend ═══
      console.log('📤 Creating Razorpay order...');
      const { data: order } = await api.post('/payments/create-order', {
        course_id: course.id,
        amount: course.price,
      });

      console.log('✅ Order created:', order);

      // ═══ STEP 2: Open Razorpay modal ═══
      const options = {
        key: order.key_id,
        amount: order.amount,           // in paise
        currency: order.currency,
        name: 'CourseHub',
        description: course.title,
        image: course.thumbnail || '',
        order_id: order.order_id,

        // ═══ STEP 3: Payment success handler ═══
        handler: async (response: any) => {
          console.log('✅ Payment response:', response);

          try {
            // Verify payment on backend
            const { data: verified } = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              course_id: course.id,
              amount: course.price,
            });

            console.log('✅ Payment verified:', verified);

            // Enroll student
            const { data: enrollment } = await api.post('/enrollments/', {
              course_id: course.id,
            });

            console.log('✅ Enrolled:', enrollment);

            toast.success('🎉 Payment successful! You are enrolled.');
            setTimeout(() => {
              navigate(`/student/courses/${course.id}/learn`);
            }, 1000);
          } catch (err: any) {
            console.error('❌ Verification error:', err);
            toast.error(
              err.response?.data?.detail || 'Payment verification failed'
            );
            setProcessing(false);
          }
        },

        // Prefill user info
        prefill: {
          name: user.full_name || '',
          email: user.email || '',
          contact: '9999999999',
        },

        // Notes for backend
        notes: {
          course_id: String(course.id),
          course_title: course.title,
        },

        // Theme
        theme: {
          color: '#4f46e5',
        },

        // Modal close
        modal: {
          ondismiss: () => {
            console.log('❌ User closed Razorpay modal');
            setProcessing(false);
            toast.error('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      console.error('❌ Order creation error:', err);
      toast.error(
        err.response?.data?.detail || err.message || 'Payment failed to start'
      );
      setProcessing(false);
    }
  };

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Course not found</h2>
            <Link to="/courses">
              <Button>Back to Courses</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <button
          onClick={() => navigate(`/courses/${course.slug}`)}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 mb-6"
        >
          <ArrowLeft size={16} /> Back to course
        </button>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ═══ Left: Payment Info ═══ */}
          <div className="lg:col-span-2 space-y-5">
            {/* Razorpay Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <CreditCard className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">
                    Secure Payment by Razorpay
                  </h2>
                  <p className="text-xs text-gray-500">
                    Card, UPI, Netbanking, Wallet — all supported
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">🧪 Test Mode Active</p>
                <p className="text-xs">
                  Ye test environment hai. Real money nahi lagega.
                </p>
              </div>
            </div>

            {/* Test Card Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-3">
                🧪 Test Card Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Card Number</span>
                  <code className="bg-gray-100 px-2 py-0.5 rounded">
                    4111 1111 1111 1111
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expiry</span>
                  <code className="bg-gray-100 px-2 py-0.5 rounded">12/30</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CVV</span>
                  <code className="bg-gray-100 px-2 py-0.5 rounded">123</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name</span>
                  <code className="bg-gray-100 px-2 py-0.5 rounded">
                    Any name
                  </code>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  UPI Test:
                </p>
                <div className="space-y-1 text-xs">
                  <p>
                    Success:{' '}
                    <code className="bg-gray-100 px-2 py-0.5 rounded">
                      success@razorpay
                    </code>
                  </p>
                  <p>
                    Failure:{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      failure@razorpay
                    </code>
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-3">What you get</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Full lifetime access to the course
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Certificate of completion
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  30-day money-back guarantee
                </li>
              </ul>
            </div>
          </div>

          {/* ═══ Right: Order Summary ═══ */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>

              {/* Course Card */}
              <div className="flex gap-3 mb-5 pb-5 border-b">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-20 h-20 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 line-clamp-2">
                    {course.title}
                  </p>
                  {course.instructor_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      By {course.instructor_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between text-gray-600">
                  <span>Course price</span>
                  <span>${Number(course.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (18%)</span>
                  <span>${(Number(course.price) * 0.18).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base text-gray-800">
                  <span>Total (USD)</span>
                  <span>${(Number(course.price) * 1.18).toFixed(2)}</span>
                </div>
              </div>

              {/* Currency note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs text-yellow-800">
                <p>
                  💡 Amount will be charged in <strong>INR</strong> at Razorpay
                  (approx ₹{(Number(course.price) * 83).toFixed(0)})
                </p>
              </div>

              {/* ⭐ PAY BUTTON */}
              <Button
                onClick={handlePayment}
                loading={processing}
                className="w-full mb-3"
                size="lg"
              >
                <Lock size={16} />
                {processing ? 'Processing...' : 'Pay Now'}
              </Button>

              {/* Trust badges */}
              <div className="space-y-2 text-xs text-gray-600 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-green-500" />
                  <span>Secure 256-bit SSL encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  <span>Powered by Razorpay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}