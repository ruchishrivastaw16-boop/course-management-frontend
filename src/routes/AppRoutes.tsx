import { Routes, Route } from 'react-router-dom';
import Home from '../pages/public/Home';
import CourseCatalog from '../pages/public/CourseCatalog';
import CourseDetail from '../pages/public/CourseDetail';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import StudentDashboard from '../pages/student/StudentDashboard';
import InstructorDashboard from '../pages/instructor/InstructorDashboard';
import CreateCourse from '../pages/instructor/CreateCourse';
import AdminDashboard from '../pages/admin/AdminDashboard';
import NotFound from '../pages/NotFound';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import ManageCourses from '../pages/instructor/ManageCourses';
import Students from '../pages/instructor/Students';
import UserManagement from '../pages/admin/UserManagement';
import CourseApprovals from '../pages/admin/CourseApprovals';
import Reports from '../pages/admin/Reports';
import MyCourses from '../pages/student/MyCourses';
import Assignments from '../pages/student/Assignments';
import Grades from '../pages/student/Grades';
import EditCourse from '../pages/instructor/EditCourse';
import CoursePlayer from '../pages/student/CoursePlayer';
import ContentEditor from '../pages/instructor/ContentEditor';
import InstructorAssignments from '../pages/instructor/AssignmentEditor';
import AllCourses from '../pages/admin/AllCourses';
import Enrollments from '../pages/admin/Enrollments';
import Submissions from '../pages/admin/Submissions';
import Payments from '../pages/admin/Payments';
import Notifications from '../pages/admin/Notifications';
import AdminAssignments from '../pages/admin/Assignments';
import InstructorSubmissions from '../pages/instructor/Submissions';
import Profile from '../pages/student/Profile';
import Checkout from '../pages/student/Checkout';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<CourseCatalog />} />
      <Route path="/courses/:slug" element={<CourseDetail />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

{/* Student */}
<Route element={<ProtectedRoute />}>
  <Route element={<RoleRoute allowed={['student']} />}>
    <Route path="/student/dashboard" element={<StudentDashboard />} />
    <Route path="/student/courses" element={<MyCourses />} />
    <Route path="/student/courses/:id/learn" element={<CoursePlayer />} />
    <Route path="/student/assignments" element={<Assignments />} />
    <Route path="/student/grades" element={<Grades />} />
    <Route path="/student/profile" element={<Profile />} />
    <Route path="/checkout/:courseId" element={<Checkout />} />
    {/*                                    ^^^^^^^^^^^^^ NAYA */}
  </Route>
</Route>

{/* Instructor */}
<Route element={<ProtectedRoute />}>
  <Route element={<RoleRoute allowed={['instructor']} />}>
    <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
    <Route path="/instructor/create" element={<CreateCourse />} />
    <Route path="/instructor/courses" element={<ManageCourses />} />
    <Route path="/instructor/courses/:id/edit" element={<EditCourse />} />
    <Route path="/instructor/courses/:id/content" element={<ContentEditor />} />
    <Route path="/instructor/assignments" element={<InstructorAssignments />} />
    <Route path="/instructor/submissions" element={<InstructorSubmissions />} />
    {/*                                              ^^^^^^^^^^^^^ NAYA */}
    <Route path="/instructor/students" element={<Students />} />
  </Route>
</Route>
{/* Admin */}
<Route element={<ProtectedRoute />}>
  <Route element={<RoleRoute allowed={['admin']} />}>
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
    <Route path="/admin/users" element={<UserManagement />} />
    <Route path="/admin/approvals" element={<CourseApprovals />} />
    <Route path="/admin/courses" element={<AllCourses />} />
    <Route path="/admin/enrollments" element={<Enrollments />} />
    <Route path="/admin/assignments" element={<AdminAssignments />} />
    <Route path="/admin/submissions" element={<Submissions />} />
    <Route path="/admin/payments" element={<Payments />} />
    <Route path="/admin/notifications" element={<Notifications />} />
    <Route path="/admin/reports" element={<Reports />} />
  </Route>
</Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}