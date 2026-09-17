import React from "react";
import UserTemplate from "./user.jsx";
import "./user.css";
import { fetchUsers, createUser, updateUser, fetchShiftMasters, fetchDesignations, fetchEmploymentTypes, fetchCompanies, resetUserPassword } from "../../services/userManagementApi.js"; // Adjust the path as necessary

class User extends React.Component {
  constructor(props) {
    super(props);
    const sessionCompanyId = sessionStorage.getItem("companyId") || "";
    const designationCode = sessionStorage.getItem("designationCode") || "";
    this.state = {
      users: [],
      shiftMasters: [],
      employmentTypes: [],
      designations: [],
      companies: [],
      isSuperAdmin: designationCode === "SAD",
      sessionCompanyId,
      currentUser: {
        id: null,
        fullName: "",
        callingName: "",
        employeeNumber: "",
        address: "",
        nic: "",
        joinedDate: "",
        shiftMasterId: "",
        employmentTypeId: "",
        designationId: "",
        username: "",
        password: "",
        companyId: sessionCompanyId,
      },
      isEditing: false,
      successModalOpen: false,
      errorModalOpen: false,
      submitAttempted: false,
      // two-step reset: confirm first, then enter new password
      confirmResetOpen: false,
      confirmResetUser: null,
      resetPasswordModalOpen: false,
      resetPasswordUserId: null,
      resetPasswordUserName: "",
      newPassword: "",
      resetPasswordError: "",
    };
  }

  handleSuccessOpen = () => {
    this.setState({ successModalOpen: true });
  };
  
  handleSuccessClose = () => {
    this.setState({ successModalOpen: false });
  };
  
  handleErrorOpen = () => {
    this.setState({ errorModalOpen: true });
  };
  
  handleErrorClose = () => {
    this.setState({ errorModalOpen: false });
  };

  componentDidMount() {
    this.fetchUsers();
    this.fetchShiftMasters();
    this.fetchEmploymentTypes();
    this.fetchDesignations();
    this.fetchCompanies();
  }

  fetchUsers = () => {
    fetchUsers()
      .then((data) => this.setState({ users: data }))
      .catch((error) => console.error("Error fetching users:", error));
  };

  fetchCompanies = () => {
    fetchCompanies()
      .then((data) => this.setState({ companies: data }))
      .catch((error) => console.error("Error fetching companies:", error));
  };

  fetchShiftMasters = () => {
    fetchShiftMasters()
      .then((data) => this.setState({ shiftMasters: data }))
      .catch((error) => console.error("Error fetching shift masters:", error));
  };

  fetchEmploymentTypes = () => {
    fetchEmploymentTypes()
      .then((data) => this.setState({ employmentTypes: data }))
      .catch((error) => console.error("Error fetching employment types:", error));
  };

