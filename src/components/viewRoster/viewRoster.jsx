import React, { useState, useEffect } from 'react';
import ModalComponent from '../modalComponent/modalComponent.jsx';
import { fetchRosterDetails, saveRoster, fetchRosterDates, fetchEmployees, fetchShifts, fetchLeaves } from '../../services/employeeRoster.js';
import './viewRoster.css';

function ViewRoster() {
    const [rosters, setRosters] = useState([]);
    const [selectedRosterId, setSelectedRosterId] = useState('');
    const [rosterDetailsByEmployee, setRosterDetailsByEmployee] = useState({});
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [days, setDays] = useState([]);
    const [checkboxStates, setCheckboxStates] = useState({});
    const [leaveData, setLeaveData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    useEffect(() => {
        fetchRosterDates()
            .then(data => {
                const approvedRosters = data.filter(roster => roster.isApproved);
                setRosters(approvedRosters);
            })
            .catch(setError);

        fetchEmployees().then(setEmployees).catch(setError);
        fetchShifts().then(setShifts).catch(setError);
    }, []);

    useEffect(() => {
        if (selectedRosterId) {
            fetchRosterDetails(selectedRosterId).then(data => {
                processRosterDetails(data);
                if (data.length > 0) {
                    const startDate = new Date(data[0].staffRosterMaster.fromDate);
                    const endDate = new Date(data[0].staffRosterMaster.todate);
                    setStartDate(startDate);
                    setEndDate(endDate);
                    generateDays(startDate, endDate);
                    fetchLeaves(startDate, endDate).then(fetchedLeaves => {
                        const formattedLeaveData = processLeaveData(fetchedLeaves);
                        setLeaveData(formattedLeaveData);
                    }).catch(setError);
                }
            }).catch(setError);
        }
    }, [selectedRosterId]);

    const processLeaveData = (leaveArray) => {
        const leaveDates = {};
        leaveArray.forEach(leave => {
            let start = new Date(leave.fromDate);
            let end = new Date(leave.toDate);

            if (!leaveDates[leave.employeeId]) {
                leaveDates[leave.employeeId] = {};
            }

            start = new Date(start.setHours(0, 0, 0, 0));
            end = new Date(end.setHours(0, 0, 0, 0));
            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;
                leaveDates[leave.employeeId][dateString] = true;
            }
        });
        return leaveDates;
    };

    const processRosterDetails = (details) => {
        const groupedDetails = {};
        console.log('Roster details:', details);
        details.forEach(detail => {
            const empId = detail.employeeId;
            if (!groupedDetails[empId]) {
                groupedDetails[empId] = {
                    employeeId: empId,
                    shiftMasterId: detail.shiftMasterId,
                    daysOff: {}
                };
            }
            const dayOffDate = new Date(detail.dayOffDate).toLocaleDateString('sv-SE');
            // Only set the day off if it is not already set to true
            if (groupedDetails[empId].daysOff[dayOffDate] !== true) {
                groupedDetails[empId].daysOff[dayOffDate] = detail.isDayOff;
            }
        });
        setRosterDetailsByEmployee(groupedDetails);
    };

    const generateDays = (start, end) => {
        const startDate = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
        const endDate = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

        const newDays = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            let dayOfWeek = currentDate.toLocaleString('en-us', { weekday: 'short' });
            let dayClass = '';
            if (dayOfWeek === 'Sat') {
                dayClass = 'saturday';
            } else if (dayOfWeek === 'Sun') {
                dayClass = 'sunday';
            }
            newDays.push({ date: new Date(currentDate), dayClass: dayClass });
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        setDays(newDays);
    };

    const handleCheckboxChange = (employeeId, dayString) => {
        const updatedDetails = { ...rosterDetailsByEmployee };
        updatedDetails[employeeId].daysOff[dayString] = !updatedDetails[employeeId].daysOff[dayString];
        setRosterDetailsByEmployee(updatedDetails);
    };

    const handleRosterSelect = (e) => {
        setSelectedRosterId(e.target.value);
    };

    const handleCancel = () => {
        // Reset all changes or navigate away
        setSelectedRosterId('');
        setRosterDetailsByEmployee({});
        setDays([]);
    };

    const handleSuccessClose = () => {
        setSuccessModalOpen(false);
        handleCancel(); // back to the start state (this used to be the full page reload)
    };

    const handleErrorClose = () => {
        setErrorModalOpen(false);
    };

    const formatLocalDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        setSaving(true);
        setLoading(true);
        try {
            const rosterMasterData = {
                Id: selectedRosterId,
                FromDate: formatLocalDate(startDate),
                Todate: formatLocalDate(endDate)
            };

            const staffRosterData = Object.values(rosterDetailsByEmployee).flatMap(detail =>
                days.map(day => {
                    const dayString = day.date.toLocaleDateString('sv-SE');
                    const isDayOff = detail.daysOff[dayString] === true;
                    if (isDayOff) {
                        return {
                            EmployeeId: detail.employeeId,
                            ShiftMasterId: detail.shiftMasterId,
                            IsDayOff: isDayOff,
                            DayOffDate: dayString
                        };
                    }
                    return null;
                }).filter(entry => entry !== null)
            );

            const dataToSend = {
                rosterMaster: rosterMasterData,
                staffRosters: staffRosterData
            };

            await saveRoster(dataToSend);
            setSuccessModalOpen(true);
            setLoading(false);
            setSaving(false);
        } catch (error) {
            setError(error.toString());
            setErrorModalOpen(true);
            setLoading(false);
            setSaving(false);
        }
    };

    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <div className="employee-roster">
                <h1 className='roster-header'>View Roster</h1><br />
                <div className='row'>
                    <div className='col-md-4'>
                        <select className='form-control' value={selectedRosterId} onChange={handleRosterSelect}>
                            <option value="">Select a Roster</option>
                            {rosters.map(roster => (
                                <option key={roster.id} value={roster.id}>
                                    {new Date(roster.startDate).toLocaleDateString()} - {new Date(roster.endDate).toLocaleDateString()}
                                </option>
                            ))}
                        </select><br />
                    </div>
                    <div className='col-md-4'>&nbsp;</div>
                </div>
                {days.length > 0 && Object.keys(rosterDetailsByEmployee).length > 0 && (
                    <div className="table-wrapper" style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: '500px' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee Name</th>
                                    <th>Shift</th>
                                    {days.map((day, index) => (
                                        <th key={index} className={day.dayClass}>{day.date.toLocaleDateString('en-us', { weekday: 'short' })}<br />{day.date.toISOString().split('T')[0]}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(rosterDetailsByEmployee).map(detail => {
                                    const employee = employees.find(emp => emp.id === detail.employeeId);
                                    if (!employee) return null;
                                    return (
                                        <tr key={detail.employeeId}>
                                            <td className='sticky-column'>{employee.employeeNumber} - {employee.callingName}</td>
                                            <td>
                                                <select className='form-control' style={{ width: 'fit-content' }} defaultValue={detail.shiftMasterId} disabled>
                                                    {shifts.map(shift => (
                                                        <option key={shift.id} value={shift.id}>{shift.fromTime} - {shift.toTime}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            {days.map(day => {
                                                //console.log('detail: ', detail)
                                                const dayString = day.date.toLocaleDateString('sv-SE');
                                                const isDayOff = detail.daysOff[dayString] || false;
                                                const employeeLeaveData = leaveData[employee.id] || {};
                                                const isOnLeave = employeeLeaveData[dayString];
                                                const cellClass = `${day.dayClass} ${isDayOff ? 'checked-day' : ''} ${isOnLeave ? 'on-leave' : ''}`;
                                                return (
                                                    <td key={dayString} className={cellClass}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isDayOff}
                                                            disabled
                                                            onChange={() => handleCheckboxChange(detail.employeeId, dayString)}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {days.length > 0 && Object.keys(rosterDetailsByEmployee).length > 0 && (
                <div className="row roster-actions">
                    <div className='col-md-8'></div>
                    <div className='col-md-2'>
                        {/* <button className='btn-cancel' onClick={handleCancel}>Cancel</button> */}
                    </div>
                    <div className='col-md-2'>
                        {/* <button onClick={handleSubmit} disabled={loading || saving}>{saving ? 'Updating...' : 'Update Roster'}</button> */}
                    </div>
                </div>
            )}
            {/* Success modal */}
            <ModalComponent show={successModalOpen} onClose={handleSuccessClose} type="success" />

            {/* Error modal */}
            <ModalComponent show={errorModalOpen} onClose={handleErrorClose} type="error" />
        </div>
    );
}

export default ViewRoster;
