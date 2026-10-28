import React, { useState, useEffect } from 'react';
import { getPendingDayOffs, updateDayOff } from '../../services/employeeRoster';
import './approveDayOff.css';
import ModalComponent from '../modalComponent/modalComponent';

function ApproveDayOffs() {
    const [dayOffRequests, setDayOffRequests] = useState([]);
    const [selectedRequests, setSelectedRequests] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);

    useEffect(() => {
        fetchPendingDayOffs();
    }, []);

    const fetchPendingDayOffs = async () => {
        setLoading(true);
        try {
            const data = await getPendingDayOffs();
            setDayOffRequests(data);
            setSelectedRequests({});
        } catch (error) {
            setError('Failed to fetch day off requests');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRequest = (id) => {
        setSelectedRequests(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelectAll = () => {
        const allSelected = Object.values(selectedRequests).length === dayOffRequests.length && Object.values(selectedRequests).every(isSelected => isSelected);
        if (allSelected) {
            // Deselect all if all are selected
            setSelectedRequests({});
        } else {
            // Select all
            const newSelectedRequests = dayOffRequests.reduce((acc, request) => {
                acc[request.id] = true;
                return acc;
            }, {});
            setSelectedRequests(newSelectedRequests);
        }
    };

    const handleApproval = async (isApproved) => {
        if (isApproved === null) {
            fetchPendingDayOffs(); // Cancel: re-read the list and clear the selection, no page reload
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
        const dayOffChangeMaster = {
            StaffRosterMasterId: 0, // Placeholder, replace with actual ID as needed
            EmployeeId: 0, // Assuming the current user's ID is needed
            DayOffChangeReasonId: isApproved ? 1 : 2 // Adjust based on your reason logic
        };
    
        let dayOffChangeDetails = dayOffRequests
            .filter(request => selectedIds.includes(request.id.toString()))
            .map(request => ({
                Id: request.id,
                StaffRosterId: request.staffRosterId,
                DayOffPre: new Date(request.dayOffPre).toISOString(),
                DayOffPost: new Date(request.dayOffPost).toISOString(),
                ExchangeWithPre: null,
                ExchangeWithPost: null,
                IsApproved: isApproved,
                ApprovedBy: parseInt(userId)
            }));
    
        const dataToSend = {
            dayOffChangeMaster,
            dayOffChangeDetails
        };
    
        try {
            await updateDayOff(dataToSend); // Uncomment this to send the data to your backend API
            fetchPendingDayOffs(); // Refresh the list after updating
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
            <h1 className='approve-dayoff-header'>Approve Day Off Requests</h1>
            {dayOffRequests.length > 0 ? (
                <div className="table-container">
                    <table className="approve-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={Object.values(selectedRequests).length === dayOffRequests.length && Object.values(selectedRequests).every(isSelected => isSelected)}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>Employee</th>
                                <th>Day Off Date Before</th>
                                <th>Day Off Date After</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dayOffRequests.map(request => (
                                <tr key={request.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={!!selectedRequests[request.id]}
                                            onChange={() => handleSelectRequest(request.id)}
                                        />
                                    </td>
                                    <td>{request.dayOffChangeMaster.employee.employeeNumber} - {request.dayOffChangeMaster.employee.callingName}</td>
                                    <td>{new Date(request.dayOffPre).toLocaleDateString()}</td>
                                    <td>{new Date(request.dayOffPost).toLocaleDateString()}</td>
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

export default ApproveDayOffs;
