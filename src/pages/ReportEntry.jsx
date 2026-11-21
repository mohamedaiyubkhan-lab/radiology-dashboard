
import React from "react";
import DataManager from "../components/DataManager";
import { ENTRY_KEY } from "../utils/storage";

const fields = [
  { name: "patientId", label: "Patient ID", required: true },
  
  { name: "patientName", label: "Patient Name", required: true },
  { name: "age", label: "Age", type: "number" },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    required: true,
    options: ["Male", "Female", "Other"],
  },
  {
    name: "scanType",
    label: "Scan Type",
    type: "select",
    required: true,
    options: ["X-Ray", "CT Scan", "MRI", "Ultrasound", "Mammography", "PET Scan"],
  },
  { name: "scanName", label: "Scan Name", required: true },
  { name: "doctorName", label: "Doctor Name", required: true },
  { name: "department", label: "Department", required: true },
  { name: "scanDate", label: "Scan Date", type: "date", required: true },
  {
    name: "finding",
    label: "Radiology Finding",
    type: "textarea",
    required: true,
  },
  { name: "radiologistName", label: "Radiologist Name", required: true },
];

export default function ReportEntry() {
  return (
    <DataManager
      title="Report Entry"
      description="Enter patient scan details and radiology findings."
      storageKey={ENTRY_KEY}
      fields={fields}
      idPrefix="ENTRY"
    />
  );
}
