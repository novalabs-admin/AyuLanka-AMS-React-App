import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Modal from 'react-modal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './appointmentSchedulerDoctorChanneling.css';
import {
    fetchDoctorChannelingAppointmentsByDateRange,
    fetchDoctorChannelingLocations,
    deleteAppointment,
    fetchEmployees,
    fetchEmployeeSchedule,
    addAppointment,
    fetchTreatmentTypesByLocation,
    fetchAppointmentDetails,
    fetchLeaveData,
    fetchDayOffsData,
    fetchShiftsData,
} from '../../services/appointmentSchedulerApi.js';
import { ConfirmationModal } from '../confirmationModal/confirmationModal.jsx';
import { NotificationComponent } from '../notificationComponent/notificationComponent.jsx';
import AppointmentModalComponent from '../appointmentModalComponent/appointmentModalComponent.jsx';
import moment from 'moment';
import { EmployeeDayOffsModal } from '../employeeDayOffsModal/employeeDayOffsModal.jsx';
import { EmployeeLeavesModal } from '../employeeLeavesModal/employeeLeavesModal.jsx';
import { EmployeeShiftsModal } from '../employeeShiftsModal/employeeShiftsModal.jsx';
import { Tooltip } from 'react-tooltip';
import { Autocomplete, TextField } from '@mui/material';
import { ConfirmationModalForValidation } from '../confirmationModalForValidation/confirmationModalForValidation.jsx';

Modal.setAppElement('#root');

// Virtual resource id for appointments not yet assigned to a channeling room
const UNASSIGNED_RESOURCE_ID = 'doctor-room-waiting';

