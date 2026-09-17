import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; // For Excel export
import './staffWiseTreatmentSummaryReport.css';
import { fetchAllAppointmentsByDateRange } from '../../../services/appointmentSchedulerApi';
import SkeletonTable from '../../common/SkeletonTable';
import EmptyState from '../../common/EmptyState';

const StaffWiseTreatmentSummaryReport = () => {
    const [appointments, setAppointments] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateRange, setDateRange] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [treatmentAppointments, setTreatmentAppointments] = useState([]);
    const [treatmentNames, setTreatmentNames] = useState([]);
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

    const fetchAppointments = async () => {
        setLoading(true);
        setFetched(false);
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const data = await fetchAllAppointmentsByDateRange(start, end);

            const employeeData = {};
            const treatmentNamesSet = new Set(); // To store unique treatment names

            // Iterate over each appointment in the response
            data.forEach(appointment => {
                const employee = appointment.employee;
                const secondaryEmployee = appointment.secondaryEmployee; // Assuming secondary employee is stored in `secondaryEmployee`

                const employeeId = employee ? employee.id : "Unknown";
                const secondaryEmployeeId = secondaryEmployee ? secondaryEmployee.id : null;
                const callingName = employee ? employee.callingName : "No Employee";
                const secondaryEmployeeName = secondaryEmployee ? secondaryEmployee.callingName : "No Secondary Employee";

                if (employeeId === "Unknown") return;

                // Collect treatment names
                appointment.appointmentTreatments.forEach(treatment => {
                    treatmentNamesSet.add(treatment.treatmentType.name); // Add treatment name to set
                });

                // Initialize employee data if not already present
                if (!employeeData[employeeId]) {
                    employeeData[employeeId] = {
                        employeeId: employeeId,
                        callingName: callingName,
                        treatmentCounts: {}, // Store treatment counts for this employee
                    };
                }

                // Initialize secondary employee data if not already present
                if (secondaryEmployeeId && !employeeData[secondaryEmployeeId]) {
                    employeeData[secondaryEmployeeId] = {
                        employeeId: secondaryEmployeeId,
                        callingName: secondaryEmployeeName,
                        treatmentCounts: {}, // Store treatment counts for secondary employee
                    };
                }

                // Iterate through treatments and update counts for both primary and secondary employee
                appointment.appointmentTreatments.forEach(treatment => {
                    const treatmentName = treatment.treatmentType.name; // Get treatment name

                    // Update treatment count for primary employee
                    if (!employeeData[employeeId].treatmentCounts[treatmentName]) {
                        employeeData[employeeId].treatmentCounts[treatmentName] = 0;
                    }
                    employeeData[employeeId].treatmentCounts[treatmentName]++;

                    // Update treatment count for secondary employee (if exists)
                    if (secondaryEmployeeId) {
                        if (!employeeData[secondaryEmployeeId].treatmentCounts[treatmentName]) {
                            employeeData[secondaryEmployeeId].treatmentCounts[treatmentName] = 0;
                        }
                        employeeData[secondaryEmployeeId].treatmentCounts[treatmentName]++;
                    }
                });
            });

            // Prepare the final array with treatment counts for each employee (including secondary employees)
            const result = Object.values(employeeData);

            // Create a list of treatment names from the collected data
            const treatmentNamesArray = Array.from(treatmentNamesSet); // Convert Set to Array
            setTreatmentNames(treatmentNamesArray);

            // Map appointments data to include treatment counts
            const mappedAppointments = result.map(employee => {
                // Using treatmentNamesArray instead of treatmentNamesSet here
                const treatmentCounts = treatmentNamesArray.reduce((acc, treatmentName) => {
                    acc[treatmentName] = employee.treatmentCounts[treatmentName] || 0; // Assign count or 0 if no treatments found
                    return acc;
                }, {});

                return {
                    employeeId: employee.employeeId,
                    callingName: employee.callingName,
                    ...treatmentCounts, // Spread treatmentCounts into the employee object
                };
            });

            setTreatmentAppointments(mappedAppointments); // Set the grouped data
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
        console.log('treatment Names', treatmentNames)
    }, [treatmentNames]);


    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Export to Excel functionality
    const exportToExcel = () => {
        // Prepare data for Excel export
        const exportData = [];

        // Create header rows
        const headerRow1 = ['Employee Name'];  // Start with Employee Name

        // Add treatment names to the header
        treatmentNames.forEach(treatmentName => {
            headerRow1.push(treatmentName); // Main header with treatment names
        });

        // Push the headers to the export data
        exportData.push(headerRow1); // First header row

        // Create data rows for each employee
        treatmentAppointments.forEach(appointment => {
            const row = [appointment.callingName];  // Start with the employee name

            // Add treatment counts for each treatment name
            treatmentNames.forEach(treatmentName => {
                row.push(appointment[treatmentName] || 0);  // Add the treatment count or 0 if no treatment found
            });

            exportData.push(row); // Push the row to the export data
        });

        // Convert to worksheet and save as Excel file
        const ws = XLSX.utils.aoa_to_sheet(exportData);  // Convert the array of arrays to a sheet
        const wb = XLSX.utils.book_new();  // Create a new workbook
        XLSX.utils.book_append_sheet(wb, ws, "Treatment Report");  // Add the sheet to the workbook
        XLSX.writeFile(wb, "TreatmentReport.xlsx");  // Save the workbook as an Excel file
    };




    return (
        <div style={{ marginRight: '4%' }}>
            <h2 className="report-heading">Staff Wise Treatment Summary Report</h2>
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

            {loading && <SkeletonTable rows={5} cols={6} />}

            {!loading && fetched && treatmentAppointments.length === 0 && (
                <EmptyState title="No treatment data for this period"
                    message="No appointments found in the selected date range." />
            )}

            {!loading && treatmentAppointments.length > 0 && (
            <div className="scrollable-table-container">
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Employee Name</th>
                            {treatmentNames.map(treatmentName => (
                                <th key={treatmentName}>{treatmentName}</th>
                            ))}
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {treatmentAppointments.map(appointment => (
                            <tr key={appointment.employeeId}>
                                <td>{appointment.callingName}</td>
                                {treatmentNames.map(treatmentName => (
                                    <td key={treatmentName}>{appointment[treatmentName] || 0}</td>
                                ))}
                                <td><strong>{treatmentNames.reduce((s, t) => s + (appointment[t] || 0), 0)}</strong></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="table-total-row">
                            <td><strong>Total</strong></td>
                            {treatmentNames.map(t => (
                                <td key={t}><strong>{treatmentAppointments.reduce((s, a) => s + (a[t] || 0), 0)}</strong></td>
                            ))}
                            <td><strong>{treatmentAppointments.reduce((s, a) =>
                                s + treatmentNames.reduce((ts, t) => ts + (a[t] || 0), 0), 0)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            )}

            <br /><br />
            <div className="report-buttons no-print">
                <button className="report-button" onClick={window.print}>Print</button>
                <button className="report-button" onClick={exportToExcel}>Download as Excel</button>
            </div>
        </div>
    );
};

export default StaffWiseTreatmentSummaryReport;
