import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import LoginPage from "../pages/login/page";
import DashboardPage from "../pages/dashboard/page";
import AttendancePage from "../pages/attendance/page";
import AttendanceHistoryPage from "../pages/attendance/history/page";
import EmployeesPage from "../pages/employees/page";
import ProfilePage from "../pages/profile/page";
import RequestsPage from "../pages/requests/page";
import RequestsNewPage from "../pages/requests/new/page";
import OfficePage from "../pages/office/page";
import OvertimePage from "../pages/overtime/page";
import OvertimeNewPage from "../pages/overtime/new/page";
import OvertimeDetailPage from "../pages/overtime/detail/page";
import OvertimeEditPage from "../pages/overtime/edit/page";
import LeavePage from "../pages/leave/page";
import LeaveNewPage from "../pages/leave/new/page";
import LeaveDetailPage from "../pages/leave/detail/page";
import LeaveEditPage from "../pages/leave/edit/page";
import TimelinePage from "../pages/timeline/page";
import CrmPage from "../pages/crm/page";
import TimeOffPage from "../pages/timeoff/page";
import TimeOffNewPage from "../pages/timeoff/new/page";
import PayslipPage from "../pages/payslip/page";
import PayslipDetailPage from "../pages/payslip/detail/page";
import { AppLayout } from "../components/feature/AppLayout";
import { ProtectedRoute } from "../components/feature/ProtectedRoute";

const routes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "attendance",
        element: <AttendancePage />,
      },
      {
        path: "attendance/history",
        element: <AttendanceHistoryPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "employees",
        element: <EmployeesPage />,
      },
      {
        path: "requests",
        element: <RequestsPage />,
      },
      {
        path: "requests/new",
        element: <RequestsNewPage />,
      },
      {
        path: "office",
        element: <OfficePage />,
      },
      {
        path: "overtime",
        element: <OvertimePage />,
      },
      {
        path: "overtime/new",
        element: <OvertimeNewPage />,
      },
      {
        path: "overtime/:id/edit",
        element: <OvertimeEditPage />,
      },
      {
        path: "overtime/:id",
        element: <OvertimeDetailPage />,
      },
      {
        path: "leave",
        element: <LeavePage />,
      },
      {
        path: "leave/:id/edit",
        element: <LeaveEditPage />,
      },
      {
        path: "leave/:id",
        element: <LeaveDetailPage />,
      },
      {
        path: "leave/new",
        element: <LeaveNewPage />,
      },
      {
        path: "timeoff",
        element: <TimeOffPage />,
      },
      {
        path: "timeoff/new",
        element: <TimeOffNewPage />,
      },
      {
        path: "payslip",
        element: <PayslipPage />,
      },
      {
        path: "payslip/:id",
        element: <PayslipDetailPage />,
      },
      {
        path: "timeline",
        element: <TimelinePage />,
      },
      {
        path: "crm",
        element: <CrmPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;