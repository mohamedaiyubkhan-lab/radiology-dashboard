
import React from "react";
import DataManager from "../components/DataManager";
import { REQUEST_KEY } from "../utils/storage";

const fields = [
  { name: "reportId", label: "Report ID", required: true, readOnly: true },
  { name: "patientId", label: "Patient ID", required: true },
  { name: "patientName", label: "Patient Name", required: true },
  {
    name: "scanType",
    label: "Scan Type",
    type: "select",
    required: true,
    options: ["X-Ray", "CT Scan", "MRI", "Ultrasound", "Mammography", "PET Scan"],
  },
  { name: "scanName", label: "Scan Name", required: true },
  { name: "doctorName", label: "Doctor Name", required: true },
  { name: "date", label: "Date", type: "date", required: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    defaultValue: "Pending",
    options: ["Pending", "Approved", "In Progress", "Completed", "Cancelled"],
  },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    required: true,
    defaultValue: "Normal",
    options: ["Low", "Normal", "High", "Emergency"],
  },
];

export default function DoctorRequest() {
  return (
    <DataManager
      title="Doctor Request"
      description="Manage doctor scan requests and patient investigations."
      storageKey={REQUEST_KEY}
      fields={fields}
      idPrefix="RAD"
    />
  );
}
