import { useEffect, useState } from "react";
import {
  getProvinces,
  getDistricts,
  createCity,
} from "../../services/geographyApi";

// Rendered on top of CreateCustomerModal, so z-indexes sit above Bootstrap's modal (1055)
const AddCityModal = ({ initialName, onClose, onCreated }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [nameEn, setNameEn] = useState(initialName);
  const [postCode, setPostCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch(() => alert("Could not load provinces."));
  }, []);

  const handleProvinceChange = async (e) => {
    const id = e.target.value;
    setProvinceId(id);
    setDistrictId("");
    setDistricts([]);
    if (!id) return;
    try {
      setDistricts(await getDistricts(id));
    } catch {
      alert("Could not load districts.");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const created = await createCity({
        nameEn: nameEn.trim(),
        provinceId: Number(provinceId),
        districtId: Number(districtId),
        postCode: postCode.trim() || null,
      });
      const district = districts.find((d) => String(d.id) === districtId);
      onCreated({
        id: created.id,
        nameEn: nameEn.trim(),
        districtName: district?.nameEn,
        postCode: postCode.trim(),
      });
    } catch {
      alert("City creation failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1065 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title">Add New City</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              />
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">
                  Province <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={provinceId}
                  onChange={handleProvinceChange}
                >
                  <option value="">Select province</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  District <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  disabled={!provinceId}
                >
                  <option value="">Select district</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  City Name <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Enter city name"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Post Code</label>
                <input
                  className="form-control"
                  value={postCode}
                  onChange={(e) =>
                    setPostCode(e.target.value.replace(/\D/g, "").slice(0, 5))
                  }
                  inputMode="numeric"
                  placeholder="Optional, e.g. 71100"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                disabled={!nameEn.trim() || !districtId || saving}
                onClick={handleSave}
              >
                {saving ? "Saving..." : "Add City"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1060 }}
      ></div>
    </>
  );
};

export default AddCityModal;
