import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { fetchEmployees, fetchEmployeeDayOffs, updateDayOff, fetchRosterDates, getPendingDayOffs } from '../../services/employeeRoster.js';
import './changeDayOff.css';
import ModalComponent from '../modalComponent/modalComponent.jsx';

function ChangeDayOff() {
    const [reason, setReason] = useState('');
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedEmployee2, setSelectedEmployee2] = useState('');
    const [dayOffs, setDayOffs] = useState([]);
    const [dayOffs2, setDayOffs2] = useState({});
    const [newDayOffs, setNewDayOffs] = useState({});
    const [newDayOffs2, setNewDayOffs2] = useState({});
    const [rosters, setRosters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedRosterId, setSelectedRosterId] = useState('');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);

    useEffect(() => {
        fetchRosterDates()
            .then(data => {
                const approvedRosters = data.filter(roster => roster.isApproved);
                setRosters(approvedRosters);
            })
            .catch(setError);

        fetchEmployees().then(setEmployees).catch(setError);
        getPendingDayOffs().then(setPendingApprovals).catch(setError); // Fetch pending day off approvals
    }, []);

    useEffect(() => {
        if (reason && selectedEmployee && selectedRosterId) {
            fetchEmployeeDayOffs(selectedEmployee, selectedRosterId)
                .then(data => {
                    const activedayOffs = data.filter(shift => shift.isDayOff);
                    const futureDayOffs = filterFutureDayOffs(activedayOffs);
                    const updatedNewDayOffs = futureDayOffs.reduce((acc, dayOff) => {
                        acc[dayOff.dayOffDate] = new Date(dayOff.dayOffDate); // Initialize with existing dates
                        return acc;
                    }, {});
                    console.log('day offs: ', futureDayOffs)
                    setDayOffs(futureDayOffs);
                    setNewDayOffs(updatedNewDayOffs);
                }).catch(setError);
        }

        if (reason === 'exchange_request' && selectedEmployee2 && selectedRosterId) {
            fetchEmployeeDayOffs(selectedEmployee2, selectedRosterId)
                .then(data2 => {
                    const futureDayOffs2 = filterFutureDayOffs(data2);
                    setDayOffs2(futureDayOffs2);
                    setNewDayOffs2(futureDayOffs2);
                }).catch(setError);
        }
    }, [selectedEmployee, selectedEmployee2, selectedRosterId, reason]);

    useEffect(() => {
        console.log('day offs: ', dayOffs)
    }, []);

    const filterFutureDayOffs = (dayOffs) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);  // Normalize today's date to remove the time component for a fair comparison.

        return dayOffs.filter(dayOff => {
            const dayOffDate = new Date(dayOff.dayOffDate);
            dayOffDate.setHours(0, 0, 0, 0);  // Normalize dayOff date.
            return dayOffDate >= today;
        });
    };

    const handleReasonChange = (e) => {
        setReason(e.target.value);
        setSelectedEmployee('');
        setSelectedEmployee2('');
        setDayOffs([]);
        setNewDayOffs({});
    };

    const handleEmployeeChange = (e) => {
        setSelectedEmployee(e.target.value);
        setDayOffs([]);
        setNewDayOffs({});
    };

    const handleEmployeeChange2 = (e) => {
        setSelectedEmployee2(e.target.value);
        setDayOffs([]);
        setNewDayOffs({});
    };

    const handleDayOffChange = (dayOffDate, newDate) => {
        setNewDayOffs(prevState => ({
            ...prevState,
            [dayOffDate]: newDate // Update the date change based on the original day off date
        }));
    };

    const handleDayOffChange2 = (date, newDate) => {
        setNewDayOffs2(prevState => ({
            ...prevState,
            [date]: newDate
        }));
    };

    const toLocalISOString = (date) => {
        const tzOffset = new Date().getTimezoneOffset() * 60000; // offset in milliseconds
        const adjustedDate = new Date(date - tzOffset);
        return adjustedDate.toISOString().split('T')[0];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitAttempted(true); // Set the form as submitted
        if (!selectedRosterId || !reason || !selectedEmployee) {
            return;
        }

        setLoading(true);
        try {
            let dayOffChangeDetails = [];
            if (reason === 'management_request' || reason === 'employee_request') {
                // Collect details for management request
                dayOffChangeDetails = dayOffs.filter(dayOff =>
                    newDayOffs[dayOff.dayOffDate] &&
                    new Date(dayOff.dayOffDate).getTime() !== new Date(newDayOffs[dayOff.dayOffDate]).getTime()
                ).map(dayOff => ({
                    StaffRosterId: dayOff.id,
                    DayOffPre: toLocalISOString(new Date(dayOff.dayOffDate)),
                    DayOffPost: toLocalISOString(new Date(newDayOffs[dayOff.dayOffDate])),
                    ExchangeWithPre: null,
                    ExchangeWithPost: null,
                    IsApproved: false
                }));
            } else if (reason === 'exchange_request') {
                // Collect details for exchange request
                dayOffChangeDetails = dayOffs.map((dayOff, index) => ({
                    StaffRosterId: dayOff.id,
                    DayOffPre: toLocalISOString(new Date(dayOff.dayOffDate)),
                    DayOffPost: toLocalISOString(new Date(dayOffs2[index].dayOffDate)),
                    ExchangeWithPre: toLocalISOString(new Date(dayOffs2[index].dayOffDate)),
                    ExchangeWithPost: toLocalISOString(new Date(dayOff.dayOffDate)),
                    IsApproved: false
                }));
            }

            const dayOffChangeMaster = {
                StaffRosterMasterId: parseInt(selectedRosterId),
                EmployeeId: parseInt(selectedEmployee),
                DayOffChangeReasonId: reason === 'management_request' ? 1 : 2
            };

            const dataToSend = {
                dayOffChangeMaster,
                dayOffChangeDetails
            };

            console.log('Sending Data:', dataToSend);
            await updateDayOff(dataToSend);  // Assuming updateDayOff sends the data to the backend correctly
            // clear the form and re-read the pending list (this used to be the full page reload on OK)
            setReason('');
            setSelectedEmployee('');
            setSelectedEmployee2('');
            setSelectedRosterId('');
            setDayOffs([]);
            setDayOffs2({});
            setNewDayOffs({});
            setNewDayOffs2({});
            setSubmitAttempted(false);
            getPendingDayOffs().then(setPendingApprovals).catch(setError);
            setSuccessModalOpen(true); // Open success modal
        } catch (error) {
            setError(error.toString());
            setErrorModalOpen(true); // Open error modal
            console.error('Error submitting day off changes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRosterSelect = (e) => {
        setSelectedRosterId(e.target.value);
    };

    const handleExchangeDays = (index) => {
        let temp = dayOffs[index];
        dayOffs[index] = dayOffs2[index];
        dayOffs2[index] = temp;

        setDayOffs([...dayOffs]);
        setDayOffs2([...dayOffs2]);
    };

    const shouldShowError = (field) => {
        if (field === 'selectedRosterId') return !selectedRosterId && submitAttempted;
        if (field === 'reason') return !reason && submitAttempted;
        if (field === 'selectedEmployee') return !selectedEmployee && submitAttempted;
        return false;
    };

    return (
        <div className="change-day-off">
            <h1 className='dayoff-header'>Change Day Off</h1><br />
            <div className="row">
                <div className="col-md-4">
                    <form onSubmit={handleSubmit}>
                        <div className='row'>
                            <div className='col-md-12'>
                                <label>Roster <span className="required-star">*</span></label>
                                <select className={`form-control ${shouldShowError('selectedRosterId') ? 'error-border' : ''}`} value={selectedRosterId} onChange={handleRosterSelect}>
                                    <option value="">Select a Roster</option>
                                    {rosters.map(roster => (
                                        <option key={roster.id} value={roster.id}>
                                            {new Date(roster.startDate).toLocaleDateString()} - {new Date(roster.endDate).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select><br />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-12">
                                <label>Reason for changing day off <span className="required-star">*</span></label>
                                <select className={`form-control ${shouldShowError('reason') ? 'error-border' : ''}`} value={reason} onChange={handleReasonChange}>
                                    <option value="">Select a reason</option>
                                    <option value="management_request">On Management Request</option>
                                    <option value="employee_request">Employee Request</option>
                                </select><br />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-12">
                                <label>Select Employee <span className="required-star">*</span></label>
                                <select className={`form-control ${shouldShowError('selectedEmployee') ? 'error-border' : ''}`} value={selectedEmployee} onChange={handleEmployeeChange}>
                                    <option value="">Select an Employee</option>
                                    {employees.map(employee => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.employeeNumber} - {employee.callingName}
                                        </option>
                                    ))}
                                </select><br />
                            </div>
                        </div>
                        <div className='row'>
                            <div className='col-md-6'>
                                <label>Change From</label><br />
                            </div>
                            <div className='col-md-6'>
                                <label>Change To</label><br />
                            </div>
                        </div><br />
                        {Array.isArray(dayOffs) ? (
                            dayOffs.map(dayOff => (
                                <div key={dayOff.dayOffDate}>
                                    <div className='row'>
                                        <div className='col-md-6'>
                                            <label>{dayOff.dayOffDate.split('T')[0]}</label>
                                        </div>
                                        <div className='col-md-6'>
                                            <DatePicker
                                                className='form-control'
                                                selected={newDayOffs[dayOff.dayOffDate]}
                                                onChange={date => handleDayOffChange(dayOff.dayOffDate, date)}
                                                minDate={new Date()}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div>No day offs available or data is not properly formatted.</div>
                        )}
                        <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Day Off'}</button>
                    </form>
                    <ModalComponent show={error !== null} onClose={() => setError(null)} message={error} type="error" />
                </div>
                <div className="col-md-8">
                    <h3>Pending Day Off Approvals</h3>
                    <div className="table-container">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>From Date</th>
                                    <th>To Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingApprovals.map((approval, index) => (
                                    <tr key={index}>
                                        <td>{approval.dayOffChangeMaster.employee.employeeNumber} - {approval.dayOffChangeMaster.employee.callingName}</td>
                                        <td>{new Date(approval.dayOffPre).toLocaleDateString()}</td>
                                        <td>{new Date(approval.dayOffPost).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* Success modal */}
            <ModalComponent show={successModalOpen} onClose={() => setSuccessModalOpen(false)} type="success" />

            {/* Error modal */}
            <ModalComponent show={errorModalOpen} onClose={() => setErrorModalOpen(false)} type="error" />
        </div>
    );
}

export default ChangeDayOff;
