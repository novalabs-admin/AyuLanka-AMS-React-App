import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Modal from "react-modal";
import DatePicker from "react-datepicker";
import TimeInput from "../common/TimeInput";
import "react-datepicker/dist/react-datepicker.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./appointmentSchedulerPrimeCare.css"; // Ensure this file contains your custom styles
import {
  fetchPrimeCareAppointmentsByDateRange,
  deleteAppointment,
  fetchEmployees,
  fetchEmployeeSchedule,
  fetchPrimeCareTreatmentLocations,
  addAppointment,
  fetchAppointments,
  fetchTreatmentTypesByLocation,
  fetchAppointmentDetails,
  fetchLeaveData,
  fetchDayOffsData,
  fetchShiftsData,
} from "../../services/appointmentSchedulerApi.js";
import { ConfirmationModal } from "../confirmationModal/confirmationModal.jsx";
import { NotificationComponent } from "../notificationComponent/notificationComponent.jsx";
import AppointmentModalComponent from "../appointmentModalComponent/appointmentModalComponent.jsx";
import moment from "moment";
import { EmployeeDayOffsModal } from "../employeeDayOffsModal/employeeDayOffsModal.jsx";
import { EmployeeLeavesModal } from "../employeeLeavesModal/employeeLeavesModal.jsx";
import { EmployeeShiftsModal } from "../employeeShiftsModal/employeeShiftsModal.jsx";
import { Tooltip } from "react-tooltip";
import { Autocomplete, TextField } from "@mui/material";
import { ConfirmationModalForValidation } from "../confirmationModalForValidation/confirmationModalForValidation.jsx";

Modal.setAppElement("#root");

