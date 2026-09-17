import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Login from "./components/login";
import Sidebar from "./components/sideBar/sideBar";
import Breadcrumb from "./components/breadcrumb/Breadcrumb";
import User from "./components/user/user";
import ApplyLeave from "./components/leave/applyLeave";
import EmployeeRoster from "./components/employeeRoster/employeeRoster";
import AppointmentScheduler from "./components/appointmentScheduler/appointmentScheduler";
import UpdateRoster from "./components/updateRoster/updateRoster";
import ChangeDayOff from "./components/changeDayOff/changeDayOff";
import ApproveRoster from "./components/approveRoster/approveRoster";
import ViewRoster from "./components/viewRoster/viewRoster";
import ApproveDayOff from "./components/approveDayOff/approveDayOff";
import ChangeShift from "./components/changeShift/changeShift";
import ApproveShift from "./components/approveShift/approveShift";
import ManageAttendance from "./components/attendance/manageAttendance";
import Logout from "./components/logout/logout";
import AppointmentReport from "./components/Reports/appointmentReport/appointmentReport";
import StaffWiseAppointmentSummaryReport from "./components/Reports/staffWiseAppointmentSummaryReport/staffWiseAppointmentSummaryReport";
import StaffWiseTreatmentSummaryReport from "./components/Reports/staffWiseTreatmentSummaryReport/staffWiseTreatmentSummaryReport";
import DeletedAppointmentReport from "./components/Reports/deletedAppointmentReport/deletedAppointmentReport";
import AppointmentCompletionRateReport from "./components/Reports/appointmentCompletionRateReport/appointmentCompletionRateReport";
import AppointmentSchedulerPrimeCare from "./components/appointmentSchedulerPrimeCare/appointmentSchedulerPrimeCare";
import TokenGenerate from "./components/tokenGenerate/TokenGenerate";
import TokenDashboard from "./components/tokenDashboard/tokenDashboard";
import UnlinkedAppointmentReport from "./components/Reports/unlinkedAppointmentReport/unlinkedAppointmentReport";
import Dashboard from "./components/dashboard/dashboardCharts";
import { Home } from "@mui/icons-material";
import CustomerProfile from "./components/customerProfile/customerProfile";
import DoctorSessionManager from "./components/doctorSessionManager/doctorSessionManager";
import ChannelingAppointment from "./components/channelingAppointment/channelingAppointment";
import AppointmentSchedulerDoctorChanneling from "./components/appointmentSchedulerDoctorChanneling/appointmentSchedulerDoctorChanneling";

const Layout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  return (
    <div className="app-container">
      {!isLoginPage && <Sidebar />}
      <div className={`main-content ${isLoginPage ? 'full-width' : ''}`}>
        {!isLoginPage && <Breadcrumb />}
        {children}
      </div>
    </div>
  );
};

const Routers = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/user" element={<User />} />
        <Route path="/customer-profile" element={<CustomerProfile />} />
        <Route path="/apply-leave" element={<ApplyLeave />} />
        <Route path="/attendance-upload" element={<ManageAttendance />} />
        <Route path="/employee-roster" element={<EmployeeRoster />} />
        <Route path="/token-generate" element={<TokenGenerate />} />
        <Route path="/token-dashboard" element={<TokenDashboard />} />
        <Route path="/appoinment-schedular-elitecare" element={<AppointmentScheduler />} />
        <Route path="/appoinment-schedular-primecare" element={<AppointmentSchedulerPrimeCare />} />
        <Route path="/appoinment-schedular-doctorechanneling" element={<AppointmentSchedulerDoctorChanneling />} />
        <Route path="/update-roster" element={<UpdateRoster />} />
        <Route path="/approve-roster" element={<ApproveRoster />} />
        <Route path="/view-roster" element={<ViewRoster />} />
        <Route path="/change-dayoff" element={<ChangeDayOff />} />
        <Route path="/approve-dayoff" element={<ApproveDayOff />} />
        <Route path="/change-shift" element={<ChangeShift />} />
        <Route path="/approve-shift" element={<ApproveShift />} />
        <Route path="/deleted-appointment-report" element={<DeletedAppointmentReport />} />
        <Route path="/appointment-report" element={<AppointmentReport />} />
        <Route path="/unlinked-appointment-report" element={<UnlinkedAppointmentReport />} />
        <Route path="/staff-appointment-summary-report" element={<StaffWiseAppointmentSummaryReport />} />
        <Route path="/staff-treatment-summary-report" element={<StaffWiseTreatmentSummaryReport />} />
        <Route path="/appointment-completion-rate-report" element={<AppointmentCompletionRateReport />} />
        <Route path="/doctor-sessions" element={<DoctorSessionManager />} />
        <Route path="/channeling" element={<ChannelingAppointment />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Layout>
  );
};

export default Routers;