function AppointmentSchedulerDoctorChanneling() {
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
        contactNo: '',
        tokenNo: '',
        tokenIssueTime: new Date(),
        resourceId: '',
        remarks: '',
        locationId: '',
        treatmentTypeId: [],
        appoinmentTreatments: [],
    });
    const [employees, setEmployees] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [treatmentTypes, setTreatmentTypes] = useState([]);
    const [channelingLocations, setChannelingLocations] = useState([]);
    const [resources, setResources] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [formErrors, setFormErrors] = useState({
        customerName: false,
        contactNo: false,
        treatmentTypeId: false,
        scheduleDate: false,
    });

    const [isDayOffModalOpen, setIsDayOffModalOpen] = useState(false);
    const [isLeavesModalOpen, setIsLeavesModalOpen] = useState(false);
    const [isShiftsModalOpen, setIsShiftsModalOpen] = useState(false);
    const [dayOffsData, setDayOffsData] = useState([]);
    const [leavesData, setLeavesData] = useState([]);
    const [shiftsData, setShiftsData] = useState([]);
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [actualStartTime, setActualStartTime] = useState(null);
    const [actualEndTime, setActualEndTime] = useState(null);
    const [actualSecondStartTime, setActualSecondStartTime] = useState(null);
    const [actualSecondEndTime, setActualSecondEndTime] = useState(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isClickedHandleSubmit, setIsClickedHandleSubmit] = useState(false);
    const [isEventDrop, setIsEventDrop] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [empData, locationData] = await Promise.all([
                    fetchEmployees(),
                    fetchDoctorChannelingLocations(),
                ]);

                const filteredEmployees = empData.filter(e => e.designation?.designationCode === 'MA');
                const filteredDoctors = empData.filter(e => e.designation?.designationCode === 'ADT');

                setEmployees(filteredEmployees);
                setDoctors(filteredDoctors);
                setChannelingLocations(locationData);

                // Build calendar resources: Unassigned first, then actual rooms
                setResources([
                    { id: UNASSIGNED_RESOURCE_ID, title: 'Doctor Room Waiting', order: 0 },
                    ...locationData.map((l, i) => ({ id: l.id.toString(), title: l.name, order: i + 1 })),
                ]);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, []);

    const handleDatesSet = async (dateInfo) => {
        const { startStr, endStr } = dateInfo;
        try {
            const appointments = await fetchDoctorChannelingAppointmentsByDateRange(startStr, endStr);
            setCurrentEvents(formatAppointments(appointments));
        } catch (error) {
            console.error('Error fetching events for date range:', error);
        }
    };

    const openDayOffsModal = async () => {
        const date = moment(startTime).format('YYYY-MM-DD');
        try {
            const data = await fetchDayOffsData(date);
            setDayOffsData(data);
            setIsDayOffModalOpen(true);
        } catch (error) {
            console.error('Error fetching day offs:', error);
        }
    };

    const openShiftsModal = async () => {
        const date = moment(startTime).format('YYYY-MM-DD');
        try {
            const data = await fetchShiftsData(date);
            setShiftsData(data);
            setIsShiftsModalOpen(true);
        } catch (error) {
            console.error('Error fetching shifts:', error);
        }
    };

    const openLeavesModal = async () => {
        const date = moment(startTime).format('YYYY-MM-DD');
        try {
            const data = await fetchLeaveData(date);
            setLeavesData(data);
            setIsLeavesModalOpen(true);
        } catch (error) {
            console.error('Error fetching leaves:', error);
        }
    };

    // Determine which resource (calendar column) an appointment belongs to.
    // Channeling appointments without a room assigned (or assigned to a non-channeling location)
    // go into the "Unassigned" virtual column.
    const resolveResourceId = (appointment, locationData) => {
        if (!appointment.locationId) return UNASSIGNED_RESOURCE_ID;
        const isChannelingRoom = locationData.some(l => l.id === appointment.locationId);
        return isChannelingRoom ? appointment.locationId.toString() : UNASSIGNED_RESOURCE_ID;
    };

    const formatAppointments = (appointments) => {
        return appointments.map(appointment => {
            const datePart = appointment.scheduleDate.split('T')[0];

            const startDateTime = appointment.actualFromTime
                ? new Date(`${datePart}T${appointment.actualFromTime}`)
                : new Date(`${datePart}T${appointment.fromTime}`);

            let endDateTime;
            if (!appointment.actualFromTime && !appointment.actualToTime) {
                endDateTime = new Date(`${datePart}T${appointment.toTime}`);
            } else if (appointment.actualFromTime && !appointment.actualToTime) {
                const duration = new Date(`${datePart}T${appointment.toTime}`) - new Date(`${datePart}T${appointment.fromTime}`);
                endDateTime = new Date(new Date(`${datePart}T${appointment.actualFromTime}`).getTime() + duration);
            } else {
                endDateTime = new Date(`${datePart}T${appointment.actualToTime}`);
            }

            const treatmentTypesStr = appointment.appointmentTreatments
                ? appointment.appointmentTreatments.map(t => t.treatmentType.name).join(', ')
                : '';

            const resourceId = resolveResourceId(appointment, channelingLocations);

            return {
                id: appointment.id,
                title: appointment.customerName,
                start: startDateTime,
                end: endDateTime,
                resourceId,
                employeeId: appointment.employeeId,
                backgroundColor: getBackgroundColor(
                    appointment.employeeId,
                    appointment.tokenNo,
                    appointment.actualFromTime,
                    appointment.actualToTime
                ),
                extendedProps: {
                    contactNo: appointment.contactNo,
                    tokenNo: appointment.tokenNo,
                    employeeName: appointment.employee ? appointment.employee.callingName : '',
                    treatmentTypes: treatmentTypesStr,
                    doctorName: appointment.doctorEmployee ? appointment.doctorEmployee.callingName : '',
                },
            };
        });
    };

    const getBackgroundColor = (employeeId, tokenNo, actualStart, actualEnd) => {
        if (!employeeId && !tokenNo) return '#6E6E6E';
        if (!employeeId && tokenNo) return '#FF3333';
        if (employeeId && !tokenNo) return '#FF9900';
        if (employeeId && tokenNo && actualStart && actualEnd) return '#33CC33';
        return '#1E90FF';
    };

    function formatTimeForCSharp(date) {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function isWithinWorkHours(appStart, appEnd, workStart, workEnd) {
        return appStart >= workStart && appEnd <= workEnd;
    }

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setAppointmentData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultipleTreatmentTypeChange = (event, value) => {
        if (!Array.isArray(value)) return;
        const selectedIds = value.map(o => o.id);
        setAppointmentData(prev => ({ ...prev, treatmentTypeId: selectedIds }));
    };

    const handleDateChange = (name, date) => {
        setAppointmentData({ ...appointmentData, [name]: date });
        setFormErrors(prev => ({ ...prev, scheduleDate: !date }));
    };

    const handleTimeChange = (date, name) => {
        if (name === 'startTime') {
            setStartTime(date);
            let totalMs = 0;
            appointmentData.treatmentTypeId.forEach(id => {
                const t = treatmentTypes.find(x => x.id === id);
                if (t) totalMs += ((t.durationHours || 0) * 3600 + (t.durationMinutes || 0) * 60) * 1000;
            });
            const newEnd = new Date(date.getTime() + totalMs);
            setEndTime(newEnd);
            setAppointmentData(prev => ({ ...prev, startTime: date, endTime: newEnd }));
        }
        if (name === 'endTime') {
            setEndTime(date);
            setAppointmentData(prev => ({ ...prev, endTime: date }));
        }
    };

    const handleActualTimeChange = (date, name) => {
        if (name === 'actualStartTime') {
            setActualStartTime(date);
            setAppointmentData(prev => ({ ...prev, actualStartTime: date }));
        }
        if (name === 'actualEndTime') {
            setActualEndTime(date);
            setAppointmentData(prev => ({ ...prev, actualEndTime: date }));
        }
    };

    const handleActualSecondTimeChange = (date, name) => {
        if (name === 'actualSecondStartTime') {
            setActualSecondStartTime(date);
            setAppointmentData(prev => ({ ...prev, actualSecondStartTime: date }));
        }
        if (name === 'actualSecondEndTime') {
            setActualSecondEndTime(date);
            setAppointmentData(prev => ({ ...prev, actualSecondEndTime: date }));
        }
    };

    const handleSubmit = async (event) => {
        setIsClickedHandleSubmit(true);
        if (event) event.preventDefault();
        setNotification({ message: '', type: '' });

        const errors = {
            customerName: !appointmentData.customerName,
            contactNo: !appointmentData.contactNo,
            treatmentTypeId: !appointmentData.treatmentTypeId,
            scheduleDate: !appointmentData.scheduleDate,
        };
        setFormErrors(errors);
        if (Object.values(errors).some(e => e)) return;

        if (appointmentData.employeeId) {
            const selEmp = employees.find(e => e.id.toString() === appointmentData.employeeId);
            setSelectedEmployee(selEmp);

            if (selEmp) {
                const st = moment(appointmentData.startTime).toDate();
                const et = moment(appointmentData.endTime).toDate();
                const isOverlap = currentEvents.some(ev => {
                    if (appointmentData.id && ev.id.toString() === appointmentData.id.toString()) return false;
                    const isSameEmployee = ev.employeeId === selEmp.id;
                    const isDiffResource = ev.resourceId !== appointmentData.resourceId;
                    if (isSameEmployee && isDiffResource) return false;
                    const evStart = moment(ev.start).toDate();
                    const evEnd = moment(ev.end).toDate();
                    return isSameEmployee && (st < evEnd && et > evStart);
                });
                if (isOverlap && !isConfirmed) {
                    setNotification({ message: 'The selected room is already in use during this time slot.', type: 'error' });
                    setIsConfirmModalOpenForValidation(true);
                    return;
                }

                const scheduleDate = moment(appointmentData.scheduleDate).toDate();
                const empSchedule = await fetchEmployeeSchedule(selEmp.id, scheduleDate);
                if (!empSchedule && !isConfirmed) {
                    setNotification({ message: 'The selected employee is not available on the selected date.', type: 'error' });
                    setIsConfirmModalOpenForValidation(true);
                    return;
                }

                if (empSchedule) {
                    const stStr = st.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                    const etStr = et.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                    if (!isWithinWorkHours(stStr, etStr, empSchedule.shiftMaster.fromTime, empSchedule.shiftMaster.toTime) && !isConfirmed) {
                        setNotification({ message: `Appointment time does not align with ${selEmp.fullName}'s working hours.`, type: 'error' });
                        setIsConfirmModalOpenForValidation(true);
                        return;
                    }
                }
            }
        }

        const userId = sessionStorage.getItem('userId');
        const treatmentModels = appointmentData.treatmentTypeId.map(id => ({
            Id: 0,
            AppoinmentId: null,
            TreatmentTypeId: parseInt(id, 10),
        }));

        // Determine the LocationId to save:
        // if the appointment is dropped onto a real channeling room, save that room's id;
        // if it's in the Unassigned column, save null (or keep existing locationId if not a channeling room)
        const resolvedLocationId = appointmentData.resourceId === UNASSIGNED_RESOURCE_ID
            ? null
            : appointmentData.resourceId;

        const appointmentDataToSend = {
            Id: appointmentData.id ?? 0,
            ScheduleDate: appointmentData.scheduleDate,
            EmployeeId: appointmentData.employeeId || 0,
            SecondaryEmployeeId: appointmentData.secondaryEmployeeId || 0,
            DoctorEmployeeId: appointmentData.doctorEmployeeId || 0,
            CustomerName: appointmentData.customerName,
            ContactNo: appointmentData.contactNo,
            FromTime: formatTimeForCSharp(appointmentData.startTime),
            ToTime: formatTimeForCSharp(appointmentData.endTime),
            ActualFromTime: appointmentData.actualStartTime ? formatTimeForCSharp(appointmentData.actualStartTime) : null,
            ActualToTime: appointmentData.actualEndTime ? formatTimeForCSharp(appointmentData.actualEndTime) : null,
            ActualFromTimeSecond: appointmentData.actualSecondStartTime ? formatTimeForCSharp(appointmentData.actualSecondStartTime) : null,
            ActualToTimeSecond: appointmentData.actualSecondEndTime ? formatTimeForCSharp(appointmentData.actualSecondEndTime) : null,
            EnteredBy: userId,
            EnteredDate: new Date().toISOString(),
            TokenNo: appointmentData.tokenNo === '' ? null : appointmentData.tokenNo,
            Remarks: appointmentData.remarks,
            LocationId: resolvedLocationId,
            appoinmentTreatments: treatmentModels,
        };

        try {
            await addAppointment(appointmentDataToSend);
            setModalContent({ type: 'success', message: appointmentData.id ? 'Appointment updated successfully!' : 'Appointment created successfully!' });
            setShowModal(true);
        } catch (error) {
            console.error('Failed to save appointment:', error);
            setModalContent({ type: 'error', message: 'Failed to save appointment.' });
            setShowModal(true);
            return;
        }

        refreshAppointments();
        setModalIsOpen(false);
        resetAppointmentForm();
        setSelectedResource({});
    };

    const refreshAppointments = () => window.location.reload();

    const resetAppointmentForm = () => {
        setAppointmentData({
            id: undefined,
            scheduleDate: new Date(),
            treatmentTypeId: [],
            employeeId: '',
            secondaryEmployeeId: '',
            doctorEmployeeId: '',
            customerName: '',
            contactNo: '',
            tokenNo: '',
            tokenIssueTime: new Date(),
            resourceId: '',
            remarks: '',
            locationId: '',
            appoinmentTreatments: [],
        });
        setSelectedEventId(null);
        setSelectedEmployee(null);
        setNotification({ message: '', type: '' });
        setFormErrors({ customerName: false, contactNo: false, treatmentTypeId: false, scheduleDate: false });
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
        setIsEventDrop(false);
    };

    const handleEventDrop = async (info) => {
        const { event } = info;
        setDropEvent(info);
        setIsEventDrop(true);

        try {
            const appointmentDetails = await fetchAppointmentDetails(event.id);
            const treatmentTypeIds = appointmentDetails.appointmentTreatments.map(t => t.treatmentTypeId);
            const startTime = moment(event.start).toDate();
            const endTime = moment(event.end).toDate();

            const newResourceId = event._def.resourceIds[0];
            const resolvedLocationId = newResourceId === UNASSIGNED_RESOURCE_ID ? null : newResourceId;

            const treatmentModels = treatmentTypeIds.map(id => ({
                Id: 0,
                AppoinmentId: null,
                TreatmentTypeId: parseInt(id, 10),
            }));

            const userId = sessionStorage.getItem('userId');
            const appointmentDataToSend = {
                Id: event.id,
                ScheduleDate: moment(startTime).toISOString(),
                EmployeeId: appointmentDetails.employeeId || 0,
                SecondaryEmployeeId: appointmentDetails.secondaryEmployeeId || 0,
                DoctorEmployeeId: appointmentDetails.doctorEmployeeId || 0,
                CustomerName: appointmentDetails.customerName,
                ContactNo: appointmentDetails.contactNo,
                FromTime: moment(startTime).format('HH:mm:ss'),
                ToTime: moment(endTime).format('HH:mm:ss'),
                ActualFromTime: appointmentDetails.actualFromTime,
                ActualToTime: appointmentDetails.actualToTime,
                ActualFromTimeSecond: appointmentDetails.actualFromTimeSecond,
                ActualToTimeSecond: appointmentDetails.actualToTimeSecond,
                EnteredBy: userId,
                EnteredDate: moment().toISOString(),
                TokenNo: appointmentDetails.tokenNo,
                Remarks: appointmentDetails.remarks,
                LocationId: resolvedLocationId,
                AppoinmentTreatments: treatmentModels,
            };

            await addAppointment(appointmentDataToSend);
            setModalContent({ type: 'success', message: 'Appointment moved successfully!' });
            setShowModal(true);
            refreshAppointments();
        } catch (error) {
            console.error('Failed to move appointment:', error);
            setModalContent({ type: 'error', message: 'Failed to move appointment.' });
            setShowModal(true);
        }
    };

    const handleDelete = async () => {
        try {
            const userId = sessionStorage.getItem('userId');
            await deleteAppointment(selectedEventId, userId, appointmentData.remarks);
            refreshAppointments();
            setModalIsOpen(false);
            resetAppointmentForm();
        } catch (error) {
            console.error('Failed to delete appointment:', error);
            alert('Could not delete the appointment. Please try again.');
        }
        setIsConfirmModalOpen(false);
        setModalIsOpen(false);
    };

    const handleValidationConfirmation = () => {
        setIsConfirmModalOpenForValidation(false);
        setModalIsOpen(false);
        setIsConfirmed(true);
    };

    useEffect(() => {
        if (!isConfirmModalOpenForValidation && isConfirmed) {
            if (isClickedHandleSubmit) handleSubmit();
            else if (isEventDrop) handleEventDrop(dropEvent);
            setIsConfirmed(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConfirmModalOpenForValidation, isConfirmed]);

    const handleEventClick = async (clickInfo) => {
        const { event } = clickInfo;
        try {
            setSelectedEventId(event.id);
            const appointmentDetails = await fetchAppointmentDetails(event.id);
            if (!appointmentDetails.scheduleDate) return;

            const datePart = appointmentDetails.scheduleDate.split('T')[0];
            const st = new Date(`${datePart}T${appointmentDetails.fromTime}`);
            const et = new Date(`${datePart}T${appointmentDetails.toTime}`);
            const ast = appointmentDetails.actualFromTime ? new Date(`${datePart}T${appointmentDetails.actualFromTime}`) : null;
            const aet = appointmentDetails.actualToTime ? new Date(`${datePart}T${appointmentDetails.actualToTime}`) : null;
            const ast2 = appointmentDetails.actualFromTimeSecond ? new Date(`${datePart}T${appointmentDetails.actualFromTimeSecond}`) : null;
            const aet2 = appointmentDetails.actualToTimeSecond ? new Date(`${datePart}T${appointmentDetails.actualToTimeSecond}`) : null;

            const treatmentTypesAll = await fetchTreatmentTypesByLocation();
            setTreatmentTypes(treatmentTypesAll);

            const treatmentTypeIds = appointmentDetails.appointmentTreatments.map(t => t.treatmentTypeId);

            // Resolve current resource id
            const currentResourceId = resolveResourceId(appointmentDetails, channelingLocations);

            setAppointmentData({
                id: event.id,
                scheduleDate: appointmentDetails.scheduleDate,
                startTime: st,
                endTime: et,
                actualStartTime: ast,
                actualEndTime: aet,
                actualSecondStartTime: ast2,
                actualSecondEndTime: aet2,
                employeeId: appointmentDetails.employeeId ? appointmentDetails.employeeId.toString() : '',
                secondaryEmployeeId: appointmentDetails.secondaryEmployeeId ? appointmentDetails.secondaryEmployeeId.toString() : '',
                doctorEmployeeId: appointmentDetails.doctorEmployeeId ? appointmentDetails.doctorEmployeeId.toString() : '',
                customerName: appointmentDetails.customerName,
                contactNo: appointmentDetails.contactNo,
                tokenNo: appointmentDetails.tokenNo,
                resourceId: currentResourceId,
                remarks: appointmentDetails.remarks,
                treatmentTypeId: treatmentTypeIds,
                appointmentTreatments: treatmentTypeIds.map(id => ({ Id: 0, AppoinmentId: appointmentDetails.id, TreatmentTypeId: id })),
            });

            const foundResource = resources.find(r => r.id === currentResourceId);
            setSelectedResource(foundResource || { id: currentResourceId, title: 'Unassigned' });
            setStartTime(st);
            setEndTime(et);
            setActualStartTime(ast);
            setActualEndTime(aet);
            setActualSecondStartTime(ast2);
            setActualSecondEndTime(aet2);
            setModalIsOpen(true);
        } catch (error) {
            console.error('Error fetching appointment details:', error);
        }
    };

    const closeModal = () => setIsConfirmModalOpen(true);

    const closeModalAndReset = () => {
        refreshAppointments();
        resetAppointmentForm();
        setSelectedResource({});
        setModalIsOpen(false);
    };

    function renderEventContent(eventInfo) {
        const title = eventInfo.event.title;
        const props = eventInfo.event.extendedProps;
        const hoverText = `
            ${title ? `Patient: ${title}<br />` : ''}
            ${props.treatmentTypes ? `Treatments: ${props.treatmentTypes}<br />` : ''}
            ${props.doctorName ? `Doctor: ${props.doctorName}<br />` : ''}
            ${props.employeeName ? `Employee: ${props.employeeName}<br />` : ''}
            ${props.tokenNo ? `Token: ${props.tokenNo}` : ''}
        `.trim();

        return (
            <>
                <div
                    data-tooltip-id="channelingEventTooltip"
                    data-tooltip-html={hoverText}
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                >
                    <b style={{ fontSize: title.length > 20 ? '12px' : '14px' }}>{title}</b>
                    {props.tokenNo && <span style={{ fontSize: '11px', marginLeft: '4px' }}>#{props.tokenNo}</span>}
                </div>
                <Tooltip
                    id="channelingEventTooltip"
                    style={{
                        backgroundColor: '#333', color: '#fff', padding: '10px',
                        borderRadius: '8px', fontSize: '0.9em', maxWidth: '200px',
                    }}
                />
            </>
        );
    }

    return (
        <div>
            <NotificationComponent
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification({ message: '', type: '' })}
            />
            <FullCalendar
                plugins={[timeGridPlugin, resourceTimeGridPlugin, interactionPlugin]}
                initialView="resourceTimeGridDay"
                resources={resources}
                resourceOrder="order"
                selectable={true}
                select={async (selectInfo) => {
                    setStartTime(selectInfo.start);
                    setEndTime(selectInfo.start);
                    const resourceId = selectInfo.resource?.id ?? UNASSIGNED_RESOURCE_ID;
                    const foundResource = resources.find(r => r.id === resourceId);
                    setSelectedResource(foundResource || { id: UNASSIGNED_RESOURCE_ID, title: 'Doctor Room Waiting' });
                    setAppointmentData(prev => ({
                        ...prev,
                        scheduleDate: selectInfo.start,
                        resourceId,
                        treatmentTypeId: [],
                        employeeId: '',
                        secondaryEmployeeId: '',
                        doctorEmployeeId: '',
                        startTime: selectInfo.start,
                        customerName: '',
                        contactNo: '',
                    }));
                    const treatmentTypesAll = await fetchTreatmentTypesByLocation();
                    setTreatmentTypes(treatmentTypesAll);
                    setModalIsOpen(true);
                }}
                events={currentEvents}
                datesSet={handleDatesSet}
                eventContent={renderEventContent}
                allDaySlot={false}
                slotMinTime="07:00:00"
                eventDrop={handleEventDrop}
                eventClick={handleEventClick}
                editable={true}
            />

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModalAndReset}
                className="Modal custom-modal"
                closeTimeoutMS={300}
                overlayClassName="Overlay"
                contentLabel="Channeling Appointment"
            >
                <div className="modal-dialog modal-lg">
                    <div className="modal-content custom-modal-content">
                        <div className="modal-header custom-modal-header">
                            <div className="container-fluid">
                                <div className="row">
                                    <div className="col-10">
                                        <h5 className="modal-title-appointment custom-modal-title-appointment">
                                            Appointment at <span style={{ color: 'green', fontWeight: 'bold' }}>{selectedResource.title || 'Unassigned'}</span>
                                        </h5>
                                    </div>
                                    <div className="col-2 text-right">
                                        <button type="button" className="close custom-close" onClick={closeModalAndReset}>
                                            <span>&times;</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-4"><button onClick={openDayOffsModal} className="btn btn-warning btn-sm">Day Offs</button></div>
                                    <div className="col-md-4"><button onClick={openLeavesModal} className="btn btn-warning btn-sm">Leaves</button></div>
                                    <div className="col-md-4"><button onClick={openShiftsModal} className="btn btn-warning btn-sm">Shifts</button></div>
                                </div>
                            </div>
                        </div>

                        <NotificationComponent
                            message={notification.message}
                            type={notification.type}
                            onClose={() => setNotification({ message: '', type: '' })}
                        />

                        <form onSubmit={handleSubmit} className="modal-appoinment-body modal-body custom-modal-body">
                            <div className="container-fluid">
                                <div className="row">
                                    <div className="col-md-6 form-group">
                                        <label>Customer Name <span className="text-danger">*</span></label>
                                        <input
                                            disabled={!appointmentData.id}
                                            className={`form-control ${formErrors.customerName ? 'is-invalid' : ''}`}
                                            type="text" name="customerName"
                                            value={appointmentData.customerName}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="col-md-6 form-group">
                                        <label>Contact Number <span className="text-danger">*</span></label>
                                        <input
                                            disabled={!appointmentData.id}
                                            className={`form-control ${formErrors.contactNo ? 'is-invalid' : ''}`}
                                            type="text" name="contactNo"
                                            value={appointmentData.contactNo}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-12 form-group">
                                        <label>Treatment Type(s) <span className="text-danger">*</span></label>
                                        <Autocomplete
                                            disabled={!appointmentData.id}
                                            multiple
                                            options={treatmentTypes}
                                            getOptionLabel={o => o.treatmentShortCode ? `${o.name} - ${o.treatmentShortCode}` : o.name}
                                            value={treatmentTypes.filter(t => appointmentData.treatmentTypeId.includes(t.id))}
                                            onChange={(e, v) => handleMultipleTreatmentTypeChange(e, v)}
                                            renderInput={params => (
                                                <TextField {...params} variant="outlined" error={!!formErrors.treatmentTypeId} required />
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 form-group">
                                        <label>Schedule Date <span className="text-danger">*</span></label><br />
                                        <DatePicker
                                            disabled={!appointmentData.id}
                                            className={`form-control ${formErrors.scheduleDate ? 'is-invalid' : ''}`}
                                            selected={appointmentData.scheduleDate}
                                            onChange={date => handleDateChange('scheduleDate', date)}
                                            dateFormat="MMMM d, yyyy"
                                        />
                                    </div>
                                    <div className="col-md-3 form-group">
                                        <label>Start Time <span className="text-danger">*</span></label><br />
                                        <DatePicker
                                            disabled={!appointmentData.id}
                                            className="form-control"
                                            selected={startTime}
                                            onChange={date => handleTimeChange(date, 'startTime')}
                                            showTimeSelect showTimeSelectOnly
                                            timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa"
                                        />
                                    </div>
                                    <div className="col-md-3 form-group">
                                        <label>End Time <span className="text-danger">*</span></label><br />
                                        <DatePicker
                                            disabled={!appointmentData.id}
                                            className="form-control"
                                            selected={endTime}
                                            onChange={date => handleTimeChange(date, 'endTime')}
                                            showTimeSelect showTimeSelectOnly
                                            timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 form-group">
                                        <label>Doctor</label>
                                        <select
                                            disabled={!appointmentData.id}
                                            className="form-control"
                                            name="doctorEmployeeId"
                                            value={appointmentData.doctorEmployeeId}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select a Doctor</option>
                                            {doctors.map(d => (
                                                <option key={d.id} value={d.id}>{d.employeeNumber} - {d.callingName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6 form-group">
                                        <label>Token Number</label>
                                        <input
                                            disabled={!appointmentData.id}
                                            className="form-control" type="text" name="tokenNo"
                                            value={appointmentData.tokenNo}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 form-group">
                                        <label>Employee</label>
                                        <select
                                            disabled={!appointmentData.id}
                                            className="form-control"
                                            name="employeeId"
                                            value={appointmentData.employeeId}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select an Employee</option>
                                            {employees.map(e => (
                                                <option key={e.id} value={e.id}>{e.employeeNumber} - {e.callingName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-3 form-group">
                                        <label>Actual Start Time</label><br />
                                        <DatePicker
                                            disabled={!appointmentData.id}
                                            className="form-control"
                                            selected={actualStartTime}
                                            onChange={date => handleActualTimeChange(date, 'actualStartTime')}
                                            showTimeSelect showTimeSelectOnly
                                            timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa"
                                        />
                                    </div>
                                    <div className="col-md-3 form-group">
                                        <label>Actual End Time</label><br />
                                        <DatePicker
                                            disabled={!appointmentData.id}
                                            className="form-control"
                                            selected={actualEndTime}
                                            onChange={date => handleActualTimeChange(date, 'actualEndTime')}
                                            showTimeSelect showTimeSelectOnly
                                            timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-12 form-group">
                                        <label>Assign to Room</label>
                                        <select
                                            disabled={!appointmentData.id}
                                            className="form-control"
                                            name="resourceId"
                                            value={appointmentData.resourceId}
                                            onChange={handleInputChange}
                                        >
                                            <option value={UNASSIGNED_RESOURCE_ID}>Doctor Room Waiting</option>
                                            {channelingLocations.map(l => (
                                                <option key={l.id} value={l.id.toString()}>{l.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-12 form-group">
                                        <label>Remarks</label>
                                        <textarea
                                            className="form-control" name="remarks"
                                            value={appointmentData.remarks}
                                            onChange={handleInputChange}
                                            rows="2"
                                        />
                                    </div>
                                </div>
                                <div className="custom-modal-footer row">
                                    <div className="col-6 p-2">
                                        <button onClick={closeModal} className="btn btn-danger" type="button">Delete</button>
                                    </div>
                                    <div className="col-6 p-2">
                                        <button onClick={handleSubmit} className="btn btn-success" type="button">Save</button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

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
            <EmployeeDayOffsModal isOpen={isDayOffModalOpen} onClose={() => setIsDayOffModalOpen(false)} employees={dayOffsData} />
            <EmployeeLeavesModal isOpen={isLeavesModalOpen} onClose={() => setIsLeavesModalOpen(false)} employees={leavesData} />
            <EmployeeShiftsModal isOpen={isShiftsModalOpen} onClose={() => setIsShiftsModalOpen(false)} employees={shiftsData} />
        </div>
    );
}

export default AppointmentSchedulerDoctorChanneling;
