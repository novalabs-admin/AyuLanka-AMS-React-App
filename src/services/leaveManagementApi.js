// src/api.js
import axios from "axios";

// Import URL from config file
const baseUrl = process.env.REACT_APP_API_BASEURL;
const sublink = process.env.REACT_APP_API_SUBLINK;

export const API_BASE_URL = `${baseUrl}${sublink}`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Fetch Employees
export const fetchEmployees = async () => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get("/employee", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

// Fetch Leave Types
export const fetchLeaveApplications = async () => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get("/staffleave", { params });
    console.log(response)
    return response.data;
  } catch (error) {
    console.error("Error fetching leaves:", error);
    throw error;
  }
};

// Fetch Leave Types
export const fetchLeaveTypes = async () => {
  try {
    const response = await api.get("/leavetype");
    console.log(response)
    return response.data;
  } catch (error) {
    console.error("Error fetching leave types:", error);
    throw error;
  }
};

// Submit Leave Application
export const createLeaveApplication = async (leave) => {
  try {
    const response = await api.post("/staffleave", leave);
    return response.data;
  } catch (error) {
    console.error("Error creating leave application:", error);
    throw error;
  }
};

// Update Leave Application
export const updateLeaveApplication = async (leave) => {
  try {
    const response = await api.put(`/staffleave/${leave.id}`, leave);
    return response.data;
  } catch (error) {
    console.error("Error updating leave application:", error);
    throw error;
  }
};

// Delete Leave Application
export const deleteLeaveApplication = async (leaveId) => {
  try {
    const response = await api.delete(`/staffleave/${leaveId}`);
    return response.data;  // Return some data or true to confirm deletion
  } catch (error) {
    console.error("Error deleting leave application:", error);
    throw error;
  }
};
