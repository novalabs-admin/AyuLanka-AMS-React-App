import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; // For Excel export
import './staffWiseAppointmentSummaryReport.css';
import { fetchAllAppointmentsByDateRange } from '../../../services/appointmentSchedulerApi';
import SkeletonTable from '../../common/SkeletonTable';
import EmptyState from '../../common/EmptyState';

const StaffWiseAppointmentSummaryReport = () => {
    const [appointments, setAppointments] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateRange, setDateRange] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
  
    // Generate an array of dates between start and end dates
    const generateDateRange = (start, end) => {
        const dates = [];
        let currentDate = new Date(start);
        while (currentDate <= new Date(end)) {
            dates.push(new Date(currentDate).toISOString().slice(0, 10)); // Format as YYYY-MM-DD
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
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
    
        return durationMinutes;
    }

// Helper function to convert minutes into hours and minutes (e.g., "1h:30m")
const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h:${mins}m`;
};

const fetchAppointments = async () => {
    setLoading(true);
    setFetched(false);
    try {
        const start = new Date(startDate); // Convert to Date object
        const end = new Date(endDate);     // Convert to Date object
        const data = await fetchAllAppointmentsByDateRange(start, end);

        const employeeData = {};
        
        // Iterate over each appointment in the response
        data.forEach(appointment => {
            const scheduleDate = new Date(appointment.scheduleDate).toDateString(); // Format the date
            const employee = appointment.employee;

            // Use "Unknown" if no employee is assigned
            const employeeId = employee ? employee.id : "Unknown";
            const callingName = employee ? employee.callingName : "No Employee";

            // Initialize employee data if not already present
            if (!employeeData[employeeId]) {
                employeeData[employeeId] = {
                    employeeId: employeeId,
                    callingName: callingName,
                    scheduleCounts: [], // Change to an array for date-specific counts
                };
            }

            // Find or create a schedule entry for the specific date
            const scheduleEntry = employeeData[employeeId].scheduleCounts.find(entry => entry.date === scheduleDate);

            if (!scheduleEntry) {
                // Initialize a new entry for the date if not present
                employeeData[employeeId].scheduleCounts.push({
                    date: scheduleDate,
                    appointmentCount: 0,
                    treatmentCount: 0,
                    totalDuration: 0,
                });
            }

            // Get the correct schedule entry
            const currentScheduleEntry = employeeData[employeeId].scheduleCounts.find(entry => entry.date === scheduleDate);

            // Update counts for the specific date
            currentScheduleEntry.appointmentCount++;
            currentScheduleEntry.treatmentCount += appointment.appointmentTreatments.length;

            if (appointment.actualFromTime != null && appointment.actualToTime != null) {
                const totalDuration = calculateDuration(appointment.actualFromTime, appointment.actualToTime);
                currentScheduleEntry.totalDuration += totalDuration; // Assuming you want to add total minutes
            }
        });

        // Prepare the final array
        const result = Object.values(employeeData);

        // Map appointments to include counts for each date in dateRange
        const mappedAppointments = result.map(employee => {
            const summary = {
                appointmentCount: 0,
                treatmentCount: 0,
                duration: 0,
            };
            const dateRangeNew = generateDateRange(startDate, endDate);
            
            // Create a new object for the employee with counts for each date
            const dateCounts = dateRangeNew.reduce((acc, date) => {
                const formattedDate = new Date(date).toDateString();
                const scheduleEntry = employee.scheduleCounts.find(entry => {
                    return new Date(entry.date).toDateString() === formattedDate; // Ensure both are Date objects
                }) || {
                    appointmentCount: 0,
                    treatmentCount: 0,
                    totalDuration: 0,
                };
                
                // Update summary totals
                summary.appointmentCount += scheduleEntry.appointmentCount;
                summary.treatmentCount += scheduleEntry.treatmentCount;
                summary.duration += scheduleEntry.totalDuration;

                // Convert totalDuration to "hours:minutes" format
                acc[date] = {
                    appointmentCount: scheduleEntry.appointmentCount,
                    treatmentCount: scheduleEntry.treatmentCount,
                    duration: formatDuration(scheduleEntry.totalDuration), // Format duration here
                };

                return acc;
            }, {});

            return {
                employeeId: employee.employeeId,
                callingName: employee.callingName,
                ...dateCounts, // Spread dateCounts into the employee object
                summary: {
                    appointmentCount: summary.appointmentCount,
                    treatmentCount: summary.treatmentCount,
                    duration: formatDuration(summary.duration), // Format summary duration here
                },
            };
        });

        setAppointments(mappedAppointments); // Set the grouped data
        setDateRange(generateDateRange(startDate, endDate)); // Set the date range for table headers
    } catch (error) {
        console.error('Error fetching appointments data:', error);
    } finally {
        setLoading(false);
        setFetched(true);
    }
};


    const filteredAppointments = appointments.filter((appointment) => {
        return appointment.callingName.toLowerCase().includes(searchTerm.toLowerCase());
    });
    

    useEffect(() => {
        console.log('mapped appointments', appointments)
    }, [appointments]);
    

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Export to Excel functionality
const exportToExcel = () => {
    // Prepare data for Excel export
    const exportData = [];

    // Create header rows
    const headerRow1 = ['Employee Name'];
    const headerRow2 = ['']; // Sub-headers

    dateRange.forEach(date => {
        headerRow1.push(formatDate(date), '', ''); // Main date header
        headerRow2.push('Appointment Count', 'Treatment Count', 'Duration'); // Sub-headers
    });
    
    headerRow1.push('Summary', '', '');
    headerRow2.push('Appointment Count', 'Treatment Count', 'Duration');

    exportData.push(headerRow1); // Push main headers to the export data
    exportData.push(headerRow2);  // Push sub-headers to the export data

    // Create data rows
    filteredAppointments.forEach(appointment => {
        const row = [appointment.callingName];

        dateRange.forEach(date => {
            row.push(appointment[date]?.appointmentCount || 0);
            row.push(appointment[date]?.treatmentCount || 0);
            row.push(appointment[date]?.duration || 0);
        });

        // Summary data
        row.push(appointment.summary.appointmentCount || 0);
        row.push(appointment.summary.treatmentCount || 0);
        row.push(appointment.summary.duration || 0);

        exportData.push(row);
    });

    // Convert to worksheet and save
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Appointments Report");
    XLSX.writeFile(wb, "AppointmentReport.xlsx");
};



    return (
        <div style={{marginRight:'4%'}}>
            <h2 className="report-heading">Staff Wise Appointment Summary Report</h2>
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
                        <button onClick={fetchAppointments} className="report-filter-button">Generate Report</button>
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

            {loading && <SkeletonTable rows={5} cols={7} />}

            {!loading && fetched && filteredAppointments.length === 0 && (
                <EmptyState title="No staff data for this period"
                    message="No appointments found in the selected date range." />
            )}

            {!loading && filteredAppointments.length > 0 && (
            <div className="scrollable-table-container">
                <table className="report-table">
                    <thead>
                        <tr>
                            <th rowSpan="2">Employee Name</th>
                            {dateRange.map(date => (
                                <th colSpan="3" key={date}>{formatDate(date)}</th>
                            ))}
                            <th colSpan="3">Summary</th>
                        </tr>
                        <tr>
                            {dateRange.map(date => (
                                <React.Fragment key={date}>
                                    <th key={`${date}-appointments`}>Appt Count</th>
                                    <th key={`${date}-treatments`}>Treatment Count</th>
                                    <th key={`${date}-duration`}>Duration</th>
                                </React.Fragment>
                            ))}
                            <th>Appt Count</th>
                            <th>Treatments Count</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAppointments.map(appointment => (
                            <tr key={appointment.employeeId}>
                                <td>{appointment.callingName}</td>
                                {dateRange.map(date => (
                                    <React.Fragment key={date}>
                                        <td>{appointment[date]?.appointmentCount || 0}</td>
                                        <td>{appointment[date]?.treatmentCount || 0}</td>
                                        <td>{appointment[date]?.duration || 0}</td>
                                    </React.Fragment>
                                ))}
                                <td>{appointment.summary.appointmentCount || 0}</td>
                                <td>{appointment.summary.treatmentCount || 0}</td>
                                <td>{appointment.summary.duration || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="table-total-row">
                            <td><strong>Total</strong></td>
                            {dateRange.map(date => (
                                <React.Fragment key={date}>
                                    <td><strong>{filteredAppointments.reduce((s,a) => s + (a[date]?.appointmentCount||0), 0)}</strong></td>
                                    <td><strong>{filteredAppointments.reduce((s,a) => s + (a[date]?.treatmentCount||0), 0)}</strong></td>
                                    <td>—</td>
                                </React.Fragment>
                            ))}
                            <td><strong>{filteredAppointments.reduce((s,a) => s + (a.summary.appointmentCount||0), 0)}</strong></td>
                            <td><strong>{filteredAppointments.reduce((s,a) => s + (a.summary.treatmentCount||0), 0)}</strong></td>
                            <td>—</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            )}

            <br/><br/>
            <div className="report-buttons no-print">
                <button className="report-button" onClick={window.print}>Print</button>
                <button className="report-button" onClick={exportToExcel}>Download as Excel</button>
            </div>
        </div>
    );
};

export default StaffWiseAppointmentSummaryReport;
