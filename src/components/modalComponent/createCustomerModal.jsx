import { useState } from "react";
import AsyncSelect from "react-select/async";
import { searchCities, searchCountries } from "../../services/geographyApi";
import AddCityModal from "./addCityModal";

// Map API city -> react-select option; `value` is the cityId sent on create
const toCityOption = (c) => ({
  value: c.id,
  label: `${c.nameEn}, ${c.districtName}${c.postCode ? ` (${c.postCode})` : ""}`,
});

const loadCityOptions = async (input) => {
  if (input.trim().length < 2) return [];
  const cities = await searchCities(input.trim());
  return cities.map(toCityOption);
};

// Local customers are always saved with this country (Sri Lanka)
export const LOCAL_COUNTRY_ID = 144;
const LOCAL_COUNTRY_OPTION = { value: LOCAL_COUNTRY_ID, label: "Sri Lanka" };

// `value` is the countryId sent on create
const toCountryOption = (c) => ({ value: c.id, label: c.name });

const loadCountryOptions = async (input) => {
  if (input.trim().length < 2) return [];
  const countries = await searchCountries(input.trim());
  return countries.map(toCountryOption);
};

const CreateCustomerModal = ({
  show,
  customerName,
  setCustomerName,
  phone,
  setPhone,
  city,
  setCity,
  country,
  setCountry,
  isForeigner,
  setIsForeigner,
  remark,
  setRemark,
  loading,
  onClose,
  onCreate,
}) => {
  // null = closed; otherwise the text typed in the city search
  const [newCityName, setNewCityName] = useState(null);

  if (!show) return null;

  const isPhoneValid = isValidContactNo(phone);

  // Only the active type's location is kept, so the other id is never sent
  const changeCustomerType = (foreigner) => {
    setIsForeigner(foreigner);
    setCity(null);
    setCountry(null);
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title">Create New Customer</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              />
            </div>

            <div className="modal-body">
              {/* Customer Name */}
              <div className="mb-3">
                <label className="form-label">
                  Customer Name <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              {/* Contact Number */}
              <div className="mb-3">
                <label className="form-label">
                  Contact Number <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${
                    phone && !isPhoneValid ? "is-invalid" : ""
                  }`}
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  } // digits only, max 10
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="e.g. 0784327095"
                />

                {phone && !isPhoneValid && (
                  <div className="invalid-feedback">
                    Contact number must be exactly 10 digits and start with 0
                  </div>
                )}
              </div>

              {/* Customer Type */}
              <div className="mb-3">
                <label className="form-label">Customer Type</label>
                <div
                  className="btn-group w-100"
                  role="radiogroup"
                  aria-label="Customer type"
                >
                  {[
                    ["Local", false],
                    ["Foreigner", true],
                  ].map(([label, value]) => (
                    <button
                      key={label}
                      type="button"
                      role="radio"
                      aria-checked={isForeigner === value}
                      className={`btn ${
                        isForeigner === value
                          ? "btn-success"
                          : "btn-outline-success"
                      }`}
                      onClick={() => changeCustomerType(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* City */}
              <div className="mb-3">
                <label className="form-label">
                  Nearest City{" "}
                  {!isForeigner && <span className="text-danger">*</span>}
                </label>
                <AsyncSelect
                  value={city}
                  onChange={setCity}
                  loadOptions={loadCityOptions}
                  isDisabled={isForeigner}
                  isClearable
                  placeholder="Type to search city"
                  noOptionsMessage={({ inputValue }) =>
                    inputValue.trim().length < 2 ? (
                      "Type at least 2 characters"
                    ) : (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={() => setNewCityName(inputValue.trim())}
                      >
                        No cities found. Add "{inputValue.trim()}" as a new city
                      </button>
                    )
                  }
                />
              </div>

              {/* Country */}
              <div className="mb-3">
                <label className="form-label">
                  Country{" "}
                  {isForeigner && <span className="text-danger">*</span>}
                </label>
                <AsyncSelect
                  value={isForeigner ? country : LOCAL_COUNTRY_OPTION}
                  onChange={setCountry}
                  loadOptions={loadCountryOptions}
                  isDisabled={!isForeigner}
                  isClearable={isForeigner}
                  placeholder="Type to search country"
                  noOptionsMessage={({ inputValue }) =>
                    inputValue.trim().length < 2
                      ? "Type at least 2 characters"
                      : "No countries found"
                  }
                />
              </div>

              {/* Remark */}
              <div className="mb-3">
                <label className="form-label">Remark</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Optional remark"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                className="btn btn-success"
                disabled={
                  !customerName.trim() ||
                  !isPhoneValid ||
                  !(isForeigner ? country : city) ||
                  loading
                }
                onClick={onCreate}
              >
                {loading ? "Creating..." : "Create Customer"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop fade show"></div>

      {newCityName !== null && (
        <AddCityModal
          initialName={newCityName}
          onClose={() => setNewCityName(null)}
          onCreated={(created) => {
            setCity(toCityOption(created));
            setNewCityName(null);
          }}
        />
      )}
    </>
  );
};

// helper: exactly 10 digits, leading 0
const isValidContactNo = (value) => /^0\d{9}$/.test(value);

export default CreateCustomerModal;
