import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import './sideBar.css';
import logo from '../../assets/images/ayu_lanka_logo.png';

// Child paths for each collapsible menu group
const MENU_PATHS = {
  user:       ['/user'],
  leaves:     ['/apply-leave'],
  attendance: ['/attendance-upload'],
  roster:     ['/employee-roster', '/update-roster', '/approve-roster', '/view-roster',
               '/change-dayoff', '/approve-dayoff', '/change-shift', '/approve-shift'],
  report:     ['/appointment-report', '/unlinked-appointment-report',
               '/appointment-completion-rate-report', '/deleted-appointment-report',
               '/staff-appointment-summary-report', '/staff-treatment-summary-report',
               '/customer-profile'],
};

const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Manual open/close override per menu group
  const [menuState, setMenuState] = useState({
    user: false, leaves: false, attendance: false, roster: false, report: false,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const designationCode = sessionStorage.getItem("designationCode");
  const fullName        = sessionStorage.getItem("fullName")  || "";
  const companyCode     = sessionStorage.getItem("companyCode") || "";

  // A group is open if the user manually opened it OR the current page lives inside it
  const isGroupOpen = (group) =>
    menuState[group] || (MENU_PATHS[group]?.includes(pathname) ?? false);

  const toggleMenu = (group) => {
    setMenuState(prev => ({ ...prev, [group]: !isGroupOpen(group) }));
  };

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  // Returns className string for a <Link> — 'active-link' when it matches current path
  const linkClass = (path) => pathname === path ? 'active-link' : '';

  return (
    <>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src={logo} alt="Ayu Lanka" className="sidebar-logo" />
          <div className="sidebar-brand-info">
            <span className="sidebar-company-badge">{companyCode}</span>
            <span className="sidebar-username">{fullName}</span>
          </div>
        </div>
        <div className="sidebar-divider" />

        <ul>
          {(designationCode === "SAD" || designationCode === "AD") && (
            <>
              <li className={isGroupOpen('user') ? 'active' : ''}>
                <span onClick={() => toggleMenu('user')}>User</span>
                {isGroupOpen('user') && (
                  <ul>
                    <li><Link className={linkClass('/user')} to="/user">Create/Update Users</Link></li>
                  </ul>
                )}
              </li>
              <li className={isGroupOpen('leaves') ? 'active' : ''}>
                <span onClick={() => toggleMenu('leaves')}>Leaves</span>
                {isGroupOpen('leaves') && (
                  <ul>
                    <li><Link className={linkClass('/apply-leave')} to="/apply-leave">Create/Update/Delete Leaves</Link></li>
                  </ul>
                )}
              </li>
              <li className={isGroupOpen('attendance') ? 'active' : ''}>
                <span onClick={() => toggleMenu('attendance')}>Attendance Upload</span>
                {isGroupOpen('attendance') && (
                  <ul>
                    <li><Link className={linkClass('/attendance-upload')} to="/attendance-upload">Upload</Link></li>
                  </ul>
                )}
              </li>
              <li className={isGroupOpen('roster') ? 'active' : ''}>
                <span onClick={() => toggleMenu('roster')}>Roster</span>
                {isGroupOpen('roster') && (
                  <ul>
                    <li><Link className={linkClass('/employee-roster')} to="/employee-roster">Create Roster</Link></li>
                    <li><Link className={linkClass('/update-roster')}   to="/update-roster">Update Roster</Link></li>
                    {designationCode === "SAD" && (
                      <li><Link className={linkClass('/approve-roster')} to="/approve-roster">Approve Roster</Link></li>
                    )}
                    <li><Link className={linkClass('/view-roster')}    to="/view-roster">View Roster</Link></li>
                    <li><Link className={linkClass('/change-dayoff')}  to="/change-dayoff">Change Day Off</Link></li>
                    {designationCode === "SAD" && (
                      <li><Link className={linkClass('/approve-dayoff')} to="/approve-dayoff">Approve Change Day Off</Link></li>
                    )}
                    <li><Link className={linkClass('/change-shift')}   to="/change-shift">Change Shift</Link></li>
                    {designationCode === "SAD" && (
                      <li><Link className={linkClass('/approve-shift')} to="/approve-shift">Approve Change Shift</Link></li>
                    )}
                  </ul>
                )}
              </li>
            </>
          )}

          {(designationCode === "SAD" || designationCode === "AD" || designationCode === "ADT" || designationCode === "RP") && (
            <li className={isGroupOpen('report') ? 'active' : ''}>
              <span onClick={() => toggleMenu('report')}>Reports</span>
              {isGroupOpen('report') && (
                <ul>
                  <li><Link className={linkClass('/appointment-report')}                   to="/appointment-report">Appointment Report</Link></li>
                  <li><Link className={linkClass('/unlinked-appointment-report')}           to="/unlinked-appointment-report">Appointments Missing Next Visit Report</Link></li>
                  <li><Link className={linkClass('/appointment-completion-rate-report')}    to="/appointment-completion-rate-report">Appointment Completion Rate Report</Link></li>
                  <li><Link className={linkClass('/deleted-appointment-report')}            to="/deleted-appointment-report">Deleted Appointment Report</Link></li>
                  <li><Link className={linkClass('/staff-appointment-summary-report')}      to="/staff-appointment-summary-report">Staff Wise Appointment Summary Report</Link></li>
                  <li><Link className={linkClass('/staff-treatment-summary-report')}        to="/staff-treatment-summary-report">Staff Wise Treatment Summary Report</Link></li>
                  <li><Link className={linkClass('/customer-profile')}                     to="/customer-profile">Customer Profile</Link></li>
                </ul>
              )}
            </li>
          )}

          {(designationCode === "SAD" || designationCode === "AD" || designationCode === "RP" || designationCode === "ADT") && (
            <>
              <li><Link className={linkClass('/token-generate')}                          to="/token-generate">Token Generate</Link></li>
              <li><Link className={linkClass('/appoinment-schedular-elitecare')}          to="/appoinment-schedular-elitecare">Appointment Scheduler - Elite Care</Link></li>
              <li><Link className={linkClass('/appoinment-schedular-primecare')}          to="/appoinment-schedular-primecare">Appointment Scheduler - Prime Care</Link></li>
              <li><Link className={linkClass('/doctor-sessions')}                         to="/doctor-sessions">Doctor Sessions (Channeling)</Link></li>
              <li><Link className={linkClass('/channeling')}                              to="/channeling">Channeling Appointments</Link></li>
              <li><Link className={linkClass('/appoinment-schedular-doctorechanneling')}  to="/appoinment-schedular-doctorechanneling">Appointment Scheduler - Channeling</Link></li>
            </>
          )}
        </ul>

        <div className="logout">
          <FaSignOutAlt /> <Link to="/logout">Logout</Link>
        </div>
      </div>
      <div className="sidebar-toggle" onClick={toggleSidebar}>
        <FaBars />
      </div>
    </>
  );
};

export default Sidebar;
