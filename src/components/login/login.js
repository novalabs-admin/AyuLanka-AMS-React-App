import React, { useState } from "react";
import template from "./login.jsx";
import { login_api } from "../../services/userManagementApi.js";
import { jwtDecode } from 'jwt-decode';

class login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      permissionId: 1,
      error: null,
      showErrorToast: false,
      showSuccessToast: false,
      errorMessageToast: "",
      successMessageToast: "",
      loading: false, // Flag to indicate loading state
    };
  }

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({
      [name]: value,
    });
  };

  handleFormSubmit = async (event) => {
    event.preventDefault();
    const { username, password } = this.state;

    // Set loading to true to show loading spinner
    this.setState({ loading: true });

    try {
      const formData = {
        username: username,
        password: password
      };

      const response = await login_api(formData);

        if (response.token) {
          // Decode the JWT to extract user details
          const decoded = jwtDecode(response.token);
          console.log("Decoded JWT:", decoded);

          if (decoded.userId && decoded.fullName && decoded.designationCode) {
            // Clear any stale session from a previous user before writing new values
            sessionStorage.clear();
            sessionStorage.setItem('exp', decoded.exp);
            sessionStorage.setItem('userId', decoded.userId);
            sessionStorage.setItem('fullName', decoded.fullName);
            sessionStorage.setItem('designationCode', decoded.designationCode);
            sessionStorage.setItem('companyId', decoded.companyId);
            sessionStorage.setItem('companyCode', decoded.companyCode ?? '');

            // Use a hard redirect so all components mount fresh with the new session.
            // React Router's <Navigate> keeps old in-memory state alive, which can
            // cause the wrong company's data to appear until a manual hard refresh.
            const destination = decoded.designationCode === 'SAD' ? '/dashboard' : '/home';
            window.location.href = destination;
            return;
          } else {
            throw new Error("Necessary user details not found in token");
          }
        } else {
          throw new Error("No token received, authorization failed.");
        }
      } catch (error) {
        let errorMessage = "Error occurred while processing the request.";
        if (error.response && error.response.status === 401) {
          errorMessage = "Unauthorized access. Please check your username and password.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.setState({
          showErrorToast: true,
          errorMessageToast: errorMessage,
          loading: false,
        });
      }
  };

  render() {
    return template.call(this);
  }
}

export default login;
