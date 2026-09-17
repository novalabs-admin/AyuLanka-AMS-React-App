import React from "react";
import logoImage from "../../assets/images/ayu_lanka_logo.png"; // Update the logo to a hospital logo
import "./login.css";
import ToastMessage from "../toastMessage/toastMessage.js";
function template() {
  return (
    <div className="container-wrapper-login">
      {/* Error Toast */}
      <ToastMessage
        show={this.state.showErrorToast}
        onClose={() => this.setState({ showErrorToast: false })}
        type="danger"
        message={this.state.errorMessageToast}
      />
      {/* Success Toast */}
      <ToastMessage
        show={this.state.showSuccessToast}
        onClose={() => this.setState({ showSuccessToast: false })}
        type="success"
        message={this.state.successMessageToast}
      />
      <div className="container container-main">
        <div className="row">
          <div className="col-lg-8">
            <div className="welcome-image text-center">
              <h5>Welcome to Our Hospital</h5>
              <h1>BOOK YOUR APPOINTMENT</h1>
              <p className="welcome-description">
                Our hospital appointment scheduling system allows you to easily
                book appointments with our healthcare professionals. Streamline
                your visit and ensure you get the care you need efficiently and
                conveniently.
              </p>
            </div>
          </div>
          <div className="col-lg-4" style={{backgroundColor: 'white'}}>
            <div className="login text-center">
              <img
                src={logoImage}
                alt="Hospital Logo"
                className="logo img-fluid mb-4 mt-4"
              />
              {this.state.error && (
                <div className="error-message mb-4">{this.state.error}</div>
              )}
              <form onSubmit={this.handleFormSubmit} className="w-100 mw-400">
                <div className="form-group mb-3">
                  <input
                    type="text"
                    className="form-control rounded-0"
                    id="username"
                    name="username"
                    value={this.state.username}
                    onChange={this.handleInputChange}
                    placeholder="Username"
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <input
                    type="password"
                    className="form-control rounded-0"
                    id="password"
                    name="password"
                    value={this.state.password}
                    onChange={this.handleInputChange}
                    placeholder="Password"
                    required
                  />
                </div>

                <button
                  className="btn btn-primary btn-block mt-3"
                  type="submit"
                  disabled={this.state.loading} // Disable button when loading
                >
                  {this.state.loading ? (
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    "Login"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default template;
