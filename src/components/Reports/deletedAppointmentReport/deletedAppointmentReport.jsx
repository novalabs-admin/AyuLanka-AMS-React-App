import React, { useState } from 'react';
import * as XLSX from 'xlsx'; // Import XLSX library
import './deletedAppointmentReport.css';
import { fetchDeletedAppoitmentByDate } from '../../../services/appointmentSchedulerApi';
import SkeletonTable from '../../common/SkeletonTable';
import EmptyState from '../../common/EmptyState';

const DeletedAppointmentReport = () => {
    const [appointments, setAppointments] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const fetchAppointments = async () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates.');
            return;
        }
        setLoading(true);
        setFetched(false);
        try {
            const data = await fetchDeletedAppoitmentByDate(startDate, endDate);

            const sortedData = data.sort((a, b) => {
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
            (appointment.customerName && appointment.customerName.toLowerCase().includes(searchTerm.toLowerCase())) || // Check Customer Name
            (appointment.contactNo && appointment.contactNo.includes(searchTerm)) || // Check Contact No
            (appointment.location?.name && appointment.location.name.toLowerCase().includes(searchTerm.toLowerCase())) || // Check Location
            (appointment.appointmentTreatments.some(treatment => treatment.treatmentType.name.toLowerCase().includes(searchTerm.toLowerCase()))) || // Check Treatment Types
            (appointment.scheduleDate && appointment.scheduleDate.split('T')[0].includes(searchTerm)) || // Check Scheduled Date
            (appointment.fromTime && appointment.fromTime.includes(searchTerm)) || // Check Start Time
            (appointment.toTime && appointment.toTime.includes(searchTerm)) || // Check End Time
            (appointment.remarks && appointment.remarks.toLowerCase().includes(searchTerm.toLowerCase())) || // Check Remarks
            (appointment.deletedByEmployee?.callingName && appointment.deletedByEmployee.callingName.toLowerCase().includes(searchTerm.toLowerCase())) || // Check Entered By
            (appointment.deletedDate && formatDateTime(appointment.deletedDate).includes(searchTerm)) // Check Entered Date & Time
        );
    });


    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Deleted Appointment Report</title>
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
                    <h2>Deleted Appointment Report</h2>
                    <div class="printable-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer Name</th>
                                    <th>Contact No</th>
                                    <th>Location</th>
                                    <th>Treatment Types</th>
                                    <th>Scheduled Date</th>
                                    <th>Scheduled Start Time & End Time</th>
                                    <th>Remarks</th>
                                    <th>Deleted By</th>
                                    <th>Deleted Date & Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredAppointments.map(appointment => `
                                    <tr>
                                        <td>${appointment.customerName}</td>
                                        <td>${appointment.contactNo}</td>
                                        <td>${appointment.location.name}</td>
                                        <td>
                                            ${appointment.appointmentTreatments.map(treatment => treatment.treatmentType.name).join(', ')}
                                        </td>
                                        <td>${appointment.scheduleDate.split('T')[0]}</td>
                                        <td>${appointment.fromTime} - ${appointment.toTime}</td>
                                        <td>${appointment.remarks}</td>
                                        <td>${appointment.deletedByEmployee.callingName}</td>
                                        <td>${appointment.deletedDate ? formatDateTime(appointment.deletedDate) : ''}</td>
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
            CustomerName: appointment.customerName,
            ContactNo: appointment.contactNo,
            Location: appointment.location.name,
            TreatmentTypes: appointment.appointmentTreatments.map(treatment => treatment.treatmentType.name).join(', '),
            ScheduledDate: appointment.scheduleDate.split('T')[0],
            ScheduledTime: `${appointment.fromTime} - ${appointment.toTime}`,
            Remarks: appointment.remarks,
            EnteredBy: appointment.deletedByEmployee.callingName,
            EnteredDateTime: appointment.deletedDate ? formatDateTime(appointment.deletedDate) : null
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');

        // Generate Excel file
        XLSX.writeFile(workbook, 'Appointment_Report.xlsx');
    };

    return (
        <div style={{ marginRight: '4%' }}>
            <h2 className="report-heading">Deleted Appointment Report</h2>

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
                <EmptyState title="No deleted appointments found"
                    message="No deleted appointments match the selected filters." />
            )}
            {!loading && filteredAppointments.length > 0 && <div className="scrollable-table-container">
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>Contact No</th>
                            <th>Location</th>
                            <th>Treatment Types</th>
                            <th>Scheduled Date</th>
                            <th>Scheduled Start Time & End Time</th>
                            <th>Remarks</th>
                            <th>Deleted By</th>
                            <th>Deleted Date & Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAppointments.map(appointment => (
                            <tr key={appointment.tokenNo}>
                                <td>{appointment.customerName}</td>
                                <td>{appointment.contactNo}</td>
                                <td>{appointment.location.name}</td>
                                <td>
                                    {appointment.appointmentTreatments.map(treatment => treatment.treatmentType.name).join(', ')}
                                </td>
                                <td>{appointment.scheduleDate.split('T')[0]}</td>
                                <td>{appointment.fromTime} - {appointment.toTime}</td>
                                <td>{appointment.remarks}</td>
                                <td>{appointment.deletedByEmployee.callingName}</td>
                                <td>{appointment.deletedDate ? formatDateTime(appointment.deletedDate) : ''}</td>
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

export default DeletedAppointmentReport;
