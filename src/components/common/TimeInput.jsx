import React from "react";

// Native <input type="time">: clock popup plus typing, any minute (not just 15-min steps).
// Takes and returns Date objects (only the time part matters) like the react-datepicker it replaces.
const toValue = (d) =>
  d
    ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    : "";

function TimeInput({ value, onChange, baseDate, allowClear = false, className = "form-control", ...rest }) {
  const handleChange = (e) => {
    if (!e.target.value) {
      // Required times (start/end) ignore a cleared field; optional "actual" times may be emptied
      if (allowClear) onChange(null);
      return;
    }
    const [h, m] = e.target.value.split(":").map(Number);
    const d = new Date(value || baseDate || new Date());
    d.setHours(h, m, 0, 0);
    onChange(d);
  };

  return <input type="time" className={className} value={toValue(value)} onChange={handleChange} {...rest} />;
}

export default TimeInput;
