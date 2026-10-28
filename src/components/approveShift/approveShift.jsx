import React, { useState, useEffect } from 'react';
import { getPendingShifts, updateShift } from '../../services/employeeRoster';
import './approveShift.css';
import ModalComponent from '../modalComponent/modalComponent';

function ApproveShift() {
    const [shiftRequests, setShiftRequests] = useState([]);
    const [selectedRequests, setSelectedRequests] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);

    useEffect(() => {
        fetchPendingShifts();
    }, []);

    const fetchPendingShifts = async () => {
        setLoading(true);
        try {
            const data = await getPendingShifts();
            setShiftRequests(data);
            setSelectedRequests({});
        } catch (error) {
            setError('Failed to fetch shift requests');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRequest = (id) => {
        setSelectedRequests(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelectAll = () => {
        const allSelected = Object.values(selectedRequests).length === shiftRequests.length && Object.values(selectedRequests).every(isSelected => isSelected);
        if (allSelected) {
            // Deselect all if all are selected
            setSelectedRequests({});
        } else {
            // Select all
            const newSelectedRequests = shiftRequests.reduce((acc, request) => {
                acc[request.id] = true;
                return acc;
            }, {});
            setSelectedRequests(newSelectedRequests);
        }
    };

    const handleApproval = async (isApproved) => {
        if (isApproved === null) {
            fetchPendingShifts(); // Cancel: re-read the list and clear the selection, no page reload
            return;
        }

        setLoading(true);
        const userId = sessionStorage.getItem('userId'); // Assume user ID is stored in session storage

        // Filter and collect IDs of only the selected (ticked) requests
        const selectedIds = Object.entries(selectedRequests)
            .filter(([id, isSelected]) => isSelected)
            .map(([id]) => id);

        if (selectedIds.length === 0) {
            alert('No requests selected.');
            setLoading(false);
            return;
        }

        // Prepare the master data
        const shiftChangeMasterRequest = {
            StaffRosterMasterId: 0, // Placeholder, replace with actual ID as needed
            EmployeeId: 0, // Assuming the current user's ID is needed
            ShiftChangeReasonId: isApproved ? 1 : 2 // Adjust based on your reason logic
        };

        let shiftChangeDetails = shiftRequests
            .filter(request => selectedIds.includes(request.id.toString()))
            .map(request => ({
                Id: request.id,
                StaffRosterId: request.staffRosterId,
                shiftPre: request.shiftPre,
                shiftPost: request.shiftPost,
                ExchangeWithPre: null,
                ExchangeWithPost: null,
                IsApproved: isApproved,
                ApprovedBy: parseInt(userId)
            }));

        const dataToSend = {
            shiftChangeMasterRequest,
            shiftChangeDetails
        };

        try {
            await updateShift(dataToSend); // Uncomment this to send the data to your backend API
            fetchPendingShifts(); // Refresh the list after updating
            setSuccessModalOpen(true); // Open success modal
        } catch (error) {
            setError('Failed to update approval status');
            setErrorModalOpen(true); // Open error modal
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p className="approve-loading">Loading...</p>;
    if (error) return <p className="approve-error">Error: {error}</p>;

    return (
        <div className="approve-container">
            <h1 className='approve-shift-header'>Approve Shift Requests</h1>
            {shiftRequests.length > 0 ? (
                <div className="table-container">
                    <table className="approve-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={Object.values(selectedRequests).length === shiftRequests.length && Object.values(selectedRequests).every(isSelected => isSelected)}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>Shift Before</th>
                                <th>Shift After</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shiftRequests.map(request => (
                                <tr key={request.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={!!selectedRequests[request.id]}
                                            onChange={() => handleSelectRequest(request.id)}
                                        />
                                    </td>
                                    <td>{request.shiftChangeMaster.employee.employeeNumber} - {request.shiftChangeMaster.employee.callingName}</td>
                                    <td>{new Date(request.staffRoster.dayOffDate).toLocaleDateString()}</td>
                                    <td>{request.shiftMasterPre.fromTime} - {request.shiftMasterPre.toTime}</td>
                                    <td>{request.shiftMasterPost.fromTime} - {request.shiftMasterPost.toTime}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>No pending requests.</p>
            )}
            <div className="row approve-buttons">
                <div className='col-md-8'>&nbsp;</div>
                <div className='col-md-2'>
                    <button
                        className="approve-btn reject"
                        onClick={() => handleApproval(null)}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                </div>
                <div className='col-md-2'>
                    <button
                        className="approve-btn approve"
                        onClick={() => handleApproval(true)}
                        disabled={loading || Object.values(selectedRequests).every(v => !v)}
                    >
                        Approve
                    </button>
                </div>
            </div>
            {/* Success modal */}
            <ModalComponent show={successModalOpen} onClose={() => setSuccessModalOpen(false)} type="success" />

            {/* Error modal */}
            <ModalComponent show={errorModalOpen} onClose={() => setErrorModalOpen(false)} type="error" />
        </div>
    );
}

export default ApproveShift;
