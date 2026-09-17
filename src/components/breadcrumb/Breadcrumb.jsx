import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const PATH_LABELS = {
  '/dashboard':                               'Dashboard',
  '/home':                                    'Home',
  '/user':                                    'User Management',
  '/apply-leave':                             'Leaves',
  '/attendance-upload':                       'Attendance Upload',
  '/employee-roster':                         'Create Roster',
  '/update-roster':                           'Update Roster',
  '/approve-roster':                          'Approve Roster',
  '/view-roster':                             'View Roster',
  '/change-dayoff':                           'Change Day Off',
  '/approve-dayoff':                          'Approve Day Off',
  '/change-shift':                            'Change Shift',
  '/approve-shift':                           'Approve Shift',
  '/token-generate':                          'Token Generate',
  '/token-dashboard':                         'Token Dashboard',
  '/appoinment-schedular-elitecare':          'Appointment Scheduler – Elite Care',
  '/appoinment-schedular-primecare':          'Appointment Scheduler – Prime Care',
  '/appoinment-schedular-doctorechanneling':  'Appointment Scheduler – Channeling',
  '/doctor-sessions':                         'Doctor Sessions',
  '/channeling':                              'Channeling Appointments',
  '/appointment-report':                      'Appointment Report',
  '/unlinked-appointment-report':             'Appointments Missing Next Visit',
  '/appointment-completion-rate-report':      'Appointment Completion Rate',
  '/deleted-appointment-report':              'Deleted Appointment Report',
  '/staff-appointment-summary-report':        'Staff Appointment Summary',
  '/staff-treatment-summary-report':          'Staff Treatment Summary',
  '/customer-profile':                        'Customer Profile',
};

const REPORT_PATHS = [
  '/appointment-report', '/unlinked-appointment-report',
  '/appointment-completion-rate-report', '/deleted-appointment-report',
  '/staff-appointment-summary-report', '/staff-treatment-summary-report',
  '/customer-profile',
];

const ROSTER_PATHS = [
  '/employee-roster', '/update-roster', '/approve-roster',
  '/view-roster', '/change-dayoff', '/approve-dayoff',
  '/change-shift', '/approve-shift',
];

const Breadcrumb = () => {
  const { pathname } = useLocation();
  const label = PATH_LABELS[pathname];

  if (!label) return null; // login page etc.

  // Build parent crumb
  let parent = null;
  if (REPORT_PATHS.includes(pathname)) {
    parent = { label: 'Reports', path: null };
  } else if (ROSTER_PATHS.includes(pathname)) {
    parent = { label: 'Roster', path: null };
  } else if (pathname === '/apply-leave') {
    parent = { label: 'Leaves', path: null };
  } else if (pathname === '/user') {
    parent = { label: 'User Management', path: null };
  }

  return (
    <nav className="breadcrumb-bar" aria-label="breadcrumb">
      <span className="bc-home">🏠 Home</span>
      {parent && (
        <>
          <span className="bc-sep">/</span>
          <span>{parent.label}</span>
        </>
      )}
      <span className="bc-sep">/</span>
      <span className="bc-current">{label}</span>
    </nav>
  );
};

export default Breadcrumb;
