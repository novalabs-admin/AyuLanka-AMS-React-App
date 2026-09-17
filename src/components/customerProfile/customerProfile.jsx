import React, { useEffect, useState } from 'react';
import { Form, ListGroup, Spinner, Card, Row, Col } from 'react-bootstrap';
import { fetchCustomerProfile, searchPatients } from '../../services/appointmentSchedulerApi';
import SkeletonTable from '../common/SkeletonTable';
import EmptyState from '../common/EmptyState';

const CustomerProfilePage = ({ customerId, show, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // If a customerId is passed from parent, fetch profile immediately
  useEffect(() => {
    if (!customerId) return;

    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const data = await fetchCustomerProfile(customerId);
        if (data.length > 0) {
          setSelectedCustomer({
            id: customerId,
            customerName: data[0].customerName,
            contactNo: data[0].contactNo,
          });
        }
        setAppointments(data);
      } catch (err) {
        console.error("Failed to fetch customer profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [customerId]);

  // Search input effect (only if no customerId from parent)
  useEffect(() => {
    if (customerId || searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const results = await searchPatients(searchTerm);
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, customerId]);

  // Fetch profile when a customer is selected from search
  useEffect(() => {
    if (!selectedCustomer || customerId) return;

    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const data = await fetchCustomerProfile(selectedCustomer.id);
        setAppointments(data);
      } catch (err) {
        console.error("Failed to fetch customer profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [selectedCustomer, customerId]);

  return (
    <div className="p-3">
      {/* Optional Close Button if inside Modal */}
      {onClose && (
        <div className="text-end mb-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      )}

      <h3 className="mb-4">Customer Profile</h3>

      {/* Show search only if no customerId passed */}
      {!customerId && !selectedCustomer && (
        <Form.Group controlId="customerSearch" className="mb-4">
          <Form.Label>Search Customer</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter customer name or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {loadingSearch && <Spinner animation="border" size="sm" className="mt-2" />}
          {searchResults.length > 0 && (
            <ListGroup className="mt-2 shadow-sm">
              {searchResults.map(cust => (
                <ListGroup.Item
                  key={cust.id}
                  action
                  onClick={() => {
                    setSelectedCustomer(cust);
                    setSearchTerm('');
                    setSearchResults([]);
                  }}
                >
                  {cust.customerName} ({cust.contactNo})
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Form.Group>
      )}

      {/* Customer Info */}
      {selectedCustomer && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5>Patient Name:</h5>
                <p>{selectedCustomer.customerName}</p>
              </Col>
              <Col md={6}>
                <h5>Contact No:</h5>
                <p>{selectedCustomer.contactNo}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Appointment Table */}
      {loadingProfile && <SkeletonTable rows={4} cols={6} />}
      {!loadingProfile && selectedCustomer && appointments.length === 0 && (
        <EmptyState title="No appointment history" message="This customer has no recorded appointments." />
      )}
      {!loadingProfile && appointments.length > 0 && (
        <div className="table-responsive shadow-sm">
          <table className="table table-bordered table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Treatments</th>
                <th>Employee</th>
                <th>Location</th>
                <th>Child Appointments</th>
                <th>Entered By</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt, idx) => (
                <tr key={idx}>
                  <td>{appt.scheduleDate?.substring(0, 10)}</td>
                  <td>{appt.appointmentTreatments.map(t => t.treatmentType.name).join(", ")}</td>
                  <td>{appt.employee?.username || ""}</td>
                  <td>{appt.location?.name || ""}</td>
                  <td>{appt.childAppointments?.length || 0}</td>
                  <td>{appt.enteredByEmployee?.username || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerProfilePage;
