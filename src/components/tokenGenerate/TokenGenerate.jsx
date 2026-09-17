import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Modal from 'react-modal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './TokenGenerate.css'; // Ensure this file contains your custom styles
import { searchPatients,createCustomer, fetchAppointmentsByDateRange,fetchEmployeeSchedule, fetchTokensByDate, deleteAppointment, fetchEmployees, fetchPrimeCareTreatmentLocations, fetchEliteCareTreatmentLocations, addAppointment, fetchTreatmentTypesByLocation } from '../../services/appointmentSchedulerApi.js';
import { ConfirmationModal } from '../confirmationModal/confirmationModal.jsx';
import { NotificationComponent } from '../notificationComponent/notificationComponent.jsx';
import AppointmentModalComponent from '../appointmentModalComponent/appointmentModalComponent.jsx';
import moment from 'moment';
import { Autocomplete, TextField } from '@mui/material';
import { ConfirmationModalForValidation } from '../confirmationModalForValidation/confirmationModalForValidation.jsx';
import CreatableSelect from "react-select/creatable";
import CreateCustomerModal from '../modalComponent/createCustomerModal.jsx';

Modal.setAppElement('#root');

function TokenGenerate() {
    const [currentEvents, setCurrentEvents] = useState([]);
    const [dropEvent, setDropEvent] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState({});
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isConfirmModalOpenForValidation, setIsConfirmModalOpenForValidation] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ type: '', message: '' });
    const [appointmentData, setAppointmentData] = useState({
        scheduleDate: new Date(),
        employeeId: '',
        secondaryEmployeeId: '',
        doctorEmployeeId: '',
        customerName: '',
        customerId: '',
        contactNo: '',
        tokenNo: '',
        tokenIssueTime: new Date(),
        resourceId: '',
        remarks: '',
        locationId: '',
        mainTreatmentArea: '',
        isTokenIssued: false,
        isPatientContacted: false,
        treatmentTypeId: [], // Store selected treatment type IDs as an array
        appoinmentTreatments: [], // Initialize appoinmentTreatments as an empty array
    });
    const [employees, setEmployees] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [treatmentTypes, setTreatmentTypes] = useState([]);
    const [resources, setResources] = useState([]);
    const [eliteCareTreatmentLocations, setEliteCareTreatmentLocations] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [formErrors, setFormErrors] = useState({
        customerName: false,
        contactNo: false,
        treatmentTypeId: false,
        // employeeId: false,
        scheduleDate: false
    });
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [actualStartTime, setActualStartTime] = useState(null);
    const [actualEndTime, setActualEndTime] = useState(null);
    const [actualSecondStartTime, setActualSecondStartTime] = useState(null);
    const [actualSecondEndTime, setActualSecondEndTime] = useState(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isClickedHandleSubmit, setIsClickedHandleSubmit] = useState(false);

    const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
    const [bookedTokens, setBookedTokens] = useState([]);
    const [locationType, setLocationType] = useState("1");
    const [eliteAppointments, setEliteAppointments] = useState([]);
    const [selectedEliteAppointment, setSelectedEliteAppointment] = useState(null);
    const [selectedTokenNo, setSelectedTokenNo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isNextAppointmentModalOpen, setIsNextAppointmentModalOpen] = useState(false);
    const [nextAppointmentData, setNextAppointmentData] = useState({
        customerName: "",
        customerId: "",
        contactNo: "",
        locationType: "1",
        locationId: "",
        treatmentTypeId: [],
        scheduleDate: new Date(),
        employeeId: "",
        startTime: null,
        endTime: null,
        isNeededToFollowUp: false,
    });
    const [availableLocations, setAvailableLocations] = useState([]);
    const [loadingTokens, setLoadingTokens] = useState(false);

    const [patientOptions, setPatientOptions] = useState([]);
    const [isLoadingPatients, setIsLoadingPatients] = useState(false);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [backendErrors, setBackendErrors] = useState({});
    const [nextAppBackendErrors, setNextAppBackendErrors] = useState({});



    // Read values from env
    const rows = Number(process.env.REACT_APP_TOTAL_ROWS) || 17;
    const cols = Number(process.env.REACT_APP_TOKENS_PER_ROW) || 10;
    const startHour = Number(process.env.REACT_APP_APPOINTMENT_START_HOUR) || 7; // 7 AM
    const totalTokens = rows * cols;

    useEffect(() => {
        const loadAppointments = async () => {
            try {
                setLoadingTokens(true);
                const tokens = await fetchTokensByDate(selectedDate);
                setBookedTokens(tokens.filter(t => t.doctorSessionId === null))
                console.log("tokens:", tokens);
                // setState(appointments) if you want to store them
            } catch (err) {
                console.error("Failed to fetch tokens:", err);
            } finally {
                setLoadingTokens(false);
            }
        };

        loadAppointments();
    }, [selectedDate]);

    useEffect(() => {
        if (locationType === "2") {
            const loadAppointments = async () => {
                try {
                    const appointments = await fetchAppointmentsByDateRange(selectedDate, selectedDate);
                    console.log('setEliteAppointments', appointments)
                    setEliteAppointments(appointments); // Format as needed for FullCalendar
                } catch (error) {
                    console.error('Error fetching events for date range:', error);
                }
            };

            loadAppointments();
        }
    }, [locationType]);

    const handlePatientSearch = useCallback(async (inputValue) => {
        if (inputValue.length < 3) {
          setPatientOptions([]);
          return;
        }
      
        setIsLoadingPatients(true);
        try {
          const results = await searchPatients(inputValue);
      
          const options = results.map((p) => ({
            value: p.id,
            label: `${p.customerName} (${p.contactNo})`,
            customerName: p.customerName,
            customerId: p.id,
            contactNo: p.contactNo
          }));
          console.log('optionssssss', options)
          setPatientOptions(options);
        } catch (error) {
          console.error("Patient search failed", error);
          setPatientOptions([]);
        } finally {
          setIsLoadingPatients(false);
        }
      }, []);
      


    // Fetch Employees and Treatment Types from API
    useEffect(() => {
        console.log('appointmentData scheduleDate', appointmentData)
        const loadData = async () => {
            try {
                const [empData, treatmentLocationData, eliteCareTreatmentLocationData, treatmentTypesbyLocations] = await Promise.all([
                    fetchEmployees(),
                    fetchPrimeCareTreatmentLocations(),
                    fetchEliteCareTreatmentLocations(),
                    fetchTreatmentTypesByLocation()
                ]);

                // Filter employees with designationCode 'MA'
                const filteredEmployees = empData.filter(employee => employee.designation?.designationCode === 'MA');
                const filteredDoctors = empData.filter(employee => employee.designation?.designationCode === 'ADT');

                setEmployees(filteredEmployees);
                setDoctors(filteredDoctors);
                setResources(treatmentLocationData);
                setEliteCareTreatmentLocations(eliteCareTreatmentLocationData);
                setTreatmentTypes(treatmentTypesbyLocations);

                setAppointmentData(prevState => ({
                    ...prevState,
                    startTime: startTime
                }));
            } catch (error) {
                console.error('Error loading data from API:', error);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        const autoAssignNextToken = async () => {
            if (!nextAppointmentData.scheduleDate || !nextAppointmentData.startTime) return;
    
            try {
                // Fetch all tokens for that date (exclude doctor channeling appointments)
                const allTokens = await fetchTokensByDate(nextAppointmentData.scheduleDate);
                const tokens = allTokens.filter(t => t.doctorSessionId === null);
    
                // Convert selected time to hour (e.g. 09:30 → 9)
                const selectedHour = new Date(nextAppointmentData.startTime).getHours();
    
                // Filter tokens that belong to that hour range
                const startTokenNo = (selectedHour - startHour) * cols + 1;
                const endTokenNo = startTokenNo + cols - 1;
    
                const bookedInHour = tokens
                    .map(t => parseInt(t.tokenNo, 10))
                    .filter(no => no >= startTokenNo && no <= endTokenNo);
    
                // Find next available token in that hour
                let nextAvailable = null;
                for (let i = startTokenNo; i <= endTokenNo; i++) {
                    if (!bookedInHour.includes(i)) {
                        nextAvailable = i;
                        break;
                    }
                }
    
                setNextAppointmentData(prev => ({
                    ...prev,
                    tokenNo: nextAvailable ?? null // null if full
                }));
            } catch (err) {
                console.error("Failed to auto assign token:", err);
            }
        };
    
        autoAssignNextToken();
    }, [nextAppointmentData.scheduleDate, nextAppointmentData.startTime]);
    
    useEffect(() => {
        const fetchAvailableLocations = async () => {
            if (nextAppointmentData.locationType !== "2") {
                setAvailableLocations([]); // Not Elite Care
                return;
            }
    
            const locations = await getAvailableTreatmentLocations();
            setAvailableLocations(locations || []);
        };
    
        fetchAvailableLocations();
    }, [
        nextAppointmentData.scheduleDate,
        nextAppointmentData.startTime,
        nextAppointmentData.endTime,
        nextAppointmentData.locationType
    ]);

    // 🔹 Extract booked token numbers as integers
    const addedTokens = bookedTokens
        .map((a) => parseInt(a.tokenNo, 10))
        .filter((n) => !isNaN(n));

    const renderTokens = () => {
        let tokenNumber = 1;
        const tokenLayout = [];
    
        // Filter tokens based on search term
        const filteredBookedTokens = bookedTokens.filter(bt => 
            bt.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bt.contactNo?.includes(searchTerm)
        );
    
        for (let r = 0; r < rows; r++) {
            const rowStartHour = startHour + r;
            const rowEndHour = rowStartHour + 1;
            const timeRange = `${rowStartHour.toString().padStart(2, "0")}:00 - ${rowEndHour.toString().padStart(2, "0")}:00`;
    
            tokenLayout.push(
                <div className="d-flex align-items-center mb-2" key={r}>
                    {/* Time Label */}
                    <div className="me-3 text-center" style={{ width: "100px" }}>
                        <strong>{timeRange}</strong>
                    </div>
    
                    {/* Tokens */}
                    <div className="d-flex flex-wrap flex-grow-1">
                        {Array.from({ length: cols }, (_, c) => {
                            if (tokenNumber > totalTokens) return null;
                            const current = tokenNumber++;
    
                            // Find booked token object for this number
                            const booked = bookedTokens.find(bt => parseInt(bt.tokenNo, 10) === current);
    
                            // If searching and this token doesn't match, don't render it
                            if (searchTerm && !filteredBookedTokens.some(bt => parseInt(bt.tokenNo, 10) === current)) {
                                return null;
                            }
    
                            let btnClass = "btn-secondary"; // default for free
                            if (booked) {
                                btnClass = booked.chitNo
                                    ? "btn-success"
                                    : booked.isNeededToFollowUp == true
                                    ? "btn-danger"
                                    : "btn-warning";
                            }
    
                            return (
                                <div
                                    key={current}
                                    className="p-1"
                                    style={{ flex: `0 0 ${100 / cols}%` }}
                                >
                                    <button
                                        className={`btn p-1 ${btnClass}`}
                                        style={{
                                            width: "80px",
                                            height: "80px",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            fontWeight: "bold",
                                            position: "relative",
                                        }}
                                        onClick={() => handleTokenClick(current)}
                                    >
                                        {/* Token number */}
                                        <span style={{ fontSize: "20px" }}>{current}</span>
    
                                        {/* Chit number */}
                                        {booked?.chitNo && (
                                            <span
                                                style={{
                                                    fontSize: "12px",
                                                    fontWeight: "normal",
                                                    color: "#fff",
                                                    backgroundColor: "rgba(0,0,0,0.3)",
                                                    borderRadius: "4px",
                                                    padding: "2px 6px",
                                                    marginTop: "4px",
                                                }}
                                            >
                                                Chit: {booked.chitNo}
                                            </span>
                                        )}
    
                                        {/* Customer name (show when searching) */}
                                        {/* {searchTerm && booked?.customerName && (
                                            <span
                                                style={{
                                                    fontSize: "10px",
                                                    fontWeight: "normal",
                                                    color: "#fff",
                                                    backgroundColor: "rgba(0,0,0,0.5)",
                                                    borderRadius: "4px",
                                                    padding: "1px 4px",
                                                    marginTop: "2px",
                                                    maxWidth: "70px",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                                title={booked.customerName}
                                            >
                                                {booked.customerName}
                                            </span>
                                        )} */}
    
                                        {/* Contact number (show when searching) */}
                                        {/* {searchTerm && booked?.contactNo && (
                                            <span
                                                style={{
                                                    fontSize: "10px",
                                                    fontWeight: "normal",
                                                    color: "#fff",
                                                    backgroundColor: "rgba(0,0,0,0.5)",
                                                    borderRadius: "4px",
                                                    padding: "1px 4px",
                                                    marginTop: "2px",
                                                }}
                                            >
                                                {booked.contactNo}
                                            </span>
                                        )} */}
    
                                        {/* Star icon if contacted */}
                                        {booked?.isPatientContacted && (
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    top: "-2px",
                                                    right: "6px",
                                                    color: "blue",
                                                    fontSize: "20px",
                                                }}
                                                title="Patient Contacted"
                                            >
                                                ★
                                            </span>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
    
        return tokenLayout;
    };
    

    const handleTokenClick = (tokenNumber) => {
        setSelectedTokenNo(tokenNumber);
        // Check if this token is already booked
        const existing = bookedTokens.find(
            (a) => parseInt(a.tokenNo, 10) === tokenNumber
        );

        
        console.log('existinggggggggggg', existing)

        if (existing) {
            let startTime = null;
            if (existing.fromTime) {
                const [h, m, s] = existing.fromTime.split(":").map(Number);
                startTime = new Date(existing.scheduleDate);
                startTime.setHours(h, m, s, 0);
            }

            let endTime = null;
            if (existing.toTime) {
                const [h, m, s] = existing.toTime.split(":").map(Number);
                endTime = new Date(existing.scheduleDate);
                endTime.setHours(h, m, s, 0);
            }

            // If token is booked, populate appointmentData with existing appointment
            console.log('existing.scheduleDate', existing.scheduleDate)
            console.log('new Date(existing.scheduleDate)', new Date(existing.scheduleDate))
            setAppointmentData({
                id: existing.id,
                scheduleDate: new Date(existing.scheduleDate),
                customerName: existing.customerName || '',
                customerId: existing.customerId || '',
                contactNo: existing.contactNo || '',
                tokenNo: tokenNumber,
                chitNo: existing.chitNo,
                startTime: startTime,
                endTime: endTime,
                actualStartTime: existing.actualFromTime,
                actualEndTime: existing.actualToTime,
                actualSecondStartTime: existing.actualFromTimeSecond,
                actualSecondEndTime: existing.actualToTimeSecond,
                locationId: existing.locationId,
                employeeId: existing.employeeId ? existing.employeeId.toString() : 0,
                secondaryEmployeeId: existing.secondaryEmployeeId ? existing.secondaryEmployeeId.toString() : 0,
                doctorEmployeeId: existing.doctorEmployeeId ? existing.doctorEmployeeId.toString() : 0,
                treatmentTypeId: existing.appointmentTreatments?.map(t => t.treatmentTypeId) || [],
                remarks: existing.remarks,
                appoinmentTreatments: existing.appointmentTreatments || [],
                childAppointments: existing.childAppointments || [],
                IsNeededToFollowUp: existing.isNeededToFollowUp,
                isPatientContacted: existing.isPatientContacted
            });
            setStartTime(startTime)
            setEndTime(endTime)
            setSelectedEventId(existing.id)
            setLocationType(existing.mainTreatmentArea)

            if(existing.mainTreatmentArea == "2") {
                setSelectedEliteAppointment(appointmentData);
            }
        } else {
            // If token is free, populate only tokenNo and date
            setAppointmentData(prevState => ({
                ...prevState,
                tokenNo: tokenNumber,
                scheduleDate: selectedDate, // keep current selected date
            }));
        }

        setModalIsOpen(true);
    };

    const handleTimeChange = (date, name) => {
        console.log('treatmentTypes', treatmentTypes);

        if (name === 'startTime') {
            setNotification({ message: '', type: '' });

            // Check required fields and set errors
            const errors = {
                customerName: !appointmentData.customerName,
                contactNo: !appointmentData.contactNo,
                treatmentTypeId: !appointmentData.treatmentTypeId,
                // employeeId: !appointmentData.employeeId,
                scheduleDate: !appointmentData.scheduleDate
            };

            setFormErrors(errors);

            // If any field has an error, stop the form submission
            if (Object.values(errors).some(error => error)) {
                console.log('Validation errors', errors);
                return;
            }

            setStartTime(date);

            let totalDurationMilliseconds = 0; // Initialize total duration for multiple treatments

            // Iterate over the selected treatment type IDs
            appointmentData.treatmentTypeId.forEach(option => {
                // Find the treatment that matches the selected treatmentTypeId inside the treatmentType object
                const selectedTreatment = treatmentTypes.find(t => t.id == option);
                console.log(`Dropdown changed: treatmentTypeId = ${option}, selectedTreatment = `, selectedTreatment);  // Debugging line

                if (selectedTreatment) {
                    let durationMilliseconds = 0;

                    const { durationHours, durationMinutes } = selectedTreatment; // Destructure duration fields

                    if (durationHours || durationMinutes) {
                        // Calculate duration in milliseconds
                        durationMilliseconds = (durationHours * 3600 + (durationMinutes || 0) * 60) * 1000;

                        // Accumulate total duration
                        totalDurationMilliseconds += durationMilliseconds;
                    }
                }
            });

            // Calculate new end time based on the total duration
            const newEndTime = new Date(date.getTime() + totalDurationMilliseconds);
            setEndTime(newEndTime);

            // Update the appointmentData state with the new startTime and calculated endTime
            setAppointmentData(prevState => ({
                ...prevState,
                startTime: date,
                endTime: newEndTime
            }));
        }

        if (name === 'endTime') {
            setEndTime(date);
            // Update the appointmentData state with the new startTime and calculated endTime
            setAppointmentData(prevState => ({
                ...prevState,
                endTime: date
            }));
        }
    };

    const handleNextAppointmentTimeChange = (date, name) => {
        console.log('treatmentTypes', treatmentTypes);

        if (name === 'startTime') {
            setNotification({ message: '', type: '' });

            // Check required fields and set errors
            const errors = {
                customerName: !nextAppointmentData.customerName,
                contactNo: !nextAppointmentData.contactNo,
                treatmentTypeId: !nextAppointmentData.treatmentTypeId,
                // employeeId: !appointmentData.employeeId,
                scheduleDate: !nextAppointmentData.scheduleDate,
                startTime: !appointmentData.startTime
            };

            setFormErrors(errors);

            // If any field has an error, stop the form submission
            if (Object.values(errors).some(error => error)) {
                console.log('Validation errors', errors);
                return;
            }

            setStartTime(date);

            let totalDurationMilliseconds = 0; // Initialize total duration for multiple treatments

            // Iterate over the selected treatment type IDs
            nextAppointmentData.treatmentTypeId.forEach(option => {
                // Find the treatment that matches the selected treatmentTypeId inside the treatmentType object
                const selectedTreatment = treatmentTypes.find(t => t.id == option);
                console.log(`Dropdown changed: treatmentTypeId = ${option}, selectedTreatment = `, selectedTreatment);  // Debugging line

                if (selectedTreatment) {
                    let durationMilliseconds = 0;

                    const { durationHours, durationMinutes } = selectedTreatment; // Destructure duration fields

                    if (durationHours || durationMinutes) {
                        // Calculate duration in milliseconds
                        durationMilliseconds = (durationHours * 3600 + (durationMinutes || 0) * 60) * 1000;

                        // Accumulate total duration
                        totalDurationMilliseconds += durationMilliseconds;
                    }
                }
            });

            // Calculate new end time based on the total duration
            const newEndTime = new Date(date.getTime() + totalDurationMilliseconds);
            setEndTime(newEndTime);

            // Update the appointmentData state with the new startTime and calculated endTime
            setNextAppointmentData(prevState => ({
                ...prevState,
                startTime: date,
                endTime: newEndTime
            }));
        }

        if (name === 'endTime') {
            setEndTime(date);
            // Update the appointmentData state with the new startTime and calculated endTime
            setNextAppointmentData(prevState => ({
                ...prevState,
                endTime: date
            }));
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;


        setAppointmentData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleTokenNumberChange = (event) => {
        const { name, value } = event.target;


        setAppointmentData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };
    // Handler for multiple treatment type selection
    const handleMultipleTreatmentTypeChange = (event, value) => {
        // Debugging logs
        console.log('Selected Value:', value);

        // Ensure value is an array
        if (!Array.isArray(value)) {
            console.error("No selected options found");
            return;
        }

        const selectedIds = value.map(option => option.id); // Get IDs from selected options
        console.log('Selected IDs:', selectedIds); // Debugging line

        // Update appointmentData state with selected IDs
        setAppointmentData(prevState => ({
            ...prevState,
            treatmentTypeId: selectedIds
        }));

        // Proceed with the rest of your logic if needed
        if (appointmentData.startTime && selectedIds.length > 0) {
            let totalDurationMilliseconds = 0;

            selectedIds.forEach(id => {
                const selectedTreatment = treatmentTypes.find(t => t.id == id);
                if (selectedTreatment) {
                    let durationMilliseconds = (selectedTreatment.durationHours * 3600 +
                        (selectedTreatment.durationMinutes || 0) * 60) * 1000;
                    totalDurationMilliseconds += durationMilliseconds; // Accumulate total duration
                }
            });

            const newEndTime = new Date(appointmentData.startTime.getTime() + totalDurationMilliseconds);
            setEndTime(newEndTime);

            setAppointmentData(prevState => ({
                ...prevState,
                endTime: newEndTime
            }));
        }
    };

    function formatTimeForCSharp(date) {
        console.log('formatTimeForCSharp', date)
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }


    const handleSubmit = async (event, isTokenIssue = false, isMainLocationChanged = false) => {
        console.log('handleSubmit appointmentData', appointmentData)
        setBackendErrors({});
        setIsClickedHandleSubmit(true)
        if (event) event.preventDefault();

        setNotification({ message: '', type: '' });

        const isValidContactNo = (value) => /^(0\d{9}|\d{9})$/.test(value);

        const errors = {
        customerName: !appointmentData.customerName,
        contactNo: !appointmentData.contactNo || !isValidContactNo(appointmentData.contactNo),
        treatmentTypeId: !appointmentData.treatmentTypeId || appointmentData.treatmentTypeId.length === 0,
        scheduleDate: !appointmentData.scheduleDate,
        startTime: !appointmentData.startTime
        };


        setFormErrors(errors);

        // If any field has an error, stop the form submission
        if (Object.values(errors).some(error => error)) {
            console.log('Validation errors', errors);
            return;
        }
        const userId = sessionStorage.getItem('userId');

        // Map treatment type IDs to AppoinmentTreatmentRequestModel
        const treatmentModels = appointmentData.treatmentTypeId.map(treatmentTypeId => ({
            Id: 0, // Assuming new appointment (you can set as needed)
            AppoinmentId: null, // Since it's a new appointment
            TreatmentTypeId: parseInt(treatmentTypeId, 10) // Convert to integer
        }));

        const formatDateOnly = (date) => {
            const d = (date instanceof Date) ? date : new Date(date);
            return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
        };

        let changedLocation = locationType;
        if(isMainLocationChanged) {
            if(locationType == 1) {
                changedLocation = 3;
                setAppointmentData(prevState => ({
                    ...prevState,
                    locationId: null
                }));
            } else {
                changedLocation = 1;
            }
        }

        const appointmentDataToSend = {
            Id: appointmentData.id != 0 ? appointmentData.id : 0,
            ScheduleDate: formatDateOnly(appointmentData.scheduleDate),
            CustomerName: appointmentData.customerName,
            CustomerId: appointmentData.customerId,
            ContactNo: appointmentData.contactNo,
            EmployeeId: appointmentData.employeeId != "" ? appointmentData.employeeId : null,
            SecondaryEmployeeId: appointmentData.secondaryEmployeeId != "" ? appointmentData.secondaryEmployeeId : null,
            DoctorEmployeeId: appointmentData.doctorEmployeeId != "" ? appointmentData.doctorEmployeeId : null,
            ActualFromTime: appointmentData.actualStartTime != "" ? appointmentData.actualStartTime : null,
            ActualToTime: appointmentData.actualEndTime != "" ? appointmentData.actualEndTime : null,
            ActualFromTimeSecond: appointmentData.actualSecondStartTime != "" ? appointmentData.actualSecondStartTime : null,
            ActualToTimeSecond: appointmentData.actualSecondEndTime != "" ? appointmentData.actualSecondEndTime : null,
            Remarks: appointmentData.remarks,
            FromTime: formatTimeForCSharp(appointmentData.startTime),
            ToTime: formatTimeForCSharp(appointmentData.endTime),
            EnteredBy: userId,
            EnteredDate: new Date().toISOString(),
            TokenNo: appointmentData.tokenNo,
            LocationId: !isMainLocationChanged && appointmentData.locationId != "" ? appointmentData.locationId : null,
            IsTokenIssued: isTokenIssue ? true : false,
            MainTreatmentArea: changedLocation,
            appoinmentTreatments: treatmentModels,
            isPatientContacted: appointmentData.isPatientContacted
        };

        console.log('appointmentDataToSend', appointmentDataToSend);
        console.log('isConfirmModalOpenForValidation', isConfirmModalOpenForValidation)
        //if(!isConfirmModalOpenForValidation) {
        try {
            const createdAppointment = await addAppointment(appointmentDataToSend);
            console.log('Appointment created:', createdAppointment);
            if (appointmentData.id !== 0 && appointmentData.id !== undefined) {
                setModalContent({ type: 'success', message: 'Appointment updated successfully!' });
            } else {
                setModalContent({ type: 'success', message: 'Appointment created successfully!' });
            }
            setShowModal(true);
        } catch (error) {
            console.error('Failed to create appointment:', error);

            // 🔹 Backend validation error (400)
            if (error.response?.status == 400 && error.response.data) {
                const { message, field } = error.response.data;

                if (field) {
                    setBackendErrors({ [field]: message });
                    setIsClickedHandleSubmit(false);
                    return; // stop further handling
                }

                setModalContent({ type: 'error', message });
                setShowModal(true);
                setIsClickedHandleSubmit(false);
                return;
            }

            // 🔹 Fallback error
            setModalContent({
                type: 'error',
                message:
                    appointmentData.id
                        ? 'Failed to update appointment'
                        : 'Failed to create appointment'
            });
            setShowModal(true);
            setIsClickedHandleSubmit(false);
            return;
        }

        setIsClickedHandleSubmit(false);
        refreshAppointments();  // Fetch appointments again or adjust state directly
        setModalIsOpen(false);
        resetAppointmentForm(); // Clear or reset the form state
        setSelectedResource({});
        // }
    };

    const handleNextAppointmentSubmit = async () => {
        const {
            scheduleDate,
            startTime,
            endTime,
            treatmentTypeId,
            locationType,
            customerName,
            customerId,
            contactNo
          } = nextAppointmentData;
        
          if (
            !scheduleDate ||
            !startTime ||
            !treatmentTypeId.length ||
            !locationType ||
            !customerName ||
            !customerId ||
            !contactNo
          ) {
            alert("Please fill all required fields.");
            return;
          }

        setNextAppBackendErrors({});
          
        const userId = sessionStorage.getItem('userId');
    
        const treatmentModels = nextAppointmentData.treatmentTypeId.map(treatmentTypeId => ({
            Id: 0,
            AppoinmentId: null,
            TreatmentTypeId: parseInt(treatmentTypeId, 10)
        }));
    
        const formatDateOnly = (date) => {
            const d = (date instanceof Date) ? date : new Date(date);
            return `${d.getFullYear()}-${(d.getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
        };

        const scheduleDateFormatted = formatDateOnly(nextAppointmentData.scheduleDate);
        const existingAppointments = await fetchAppointmentsByDateRange(scheduleDateFormatted, scheduleDateFormatted);
        setCurrentEvents(existingAppointments);

        if (nextAppointmentData.employeeId) {

            // Find the selected employee
            // const selectedTreatment = treatmentTypes.find(type => type.id.toString() === appointmentData.treatmentTypeId);
            const selectedEmployee = employees.find(emp => emp.id.toString() === nextAppointmentData.employeeId);
            setSelectedEmployee(selectedEmployee)

            if (!selectedEmployee) {
                setNotification({ message: "Selected employee is invalid.", type: 'error' });
                return;
            }
            
            const employeeSchedule = await fetchEmployeeSchedule(selectedEmployee.id, nextAppointmentData.scheduleDate);

            if (!employeeSchedule && !isConfirmed) {
                setNotification({ message: `The selected employee is not available on the selected date.`, type: 'error' });
                console.log('setIsConfirmModalOpenForValidation2')
                setIsConfirmModalOpenForValidation(true);
                return;
            }

            const st = new Date(startTime);
            const ed = new Date(endTime);

            // Extract the time part in 24-hour format (HH:mm:ss)
            const startTimeString = st.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false, // 24-hour format
            });

            const endTimeString = ed.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false, // 24-hour format
            });

            if (employeeSchedule) {
                const convertedFromShift = employeeSchedule.shiftMaster.fromTime;
                const convertedToShift = employeeSchedule.shiftMaster.toTime;

                console.log('startTime:', startTime);
                console.log('endTime:', endTime);
                console.log('startTimeString:', startTimeString);
                console.log('endTimeString:', endTimeString);
                console.log('employeeSchedule.shiftMaster.fromTime:', employeeSchedule.shiftMaster.fromTime);
                console.log('employeeSchedule.shiftMaster.toTime:', employeeSchedule.shiftMaster.toTime);

                const isValid = isWithinWorkHours(startTimeString, endTimeString, convertedFromShift, convertedToShift);

                if (!isValid && !isConfirmed) {
                    setNotification({ message: `The appointment time does not align with the ${selectedEmployee.fullName}'s working hours. Shift of the selected employee is ${employeeSchedule.shiftMaster.fromTime} - ${employeeSchedule.shiftMaster.toTime}`, type: 'error' });
                    console.log('setIsConfirmModalOpenForValidation3')
                    setIsConfirmModalOpenForValidation(true);
                    return;
                }
            }
        }

        // Check for overlapping appointments within the same resource (e.g., room, machine)
        if (nextAppointmentData.locationId) {
            const safeStart = ensureTimeString(nextAppointmentData.startTime);
            const safeEnd = ensureTimeString(nextAppointmentData.endTime);
        
            const newStart = combineDateAndTime(nextAppointmentData.scheduleDate, safeStart);
            const newEnd = combineDateAndTime(nextAppointmentData.scheduleDate, safeEnd);
        
            const isResourceOverlap = existingAppointments.some((event, index) => {
        
                // Skip same event when editing
                if (nextAppointmentData.id && event.id.toString() === nextAppointmentData.id.toString()) {
                    console.log("Skipping same event");
                    return false;
                }
        
                const sameLocation = event.locationId == nextAppointmentData.locationId;
        
                if (!sameLocation) return false;
        
                const eventStart = combineDateAndTime(event.scheduleDate, event.fromTime);
                const eventEnd = combineDateAndTime(event.scheduleDate, event.toTime);
        
                const isStartWithinEvent = newStart >= eventStart && newStart < eventEnd;
                const isEndWithinEvent = newEnd > eventStart && newEnd <= eventEnd;
                const isEventWithinNew = eventStart >= newStart && eventEnd <= newEnd;
  
                return isStartWithinEvent || isEndWithinEvent || isEventWithinNew;
            });
        
            if (isResourceOverlap && !isConfirmed) {
                setNotification({
                    message: `The selected room is already in use during this time slot.`,
                    type: "error"
                });
                setIsConfirmModalOpenForValidation(true);
                return;
            }
        }

        const appointmentDataToSend = {
            Id: 0,
            ScheduleDate: formatDateOnly(nextAppointmentData.scheduleDate),
            CustomerName: nextAppointmentData.customerName,
            CustomerId: nextAppointmentData.customerId,
            ContactNo: nextAppointmentData.contactNo,
            FromTime: formatTimeForCSharp(nextAppointmentData.startTime),
            ToTime: formatTimeForCSharp(nextAppointmentData.endTime),
            EnteredBy: userId,
            EnteredDate: new Date().toISOString(),
            TokenNo: nextAppointmentData.tokenNo,
            LocationId: nextAppointmentData.locationId != "" ? nextAppointmentData.locationId : null,
            EmployeeId: nextAppointmentData.employeeId != "" ? nextAppointmentData.employeeId : null,
            IsTokenIssued: false,
            MainTreatmentArea: nextAppointmentData.locationType,
            appoinmentTreatments: treatmentModels,
            ParentAppointmentScheduleId: appointmentData.id, // link to current appointment
            IsNeededToFollowUp: nextAppointmentData.isNeededToFollowUp
        };
    
        try {
            await addAppointment(appointmentDataToSend);
            setModalContent({ type: 'success', message: 'Next appointment created successfully!' });
            setShowModal(true);
            setIsNextAppointmentModalOpen(false);
            refreshAppointments();
        } catch (error) {
            console.error('Failed to create appointment:', error);
        
            // 🔹 Backend validation error (400)
            if (error.response?.status == 400 && error.response.data) {
                const { message, field } = error.response.data;
        
                if (field) {
                    setNextAppBackendErrors({ [field]: message });
                    return; // stop further handling
                }
        
                setModalContent({ type: 'error', message });
                setShowModal(true);
                return;
            }
        
            // 🔹 Fallback error
            setModalContent({
                type: 'error',
                message:
                    nextAppointmentData.id
                        ? 'Failed to update appointment'
                        : 'Failed to create appointment'
            });
            setShowModal(true);
            return;
        }
    };    

    const ensureTimeString = (value) => {
        if (typeof value === "string") return value;           
        if (value instanceof Date) return moment(value).format("HH:mm:ss");
        return null;
    };
    
    const combineDateAndTime = (date, timeString) => {
    
        const safeTime = ensureTimeString(timeString);
    
        if (!safeTime) {
            console.error("Invalid timeString:", timeString);
            return null;
        }
    
        const [hours, minutes, seconds] = safeTime.split(":").map(Number);
        const newDate = moment(date).toDate();
        newDate.setHours(hours, minutes, seconds || 0, 0);
        return newDate;
    };
    
    

    function isWithinWorkHours(appStart, appEnd, workStart, workEnd) {

        return appStart >= workStart && appEnd <= workEnd;
    }

    const refreshAppointments = async () => {
        window.location.reload();
    };

    const resetAppointmentForm = () => {
        setAppointmentData({
            id: undefined,
            scheduleDate: new Date(),
            treatmentTypeId: [],
            employeeId: '',
            secondaryEmployeeId: '',
            doctorEmployeeId: '',
            customerName: '',
            customerId: '',
            contactNo: '',
            tokenNo: '',
            tokenIssueTime: new Date(),
            resourceId: '',
            remarks: '',
            locationId: '',
            isPatientContacted: false,
            appoinmentTreatments: []
        });
        setSelectedEventId(null);
        setSelectedEmployee(null);
        setNotification({ message: '', type: '' });
        setFormErrors({
            customerName: false,
            contactNo: false,
            treatmentTypeId: false,
            scheduleDate: false,
            startTime: false
        });
        setCurrentEvents([]);
        setDropEvent([]);
        setModalIsOpen(false);
        setSelectedResource({});
        setIsConfirmModalOpen(false);
        setIsConfirmModalOpenForValidation(false);
        setShowModal(false);
        setModalContent({ type: '', message: '' });
        setStartTime(new Date());
        setEndTime(new Date());
        setActualStartTime(null);
        setActualEndTime(null);
        setActualSecondStartTime(null);
        setActualSecondEndTime(null);
        setIsConfirmed(false);
        setIsClickedHandleSubmit(false);
    };


    const handleDelete = async () => {
        try {
            console.log('appointment dataaaaaaaaa', appointmentData);

            if(appointmentData.remarks == "") {
                alert("Please enter remark before delete");
                return;
            }
            const userId = sessionStorage.getItem('userId');
            await deleteAppointment(selectedEventId, userId, appointmentData.remarks);
            const updatedEvents = currentEvents.filter(event => event.id !== selectedEventId);
            setCurrentEvents(updatedEvents);
            setSelectedEventId(null);

            refreshAppointments();  // Fetch appointments again or adjust state directly
            setModalIsOpen(false);
            resetAppointmentForm(); // Clear or reset the form state
            setSelectedResource({});
        } catch (error) {
            console.error('Failed to delete appointment:', error);
            alert('Could not delete the appointment. Please try again.');
        }
        setIsConfirmModalOpen(false);  // Close the confirmation modal
        setModalIsOpen(false);  // Close the main modal
    };

    const handleValidationConfirmation = async () => {
        console.log('handleValidationConfirmation')
        setIsConfirmModalOpenForValidation(false);  // Close the confirmation modal
        setModalIsOpen(false);  // Close the main modal
        setIsConfirmed(true);
    };

    const closeModal = () => {
        console.log("Opening confirmation modal");
        setIsConfirmModalOpen(true);  // This should trigger the modal to open
    };


    const closeModalAndReset = () => {
        refreshAppointments();  // Refresh appointments or reset state as needed
        resetAppointmentForm(); // Reset form and all necessary states
        setSelectedResource({}); // Reset selected resource
        setModalIsOpen(false);   // Close the modal
    };

    useEffect(() => {
        console.log("appointment dataaaaaaaa:", appointmentData);
        console.log("locationTypeeeeeeeeeee", locationType);

    }, [appointmentData, locationType]);

    const openNextAppointmentModal = () => {
        setNextAppointmentData({
            ...nextAppointmentData,
            customerName: appointmentData.customerName,
            customerId: appointmentData.customerId,
            contactNo: appointmentData.contactNo
        });
        setIsNextAppointmentModalOpen(true);
    };
    
    const getAvailableTreatmentLocations = async () => {
        // Make sure locations exist
        if (!Array.isArray(eliteCareTreatmentLocations)) return [];
    
        // If no date or time selected, return all locations
        if (!nextAppointmentData.startTime || !nextAppointmentData.scheduleDate) {
            return eliteCareTreatmentLocations;
        }
    
        const newStart = combineDateAndTime(nextAppointmentData.scheduleDate, ensureTimeString(nextAppointmentData.startTime));
        const newEnd = combineDateAndTime(
            nextAppointmentData.scheduleDate,
            ensureTimeString(nextAppointmentData.endTime || nextAppointmentData.startTime)
        );
    
        const formatDateOnly = (date) => {
            const d = (date instanceof Date) ? date : new Date(date);
            return `${d.getFullYear()}-${(d.getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
        };

        const scheduleDateFormatted = formatDateOnly(nextAppointmentData.scheduleDate);
        const existingAppointments = await fetchAppointmentsByDateRange(scheduleDateFormatted, scheduleDateFormatted);
        console.log('existingAppointments', existingAppointments)

        // Filter out unavailable locations
        const unavailableLocationIds = (existingAppointments || [])
            .filter(event => {
                if (event.mainTreatmentArea != "2") return false; // Only Elite Care
                const eventStart = combineDateAndTime(event.scheduleDate, ensureTimeString(event.fromTime));
                const eventEnd = combineDateAndTime(event.scheduleDate, ensureTimeString(event.toTime));
    
                const overlap =
                    (newStart >= eventStart && newStart < eventEnd) ||
                    (newEnd > eventStart && newEnd <= eventEnd) ||
                    (eventStart >= newStart && eventEnd <= newEnd);
    
                return overlap;
            })
            .map(event => event.locationId);

        console.log('unavailableLocationIds', unavailableLocationIds)
    
        // Return only available locations
        return eliteCareTreatmentLocations.filter(loc => !unavailableLocationIds.includes(loc.id));
    };

    const handleCreateCustomer = async () => {
        try {
          setIsCreatingCustomer(true);
      
          const res = await createCustomer({
            customerName: newCustomerName,
            phone: newCustomerPhone,
          });
      
          // bind created customer to appointment
          setAppointmentData(prev => ({
            ...prev,
            customerId: res.data.result.customerId,
            customerName: res.data.result.customerName,
            contactNo: res.data.result.phone,
          }));
      
          // close modal & reset
          setShowCreateModal(false);
          setNewCustomerPhone("");
        } catch (error) {
          alert("Customer creation failed");
          console.error(error);
        } finally {
          setIsCreatingCustomer(false);
        }
      };
      
    

    return (
        <div className="container">
            <h2 className="token-header">
                Token Generate -{" "}
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                        const date = e.target.value;
                        setSelectedDate(date);
                        setAppointmentData(prevState => ({
                            ...prevState,
                            scheduleDate: date
                        }));
                    }}
                    className="border rounded p-1"
                />
            </h2><br />

            {/* Search Bar */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="input-group" style={{ 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        borderRadius: '10px'
                    }}>
                        <span className="input-group-text" style={{ 
                            backgroundColor: '#f8f9fa',
                            border: 'none',
                            borderRight: '1px solid #dee2e6',
                            padding: '12px 15px',
                            borderTopLeftRadius: '10px',
                            borderBottomLeftRadius: '10px'
                        }}>
                            <i className="fas fa-search" style={{ color: '#6c757d' }}></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by customer name or contact number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                border: 'none',
                                padding: '12px 15px',
                                fontSize: '16px',
                                backgroundColor: '#fff',
                                boxShadow: 'none'
                            }}
                        />
                        {searchTerm && (
                            <button
                                className="btn"
                                type="button"
                                onClick={() => setSearchTerm('')}
                                style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 20px',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    borderTopRightRadius: '10px',
                                    borderBottomRightRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#c82333';
                                    e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#dc3545';
                                    e.target.style.transform = 'scale(1)';
                                }}
                            >
                                Clear
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>
                    {searchTerm && (
                        <small className="text-muted mt-2 d-block">
                            Showing {bookedTokens.filter(bt => 
                                bt.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                bt.contactNo?.includes(searchTerm)
                            ).length} of {bookedTokens.length} tokens
                        </small>
                    )}
                </div>
            </div>
            {loadingTokens ? (
                <div
                    className="d-flex justify-content-center align-items-center"
                    style={{
                    height: "250px",
                    backgroundColor: "#f5f5f5", // light grey background
                    borderRadius: "12px",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                    flexDirection: "column",
                    gap: "10px",
                    }}
                >
                    <div
                    className="spinner-border"
                    role="status"
                    style={{
                        width: "3.5rem",
                        height: "3.5rem",
                        color: "#28a745", // green spinner
                        borderWidth: "5px",
                        animation: "spin 1s linear infinite",
                    }}
                    ></div>
                    <strong style={{ color: "#495057", fontSize: "18px" }}>
                    Loading Tokens...
                    </strong>
                </div>
                ) : (
                renderTokens()
                )}


            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModalAndReset}
                className="Modal custom-modal"
                closeTimeoutMS={300}
                overlayClassName="Overlay"
                contentLabel="Create Appointment"
            >
                <div className="modal-dialog modal-lg">
                    <div className="modal-content custom-modal-content">
                        <div className="modal-header custom-modal-header">
                            <div className="container-fluid">
                                <div className="row">
                                    <div className="col-4">
                                        <h5 className="modal-title-appointment custom-modal-title-appointment">Create Appointment</h5>
                                    </div>
                                    <div className="col-6">
                                        <input className="form-control"
                                            type="text"
                                            id="tokenNo"
                                            name="tokenNo"
                                            style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', backgroundColor: '#ffc107' }}
                                            value={appointmentData.tokenNo}
                                            onChange={handleTokenNumberChange} />
                                            
                                            {backendErrors.tokenNo && (
                                                <div style={{color:'red', fontSize: '14px'}}>
                                                    {backendErrors.tokenNo}
                                                </div>
                                            )}
                                    </div>
                                    <div className="col-2" style={{ textAlign: 'right' }}>
                                        <button type="button" className="close custom-close" style={{ width: '50px' }} onClick={closeModalAndReset}>
                                            <span>&times;</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 form-group">
                                <label htmlFor="locationType">Location Type <span className="text-danger">*</span></label>
                                <select
                                    id="locationType"
                                    className="form-control"
                                    value={locationType}
                                    disabled={appointmentData.id}
                                    onChange={(e) => setLocationType(e.target.value)}
                                >
                                    <option value="1">Prime Care</option>
                                    <option value="2">Elite Care (Existing Appointment)</option>
                                    <option value="3">Elite Care (New Appointment)</option>
                                </select>
                            </div>
                            <div className="col-md-3 form-group">
                            <label>&nbsp;</label>
                                <button
                                    onClick={(e) => handleSubmit(e, false, true)}
                                    className="btn btn-secondary w-100"
                                    disabled={appointmentData.chitNo == null}
                                >
                                    Change Location
                                </button>
                            </div>
                        </div>
                        {locationType == "2" && !appointmentData.id && (
                            <div className="row">
                                <div className="col-md-12 form-group">
                                    <label htmlFor="eliteAppointments">Select Existing Appointment <span className="text-danger">*</span></label>
                                    <select
                                        id="eliteAppointments"
                                        className="form-control"
                                        value={selectedEliteAppointment?.id || ""}
                                        onChange={(e) => {
                                            const appt = eliteAppointments.find(a => a.id === parseInt(e.target.value));
                                            setSelectedEliteAppointment(appt);
                                            if (appt) {
                                                // auto-fill appointment form
                                                if (appt) {
                                                    let startTime = null;
                                                    if (appt.fromTime) {
                                                        const [h, m, s] = appt.fromTime.split(":").map(Number);
                                                        startTime = new Date(appt.scheduleDate);
                                                        startTime.setHours(h, m, s, 0);
                                                    }

                                                    let endTime = null;
                                                    if (appt.toTime) {
                                                        const [h, m, s] = appt.toTime.split(":").map(Number);
                                                        endTime = new Date(appt.scheduleDate);
                                                        endTime.setHours(h, m, s, 0);
                                                    }
                                                    setAppointmentData({
                                                        ...appointmentData,
                                                        id: appt.id,
                                                        customerName: appt.customerName,
                                                        customerId: appt.customerId,
                                                        contactNo: appt.contactNo,
                                                        scheduleDate: new Date(appt.scheduleDate),
                                                        startTime: startTime,
                                                        endTime: endTime,
                                                        locationId: appt.locationId,
                                                        actualStartTime: appt.actualFromTime,
                                                        actualEndTime: appt.actualToTime,
                                                        actualSecondStartTime: appt.actualFromTimeSecond,
                                                        actualSecondEndTime: appt.actualToTimeSecond,
                                                        employeeId: appt.employeeId ? appt.employeeId.toString() : 0,
                                                        secondaryEmployeeId: appt.secondaryEmployeeId ? appt.secondaryEmployeeId.toString() : 0,
                                                        doctorEmployeeId: appt.doctorEmployeeId ? appt.doctorEmployeeId.toString() : 0,
                                                        remarks: appt.remarks,
                                                        treatmentTypeId: appt.appointmentTreatments
                                                            ? appt.appointmentTreatments.map(t => t.treatmentTypeId)
                                                            : [],
                                                        appoinmentTreatments: appt.appointmentTreatments || [],
                                                        childAppointments: appt.childAppointments || [],
                                                        IsNeededToFollowUp: appt.isNeededToFollowUp,
                                                        isPatientContacted: appt.isPatientContacted
                                                    });
                                                    setStartTime(startTime)
                                                    setEndTime(endTime)
                                                    setSelectedEventId(appt.id)
                                                }
                                            }
                                        }}
                                    >
                                        <option value="">-- Select Appointment --</option>
                                        {eliteAppointments.map(appt => (
                                            <option key={appt.id} value={appt.id}>
                                                {appt.customerName} - {appt.scheduleDate}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        {(locationType == "1" || locationType == "3" || (locationType == "2" && selectedEliteAppointment)) && (
                            <form onSubmit={handleSubmit} className="modal-appoinment-body modal-body custom-modal-body">
                                <div className="container-fluid">
                                    <div className="row">
                                    <div className="col-md-6 form-group">
                                        <label>
                                            Customer Name <span className="text-danger">*</span>
                                        </label>
                                            <CreatableSelect
                                                placeholder="Search or create customer..."
                                                isClearable
                                                isLoading={isLoadingPatients}
                                                options={patientOptions}
                                                value={
                                                    appointmentData.customerId
                                                      ? {
                                                          value: appointmentData.customerId,
                                                          label: `${appointmentData.customerName}`
                                                        }
                                                      : null
                                                  }
                                                onInputChange={(value) => {
                                                    handlePatientSearch(value);
                                                    return value;
                                                }}
                                                formatCreateLabel={(input) => `➕ Create customer "${input}"`}
                                                onChange={(selected) => {
                                                    if (!selected) {
                                                    console.log("selectedddddddd", selected)
                                                    setAppointmentData(prev => ({
                                                        ...prev,
                                                        customerName: "",
                                                        customerId: "",
                                                        contactNo: ""
                                                    }));
                                                    return;
                                                    }

                                                    // NEW CUSTOMER → open modal
                                                    if (selected.__isNew__) {
                                                    setNewCustomerName(selected.label);
                                                    setNewCustomerPhone("");
                                                    setShowCreateModal(true);
                                                    return;
                                                    }

                                                    // EXISTING CUSTOMER
                                                    setAppointmentData(prev => ({
                                                    ...prev,
                                                    customerName: selected.customerName,
                                                    customerId: selected.customerId,
                                                    contactNo: selected.contactNo
                                                    }));
                                                }}
                                                classNamePrefix="react-select"
                                            />

                                            {formErrors.customerName && (
                                                <div className="text-danger small">
                                                {formErrors.customerName}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 form-group">
                                            <label htmlFor="contactNo">Contact Number <span className="text-danger">*</span></label>
                                            <input className={`form-control ${formErrors.contactNo ? 'is-invalid' : ''}`} type="text" id="contactNo" name="contactNo" value={appointmentData.contactNo} onChange={handleInputChange} required />
                                            {formErrors.contactNo && (
                                                <div className="text-danger small">
                                                    Contact number is not valid
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-12 col-sm-12 form-group">
                                            <label htmlFor="treatmentTypeId">Treatment Type(s) <span className="text-danger">*</span></label>
                                            <Autocomplete
                                                multiple
                                                options={treatmentTypes}
                                                getOptionLabel={(option) =>
                                                    option.treatmentShortCode
                                                        ? `${option.name} - ${option.treatmentShortCode}`
                                                        : option.name
                                                } // Adjust based on your data structure
                                                value={treatmentTypes.filter(type => appointmentData.treatmentTypeId.includes(type.id))} // Selected values
                                                onChange={(event, value) => handleMultipleTreatmentTypeChange(event, value)} // Pass the selected values directly
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        variant="outlined"
                                                        error={!!formErrors.treatmentTypeId}
                                                        required
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 form-group">
                                            <label htmlFor="employeeId">Employee</label>
                                            <select className={`form-control ${formErrors.employeeId ? 'is-invalid' : ''}`} id="employeeId" name="employeeId" value={appointmentData.employeeId} onChange={handleInputChange} required>
                                                <option value="">Select an Employee</option>
                                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.employeeNumber} - {emp.callingName}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className="col-md-6 form-group">
                                            <label htmlFor="scheduleDate">Schedule Date <span className="text-danger">*</span></label><br />
                                            <DatePicker
                                                className={`form-control ${formErrors.scheduleDate ? 'is-invalid' : ''}`}
                                                selected={appointmentData.scheduleDate}
                                                dateFormat="MMMM d, yyyy"
                                                onChange={(date) => {
                                                    setAppointmentData({
                                                        ...appointmentData,
                                                        scheduleDate: date,
                                                        startTime: null,
                                                        endTime: null
                                                    });
                                                    setStartTime(null);
                                                    setEndTime(null);
                                                }}
                                                disabled={appointmentData.chitNo != null}
                                            />
                                            {formErrors.scheduleDate && (
                                                <div className="text-danger small">
                                                    Schedule Date is invalid
                                                </div>
                                            )}

                                        </div>
                                        <div className="col-md-6 form-group">
                                            <label htmlFor="startTime">Start Time <span className="text-danger">*</span></label><br />
                                            <DatePicker
                                                onChange={(date) => handleTimeChange(date, 'startTime')}
                                                className={`form-control ${formErrors.startTime ? 'is-invalid' : ''}`}
                                                selected={startTime}
                                                showTimeSelect
                                                showTimeSelectOnly
                                                timeIntervals={15}
                                                timeCaption="Time"
                                                dateFormat="h:mm aa"
                                            />
                                            {formErrors.startTime && (
                                                <div className="text-danger small">
                                                    Start Time is invalid
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-12 form-group">
                                            <label htmlFor="remarks">Remarks</label>
                                            <textarea
                                                className="form-control"
                                                id="remarks"
                                                name="remarks"
                                                value={appointmentData.remarks}
                                                onChange={handleInputChange}
                                                rows="2"  // Number of visible rows in textarea
                                                placeholder="Enter any remarks or additional information"
                                            />
                                        </div>
                                    </div>
                                    <br/>
                                    <div className="row">
                                        <div className="col-md-3 form-group">
                                            <label className="form-check-label" htmlFor="isPatientContacted" style={{color:'red'}}>
                                                Patient Contacted
                                            </label>
                                        </div>
                                        <div className="col-md-6 form-group form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="isPatientContacted"
                                                checked={appointmentData.isPatientContacted}
                                                onChange={(e) =>
                                                    setAppointmentData({
                                                        ...appointmentData,
                                                        isPatientContacted: e.target.checked
                                                    })
                                                    }
                                            />
                                        </div>
                                    </div>
                                    <br/>
                                    <div className="custom-modal-footer row">
                                        <div className="col-6 p-2">
                                            <button
                                                onClick={closeModal}
                                                className="btn btn-danger w-100"
                                                disabled={!appointmentData.id || appointmentData.chitNo != null || isClickedHandleSubmit}
                                            >
                                                Delete
                                            </button>
                                        </div>

                                        <div className="col-6 p-2">
                                            <button
                                                onClick={(e) => handleSubmit(e, false, false)}
                                                className="btn btn-success w-100"
                                                disabled={isClickedHandleSubmit}
                                            >
                                                {!appointmentData.id ? "Create" : "Update"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="custom-modal-footer row">
                                        <div className="col-4 p-2">
                                            { appointmentData.chitNo != null && (
                                                <label style={{fontSize: '18px', fontWeight: 'bold', color: 'red'}}>Chit No: {appointmentData.chitNo}</label>
                                            )}
                                        </div>
                                        <div className="col-4 p-2">&nbsp;</div>
                                        <div className="col-4 p-2">
                                            <button
                                                onClick={(e) => handleSubmit(e, true, false)}
                                                className="btn btn-secondary w-100"
                                                disabled={!appointmentData.id || appointmentData.chitNo != null || isClickedHandleSubmit}
                                            >
                                                Issue Token
                                            </button>
                                        </div>
                                    </div>
                                    <div className="custom-modal-footer row">
                                        <div className="col-12 p-2">
                                            <button
                                                type="button"
                                                className="btn btn-info w-100"
                                                disabled={appointmentData.chitNo == null || appointmentData.childAppointments.length != 0}
                                                onClick={() => openNextAppointmentModal()}
                                            >
                                                Create Next Appointment
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </Modal >

            <Modal
                isOpen={isNextAppointmentModalOpen}
                onRequestClose={() => setIsNextAppointmentModalOpen(false)}
                className="Modal custom-modal"
                overlayClassName="Overlay"
                contentLabel="Create Next Appointment"
            >
                <div className="modal-dialog modal-lg">
                <NotificationComponent
                            message={notification.message}
                            type={notification.type}
                            onClose={() => setNotification({ message: '', type: '' })}
                        />
                    <div className="modal-content custom-modal-content">
                        <div className="modal-header custom-modal-header row">
                            <div className='col-md-8'>
                                <h5 className="modal-title custom-modal-title">Create Next Appointment</h5>
                            </div>
                            <div className="col-2">
                                <input className="form-control"
                                    type="text"
                                    id="tokenNo"
                                    name="tokenNo"
                                    style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', backgroundColor: '#ffc107' }}
                                    value={nextAppointmentData.tokenNo}
                                    onChange={(e) =>
                                        setNextAppointmentData({
                                            ...nextAppointmentData,
                                            tokenNo: e.target.value
                                        })
                                    }
                                />
                            </div>
                            <div className='col-md-2'>
                                <button
                                    type="button"
                                    className="close custom-close"
                                    onClick={() => setIsNextAppointmentModalOpen(false)}
                                >
                                    <span>&times;</span>
                                </button>
                            </div>
                        </div>
                        <div className="row">
                            {nextAppBackendErrors.tokenNo && (
                                <div style={{color:'red', fontSize: '14px'}}>
                                    {nextAppBackendErrors.tokenNo}
                                </div>
                            )}
                        </div>
                        <div className="modal-body custom-modal-body">
                            <div className="row">
                                <div className="col-md-6 form-group">
                                    <label>Customer Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={nextAppointmentData.customerName}
                                        readOnly
                                    />
                                </div>
                                <div className="col-md-6 form-group">
                                    <label>Contact Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={nextAppointmentData.contactNo}
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 form-group">
                                    <label>Location Type</label>
                                    <select
                                        className="form-control"
                                        value={nextAppointmentData.locationType}
                                        onChange={(e) =>
                                            setNextAppointmentData({
                                                ...nextAppointmentData,
                                                locationType: e.target.value
                                            })
                                        }
                                    >
                                        <option value="1">Prime Care</option>
                                        <option value="2">Elite Care</option>
                                    </select>
                                </div>
                                <div className="col-md-6 form-group">
                                    <label>Treatment Type(s)</label>
                                    <Autocomplete
                                        multiple
                                        options={treatmentTypes}
                                        getOptionLabel={(option) =>
                                            option.treatmentShortCode
                                                ? `${option.name} - ${option.treatmentShortCode}`
                                                : option.name
                                        }
                                        value={treatmentTypes.filter(type =>
                                            nextAppointmentData.treatmentTypeId.includes(type.id)
                                        )}
                                        onChange={(event, value) =>
                                            setNextAppointmentData({
                                                ...nextAppointmentData,
                                                treatmentTypeId: value.map(v => v.id)
                                            })
                                        }
                                        renderInput={(params) => (
                                            <TextField {...params} variant="outlined" />
                                        )}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 form-group">
                                    <label>Schedule Date</label>&nbsp;&nbsp;&nbsp;
                                    <DatePicker
                                        selected={nextAppointmentData.scheduleDate}
                                        onChange={(date) =>
                                            setNextAppointmentData({
                                                ...nextAppointmentData,
                                                scheduleDate: date
                                            })
                                        }
                                        className="form-control"
                                        dateFormat="MMMM d, yyyy"
                                    />
                                </div>

                                <div className="col-md-6 form-group">
                                    <label>Start Time</label>&nbsp;&nbsp;&nbsp;
                                    <DatePicker
                                        selected={nextAppointmentData.startTime}
                                        onChange={(date) => handleNextAppointmentTimeChange(date, 'startTime')}
                                        showTimeSelect
                                        showTimeSelectOnly
                                        timeIntervals={15}
                                        timeCaption="Time"
                                        dateFormat="h:mm aa"
                                        className="form-control"
                                        required
                                    />
                                </div>
                            </div>
                            <div className='row'>
                                { nextAppointmentData.locationType == "2" && (
                                    <div className="col-md-6 form-group">
                                    <label>Treatment Location</label>
                                    <select
                                        className="form-control"
                                        value={nextAppointmentData.locationId}
                                        onChange={(e) =>
                                            setNextAppointmentData({
                                                ...nextAppointmentData,
                                                locationId: e.target.value
                                            })
                                        }
                                    >
                                        <option value="">Select Treatment Location</option>
                                        {availableLocations.map((location) => (
                                            <option key={location.id} value={location.id}>
                                                {location.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                )}
                            </div>
                            <div className="row">
                                <div className="col-md-6 form-group">
                                    <label htmlFor="employeeId">Employee</label>
                                    <select 
                                        className={`form-control ${formErrors.employeeId ? 'is-invalid' : ''}`} 
                                        id="employeeId" 
                                        name="employeeId" 
                                        value={nextAppointmentData.employeeId} 
                                        onChange={(e) =>
                                            setNextAppointmentData({
                                                ...nextAppointmentData,
                                                employeeId: e.target.value
                                            })
                                        }
                                        required
                                    >
                                        <option value="">Select an Employee</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.employeeNumber} - {emp.callingName}</option>)}
                                    </select>
                                </div>
                            </div><br/>
                            <div className="row">
                                <div className="col-md-3 form-group">
                                    <label className="form-check-label" htmlFor="followUpNeed" style={{color:'red'}}>
                                        Follow Up Need
                                    </label>
                                </div>
                                <div className="col-md-6 form-group form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="followUpNeed"
                                        checked={nextAppointmentData.isNeededToFollowUp}
                                        onChange={(e) =>
                                        setNextAppointmentData({
                                            ...nextAppointmentData,
                                            isNeededToFollowUp: e.target.checked
                                        })
                                        }
                                    />
                                </div>
                            </div><br/>
                        </div>
                        <div className="modal-footer custom-modal-footer row">
                            <div className="col-md-6">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsNextAppointmentModalOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                            <div className="col-md-6">
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleNextAppointmentSubmit}
                                >
                                    Create Next Appointment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
            

            <CreateCustomerModal
                show={showCreateModal}
                customerName={newCustomerName}
                setCustomerName={setNewCustomerName}
                phone={newCustomerPhone}
                setPhone={setNewCustomerPhone}
                loading={isCreatingCustomer}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateCustomer}
            />




            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDelete}
            />

            <ConfirmationModalForValidation
                isOpen={isConfirmModalOpenForValidation}
                onClose={() => setIsConfirmModalOpenForValidation(false)}
                onConfirm={handleValidationConfirmation}
            />

            <AppointmentModalComponent
                show={showModal}
                onClose={closeModal}
                type={modalContent.type}
                message={modalContent.message}
            />
        </div >
    );
}

export default TokenGenerate;
