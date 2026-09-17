// src/api.js
import axios from "axios";

// Import URL from config file
const baseUrl = process.env.REACT_APP_API_BASEURL;
const sublink = process.env.REACT_APP_API_SUBLINK;

export const API_BASE_URL = `${baseUrl}${sublink}`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const fetchCompanies = async () => {
  try {
    const response = await api.get("/company");
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
};

export const fetchShiftMasters = async () => {
  
  try {
    const response = await api.get("/shiftmaster");
    return response.data;
  } catch (error) {
    console.error("Error fetching shift masters:", error);
    throw error;
  }
};

export const fetchEmploymentTypes = async () => {
  try {
    const response = await api.get("/employementtype");
    return response.data;
  } catch (error) {
    console.error("Error fetching employment types:", error);
    throw error;
  }
};

export const fetchDesignations = async () => {
  try {
    const response = await api.get("/designation");
    return response.data;
  } catch (error) {
    console.error("Error fetching designations:", error);
    throw error;
  }
};

// Authentication APIs
export const login_api = async (formData) => {
  try {
    const response = await api.post("/employee/login", formData);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// User APIs
export const resetUserPassword = async (userId, newPassword) => {
  const response = await api.patch(`/employee/${userId}/reset-password`, { newPassword });
  return response.data;
};

export const fetchUsers = async () => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get("/employee", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const createUser = async (user) => {
  try {
    const userToCreate = { ...user, id: user.id ?? 0 };
    const response = await api.post("/employee", userToCreate);
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (user) => {
  try {
    const response = await api.put(`/employee/${user.id}`, user);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};
