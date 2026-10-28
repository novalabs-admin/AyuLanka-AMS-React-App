import React, { useState, useEffect } from 'react';
import { fetchEmployees, fetchEmployeeShifts, updateShift, fetchRosterDates, fetchShifts, getPendingShifts } from '../../services/employeeRoster.js';
import './changeShift.css';
import ModalComponent from '../modalComponent/modalComponent.jsx';

function ChangeShift() {
    const [selectedRosterId, setSelectedRosterId] = useState('');
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [employeeShifts, setEmployeeShifts] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rosters, setRosters] = useState([]);
    const [reason, setReason] = useState('');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);

    useEffect(() => {
        fetchRosterDates()
            .then(data => setRosters(data.filter(roster => roster.isApproved)))
            .catch(setError);
        fetchEmployees().then(setEmployees).catch(setError);
        fetchShifts().then(setShifts).catch(setError);
        getPendingShifts().then(setPendingApprovals).catch(setError); // Fetch pending shift approvals
    }, []);

    useEffect(() => {
        if (selectedEmployee && selectedRosterId) {
            fetchEmployeeShifts(selectedEmployee, selectedRosterId)
                .then(data => {
                    const activeShifts = data.filter(shift => !shift.isDayOff).map(shift => ({
                        ...shift,
                        newShiftId: shift.shiftMasterId // Initialize newShiftId
                    }));
                    setEmployeeShifts(activeShifts);
                })
                .catch(setError);
        }
    }, [selectedEmployee, selectedRosterId]);

    const handleRosterSelect = (e) => setSelectedRosterId(e.target.value);
    const handleEmployeeChange = (e) => setSelectedEmployee(e.target.value);
    const handleReasonChange = (e) => setReason(e.target.value);

    const handleShiftChange = (index, newShiftId) => {
        const updatedShifts = [...employeeShifts];
        updatedShifts[index].newShiftId = parseInt(newShiftId);
        setEmployeeShifts(updatedShifts);
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
            let shiftChangeDetails = [];

            if (reason == 'management_request' || reason == "employee_request") {
                // Collect details for management request
                shiftChangeDetails = employeeShifts.filter(shift =>
                    shift.newShiftId &&
                    shift.newShiftId !== shift.shiftMasterId
                ).map(shift => ({
                    StaffRosterId: shift.id,
                    ShiftPre: shift.shiftMasterId,
                    ShiftPost: shift.newShiftId,
                    ExchangeWithPre: null,
                    ExchangeWithPost: null,
                    IsApproved: false
                }));
            }

            const shiftChangeMasterRequest = {
                StaffRosterMasterId: parseInt(selectedRosterId),
                EmployeeId: parseInt(selectedEmployee),
                ShiftChangeReasonId: reason === 'management_request' ? 1 : 2
            };

            const dataToSend = {
                shiftChangeMasterRequest,
                shiftChangeDetails
            };

            console.log('Sending Data:', dataToSend);
            await updateShift(dataToSend); // Assuming updateShift sends the data to your backend correctly
            // clear the form and re-read the pending list (this used to be the full page reload on OK)
            setSelectedRosterId('');
            setSelectedEmployee('');
            setReason('');
            setEmployeeShifts([]);
            setSubmitAttempted(false);
            getPendingShifts().then(setPendingApprovals).catch(setError);
            setSuccessModalOpen(true); // Open success modal
        } catch (error) {
            setError(error.toString());
            setErrorModalOpen(true); // Open error modal
            console.error('Error submitting shift changes:', error);
        } finally {
            setLoading(false);
        }
    };

    const shouldShowError = (field) => {
        if (field === 'selectedRosterId') return !selectedRosterId && submitAttempted;
        if (field === 'reason') return !reason && submitAttempted;
        if (field === 'selectedEmployee') return !selectedEmployee && submitAttempted;
        return false;
    };

    return (
        <div className="shift-change-container">
            <h1 className='shift-change-header'>Change Employee Shift</h1>
            <div className="row">
                <div className="col-md-5">
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
                                <label>Reason for changing shift <span className="required-star">*</span></label>
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
                                        <option key={employee.id} value={employee.id}>{employee.employeeNumber} - {employee.callingName}</option>
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
                        {employeeShifts.map((shift, index) => (
                            <div key={index} className="row">
                                <div className='col-md-6'>
                                    {new Date(shift.dayOffDate).toLocaleDateString()}: {shift.shiftMaster.fromTime} - {shift.shiftMaster.toTime}
                                </div>
                                <div className='col-md-6'>
                                    <select className="form-control" value={shift.newShiftId} onChange={e => handleShiftChange(index, e.target.value)}>
                                        {shifts.map(s => (
                                            <option key={s.id} value={s.id}>{s.fromTime} - {s.toTime}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}<br/>
                        <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Shift'}</button>
                    </form>
                    <ModalComponent show={error !== null} onClose={() => setError(null)} message={error} type="error" />
                </div>
                <div className="col-md-7">
                    <h3>Pending Shift Approvals</h3>
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
                                        <td>{approval.shiftChangeMaster.employee.employeeNumber} - {approval.shiftChangeMaster.employee.callingName}</td>
                                        <td>{approval.shiftMasterPre.fromTime} - {approval.shiftMasterPost.toTime}</td>
                                        <td>{approval.shiftMasterPost.fromTime} - {approval.shiftMasterPost.toTime}</td>
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

export default ChangeShift;