  fetchDesignations = () => {
    fetchDesignations()
      .then((data) => this.setState({ designations: data }))
      .catch((error) => console.error("Error fetching designations:", error));
  };

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState((prevState) => ({
      currentUser: {
        ...prevState.currentUser,
        [name]: value,
      },
    }));
  };

  handleSubmit = (event) => {
    event.preventDefault();
    console.log("Form Submitted"); 
    this.setState({ submitAttempted: true }); // Ensure this is set every time the form is submitted
    const { isEditing, currentUser } = this.state;
    if (this.validateForm(currentUser)) { // Use the validateForm function to check the form data
      if (isEditing) {
        this.updateUser(currentUser);
      } else {
        this.createUser(currentUser);
      }
    } else {
      console.error("Validation failed");
    }
  };
  
  validateForm = (user) => {
    // Ensure that all required fields are filled
    const isValid = user.fullName && user.address && user.nic && user.joinedDate &&
    user.shiftMasterId && user.employmentTypeId && user.designationId &&
    user.username && (user.password || this.state.isEditing);
    console.log("Form validation status:", isValid);
    return isValid;
  };

  createUser = (user) => {
    createUser(user)
      .then((data) => {
        this.setState((prevState) => ({
          users: [...prevState.users, data],
          currentUser: {
            id: null, fullName: "", address: "", nic: "", joinedDate: "",
            shiftMasterId: "", employmentTypeId: "", designationId: "",
            username: "", password: "",
          },
          successModalOpen: true, // Open success modal on successful creation
        }));
      })
      .catch((error) => {
        console.error("Error creating user:", error);
        this.handleErrorOpen(); // Open error modal on error
      });
  };
  
  updateUser = (user) => {
    updateUser(user)
      .then((data) => {
        this.setState((prevState) => ({
          users: prevState.users.map(usr => usr.id === data.id ? data : usr),
          currentUser: {
            id: null, fullName: "", address: "", nic: "", joinedDate: "",
            shiftMasterId: "", employmentTypeId: "", designationId: "",
            username: "", password: "",
          },
          isEditing: false,
          successModalOpen: true, // Open success modal on successful update
        }));
      })
      .catch((error) => {
        console.error("Error updating user:", error);
        this.handleErrorOpen(); // Open error modal on error
      });
  };

  // Step 1: user clicks "Reset Password" → show confirm dialog
  requestResetPassword = (user) => {
    this.setState({ confirmResetOpen: true, confirmResetUser: user });
  };

  // Step 1 confirmed → close confirm, open password input modal
  onConfirmResetYes = () => {
    const user = this.state.confirmResetUser;
    this.setState({
      confirmResetOpen: false,
      confirmResetUser: null,
      resetPasswordModalOpen: true,
      resetPasswordUserId: user.id,
      resetPasswordUserName: user.callingName || user.fullName,
      newPassword: "",
      resetPasswordError: "",
    });
  };

  onConfirmResetNo = () => {
    this.setState({ confirmResetOpen: false, confirmResetUser: null });
  };

  openResetPassword = (user) => {
    this.setState({
      resetPasswordModalOpen: true,
      resetPasswordUserId: user.id,
      resetPasswordUserName: user.callingName || user.fullName,
      newPassword: "",
      resetPasswordError: "",
    });
  };

  closeResetPassword = () => {
    this.setState({ resetPasswordModalOpen: false, resetPasswordUserId: null, newPassword: "", resetPasswordError: "" });
  };

  handleResetPasswordSubmit = async () => {
    const { resetPasswordUserId, newPassword } = this.state;
    if (!newPassword || newPassword.length < 6) {
      this.setState({ resetPasswordError: "Password must be at least 6 characters." });
      return;
    }
    try {
      await resetUserPassword(resetPasswordUserId, newPassword);
      this.setState({ resetPasswordModalOpen: false, resetPasswordUserId: null, newPassword: "", resetPasswordError: "", successModalOpen: true });
    } catch (err) {
      this.setState({ resetPasswordError: "Failed to reset password. Please try again." });
    }
  };

  editUser = (user) => {
    const formattedDate = user.joinedDate ? new Date(user.joinedDate).toISOString().split('T')[0] : '';
    this.setState({
      currentUser: {
        ...user,
        password: '',
        joinedDate: formattedDate,
        companyId: user.companyId ?? this.state.sessionCompanyId,
      },
      isEditing: true,
    });
  };
  
  

  render() {
    return (
      <UserTemplate
        users={this.state.users}
        currentUser={this.state.currentUser}
        isEditing={this.state.isEditing}
        handleInputChange={this.handleInputChange}
        handleSubmit={this.handleSubmit}
        editUser={this.editUser}
        shiftMasters={this.state.shiftMasters}
        employmentTypes={this.state.employmentTypes}
        designations={this.state.designations}
        companies={this.state.companies}
        isSuperAdmin={this.state.isSuperAdmin}
        successModalOpen={this.state.successModalOpen}
        handleSuccessClose={this.handleSuccessClose}
        errorModalOpen={this.state.errorModalOpen}
        handleErrorClose={this.handleErrorClose}
        submitAttempted={this.state.submitAttempted}
        resetPasswordModalOpen={this.state.resetPasswordModalOpen}
        resetPasswordUserName={this.state.resetPasswordUserName}
        newPassword={this.state.newPassword}
        resetPasswordError={this.state.resetPasswordError}
        onNewPasswordChange={(val) => this.setState({ newPassword: val })}
        openResetPassword={this.openResetPassword}
        closeResetPassword={this.closeResetPassword}
        handleResetPasswordSubmit={this.handleResetPasswordSubmit}
        confirmResetOpen={this.state.confirmResetOpen}
        confirmResetUser={this.state.confirmResetUser}
        requestResetPassword={this.requestResetPassword}
        onConfirmResetYes={this.onConfirmResetYes}
        onConfirmResetNo={this.onConfirmResetNo}
      />
    );
  }
}

export default User;
