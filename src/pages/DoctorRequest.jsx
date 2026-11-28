import React, { useEffect, useMemo, useState } from "react";

import {
  Search,
  ScanLine,
  Users,
  ClipboardList,
  Clock,
  CheckCircle,
  CalendarDays,
  UserRound,
} from "lucide-react";

import "./DoctorRequest.css";

const MEDICAL_RECORD_KEY = "doctorMedicalRecords";
const STATUS_KEY = "radiologyRequestStatuses";

const SCAN_OPTIONS = [
  "X-Ray",
  "Chest X-Ray",
  "CT Scan",
  "MRI",
  "Ultrasound",
  "Mammography",
  "PET Scan",
  "ECG",
  "Echocardiogram",
];

function getSavedRecords() {
  try {
    const saved = localStorage.getItem(MEDICAL_RECORD_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to load doctor medical records:", error);
    return [];
  }
}

function getSavedStatuses() {
  try {
    const saved = localStorage.getItem(STATUS_KEY);
    const parsed = saved ? JSON.parse(saved) : {};

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch (error) {
    console.error("Unable to load radiology statuses:", error);
    return {};
  }
}

function getRadiologyScans(value) {
  let scans = [];

  if (Array.isArray(value)) {
    scans = value;
  } else if (typeof value === "string" && value.trim()) {
    scans = value.split(",");
  }

  return scans
    .map((item) => {
      if (typeof item === "string") {
        return {
          scanName: item.trim(),
          priority: "Normal",
        };
      }

      if (item && typeof item === "object") {
        return {
          scanName: String(
            item.scanName ||
            item.testName ||
            item.name ||
            item.test ||
            item.scanType ||
            ""
          ).trim(),
          priority: item.priority || "Normal",
        };
      }

      return null;
    })
    .filter(
      (scan) =>
        scan &&
        scan.scanName &&
        (
          SCAN_OPTIONS.includes(scan.scanName) ||
          scan.scanName.trim() !== ""
        )
    );
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DoctorRequest() {
  const [records, setRecords] = useState(getSavedRecords);
  const [statuses, setStatuses] = useState(getSavedStatuses);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const updateData = () => {
      setRecords(getSavedRecords());
      setStatuses(getSavedStatuses());
    };

    window.addEventListener("storage", updateData);
    window.addEventListener("doctor-data-updated", updateData);
    window.addEventListener("focus", updateData);

    return () => {
      window.removeEventListener("storage", updateData);
      window.removeEventListener("doctor-data-updated", updateData);
      window.removeEventListener("focus", updateData);
    };
  }, []);

  // Save Radiology statuses separately from Laboratory statuses
  useEffect(() => {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statuses));
  }, [statuses]);

  // Read only radiologyRequests from Doctor Medical Records
  const requests = useMemo(() => {
    return records.flatMap((record, recordIndex) => {
      const scans = getRadiologyScans(record.radiologyRequests);

      return scans.map((scan, scanIndex) => {
        const requestId =
          `${record.id ?? recordIndex}-${scanIndex}-${scan.scanName}`;

        return {
          requestId,
          patientName: record.patientName || "Unknown Patient",
          patientId:
            record.patientId ||
            record.patientID ||
            "Not available",
          doctorName: record.doctorName || "Not available",
          diagnosis: record.diagnosis || "Not available",
          scanName: scan.scanName,
          priority: scan.priority,
          requestDate: record.createdAt || record.recordDate,
          status: statuses[requestId] || "Pending",
        };
      });
    });
  }, [records, statuses]);

  const filteredRequests = requests.filter((request) => {
    const query = search.toLowerCase().trim();

    const matchesSearch = [
      request.patientName,
      request.patientId,
      request.doctorName,
      request.scanName,
      request.diagnosis,
      request.priority,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);

    const matchesStatus =
      statusFilter === "All" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter(
    (request) =>
      request.status === "Pending" ||
      request.status === "In Progress"
  ).length;

  const completedCount = requests.filter(
    (request) => request.status === "Completed"
  ).length;

  const patientCount = new Set(
    requests.map((request) => request.patientName)
  ).size;

  const updateStatus = (requestId, newStatus) => {
    const allowedStatuses = [
      "Pending",
      "Approved",
      "In Progress",
      "Completed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(newStatus)) return;

    setStatuses((previous) => ({
      ...previous,
      [requestId]: newStatus,
    }));
  };

  return (
    <div className="radiology-request-page">

      {/* HEADER */}
      <div className="radiology-request-heading">
        <div>
          <h1>Radiology Doctor Requests</h1>
          <p>
            View scan requests received from the Doctor Dashboard.
          </p>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="radiology-request-stats">

        <div className="radiology-request-stat">
          <div className="radiology-stat-icon purple">
            <ClipboardList size={23} />
          </div>
          <div>
            <span>Total Requests</span>
            <h2>{requests.length}</h2>
          </div>
        </div>

        <div className="radiology-request-stat">
          <div className="radiology-stat-icon orange">
            <Clock size={23} />
          </div>
          <div>
            <span>Pending / In Progress</span>
            <h2>{pendingCount}</h2>
          </div>
        </div>

        <div className="radiology-request-stat">
          <div className="radiology-stat-icon green">
            <CheckCircle size={23} />
          </div>
          <div>
            <span>Completed</span>
            <h2>{completedCount}</h2>
          </div>
        </div>

        <div className="radiology-request-stat">
          <div className="radiology-stat-icon blue">
            <Users size={23} />
          </div>
          <div>
            <span>Patients</span>
            <h2>{patientCount}</h2>
          </div>
        </div>

      </div>

      {/* REQUEST TABLE */}
      <div className="radiology-request-card">

        <div className="radiology-request-toolbar">
          <div>
            <h2>Patient Radiology Requests</h2>
            <p>Scans requested by doctors.</p>
          </div>

          <div className="radiology-request-filters">

            <div className="radiology-request-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search patient or scan..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

          </div>
        </div>

        <div className="radiology-request-table-scroll">
          <table className="radiology-request-table">

            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Requested Scan</th>
                <th>Doctor</th>
                <th>Diagnosis</th>
                <th>Priority</th>
                <th>Request Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request.requestId}>

                    <td>
                      <div className="radiology-patient-info">
                        <div className="radiology-patient-avatar">
                          <UserRound size={19} />
                        </div>

                        <div>
                          <strong>{request.patientName}</strong>
                          <small>ID: {request.patientId}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="radiology-scan-info">
                        <ScanLine size={17} />
                        <strong>{request.scanName}</strong>
                      </div>
                    </td>

                    <td>{request.doctorName}</td>
                    <td>{request.diagnosis}</td>
                    <td>{request.priority}</td>

                    <td>
                      <span className="radiology-request-date">
                        <CalendarDays size={14} />
                        {formatDate(request.requestDate)}
                      </span>
                    </td>

                    <td>
                      <select
                        className={`radiology-status-select ${request.status
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                        value={request.status}
                        onChange={(event) =>
                          updateStatus(
                            request.requestId,
                            event.target.value
                          )
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="radiology-request-empty">
                    <ScanLine size={35} />
                    <strong>No radiology requests found</strong>
                    <p>
                      Radiology requests saved by doctors will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}

export default DoctorRequest;