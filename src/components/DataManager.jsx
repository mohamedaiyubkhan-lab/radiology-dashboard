
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ClipboardList
} from "lucide-react";

import { getData, saveData, REQUEST_KEY } from "../utils/storage";

function getAllRadiologyDoctorRequests() {
  const manualRequests = getData(REQUEST_KEY);
  const medicalRecords = getData("doctorMedicalRecords");

  const incomingRequests = medicalRecords.flatMap((record, recordIndex) => {
    let scans = record.radiologyRequests || [];

    if (typeof scans === "string") {
      scans = scans.trim() ? scans.split(",") : [];
    }

    if (!Array.isArray(scans)) return [];

    return scans.map((scan, scanIndex) => {
      const scanName =
        typeof scan === "string"
          ? scan.trim()
          : scan?.scanName ||
          scan?.testName ||
          scan?.name ||
          scan?.test ||
          scan?.scanType ||
          "";

      return {
        id: `DOC-RAD-${record.id ?? recordIndex}-${scanIndex}`,
        requestId: `DOC-RAD-${record.id ?? recordIndex}-${scanIndex}`,
        patientId: record.patientId || record.patientID || "",
        patientName: record.patientName || "",
        age: record.age || "",
        gender: record.gender || "",
        doctorName: record.doctorName || "",
        scanType: scan?.scanType || "",
        scanName,
        department: "Radiology",
        status:
          typeof scan === "object"
            ? scan?.resultStatus || scan?.status || "Pending"
            : "Pending",

        resultStatus:
          typeof scan === "object"
            ? scan?.resultStatus || "Pending"
            : "Pending",
      };
    }).filter((request) => request.scanName);
  });

  return [...incomingRequests, ...manualRequests];
}

const PATIENT_KEY = "hospitalPatients";

const getPatientId = (patient) =>
  String(
    patient?.patientId ??
    patient?.patient_id ??
    patient?.id ??
    ""
  ).trim();

const getPatientName = (patient) =>
  String(
    patient?.name ??
    patient?.patientName ??
    patient?.patient_name ??
    ""
  ).trim();

const getAge = (patient) =>
  patient?.age ?? patient?.patientAge ?? patient?.patient_age ?? "";

const getGender = (patient) =>
  patient?.gender ?? patient?.sex ?? "";

const getRequestId = (request) =>
  String(request?.requestId ?? request?.id ?? "");

const getRequestPatientId = (request) =>
  String(request?.patientId ?? request?.patient_id ?? "").trim();

const getDoctorName = (request) =>
  request?.doctorName ??
  request?.doctor ??
  request?.physicianName ??
  "";

function updateDoctorRadiologyResult(report) {
  try {
    const saved = localStorage.getItem("doctorMedicalRecords");
    const medicalRecords = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(medicalRecords)) return;

    const updatedRecords = medicalRecords.map((record, recordIndex) => {
      let scans = record.radiologyRequests || [];

      if (typeof scans === "string") {
        scans = scans.trim()
          ? scans.split(",").map((item) => item.trim())
          : [];
      }

      if (!Array.isArray(scans)) return record;

      const updatedScans = scans.map((scan, scanIndex) => {
        const requestId =
          `DOC-RAD-${record.id ?? recordIndex}-${scanIndex}`;

        if (requestId !== report.requestId) return scan;

        const scanData =
          typeof scan === "string"
            ? { scanName: scan.trim() }
            : { ...scan };

        return {
          ...scanData,
          status: report.status,
          resultStatus: report.status,
          reportStatus: report.status,
          reportId: report.reportId,
          reportDate: report.reportDate,
          radiologistName: report.radiologistName,
          resultUpdatedAt: new Date().toISOString(),
        };
      });

      return {
        ...record,
        radiologyRequests: updatedScans,
      };
    });

    localStorage.setItem(
      "doctorMedicalRecords",
      JSON.stringify(updatedRecords)
    );

    window.dispatchEvent(new Event("doctor-data-updated"));
  } catch (error) {
    console.error("Unable to update Doctor Radiology Result:", error);
  }
}

