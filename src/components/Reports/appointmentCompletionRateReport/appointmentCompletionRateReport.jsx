import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './appointmentCompletionRateReport.css';
import {
    fetchAllPreScheduledScheduledAppointmentsByDateRange,
    fetchCompletedAppointmentsByDateRange
} from '../../../services/appointmentSchedulerApi';
import SkeletonTable from '../../common/SkeletonTable';
import EmptyState from '../../common/EmptyState';

const AppointmentCompletionRateReport = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [completionData, setCompletionData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const generateDateRange = (start, end) => {
        const dates = [];
        let current = new Date(start + 'T00:00:00');
        const endDt  = new Date(end   + 'T00:00:00');
        while (current <= endDt) {
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    const fetchAppointments = async () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }
        setLoading(true);
        setFetched(false);
        try {
            const dateList = generateDateRange(startDate, endDate);
            // Pass raw date strings — the API service converts via new Date("YYYY-MM-DD")
            // which parses as UTC, so .toISOString() returns the correct date unchanged.
            const allAppointments = await fetchAllPreScheduledScheduledAppointmentsByDateRange(startDate, endDate);
            const completedAppointments = await fetchCompletedAppointmentsByDateRange(startDate, endDate);

            const groupByDate = (appointments) => {
                const grouped = {};
                appointments.forEach(a => {
                    const date = a.scheduleDate?.substring(0, 10);
                    if (!grouped[date]) grouped[date] = [];
                    grouped[date].push(a);
                });
                return grouped;
            };

            const allGrouped = groupByDate(allAppointments);
            const completedGrouped = groupByDate(completedAppointments);

            const dailyStats = dateList.map(date => {
                const total     = allGrouped[date]?.length || 0;
                const completed = completedGrouped[date]?.length || 0;
                const percentage = total > 0 ? ((completed / total) * 100).toFixed(2) : '0.00';
                return { date, total, completed, percentage };
            });

            setCompletionData(dailyStats);
        } catch (error) {
            console.error('Error fetching appointment data:', error);
        } finally {
            setLoading(false);
            setFetched(true);
        }
    };

    const exportToExcel = () => {
        const data = [
            ['Date', 'Total Appointments', 'Completed Appointments', 'Completion %'],
            ...completionData.map(d => [d.date, d.total, d.completed, d.percentage + '%'])
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Completion Rate');
        XLSX.writeFile(wb, 'AppointmentCompletionRate.xlsx');
    };

    const handlePrint = () => window.print();

    // Totals
    const grandTotal     = completionData.reduce((s, d) => s + d.total, 0);
    const grandCompleted = completionData.reduce((s, d) => s + d.completed, 0);
    const grandPct       = grandTotal > 0 ? ((grandCompleted / grandTotal) * 100).toFixed(2) : '0.00';

    return (
        <div style={{ marginRight: '4%' }}>
            <h2 className="report-heading">Appointment Completion Rate Report - Pre Scheduled Appoitments</h2>

            <div className="report-filter no-print">
                <div className="row">
                    <div className="col-md-2">
                        <input type="date" value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="report-date-input" />
                    </div>
                    <div className="col-md-2">
                        <input type="date" value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="report-date-input" />
                    </div>
                    <div className="col-md-2">
                        <button onClick={fetchAppointments} className="report-filter-button">
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>

            {loading && <SkeletonTable rows={6} cols={4} />}

            {!loading && fetched && completionData.length === 0 && (
                <EmptyState title="No data for this period"
                    message="No appointments found in the selected date range." />
            )}

            {!loading && completionData.length > 0 && (
                <div className="scrollable-table-container">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Total Appointments</th>
                                <th>Completed Appointments</th>
                                <th>Completion %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {completionData.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.date}</td>
                                    <td>{item.total}</td>
                                    <td>{item.completed}</td>
                                    <td>{item.percentage}%</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="table-total-row">
                                <td><strong>Total</strong></td>
                                <td><strong>{grandTotal}</strong></td>
                                <td><strong>{grandCompleted}</strong></td>
                                <td><strong>{grandPct}%</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            <br /><br />
            <div className="report-buttons no-print">
                <button className="report-button" onClick={handlePrint}>Print</button>
                <button className="report-button" onClick={exportToExcel}>Download as Excel</button>
            </div>
        </div>
    );
};

export default AppointmentCompletionRateReport;
