
import React from "react";
import DataManager from "../components/DataManager";
import { ENTRY_KEY } from "../utils/storage";

const fields = [
  {
    name: "patientName",
    label: "Patient Name",
    type: "patient-select",
    required: true
  },
  { name: "patientId", label: "Patient ID", readOnly: true },
  { name: "age", label: "Age", readOnly: true },
  { name: "gender", label: "Gender", readOnly: true },
  { name: "doctorName", label: "Doctor Name", readOnly: true },

  { name: "scanName", label: "Scan Name", readOnly: true },
  {
    name: "department",
    label: "Department",
    defaultValue: "Radiology",
    readOnly: true
  },
  {
    name: "scanDate",
    label: "Scan Date",
    type: "date",
    required: true
  },
  {
    name: "finding",
    label: "Radiology Finding",
    type: "textarea",
    required: true
  },
  {
    name: "radiologistName",
    label: "Radiologist Name",
    required: true
  }
];

export default function ReportEntry() {
  return (
    <DataManager
      title="Report Entry"
      description="Select a patient name to automatically load patient details and scan requests."
      storageKey={ENTRY_KEY}
      fields={fields}
      idPrefix="ENTRY"
    />
  );
}