export default function DataManager({
  title,
  description,
  storageKey,
  fields = [],
  idPrefix = "REC"
}) {
  const [records, setRecords] = useState(() => getData(storageKey));
  const [patients, setPatients] = useState(() => getData(PATIENT_KEY));
  const [doctorRequests, setDoctorRequests] = useState(
    getAllRadiologyDoctorRequests
  );

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");

  const refreshData = () => {
    setRecords(getData(storageKey));
    setPatients(getData(PATIENT_KEY));
    setDoctorRequests(getAllRadiologyDoctorRequests());
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => refreshData();

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("radiology-data-updated", handleUpdate);
    window.addEventListener("doctor-data-updated", handleUpdate);
    window.addEventListener("patient-data-updated", handleUpdate);
    window.addEventListener("focus", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("radiology-data-updated", handleUpdate);
      window.removeEventListener("doctor-data-updated", handleUpdate);
      window.removeEventListener("patient-data-updated", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [storageKey]);

  const patientRequests = useMemo(() => {
    return doctorRequests.filter((request) => {
      return (
        request &&
        (request.patientName || request.patient_name)
      );
    });
  }, [doctorRequests]);
  const patientOptions = useMemo(() => {
    const result = [];

    patientRequests.forEach((request) => {
      const requestPatientId = getRequestPatientId(request);

      const registeredPatient = patients.find(
        (patient) => getPatientId(patient) === requestPatientId
      );

      const patientName =
        getRequestPatientId(request) && registeredPatient
          ? getPatientName(registeredPatient)
          : request.patientName || request.patient_name || "";

      const option = {
        requestId: getRequestId(request),
        patientId: requestPatientId,
        patientName,
        age:
          registeredPatient
            ? getAge(registeredPatient)
            : request.age ?? "",
        gender:
          registeredPatient
            ? getGender(registeredPatient)
            : request.gender || "",
        doctorName: getDoctorName(request),
        scanType: request.scanType || "",
        scanName: request.scanName || "",
        department: "Radiology"
      };

      const exists = result.some(
        (item) =>
          item.patientId === option.patientId &&
          item.requestId === option.requestId
      );

      if (!exists && option.patientName) {
        result.push(option);
      }
    });

    return result;
  }, [patientRequests, patients]);

  const openAdd = () => {
    const initialForm = {};

    fields.forEach((field) => {
      initialForm[field.name] = field.defaultValue ?? "";
    });

    if (fields.some((field) => field.name === "reportId")) {
      initialForm.reportId = `${idPrefix}-${Date.now()}`;
    }

    if (fields.some((field) => field.name === "entryId")) {
      initialForm.entryId = `${idPrefix}-${Date.now()}`;
    }

    setForm(initialForm);
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  const openEdit = (record) => {
    setForm({ ...record });
    setEditingId(record.id);
    setError("");
    setShowModal(true);
  };

  const handlePatientSelect = (event) => {
    const requestId = event.target.value;

    const selected = patientOptions.find(
      (item) => item.requestId === requestId
    );

    if (!selected) {
      setForm((previous) => ({
        ...previous,
        requestId: "",
        patientName: "",
        patientId: "",
        age: "",
        gender: "",
        doctorName: "",
        scanType: "",
        scanName: "",
        department: "Radiology"
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      requestId: selected.requestId,
      patientName: selected.patientName,
      patientId: selected.patientId,
      age: selected.age,
      gender: selected.gender,
      doctorName: selected.doctorName,
      scanType: selected.scanType,
      scanName: selected.scanName,
      department: "Radiology"
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    for (const field of fields) {
      if (
        field.required &&
        !String(form[field.name] ?? "").trim()
      ) {
        setError(`Please enter ${field.label}.`);
        return;
      }
    }

    if (
      fields.some((field) => field.type === "patient-select") &&
      !form.requestId
    ) {
      setError("Please select a patient.");
      return;
    }

    const now = new Date().toISOString();

    const record = {
      ...form,
      id: editingId || `${idPrefix}-${Date.now()}`,
      requestId: form.requestId || "",
      updatedAt: now
    };

    let updated;

    if (editingId) {
      updated = records.map((item) =>
        item.id === editingId ? record : item
      );
    } else {
      updated = [
        { ...record, createdAt: now },
        ...records
      ];
    }

    const saved = saveData(storageKey, updated);

    if (saved !== false) {
      // Update the matching Radiology request in Doctor Medical Records
      if (
        storageKey === "radiologyReportCentre" &&
        record.requestId
      ) {
        updateDoctorRadiologyResult(record);
      }

      setRecords(updated);
      setShowModal(false);
      setForm({});
      setEditingId(null);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    const updated = records.filter((item) => item.id !== id);
    const saved = saveData(storageKey, updated);

    if (saved !== false) {
      setRecords(updated);
    }
  };

  const filteredRecords = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return records;

    return records.filter((record) =>
      [
        record.patientName,
        record.patientId,
        record.doctorName,
        record.scanName,
        record.reportId,
        record.radiologistName
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [records, search]);

  const getPatientRequestValue = (record) => {
    const match = patientOptions.find(
      (item) => item.requestId === record.requestId
    );

    return match?.requestId || "";
  };

  return (
    <div className="data-manager">
      <div className="data-manager-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <button className="primary-btn" onClick={openAdd}>
          <Plus size={18} />
          Add New
        </button>
      </div>

      <div className="data-manager-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="data-manager-table-wrapper">
        <table className="data-manager-table">
          <thead>
            <tr>
              {fields.map((field) => (
                <th key={field.name}>{field.label}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={fields.length + 1} className="empty-state">
                  <ClipboardList size={30} />
                  <p>No records found.</p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id}>
                  {fields.map((field) => (
                    <td key={field.name}>
                      {field.name === "finding"
                        ? String(record[field.name] ?? "").slice(0, 50)
                        : record[field.name] ?? "-"}
                    </td>
                  ))}

                  <td>
                    <div className="action-buttons">
                      <button
                        type="button"
                        onClick={() => openEdit(record)}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="data-manager-modal">
            <div className="modal-header">
              <h3>{editingId ? "Edit Record" : "Add New Record"}</h3>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {fields.map((field) => (
                  <div className="form-group" key={field.name}>
                    <label>
                      {field.label}
                      {field.required ? " *" : ""}
                    </label>

                    {field.type === "patient-select" ? (
                      <select
                        name={field.name}
                        value={getPatientRequestValue(form)}
                        onChange={handlePatientSelect}
                        required={field.required}
                      >
                        <option value="">Select Patient Name</option>

                        {patientOptions.map((patient) => (
                          <option
                            key={patient.requestId}
                            value={patient.requestId}
                          >
                            {patient.patientName} - {patient.patientId}
                            {patient.scanName ? ` - ${patient.scanName}` : ""}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "select" ? (
                      <select
                        name={field.name}
                        value={form[field.name] ?? field.defaultValue ?? ""}
                        onChange={handleChange}
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>

                        {(field.options || []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        name={field.name}
                        value={form[field.name] ?? ""}
                        onChange={handleChange}
                        required={field.required}
                        placeholder={`Enter ${field.label}`}
                        rows={4}
                      />
                    ) : (
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        value={form[field.name] ?? ""}
                        onChange={handleChange}
                        required={field.required}
                        readOnly={field.readOnly}
                        placeholder={`Enter ${field.label}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <p className="form-error">{error}</p>
              )}

              {patientOptions.length === 0 && (
                <p className="form-error">
                  No Radiology patient requests found. Create a Doctor
                  Radiology Request first.
                </p>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn">
                  {editingId ? "Update Report" : "Save Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
