import React from "react";
import DataManager from "../components/DataManager";
import { CENTRE_KEY } from "../utils/storage";

const fields = [
  {
    name: "reportId",
    label: "Report ID",
    type: "text",
    readOnly: true,
  },
  {
    name: "patientName",
    label: "Patient Name",
    type: "patient-select",
    required: true,
  },
  {
    name: "patientId",
    label: "Patient ID",
    type: "text",
    readOnly: true,
  },
  {
    name: "scanName",
    label: "Scan Name",
    type: "text",
    required: true,
    readOnly: true,
  },
  {
    name: "doctorName",
    label: "Doctor Name",
    type: "text",
    required: true,
    readOnly: true,
  },
  {
    name: "radiologistName",
    label: "Radiologist",
    type: "text",
    required: true,
  },
  {
    name: "reportDate",
    label: "Report Date",
    type: "date",
    required: true,
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: ["Pending", "Under Review", "Completed", "Delivered"],
    defaultValue: "Pending",
    required: true,
  },
];

function ReportCentre() {
  return (
    <DataManager
      title="Report Centre Doctor"
      description="View patient radiology requests and manage radiology reports."
      storageKey={CENTRE_KEY}
      fields={fields}
      idPrefix="CENTRE"
    />
  );
}

export default ReportCentre;