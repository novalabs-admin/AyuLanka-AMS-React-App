import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import './modalComponent.css'; // Import custom CSS file for additional styling

const ModalComponent = ({ show, onClose, type, message }) => {
    const defaultSuccessMessage = "Operation completed successfully.";
    const defaultErrorMessage = "An error occurred while processing your request.";

    const getIcon = () => {
        return type === 'success' ? <FontAwesomeIcon icon={faCheckCircle} className="modal-icon success" /> :
            <FontAwesomeIcon icon={faExclamationCircle} className="modal-icon error" />;
    };

    const getMessage = () => {
        return message ? message : (type === 'success' ? defaultSuccessMessage : defaultErrorMessage);
    };

    // OK only closes the popup. It used to reload the whole page (also for error popups, which threw
    // away whatever the user had typed); each screen now refreshes or resets itself in its onClose.
    const handleOKClick = () => {
        onClose();
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title className="modal-title">{type === 'success' ? 'Success' : 'Error'}</Modal.Title>
            </Modal.Header>
            <Modal.Body className='modal-component-body'>
                {getIcon()}
                <p className="modal-message">{getMessage()}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="success" className="modal-button" onClick={handleOKClick}>
                    OK
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalComponent;