function AppointmentSchedulerPrimeCare() {
  const [currentEvents, setCurrentEvents] = useState([]);
  const [dropEvent, setDropEvent] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirmModalOpenForValidation, setIsConfirmModalOpenForValidation] =
    useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: "", message: "" });
  const [appointmentData, setAppointmentData] = useState({
    scheduleDate: new Date(),
    employeeId: "",
    secondaryEmployeeId: "",
    doctorEmployeeId: "",
    customerName: "",
    contactNo: "",
    tokenNo: "",
    tokenIssueTime: new Date(),
    resourceId: "",
    remarks: "",
    locationId: "",
    treatmentTypeId: [], // Store selected treatment type IDs as an array
    appoinmentTreatments: [], // Initialize appoinmentTreatments as an empty array
  });
  const [employees, setEmployees] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [treatmentTypes, setTreatmentTypes] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [formErrors, setFormErrors] = useState({
    customerName: false,
    contactNo: false,
    treatmentTypeId: false,
    // employeeId: false,
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

  // Fetch Employees and Treatment Types from API
  useEffect(() => {
    console.log("appointmentData scheduleDate", appointmentData);
    const loadData = async () => {
      try {
        const [empData, treatmentLocationData] = await Promise.all([
          fetchEmployees(),
          // fetchTreatmentTypes(),
          fetchPrimeCareTreatmentLocations(),
        ]);

        // Filter employees with designationCode 'MA'
        const filteredEmployees = empData.filter(
          (employee) => employee.designation?.designationCode === "MA",
        );
        const filteredDoctors = empData.filter(
          (employee) => employee.designation?.designationCode === "ADT",
        );

        setEmployees(filteredEmployees);
        setDoctors(filteredDoctors);
        setResources(treatmentLocationData);
      } catch (error) {
        console.error("Error loading data from API:", error);
      }
    };

    loadData();
  }, []);

  // Last calendar range FullCalendar asked for, so refreshAppointments can re-read the same range in place.
  const lastRangeRef = useRef(null);

  const handleDatesSet = async (dateInfo) => {
    lastRangeRef.current = dateInfo;
    console.log("dateInfo", dateInfo);
    const { startStr, endStr } = dateInfo;
    try {
      const appointments = await fetchPrimeCareAppointmentsByDateRange(
        startStr,
        endStr,
      );
      setCurrentEvents(formatAppointments(appointments)); // Format as needed for FullCalendar
    } catch (error) {
      console.error("Error fetching events for date range:", error);
    }
  };

  // Function to fetch and set Day Offs data
  const openDayOffsModal = async () => {
    const date = moment(startTime).format("YYYY-MM-DD");
    console.log(date);
    try {
      const data = await fetchDayOffsData(date);
      setDayOffsData(data);
      setIsDayOffModalOpen(true);
    } catch (error) {
      console.error("Error fetching day offs data:", error);
    }
  };

  // Function to fetch and set Leaves data
  const openShiftsModal = async () => {
    const date = moment(startTime).format("YYYY-MM-DD");
    try {
      const data = await fetchShiftsData(date);
      setShiftsData(data);
      setIsShiftsModalOpen(true);
    } catch (error) {
      console.error("Error fetching shifts data:", error);
    }
  };

  // Function to fetch and set Shifts data
  const openLeavesModal = async () => {
    const date = moment(startTime).format("YYYY-MM-DD");
    try {
      const data = await fetchLeaveData(date);
      setLeavesData(data);
      setIsLeavesModalOpen(true);
    } catch (error) {
      console.error("Error fetching leaves data:", error);
    }
  };

  const formatAppointments = (appointments) => {
    return appointments.map((appointment) => {
      const datePart = appointment.scheduleDate.split("T")[0]; // e.g. "2025-08-26"

      // --- Start datetime ---
      const startDateTime = appointment.actualFromTime
        ? new Date(`${datePart}T${appointment.actualFromTime}`)
        : new Date(`${datePart}T${appointment.fromTime}`);

      let endDateTime;

      // --- Case 1: no actual times, just planned ---
      if (!appointment.actualFromTime && !appointment.actualToTime) {
        endDateTime = new Date(`${datePart}T${appointment.toTime}`);
      }
      // --- Case 2: actual start but no actual end => calculate based on duration ---
      else if (appointment.actualFromTime && !appointment.actualToTime) {
        const fromTime = new Date(`${datePart}T${appointment.fromTime}`);
        const toTime = new Date(`${datePart}T${appointment.toTime}`);
        const duration = toTime.getTime() - fromTime.getTime();

        console.log("appointment.customerName", appointment.customerName);
        console.log("planned fromTime", fromTime);
        console.log("planned toTime", toTime);
        console.log("duration ms", duration);

        const actualFromTime = new Date(
          `${datePart}T${appointment.actualFromTime}`,
        );
        const calculatedEndTime = new Date(actualFromTime.getTime() + duration);

        console.log("actualFromTime", actualFromTime);
        console.log("calculatedEndTime", calculatedEndTime);

        endDateTime = calculatedEndTime;
      }
      // --- Case 3: actual end provided ---
      else if (appointment.actualToTime) {
        endDateTime = new Date(`${datePart}T${appointment.actualToTime}`);
      }
      // --- Fallback (shouldn't happen) ---
      else {
        endDateTime = new Date(`${datePart}T${appointment.toTime}`);
      }

      console.log("final startDateTime", startDateTime.toISOString());
      console.log("final endDateTime", endDateTime.toISOString());

      // Get all treatment types and join them with commas
      const treatmentTypes = appointment.appointmentTreatments
        ? appointment.appointmentTreatments
            .map((treatment) => treatment.treatmentType.name)
            .join(", ")
        : "";

      return {
        id: appointment.id,
        title: `${appointment.customerName}`,
        start: startDateTime, // FullCalendar accepts Date objects directly
        end: endDateTime, // Use proper Date object, not string
        resourceId: appointment.locationId.toString(),
        employeeId: appointment.employeeId,
        backgroundColor: getBackgroundColor(
          appointment.employeeId,
          appointment.tokenNo,
          appointment.actualFromTime,
          appointment.actualToTime,
        ),
        extendedProps: {
          contactNo: appointment.contactNo,
          tokenNo: appointment.tokenNo,
          employeeName: appointment.employee
            ? appointment.employee.callingName
            : "",
          treatmentTypes: treatmentTypes,
        },
      };
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setAppointmentData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handler for multiple treatment type selection
  const handleMultipleTreatmentTypeChange = (event, value) => {
    // Debugging logs
    console.log("Selected Value:", value);

    // Ensure value is an array
    if (!Array.isArray(value)) {
      console.error("No selected options found");
      return;
    }

    const selectedIds = value.map((option) => option.id); // Get IDs from selected options
    console.log("Selected IDs:", selectedIds); // Debugging line

    // Update appointmentData state with selected IDs
    setAppointmentData((prevState) => ({
      ...prevState,
      treatmentTypeId: selectedIds,
    }));

    // Proceed with the rest of your logic if needed
    if (appointmentData.startTime && selectedIds.length > 0) {
      let totalDurationMilliseconds = 0;

      selectedIds.forEach((id) => {
        const selectedTreatment = treatmentTypes.find((t) => t.id == id);
        if (selectedTreatment) {
          let durationMilliseconds =
            (selectedTreatment.durationHours * 3600 +
              (selectedTreatment.durationMinutes || 0) * 60) *
            1000;
          totalDurationMilliseconds += durationMilliseconds; // Accumulate total duration
        }
      });

      const newEndTime = new Date(
        appointmentData.startTime.getTime() + totalDurationMilliseconds,
      );
      setEndTime(newEndTime);

      setAppointmentData((prevState) => ({
        ...prevState,
        endTime: newEndTime,
      }));
    }
  };

  const handleDateChange = (name, date) => {
    setAppointmentData({ ...appointmentData, [name]: date });
    setFormErrors((prevErrors) => ({ ...prevErrors, scheduleDate: !date }));
  };

  const getBackgroundColor = (employeeId, tokenNo, actualStart, actualend) => {
    if (
      (employeeId == null || employeeId == "") &&
      (tokenNo == null || tokenNo == "")
    ) {
      // Luminous dark gray
      return "#6E6E6E";
    } else if (
      (employeeId == null || employeeId == "") &&
      tokenNo != null &&
      tokenNo != ""
    ) {
      // Luminous red
      return "#FF3333";
    } else if (
      employeeId != null &&
      employeeId != "" &&
      (tokenNo == null || tokenNo == "")
    ) {
      // Luminous orange
      return "#FF9900";
    } else if (
      employeeId != null &&
      employeeId != "" &&
      tokenNo != null &&
      tokenNo != "" &&
      actualStart != null &&
      actualStart != "" &&
      actualend != null &&
      actualend != ""
    ) {
      // Luminous green
      return "#33CC33";
    } else {
      // Luminous blue
      return "#1E90FF";
    }
  };

  function formatTimeForCSharp(date) {
    console.log("formatTimeForCSharp", date);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  function parseTime(timeStr) {
    // Check if time is in standard 12-hour format and convert to 24-hour format
    let [hours, minutes, seconds] = timeStr.split(":");
    const period = seconds.slice(-2);
    seconds = seconds.slice(0, 2);

    if (period.toLowerCase() === "pm" && hours !== "12") {
      hours = parseInt(hours, 10) + 12;
    } else if (period.toLowerCase() === "am" && hours === "12") {
      hours = "00";
    }

    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);
    seconds = parseInt(seconds, 10);

    // Special case for midnight to be represented as end of the day
    if (hours === 0 && minutes === 0 && seconds === 0) {
      hours = 24;
    }

    return new Date(1970, 0, 1, hours, minutes, seconds);
  }

  function isWithinWorkHours(appStart, appEnd, workStart, workEnd) {
    return appStart >= workStart && appEnd <= workEnd;
  }

  const handleSubmit = async (event) => {
    console.log("handleSubmit appointmentData", appointmentData);
    setIsClickedHandleSubmit(true);
    if (event) event.preventDefault();

    setNotification({ message: "", type: "" });

    // Check required fields and set errors
    const errors = {
      customerName: !appointmentData.customerName,
      contactNo: !appointmentData.contactNo,
      treatmentTypeId: !appointmentData.treatmentTypeId,
      // employeeId: !appointmentData.employeeId,
      scheduleDate: !appointmentData.scheduleDate,
    };

    setFormErrors(errors);

    // If any field has an error, stop the form submission
    if (Object.values(errors).some((error) => error)) {
      console.log("Validation errors", errors);
      return;
    }

    if (appointmentData.employeeId) {
      // Find the selected employee
      // const selectedTreatment = treatmentTypes.find(type => type.id.toString() === appointmentData.treatmentTypeId);
      const selectedEmployee = employees.find(
        (emp) => emp.id.toString() === appointmentData.employeeId,
      );
      setSelectedEmployee(selectedEmployee);

      if (!selectedEmployee) {
        setNotification({
          message: "Selected employee is invalid.",
          type: "error",
        });
        return;
      }

      const startTime = moment(appointmentData.startTime).toDate();
      const endTime = moment(appointmentData.endTime).toDate();

      const isOverlap = currentEvents.some((event) => {
        if (
          appointmentData.id &&
          event.id.toString() === appointmentData.id.toString()
        )
          return false;

        console.log(
          "current event: ",
          appointmentData.id,
          "checking event: ",
          event.id,
        );

        const eventEmployeeId = event.employeeId;
        const eventStart = moment(event.start).toDate();
        const eventEnd = moment(event.end).toDate();
        const isStartWithinEvent =
          startTime >= eventStart && startTime < eventEnd;
        const isEndWithinEvent = endTime > eventStart && endTime <= eventEnd;
        const isEventWithinNew = eventStart >= startTime && eventEnd <= endTime;

        // Check if the employee is the same but the resource is different
        const isSameEmployee = eventEmployeeId === selectedEmployee.id;
        const isDifferentResource =
          event.resourceId !== appointmentData.resourceId;

        // If same employee but different resource, allow it (no overlap)
        if (isSameEmployee && isDifferentResource) return false;

        // Otherwise, check for overlaps
        return (
          isSameEmployee &&
          (isStartWithinEvent || isEndWithinEvent || isEventWithinNew)
        );
      });

      // Trigger the modal if there's an overlap and the user hasn't confirmed
      if (isOverlap && !isConfirmed) {
        setNotification({
          message: `The selected room is already in use during this time slot.`,
          type: "error",
        });
        console.log("setIsConfirmModalOpenForValidation1");
        setIsConfirmModalOpenForValidation(true);
        return; // Stop form submission until user confirms
      }

      const scheduleDate = moment(appointmentData.scheduleDate).toDate();

      const employeeSchedule = await fetchEmployeeSchedule(
        selectedEmployee.id,
        scheduleDate,
      );

      if (!employeeSchedule && !isConfirmed) {
        setNotification({
          message: `The selected employee is not available on the selected date.`,
          type: "error",
        });
        console.log("setIsConfirmModalOpenForValidation2");
        setIsConfirmModalOpenForValidation(true);
        return;
      }

      const st = new Date(startTime);
      const ed = new Date(endTime);

      // Extract the time part in 24-hour format (HH:mm:ss)
      const startTimeString = st.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false, // 24-hour format
      });

      const endTimeString = ed.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false, // 24-hour format
      });

      if (employeeSchedule) {
        const convertedFromShift = employeeSchedule.shiftMaster.fromTime;
        const convertedToShift = employeeSchedule.shiftMaster.toTime;

        console.log("startTime:", startTime);
        console.log("endTime:", endTime);
        console.log("startTimeString:", startTimeString);
        console.log("endTimeString:", endTimeString);
        console.log(
          "employeeSchedule.shiftMaster.fromTime:",
          employeeSchedule.shiftMaster.fromTime,
        );
        console.log(
          "employeeSchedule.shiftMaster.toTime:",
          employeeSchedule.shiftMaster.toTime,
        );

        const isValid = isWithinWorkHours(
          startTimeString,
          endTimeString,
          convertedFromShift,
          convertedToShift,
        );

        if (!isValid && !isConfirmed) {
          setNotification({
            message: `The appointment time does not align with the ${selectedEmployee.fullName}'s working hours. Shift of the selected employee is ${employeeSchedule.shiftMaster.fromTime} - ${employeeSchedule.shiftMaster.toTime}`,
            type: "error",
          });
          console.log("setIsConfirmModalOpenForValidation3");
          setIsConfirmModalOpenForValidation(true);
          return;
        }
      }
    }

    // Check for overlapping appointments within the same resource (e.g., room, machine)
    if (appointmentData.resourceId) {
      const selectedResource = resources.find(
        (resource) => resource.id.toString() === appointmentData.resourceId,
      );

      const isResourceOverlap = currentEvents.some((event) => {
        if (
          appointmentData.id &&
          event.id.toString() === appointmentData.id.toString()
        )
          return false;
        const eventResourceId = event.resourceId;
        const eventStart = moment(event.start).toDate();
        const eventEnd = moment(event.end).toDate();
        const isStartWithinEvent =
          startTime >= eventStart && startTime < eventEnd;
        const isEndWithinEvent = endTime > eventStart && endTime <= eventEnd;
        const isEventWithinNew = eventStart >= startTime && eventEnd <= endTime;

        return (
          eventResourceId === appointmentData.resourceId &&
          (isStartWithinEvent || isEndWithinEvent || isEventWithinNew)
        );
      });

      if (isResourceOverlap && !isConfirmed) {
        setNotification({
          message: `The selected room is already in use during this time slot.`,
          type: "error",
        });
        console.log("setIsConfirmModalOpenForValidation4");
        setIsConfirmModalOpenForValidation(true);
        return;
      }
    }

    const userId = sessionStorage.getItem("userId");

    // Map treatment type IDs to AppoinmentTreatmentRequestModel
    const treatmentModels = appointmentData.treatmentTypeId.map(
      (treatmentTypeId) => ({
        Id: 0, // Assuming new appointment (you can set as needed)
        AppoinmentId: null, // Since it's a new appointment
        TreatmentTypeId: parseInt(treatmentTypeId, 10), // Convert to integer
      }),
    );

    const actualStartTime = appointmentData.actualStartTime
      ? formatTimeForCSharp(appointmentData.actualStartTime)
      : null;
    const actualEndTime = appointmentData.actualEndTime
      ? formatTimeForCSharp(appointmentData.actualEndTime)
      : null;

    const actualSecondStartTime = appointmentData.actualSecondStartTime
      ? formatTimeForCSharp(appointmentData.actualSecondStartTime)
      : null;
    const actualSecondEndTime = appointmentData.actualSecondEndTime
      ? formatTimeForCSharp(appointmentData.actualSecondEndTime)
      : null;

    const appointmentDataToSend = {
      Id: appointmentData.id != 0 ? appointmentData.id : 0,
      ScheduleDate: appointmentData.scheduleDate,
      EmployeeId: appointmentData.employeeId ? appointmentData.employeeId : 0,
      SecondaryEmployeeId: appointmentData.secondaryEmployeeId
        ? appointmentData.secondaryEmployeeId
        : 0,
      DoctorEmployeeId: appointmentData.doctorEmployeeId
        ? appointmentData.doctorEmployeeId
        : 0,
      CustomerName: appointmentData.customerName,
      ContactNo: appointmentData.contactNo,
      FromTime: formatTimeForCSharp(appointmentData.startTime),
      ToTime: formatTimeForCSharp(appointmentData.endTime),
      ActualFromTime: actualStartTime,
      ActualToTime: actualEndTime,
      ActualFromTimeSecond: actualSecondStartTime,
      ActualToTimeSecond: actualSecondEndTime,
      EnteredBy: userId,
      EnteredDate: new Date().toISOString(),
      TokenNo: appointmentData.tokenNo == "" ? null : appointmentData.tokenNo,
      Remarks: appointmentData.remarks,
      LocationId: appointmentData.resourceId,
      appoinmentTreatments: treatmentModels,
    };

    console.log("appointmentDataToSend", appointmentDataToSend);
    console.log(
      "isConfirmModalOpenForValidation",
      isConfirmModalOpenForValidation,
    );
    //if(!isConfirmModalOpenForValidation) {
    try {
      const createdAppointment = await addAppointment(appointmentDataToSend);
      console.log("Appointment created:", createdAppointment);
      if (appointmentData.id !== 0 && appointmentData.id !== undefined) {
        setModalContent({
          type: "success",
          message: "Appointment updated successfully!",
        });
      } else {
        setModalContent({
          type: "success",
          message: "Appointment created successfully!",
        });
      }
      setShowModal(true);
    } catch (error) {
      console.error("Failed to create appointment:", error);
      if (appointmentData.id != 0 && appointmentData.id != undefined) {
        setModalContent({
          type: "error",
          message: "Failed to update appointment",
        });
      } else {
        setModalContent({
          type: "error",
          message: "Failed to create appointment",
        });
      }
      setShowModal(true);
      return;
    }

    refreshAppointments(); // Fetch appointments again or adjust state directly
    setModalIsOpen(false);
    resetAppointmentForm({ keepResultModal: true }); // Clear the form but keep the success popup
    setSelectedResource({});
    // }
  };

  // Re-read the visible calendar range in place (used to be a full page reload).
  const refreshAppointments = async () => {
    if (lastRangeRef.current) {
      await handleDatesSet(lastRangeRef.current);
    }
  };

  // keepResultModal: after a save the success popup must stay on screen (the page reload that used to
  // wipe it is gone). The calendar events are NOT cleared here; refreshAppointments re-reads them.
  const resetAppointmentForm = ({ keepResultModal = false } = {}) => {
    setAppointmentData({
      id: undefined,
      scheduleDate: new Date(),
      treatmentTypeId: [],
      employeeId: "",
      secondaryEmployeeId: "",
      doctorEmployeeId: "",
      customerName: "",
      contactNo: "",
      tokenNo: "",
      tokenIssueTime: new Date(),
      resourceId: "",
      remarks: "",
      locationId: "",
      appoinmentTreatments: [],
    });
    setSelectedEventId(null);
    setSelectedEmployee(null);
    setNotification({ message: "", type: "" });
    setFormErrors({
      customerName: false,
      contactNo: false,
      treatmentTypeId: false,
      scheduleDate: false,
    });
    setDropEvent([]);
    setModalIsOpen(false);
    setSelectedResource({});
    setIsConfirmModalOpen(false);
    setIsConfirmModalOpenForValidation(false);
    if (!keepResultModal) {
      setShowModal(false);
      setModalContent({ type: "", message: "" });
    }
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
    const startTime = moment(event.start).toDate();
    const endTime = moment(event.end).toDate();
    setIsEventDrop(true);

    try {
      const appointmentDetails = await fetchAppointmentDetails(event.id);

      const treatmentTypeIds = appointmentDetails.appointmentTreatments.map(
        (treatment) => treatment.treatmentTypeId,
      );

      console.log("treatmentTypeIds", appointmentDetails);

      const treatmentTypesbyLocations = await fetchTreatmentTypesByLocation();

      const scheduleDate = moment(startTime).toDate();
      console.log("Schedule Date:", scheduleDate);

      if (appointmentDetails.employeeId) {
        const treatmentTypesNew = treatmentTypesbyLocations.filter(
          (item) => item.locationId === parseInt(event._def.resourceIds[0]),
        );
        //const selectedTreatment = treatmentTypesNew.find(type => type.treatmentTypeId.toString() === appointmentDetails.treatmentLocation.treatmentTypeId.toString());
        const selectedEmployee = employees.find(
          (emp) =>
            emp.id.toString() === appointmentDetails.employeeId.toString(),
        );

        // if (!selectedTreatment || !selectedEmployee) {
        //     setNotification({ message: "Selected treatment type or employee is invalid.", type: 'error' });
        //     return;
        // }

        const isOverlap = currentEvents.some((event) => {
          if (
            appointmentData.id &&
            event.id.toString() === appointmentData.id.toString()
          )
            return false;

          console.log(
            "current event: ",
            appointmentData.id,
            "checking event: ",
            event.id,
          );

          const eventEmployeeId = event.employeeId;
          const eventStart = moment(event.start).toDate();
          const eventEnd = moment(event.end).toDate();
          const isStartWithinEvent =
            startTime >= eventStart && startTime < eventEnd;
          const isEndWithinEvent = endTime > eventStart && endTime <= eventEnd;
          const isEventWithinNew =
            eventStart >= startTime && eventEnd <= endTime;

          // Check if the employee is the same but the resource is different
          const isSameEmployee = eventEmployeeId === selectedEmployee.id;
          const isDifferentResource =
            event.resourceId !== appointmentData.resourceId;

          // If same employee but different resource, allow it (no overlap)
          if (isSameEmployee && isDifferentResource) return false;

          // Otherwise, check for overlaps
          return (
            isSameEmployee &&
            (isStartWithinEvent || isEndWithinEvent || isEventWithinNew)
          );
        });

        // Trigger the modal if there's an overlap and the user hasn't confirmed
        if (isOverlap && !isConfirmed) {
          setNotification({
            message: `The selected room is already in use during this time slot.`,
            type: "error",
          });
          console.log("setIsConfirmModalOpenForValidation5");
          setIsConfirmModalOpenForValidation(true);
          return; // Stop form submission until user confirms
        }

        const employeeSchedule = await fetchEmployeeSchedule(
          selectedEmployee.id,
          scheduleDate,
        );

        if (!employeeSchedule && !isConfirmed) {
          setNotification({
            message: `The selected employee is not available on the selected date.`,
            type: "error",
          });
          console.log("setIsConfirmModalOpenForValidation6");
          setIsConfirmModalOpenForValidation(true);
          return;
        }

        const st = new Date(startTime);
        const ed = new Date(endTime);

        // Extract the time part in 24-hour format (HH:mm:ss)
        const startTimeString = st.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false, // 24-hour format
        });

        const endTimeString = ed.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false, // 24-hour format
        });

        if (employeeSchedule) {
          const convertedFromShift = employeeSchedule.shiftMaster.fromTime;
          const convertedToShift = employeeSchedule.shiftMaster.toTime;

          console.log("startTime:", startTime);
          console.log("endTime:", endTime);
          console.log("startTimeString:", startTimeString);
          console.log("endTimeString:", endTimeString);
          console.log("convertedFromShift:", convertedFromShift);
          console.log("convertedToShift:", convertedToShift);

          const isValid = isWithinWorkHours(
            startTimeString,
            endTimeString,
            convertedFromShift,
            convertedToShift,
          );

          if (!isValid && !isConfirmed) {
            setNotification({
              message: `The appointment time does not align with the ${selectedEmployee.fullName}'s working hours. Shift of the selected employee is ${employeeSchedule.shiftMaster.fromTime} - ${employeeSchedule.shiftMaster.toTime}`,
              type: "error",
            });
            console.log("setIsConfirmModalOpenForValidation7");
            setIsConfirmModalOpenForValidation(true);
            return;
          }
        }
      }

      // Check for overlapping appointments within the same resource (e.g., room, machine)
      if (appointmentData.resourceId) {
        const selectedResource = resources.find(
          (resource) => resource.id.toString() === appointmentData.resourceId,
        );

        const isResourceOverlap = currentEvents.some((event) => {
          if (
            appointmentData.id &&
            event.id.toString() === appointmentData.id.toString()
          )
            return false;
          const eventResourceId = event.resourceId;
          const eventStart = moment(event.start).toDate();
          const eventEnd = moment(event.end).toDate();
          const isStartWithinEvent =
            startTime >= eventStart && startTime < eventEnd;
          const isEndWithinEvent = endTime > eventStart && endTime <= eventEnd;
          const isEventWithinNew =
            eventStart >= startTime && eventEnd <= endTime;

          return (
            eventResourceId === appointmentData.resourceId &&
            (isStartWithinEvent || isEndWithinEvent || isEventWithinNew)
          );
        });

        if (isResourceOverlap && !isConfirmed) {
          setNotification({
            message: `The selected room is already in use during this time slot.`,
            type: "error",
          });
          console.log("setIsConfirmModalOpenForValidation8");
          setIsConfirmModalOpenForValidation(true);
          return;
        }
      }

      const userId = sessionStorage.getItem("userId");

      const updatedEvents = currentEvents.map((ev) => {
        if (ev.id === event.id) {
          return { ...ev, start: startTime, end: endTime };
        }
        return ev;
      });

      setCurrentEvents(updatedEvents);

      // Map treatment type IDs to AppoinmentTreatmentRequestModel
      const treatmentModels = treatmentTypeIds.map((treatmentTypeId) => ({
        Id: 0, // Assuming new appointment (you can set as needed)
        AppoinmentId: null, // Since it's a new appointment
        TreatmentTypeId: parseInt(treatmentTypeId, 10), // Convert to integer
      }));

      setAppointmentData({
        id: event.id,
        scheduleDate: scheduleDate,
        startTime: startTime,
        endTime: endTime,
        actualStartTime: appointmentDetails.actualFromTime,
        actualEndTime: appointmentDetails.actualToTime,
        actualSecondStartTime: appointmentDetails.actualFromTimeSecond,
        actualSecondEndTime: appointmentDetails.actualToTimeSecond,
        treatmentTypeId: treatmentTypeIds,
        employeeId: appointmentDetails.employeeId
          ? appointmentDetails.employeeId.toString()
          : 0,
        secondaryEmployeeId: appointmentDetails.secondaryEmployeeId
          ? appointmentDetails.secondaryEmployeeId.toString()
          : 0,
        doctorEmployeeId: appointmentDetails.doctorEmployeeId
          ? appointmentDetails.doctorEmployeeId.toString()
          : 0,
        customerName: appointmentDetails.customerName,
        contactNo: appointmentDetails.contactNo,
        tokenNo: appointmentDetails.tokenNo,
        resourceId: event._def.resourceIds[0],
        remarks: appointmentDetails.remarks,
        appoinmentTreatments: treatmentModels,
      });

      const appointmentDataToSend = {
        Id: event.id,
        ScheduleDate: moment(scheduleDate).toISOString(),
        //TreatmentTypeId: filteredTreatmentType.id,
        EmployeeId: appointmentDetails.employeeId
          ? appointmentDetails.employeeId
          : 0,
        SecondaryEmployeeId: appointmentDetails.secondaryEmployeeId
          ? appointmentDetails.secondaryEmployeeId
          : 0,
        DoctorEmployeeId: appointmentDetails.doctorEmployeeId
          ? appointmentDetails.doctorEmployeeId
          : 0,
        CustomerName: appointmentDetails.customerName,
        ContactNo: appointmentDetails.contactNo,
        FromTime: moment(startTime).format("HH:mm:ss"),
        ToTime: moment(endTime).format("HH:mm:ss"),
        ActualFromTime: appointmentDetails.actualFromTime,
        ActualToTime: appointmentDetails.actualToTime,
        ctualFromTimeSecond: appointmentDetails.actualFromTimeSecond,
        ActualToTimeSecond: appointmentDetails.actualToTimeSecond,
        EnteredBy: userId,
        EnteredDate: moment().toISOString(),
        TokenNo: appointmentData.tokenNo == "" ? null : appointmentData.tokenNo,
        Remarks: appointmentDetails.remarks,
        LocationId: event._def.resourceIds[0],
        AppoinmentTreatments: treatmentModels,
      };

      console.log("appointmentDataToSend", appointmentDataToSend);
      const createdAppointment = await addAppointment(appointmentDataToSend);
      setModalContent({
        type: "success",
        message: "Appointment updated successfully!",
      });
      setShowModal(true);
      console.log("Appointment created:", createdAppointment);
      refreshAppointments(); // Fetch appointments again or adjust state directly
      setModalIsOpen(false);
      resetAppointmentForm({ keepResultModal: true }); // Clear the form but keep the success popup
      setSelectedResource({});
    } catch (error) {
      console.error("Failed to update appointment:", error);
      setModalContent({
        type: "error",
        message: "Failed to update appointment",
      });
      setShowModal(true);
    }
  };

  useEffect(() => {
    console.log("Current events updated:", currentEvents);
  }, [currentEvents]);

  const handleDelete = async () => {
    try {
      console.log("appointment dataaaaaaaaa", appointmentData);
      const userId = sessionStorage.getItem("userId");
      await deleteAppointment(selectedEventId, userId, appointmentData.remarks);
      const updatedEvents = currentEvents.filter(
        (event) => event.id !== selectedEventId,
      );
      setCurrentEvents(updatedEvents);
      setSelectedEventId(null);

      refreshAppointments(); // Fetch appointments again or adjust state directly
      setModalIsOpen(false);
      resetAppointmentForm(); // Clear or reset the form state
      setSelectedResource({});
    } catch (error) {
      console.error("Failed to delete appointment:", error);
      alert("Could not delete the appointment. Please try again.");
    }
    setIsConfirmModalOpen(false); // Close the confirmation modal
    setModalIsOpen(false); // Close the main modal
  };

  const handleValidationConfirmation = async () => {
    console.log("handleValidationConfirmation");
    setIsConfirmModalOpenForValidation(false); // Close the confirmation modal
    setModalIsOpen(false); // Close the main modal
    setIsConfirmed(true);
  };

  // Use useEffect to handle submit after confirmation modal closes
  useEffect(() => {
    if (!isConfirmModalOpenForValidation && isConfirmed) {
      if (isClickedHandleSubmit) {
        handleSubmit();
      } else if (isEventDrop) {
        handleEventDrop(dropEvent);
      }
      setIsConfirmed(false);
    }
  }, [
    isConfirmModalOpenForValidation,
    isConfirmed,
    dropEvent,
    isClickedHandleSubmit,
    isEventDrop,
  ]);

  // OK / X on the success-or-error popup. It used to share closeModal (which opens the delete
  // confirmation) and relied on the page reload to hide that again; now it only closes the popup.
  // After an error the calendar is re-read, so an event dragged to a slot that failed to save snaps back.
  const closeResultModal = () => {
    const wasError = modalContent.type === "error";
    setShowModal(false);
    setModalContent({ type: "", message: "" });
    if (wasError) refreshAppointments();
  };

  const closeModal = () => {
    console.log("Opening confirmation modal");
    setIsConfirmModalOpen(true); // This should trigger the modal to open
  };

  // Add useEffect to monitor the state of isConfirmModalOpen
  useEffect(() => {
    console.log("isConfirmModalOpen changed to: ", isConfirmModalOpen);
  }, [isConfirmModalOpen]);

  // Add useEffect to monitor the state of isConfirmModalOpenForValidation
  useEffect(() => {
    console.log(
      "isConfirmModalOpenForValidation changed to: ",
      isConfirmModalOpenForValidation,
    );
  }, [isConfirmModalOpenForValidation]);

  function renderEventContent(eventInfo) {
    // Check if title length exceeds a certain limit to conditionally adjust font size
    const title = eventInfo.event.title;
    const isLongTitle = title.length > 20; // Adjust this limit based on your needs

    // Prepare hover text with <br /> for line breaks
    const hoverText = `
            ${title ? `Patient Name: ${title}<br />` : ""}
            ${eventInfo.event.extendedProps.treatmentTypes ? `Treatment Types: ${eventInfo.event.extendedProps.treatmentTypes}<br />` : ""}
            ${eventInfo.event.extendedProps.employeeName ? `Employee: ${eventInfo.event.extendedProps.employeeName}<br />` : ""}
            ${eventInfo.event.extendedProps.tokenNo ? `Token No: ${eventInfo.event.extendedProps.tokenNo}` : ""}
        `;

    return (
      <>
        <div
          data-tooltip-id="eventTooltip"
          data-tooltip-html={hoverText.trim()}
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
        >
          <div className="row">
            <div
              className="col-md-10"
              style={{
                fontSize: isLongTitle ? "12px" : "14px", // Reduce font size if title is long
                fontStyle: "italic",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <b>{title}</b>
            </div>
          </div>
        </div>

        {/* Tooltip with custom styles */}
        <Tooltip
          id="eventTooltip"
          multiline={true}
          style={{
            backgroundColor: "#333",
            color: "#fff",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            fontSize: "0.9em",
            textAlign: "left",
            maxWidth: "200px",
          }}
        />
      </>
    );
  }

  const handleTimeChange = (date, name) => {
    console.log("treatmentTypes", treatmentTypes);

    if (name === "startTime") {
      setNotification({ message: "", type: "" });

      // Check required fields and set errors
      const errors = {
        customerName: !appointmentData.customerName,
        contactNo: !appointmentData.contactNo,
        treatmentTypeId: !appointmentData.treatmentTypeId,
        // employeeId: !appointmentData.employeeId,
        scheduleDate: !appointmentData.scheduleDate,
      };

      setFormErrors(errors);

      // If any field has an error, stop the form submission
      if (Object.values(errors).some((error) => error)) {
        console.log("Validation errors", errors);
        return;
      }

      setStartTime(date);

      let totalDurationMilliseconds = 0; // Initialize total duration for multiple treatments

      // Iterate over the selected treatment type IDs
      appointmentData.treatmentTypeId.forEach((option) => {
        // Find the treatment that matches the selected treatmentTypeId inside the treatmentType object
        const selectedTreatment = treatmentTypes.find((t) => t.id == option);
        console.log(
          `Dropdown changed: treatmentTypeId = ${option}, selectedTreatment = `,
          selectedTreatment,
        ); // Debugging line

        if (selectedTreatment) {
          let durationMilliseconds = 0;

          const { durationHours, durationMinutes } = selectedTreatment; // Destructure duration fields

          if (durationHours || durationMinutes) {
            // Calculate duration in milliseconds
            durationMilliseconds =
              (durationHours * 3600 + (durationMinutes || 0) * 60) * 1000;

            // Accumulate total duration
            totalDurationMilliseconds += durationMilliseconds;
          }
        }
      });

      // Calculate new end time based on the total duration
      const newEndTime = new Date(date.getTime() + totalDurationMilliseconds);
      setEndTime(newEndTime);

      // Update the appointmentData state with the new startTime and calculated endTime
      setAppointmentData((prevState) => ({
        ...prevState,
        startTime: date,
        endTime: newEndTime,
      }));
    }

    if (name === "endTime") {
      setEndTime(date);
      // Update the appointmentData state with the new startTime and calculated endTime
      setAppointmentData((prevState) => ({
        ...prevState,
        endTime: date,
      }));
    }
  };

  const handleActualTimeChange = (date, name) => {
    if (name === "actualStartTime") {
      setActualStartTime(date);

      // Update the appointmentData state with the new startTime and calculated endTime
      setAppointmentData((prevState) => ({
        ...prevState,
        actualStartTime: date,
      }));
    }

    if (name === "actualEndTime") {
      setActualEndTime(date);
      // Update the appointmentData state with the new startTime and calculated endTime
      setAppointmentData((prevState) => ({
        ...prevState,
        actualEndTime: date,
      }));
    }
  };

  const handleActualSecondTimeChange = (date, name) => {
    if (name === "actualSecondStartTime") {
      setActualSecondStartTime(date);

      // Update the appointmentData state with the new startTime and calculated endTime
      setAppointmentData((prevState) => ({
        ...prevState,
        actualSecondStartTime: date,
      }));
    }

    if (name === "actualSecondEndTime") {
      setActualSecondEndTime(date);
      // Update the appointmentData state with the new startTime and calculated endTime
      setAppointmentData((prevState) => ({
        ...prevState,
        actualSecondEndTime: date,
      }));
    }
  };

  const handleEventClick = async (clickInfo) => {
    const { event } = clickInfo;

    try {
      setSelectedEventId(event.id);

      // Simulate fetching details, replace this with your actual fetch call
      const appointmentDetails = await fetchAppointmentDetails(event.id);

      if (!appointmentDetails.scheduleDate) {
        setNotification({
          message: `Schedule date is missing in the appointment details.`,
          type: "error",
        });
        console.error("Schedule date is missing in the appointment details.");
        return;
      }

      const startTime = new Date(
        `${appointmentDetails.scheduleDate.split("T")[0]}T${appointmentDetails.fromTime}`,
      );
      const endTime = new Date(
        `${appointmentDetails.scheduleDate.split("T")[0]}T${appointmentDetails.toTime}`,
      );

      const actualStartTime = appointmentDetails.actualFromTime
        ? new Date(
            `${appointmentDetails.scheduleDate.split("T")[0]}T${appointmentDetails.actualFromTime}`,
          )
        : null;
      const actualEndTime = appointmentDetails.actualToTime
        ? new Date(
            `${appointmentDetails.scheduleDate.split("T")[0]}T${appointmentDetails.actualToTime}`,
          )
        : null;

      const actualSecondStartTime = appointmentDetails.actualFromTimeSecond
        ? new Date(
            `${appointmentDetails.scheduleDate.split("T")[0]}T${appointmentDetails.actualFromTimeSecond}`,
          )
        : null;
      const actualSecondEndTime = appointmentDetails.actualToTimeSecond
        ? new Date(
            `${appointmentDetails.scheduleDate.split("T")[0]}T${appointmentDetails.actualToTimeSecond}`,
          )
        : null;

      // Make sure the selected resource exists in your state before setting it
      const foundResource = resources.find(
        (r) => r.id === appointmentDetails.locationId,
      );
      if (!foundResource) {
        setNotification({
          message: `Selected resource not found.`,
          type: "error",
        });
        console.error("Selected resource not found.");
        return;
      }

      setSelectedResource(foundResource);

      const treatmentTypesbyLocations = await fetchTreatmentTypesByLocation();
      //const treatmentTypes = treatmentTypesbyLocations.filter(item => item.locationId === foundResource.id);
      setTreatmentTypes(treatmentTypesbyLocations);
      console.log("appointmentDetails newwwwwwwwww", appointmentDetails);
      const treatmentTypeIds = appointmentDetails.appointmentTreatments.map(
        (treatment) => treatment.treatmentTypeId,
      );

      // Ensure appointment treatments are mapped correctly
      const appointmentTreatments =
        appointmentDetails.appointmentTreatments.map((treatment) => ({
          Id: treatment.id, // Assuming new appointment (you can set as needed)
          AppoinmentId: treatment.appoinmentId, // Since it's a new appointment
          TreatmentTypeId: parseInt(treatment.treatmentTypeId, 10), // Convert to integer
        }));
      console.log("startTime", startTime, " endTime", endTime);
      console.log(
        "actualStartTime",
        actualStartTime,
        " actualEndTime",
        actualEndTime,
      );
      setAppointmentData({
        id: event.id,
        scheduleDate: appointmentDetails.scheduleDate,
        startTime: startTime,
        endTime: endTime,
        actualStartTime: actualStartTime,
        actualEndTime: actualEndTime,
        actualSecondStartTime: actualSecondStartTime,
        actualSecondEndTime: actualSecondEndTime,
        employeeId: appointmentDetails.employeeId
          ? appointmentDetails.employeeId.toString()
          : "",
        secondaryEmployeeId: appointmentDetails.secondaryEmployeeId
          ? appointmentDetails.secondaryEmployeeId.toString()
          : "",
        doctorEmployeeId: appointmentDetails.doctorEmployeeId
          ? appointmentDetails.doctorEmployeeId.toString()
          : "",
        customerName: appointmentDetails.customerName,
        contactNo: appointmentDetails.contactNo,
        tokenNo: appointmentDetails.tokenNo,
        resourceId: foundResource.id.toString(),
        remarks: appointmentDetails.remarks,
        treatmentTypeId: treatmentTypeIds,
        appointmentTreatments: appointmentTreatments,
      });

      setStartTime(startTime);
      setEndTime(endTime);
      setActualStartTime(actualStartTime);
      setActualEndTime(actualEndTime);
      setActualSecondStartTime(actualSecondStartTime);
      setActualSecondEndTime(actualSecondEndTime);
      setModalIsOpen(true);
    } catch (error) {
      console.error("Error fetching appointment details:", error);
    }
  };

  const closeModalAndReset = () => {
    console.log("closedddddddddddddddd");
    refreshAppointments(); // Refresh appointments or reset state as needed
    resetAppointmentForm(); // Reset form and all necessary states
    setSelectedResource({}); // Reset selected resource
    setModalIsOpen(false); // Close the modal
  };

  useEffect(() => {
    console.log("appointment dataaaaaaaa:", appointmentData);
  }, [appointmentData]);

  return (
    <div>
      <NotificationComponent
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "" })}
      />
      <FullCalendar
        className={"fc"}
        plugins={[timeGridPlugin, resourceTimeGridPlugin, interactionPlugin]}
        initialView="resourceTimeGridDay"
        resources={resources.map((location) => ({
          id: location.id.toString(),
          title: location.name,
        }))}
        selectable={true}
        select={async (selectInfo) => {
          setStartTime(selectInfo.start);
          setEndTime(selectInfo.start);
          const locationId = parseInt(selectInfo.resource.id); // Get the selected location ID
          setSelectedResource(resources.find((r) => r.id === locationId));
          setAppointmentData((prevState) => ({
            ...prevState,
            scheduleDate: selectInfo.start,
            resourceId: selectInfo.resource.id,
            treatmentTypeId: "",
            employeeId: "",
            secondaryEmployeeId: "",
            doctorEmployeeId: "",
            startTime: selectInfo.start,
            customerName: "",
            contactNo: "",
          }));
          setModalIsOpen(true);

          try {
            const treatmentTypesbyLocations =
              await fetchTreatmentTypesByLocation();
            console.log("treatmentTypesbyLocations", treatmentTypesbyLocations);

            // const treatmentTypes = treatmentTypesbyLocations.filter(item => item.locationId === locationId);

            // console.log('Filtered treatment types for location:', treatmentTypes);
            setTreatmentTypes(treatmentTypesbyLocations);
          } catch (error) {
            console.error(
              "Error loading treatment types for selected location:",
              error,
            );
          }
        }}
        events={currentEvents}
        datesSet={handleDatesSet}
        eventContent={renderEventContent}
        allDaySlot={false}
        slotMinTime="07:00:00" // Start displaying times from 7 AM
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
        contentLabel="Create Appointment"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content custom-modal-content">
            <div className="modal-header custom-modal-header">
              <div className="container-fluid">
                <div className="row">
                  <div className="col-10">
                    <h5 className="modal-title-appointment custom-modal-title-appointment">
                      Create Appointment at{" "}
                      <span style={{ color: "green", fontWeight: "bold" }}>
                        {selectedResource.name || ""}
                      </span>
                    </h5>
                  </div>
                  <div className="col-2 text-right">
                    <button
                      type="button"
                      className="close custom-close"
                      onClick={closeModalAndReset}
                    >
                      <span>&times;</span>
                    </button>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4 col-sm-4">
                    <button
                      onClick={openDayOffsModal}
                      className="btn btn-warning"
                    >
                      Day Offs
                    </button>
                  </div>
                  <div className="col-md-4 col-sm-4">
                    <button
                      onClick={openLeavesModal}
                      className="btn btn-warning"
                    >
                      Leaves
                    </button>
                  </div>
                  <div className="col-md-4 col-sm-4">
                    <button
                      onClick={openShiftsModal}
                      className="btn btn-warning"
                    >
                      Shifts
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <NotificationComponent
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification({ message: "", type: "" })}
            />
            <form
              onSubmit={handleSubmit}
              className="modal-appoinment-body modal-body custom-modal-body"
            >
              <div className="container-fluid">
                <div className="row">
                  <div className="col-md-6 form-group">
                    <label htmlFor="customerName">
                      Customer Name <span className="text-danger">*</span>
                    </label>
                    <input
                      disabled={!appointmentData.id}
                      className={`form-control ${formErrors.customerName ? "is-invalid" : ""}`}
                      type="text"
                      id="customerName"
                      name="customerName"
                      value={appointmentData.customerName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 form-group">
                    <label htmlFor="contactNo">
                      Contact Number <span className="text-danger">*</span>
                    </label>
                    <input
                      disabled={!appointmentData.id}
                      className={`form-control ${formErrors.contactNo ? "is-invalid" : ""}`}
                      type="text"
                      id="contactNo"
                      name="contactNo"
                      value={appointmentData.contactNo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12 col-sm-12 form-group">
                    <label htmlFor="treatmentTypeId">
                      Treatment Type(s) <span className="text-danger">*</span>
                    </label>
                    <Autocomplete
                      disabled={!appointmentData.id}
                      multiple
                      options={treatmentTypes}
                      getOptionLabel={(option) =>
                        option.treatmentShortCode
                          ? `${option.name} - ${option.treatmentShortCode}`
                          : option.name
                      } // Adjust based on your data structure
                      value={treatmentTypes.filter((type) =>
                        appointmentData.treatmentTypeId.includes(type.id),
                      )} // Selected values
                      onChange={(event, value) =>
                        handleMultipleTreatmentTypeChange(event, value)
                      } // Pass the selected values directly
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
                  {/* <div className="col-md-6 col-sm-6 form-group">
                            <label htmlFor="scheduleDate">Schedule Date <span className="text-danger">*</span></label><br/>
                            <DatePicker className={`form-control ${formErrors.scheduleDate ? 'is-invalid' : ''}`} selected={appointmentData.scheduleDate} onChange={(date) => handleDateChange('scheduleDate', date)} dateFormat="MMMM d, yyyy" />
                        </div> */}
                </div>
                <div className="row">
                  <div className="col-md-6 col-sm-6 form-group">
                    <label htmlFor="scheduleDate">
                      Schedule Date <span className="text-danger">*</span>
                    </label>
                    <br />
                    <DatePicker
                      disabled={!appointmentData.id}
                      className={`form-control ${formErrors.scheduleDate ? "is-invalid" : ""}`}
                      selected={appointmentData.scheduleDate}
                      onChange={(date) =>
                        handleDateChange("scheduleDate", date)
                      }
                      dateFormat="MMMM d, yyyy"
                    />
                  </div>
                  <div className="col-md-3 col-sm-3 form-group">
                    <label htmlFor="startTime">
                      Start Time <span className="text-danger">*</span>
                    </label>
                    <br />
                    <TimeInput
                      disabled={!appointmentData.id}
                      baseDate={appointmentData.scheduleDate}
                      value={startTime}
                      onChange={(date) => handleTimeChange(date, "startTime")}
                    />
                  </div>
                  <div className="col-md-3 col-sm-3 form-group">
                    <label htmlFor="endTime">
                      End Time <span className="text-danger">*</span>
                    </label>
                    <br />
                    <TimeInput
                      disabled={!appointmentData.id}
                      baseDate={appointmentData.scheduleDate}
                      value={endTime}
                      onChange={(date) => handleTimeChange(date, "endTime")}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 form-group">
                    <label htmlFor="employeeId">Employee</label>
                    <select
                      disabled={!appointmentData.id}
                      className={`form-control ${formErrors.employeeId ? "is-invalid" : ""}`}
                      id="employeeId"
                      name="employeeId"
                      value={appointmentData.employeeId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select an Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employeeNumber} - {emp.callingName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3 col-sm-3 form-group">
                    <label htmlFor="actualStartTime">Actual Start Time</label>
                    <br />
                    <TimeInput
                      disabled={!appointmentData.id}
                      allowClear
                      baseDate={appointmentData.scheduleDate}
                      value={actualStartTime}
                      onChange={(date) =>
                        handleActualTimeChange(date, "actualStartTime")
                      }
                    />
                  </div>
                  <div className="col-md-3 col-sm-3 form-group">
                    <label htmlFor="actualEndTime">Actual End Time</label>
                    <br />
                    <TimeInput
                      disabled={!appointmentData.id}
                      allowClear
                      baseDate={appointmentData.scheduleDate}
                      value={actualEndTime}
                      onChange={(date) =>
                        handleActualTimeChange(date, "actualEndTime")
                      }
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 form-group">
                    <label htmlFor="secondaryEmployeeId">
                      Secondary Employee
                    </label>
                    <select
                      disabled={!appointmentData.id}
                      className={`form-control ${formErrors.secondaryEmployeeId ? "is-invalid" : ""}`}
                      id="secondaryEmployeeId"
                      name="secondaryEmployeeId"
                      value={appointmentData.secondaryEmployeeId}
                      onChange={handleInputChange}
                    >
                      <option value="">Select an Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employeeNumber} - {emp.callingName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3 col-sm-3 form-group">
                    <label htmlFor="actualSecondStartTime">
                      Actual Start Time
                    </label>
                    <br />
                    <TimeInput
                      disabled={!appointmentData.id}
                      allowClear
                      baseDate={appointmentData.scheduleDate}
                      value={actualSecondStartTime}
                      onChange={(date) =>
                        handleActualSecondTimeChange(
                          date,
                          "actualSecondStartTime",
                        )
                      }
                    />
                  </div>
                  <div className="col-md-3 col-sm-3 form-group">
                    <label htmlFor="actualSecondEndTime">Actual End Time</label>
                    <br />
                    <TimeInput
                      disabled={!appointmentData.id}
                      allowClear
                      baseDate={appointmentData.scheduleDate}
                      value={actualSecondEndTime}
                      onChange={(date) =>
                        handleActualSecondTimeChange(
                          date,
                          "actualSecondEndTime",
                        )
                      }
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 form-group">
                    <label htmlFor="doctorEmployeeId">Doctor</label>
                    <select
                      disabled={!appointmentData.id}
                      className={`form-control ${formErrors.doctorEmployeeId ? "is-invalid" : ""}`}
                      id="doctorEmployeeId"
                      name="doctorEmployeeId"
                      value={appointmentData.doctorEmployeeId}
                      onChange={handleInputChange}
                    >
                      <option value="">Select a Doctor</option>
                      {doctors.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employeeNumber} - {emp.callingName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 form-group">
                    <label htmlFor="tokenNo">Token Number</label>
                    <input
                      disabled={!appointmentData.id}
                      className="form-control"
                      type="text"
                      id="tokenNo"
                      name="tokenNo"
                      value={appointmentData.tokenNo}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                {/* New Remark Field */}
                <div className="row">
                  <div className="col-md-12 form-group">
                    <label htmlFor="remarks">Remarks</label>
                    <textarea
                      className="form-control"
                      id="remarks"
                      name="remarks"
                      value={appointmentData.remarks}
                      onChange={handleInputChange}
                      rows="2" // Number of visible rows in textarea
                      placeholder="Enter any remarks or additional information"
                    />
                  </div>
                </div>
                <div className="custom-modal-footer row">
                  {/* <div className="col-6 p-2">
                            <button className="btn btn-danger" onClick={closeModal}>Delete</button>
                        </div> */}
                  <div className="col-6 p-2">
                    <button onClick={closeModal} className="btn btn-danger">
                      Delete
                    </button>
                  </div>
                  <div className="col-6 p-2">
                    <button onClick={handleSubmit} className="btn btn-success">
                      Save
                    </button>
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
        onClose={closeResultModal}
        type={modalContent.type}
        message={modalContent.message}
      />

      {/* New Modals for Employee Day Offs and Employee Leaves */}
      <EmployeeDayOffsModal
        isOpen={isDayOffModalOpen}
        onClose={() => setIsDayOffModalOpen(false)}
        employees={dayOffsData}
      />
      <EmployeeLeavesModal
        isOpen={isLeavesModalOpen}
        onClose={() => setIsLeavesModalOpen(false)}
        employees={leavesData}
      />
      <EmployeeShiftsModal
        isOpen={isShiftsModalOpen}
        onClose={() => setIsShiftsModalOpen(false)}
        employees={shiftsData}
      />
    </div>
  );
}

export default AppointmentSchedulerPrimeCare;
