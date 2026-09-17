import React, { useState } from 'react';
import * as XLSX from 'xlsx'; // Import XLSX library
import './unlinkedAppointmentReport.css';
import { fetchAllAppointmentsByDateRange } from '../../../services/appointmentSchedulerApi';
import SkeletonTable from '../../common/SkeletonTable';
import EmptyState from '../../common/EmptyState';

const UnlinkedAppointmentReport = () => {
    const [appointments, setAppointments] = useState([]);
    const [dateFilter, setDateFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const fetchAppointments = async (date) => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates.');
            return;
        }
        setLoading(true);
        setFetched(false);
        try {
            const start = new Date(startDate); // Convert to Date object
            const end = new Date(endDate);     // Convert to Date object
            const data = await fetchAllAppointmentsByDateRange(start, end);

            //const data = await fetchAppoitmentByDate(date);

            // Filter appointments that have no next (child) appointment
            const filteredData = data.filter(
                item =>
                    item.chitNo != null &&
                    (!item.childAppointments || item.childAppointments.length === 0)
            );

            const sortedData = filteredData.sort((a, b) => {
                const tokenA = a.tokenNo !== null ? parseInt(a.tokenNo, 10) : Infinity;
                const tokenB = b.tokenNo !== null ? parseInt(b.tokenNo, 10) : Infinity;
                return tokenA - tokenB;
            });

            console.log(sortedData);
            setAppointments(sortedData);
        } catch (error) {
            console.error('Error fetching day offs data:', error);
        } finally {
            setLoading(false);
            setFetched(true);
        }
    };

    const formatDateTime = (dateTime) => {
        const date = new Date(dateTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    function calculateDuration(actualFromTime, actualToTime) {
        // console.log('actualFromTime ', actualFromTime, ' actualToTime ', actualToTime)
        // Parse the time strings into Date objects
        const fromTimeParts = actualFromTime.split(':');
        const toTimeParts = actualToTime.split(':');

        // Create Date objects for today with the provided times
        const fromDate = new Date();
        const toDate = new Date();

        fromDate.setHours(fromTimeParts[0], fromTimeParts[1], fromTimeParts[2]);
        toDate.setHours(toTimeParts[0], toTimeParts[1], toTimeParts[2]);

        // Calculate the duration in milliseconds
        const durationMilliseconds = toDate - fromDate;

        // Convert milliseconds to minutes
        const durationMinutes = Math.floor(durationMilliseconds / 60000);
        const durationHours = Math.floor(durationMinutes / 60);
        const remainingMinutes = durationMinutes % 60;

        return durationHours + "h:" + remainingMinutes + "m";
    }

    const filteredAppointments = appointments.filter((appointment) => {
        return (
            (appointment.tokenNo !== null && appointment.tokenNo.toString().includes(searchTerm)) || // Check Token Number
            (appointment.customerName && appointment.customerName.toLowerCase().includes(searchTerm.toLowerCase())) || // Check Customer Name
            (appointment.contactNo && appointment.contactNo.includes(searchTerm)) || // Check Contact No
            (appointment.employee?.callingName && appointment.employee.callingName.toLowerCase().includes(searchTerm.toLowerCase())) || // Check Employee
            (appointment.secondaryEmployee?.callingName && appointment.secondaryEmployee.callingName.toLowerCase().includes(searchTerm.toLowerCase())) || // Check Secondary Employee
            (appointment.location?.name && appointment.location.name.toLowerCase().includes(searchTerm.toLowerCase())) || // Check Location
            (appointment.appointmentTreatments.some(treatment => treatment.treatmentType.name.toLowerCase().includes(searchTerm.toLowerCase()))) || // Check Treatment Types
            (appointment.scheduleDate && appointment.scheduleDate.split('T')[0].includes(searchTerm)) || // Check Scheduled Date
            (appointment.fromTime && appointment.fromTime.includes(searchTerm)) || // Check Start Time
            (appointment.toTime && appointment.toTime.includes(searchTerm)) || // Check End Time
            (appointment.actualFromTime && `${appointment.actualFromTime} - ${appointment.actualToTime}`.includes(searchTerm)) || // Check Actual Start & End Time
            (appointment.actualFromTime && appointment.actualToTime ? calculateDuration(appointment.actualFromTime, appointment.actualToTime) : '0h:0m'.includes(searchTerm)) ||
            (appointment.remarks && appointment.remarks.toLowerCase().includes(searchTerm.toLowerCase())) || // Check Remarks
            (appointment.tokenIssueTime && formatDateTime(appointment.tokenIssueTime).includes(searchTerm)) || // Check Token Issued Date & Time
            (appointment.enteredByEmployee?.callingName && appointment.enteredByEmployee.callingName.toLowerCase().includes(searchTerm.toLowerCase())) || // Check Entered By
            (appointment.enteredDate && formatDateTime(appointment.enteredDate).includes(searchTerm)) // Check Entered Date & Time
        );
    });


    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Appointment Report</title>
                    <style>
                        @media print {
                            body {
                                margin: 0;
                                padding: 20px;
                                font-family: Arial, sans-serif;
                            }
                            .printable-table {
                                width: 100%;
                                border-collapse: collapse;
                            }
                            .printable-table th,
                            .printable-table td {
                                border: 1px solid #000;
                                padding: 8px;
                                text-align: left;
                            }
                            .printable-table th {
                                background-color: #f2f2f2;
                            }
                            @page {
                                size: landscape;
                            }
                        }
                    </style>
                </head>
                <body>
                    <h2>Appointment Report</h2>
                    <div class="printable-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Token Number</th>
                                    <th>Customer Name</th>
                                    <th>Contact No</th>
                                    <th>Employee</th>
                                    <th>Secondary Employee</th>
                                    <th>Location</th>
                                    <th>Treatment Types</th>
                                    <th>Scheduled Date</th>
                                    <th>Scheduled Start Time & End Time</th>
                                    <th>Actual Start Time & End Time</th>
                                    <th>Duration</th>
                                    <th>Remarks</th>
                                    <th>Token Issued Date & Time</th>
                                    <th>Entered By</th>
                                    <th>Entered Date & Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredAppointments.map(appointment => `
                                    <tr>
                                        <td>${appointment.tokenNo}</td>
                                        <td>${appointment.customerName}</td>
                                        <td>${appointment.contactNo}</td>
                                        <td>${appointment.employee?.callingName}</td>
                                        <td>${appointment.secondaryEmployee?.callingName}</td>
                                        <td>${appointment.location.name}</td>
                                        <td>
                                            ${appointment.appointmentTreatments.map(treatment => treatment.treatmentType.name).join(', ')}
                                        </td>
                                        <td>${appointment.scheduleDate.split('T')[0]}</td>
                                        <td>${appointment.fromTime} - ${appointment.toTime}</td>
                                        <td>${appointment.actualFromTime ? `${appointment.actualFromTime} - ${appointment.actualToTime}` : ''}</td>
                                        <td>${appointment.actualFromTime && appointment.actualToTime ? calculateDuration(appointment.actualFromTime, appointment.actualToTime) : '0h:0m'}</td>
                                        <td>${appointment.remarks}</td>
                                        <td>${appointment.tokenIssueTime ? formatDateTime(appointment.tokenIssueTime) : ''}</td>
                                        <td>${appointment.enteredByEmployee.callingName}</td>
                                        <td>${appointment.enteredDate ? formatDateTime(appointment.enteredDate) : ''}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleDownloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredAppointments.map(appointment => ({
            TokenNumber: appointment.tokenNo,
            CustomerName: appointment.customerName,
            ContactNo: appointment.contactNo,
            Employee: appointment.employee?.callingName,
            SecondaryEmployee: appointment.secondaryEmployee?.callingName,
            Location: appointment.location.name,
            TreatmentTypes: appointment.appointmentTreatments.map(treatment => treatment.treatmentType.name).join(', '),
            ScheduledDate: appointment.scheduleDate.split('T')[0],
            ScheduledTime: `${appointment.fromTime} - ${appointment.toTime}`,
            ActualTime: appointment.actualFromTime ? `${appointment.actualFromTime} - ${appointment.actualToTime}` : null,
            Duration: appointment.actualFromTime && appointment.actualToTime ? calculateDuration(appointment.actualFromTime, appointment.actualToTime) : '0h:0m',
            Remarks: appointment.remarks,
            TokenIssuedDateTime: appointment.tokenIssueTime ? formatDateTime(appointment.tokenIssueTime) : null,
            EnteredBy: appointment.enteredByEmployee.callingName,
            EnteredDateTime: appointment.enteredDate ? formatDateTime(appointment.enteredDate) : null
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');

        // Generate Excel file
        XLSX.writeFile(workbook, 'Appointment_Report.xlsx');
    };

    return (
        <div style={{ marginRight: '4%' }}>
            <h2 className="report-heading">Appointments Missing Next Visit</h2>

            {/* Date Filter */}
            <div className="report-filter">
                <div className="row">
                    <div className="col-md-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="report-date-input"
                            placeholder="Start Date"
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="report-date-input"
                            placeholder="End Date"
                        />
                    </div>
                    <div className="col-md-2">
                        <button className="report-filter-button" onClick={fetchAppointments}>
                            Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Input */}
            <div className="search-container">
                <div className='row'>
                    <div className='col-md-8'>&nbsp;</div>
                    <div className='col-md-4'>
                        <input
                            type="text"
                            className="report-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search appointments..."
                        />
                    </div>
                </div>
            </div>

            {loading && <SkeletonTable rows={6} cols={9} />}
            {!loading && fetched && filteredAppointments.length === 0 && (
                <EmptyState title="No unlinked appointments found"
                    message="All appointments in this period have a next visit scheduled." />
            )}
            {!loading && filteredAppointments.length > 0 && <div className="scrollable-table-container">
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Token Number</th>
                            <th>Customer Name</th>
                            <th>Contact No</th>
                            <th>Employee</th>
                            <th>Secondary Employee</th>
                            <th>Location</th>
                            <th>Treatment Types</th>
                            <th>Scheduled Date</th>
                            <th>Scheduled Start Time & End Time</th>
                            <th>Actual Start Time & End Time</th>
                            <th>Duration</th>
                            <th>Remarks</th>
                            <th>Token Issued Date & Time</th>
                            <th>Entered By</th>
                            <th>Entered Date & Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAppointments.map(appointment => (
                            <tr key={appointment.tokenNo}>
                                <td>{appointment.tokenNo}</td>
                                <td>{appointment.customerName}</td>
                                <td>{appointment.contactNo}</td>
                                <td>{appointment.employee?.callingName}</td>
                                <td>{appointment.secondaryEmployee?.callingName}</td>
                                <td>{appointment.location.name}</td>
                                <td>
                                    {appointment.appointmentTreatments.map(treatment => treatment.treatmentType.name).join(', ')}
                                </td>
                                <td>{appointment.scheduleDate.split('T')[0]}</td>
                                <td>{appointment.fromTime} - {appointment.toTime}</td>
                                <td>{appointment.actualFromTime ? `${appointment.actualFromTime} - ${appointment.actualToTime}` : ''}</td>
                                <td>{appointment.actualFromTime && appointment.actualToTime ? calculateDuration(appointment.actualFromTime, appointment.actualToTime) : '0h:0m'}</td>
                                <td>{appointment.remarks}</td>
                                <td>{appointment.tokenIssueTime ? formatDateTime(appointment.tokenIssueTime) : ''}</td>
                                <td>{appointment.enteredByEmployee.callingName}</td>
                                <td>{appointment.enteredDate ? formatDateTime(appointment.enteredDate) : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>}
            <br /><br />
            {/* Print and Download Buttons */}
            <div className="report-buttons">
                <button className="report-button" onClick={handlePrint}>
                    Print
                </button>
                <button className="report-button" onClick={handleDownloadExcel}>
                    Download as Excel
                </button>
            </div>
        </div>
    );
};

export default UnlinkedAppointmentReport;
