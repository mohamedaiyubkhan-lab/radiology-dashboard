
import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Scan,
} from "lucide-react";
import {
  getData,
  REQUEST_KEY,
  ENTRY_KEY,
  CENTRE_KEY,
} from "../utils/storage";

function Dashboard() {
  const [counts, setCounts] = useState({
    requests: 0,
    entries: 0,
    reports: 0,
    pending: 0,
  });

  useEffect(() => {
    const updateDashboard = () => {
      const requests = getData(REQUEST_KEY);
      const entries = getData(ENTRY_KEY);
      const reports = getData(CENTRE_KEY);

      setCounts({
        requests: requests.length,
        entries: entries.length,
        reports: reports.length,
        pending: requests.filter((item) =>
          ["Pending", "In Progress"].includes(item.status)
        ).length,
      });
    };

    updateDashboard();
    window.addEventListener("radiology-data-updated", updateDashboard);
    window.addEventListener("focus", updateDashboard);

    return () => {
      window.removeEventListener("radiology-data-updated", updateDashboard);
      window.removeEventListener("focus", updateDashboard);
    };
  }, []);

  const cards = [
    {
      label: "Doctor Requests",
      value: counts.requests,
      icon: ClipboardList,
      color: "purple",
    },
    {
      label: "Report Entries",
      value: counts.entries,
      icon: FileText,
      color: "blue",
    },
    {
      label: "Reports in Centre",
      value: counts.reports,
      icon: Users,
      color: "green",
    },
    {
      label: "Pending Requests",
      value: counts.pending,
      icon: Clock,
      color: "orange",
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="welcome-banner">
        <div>
          <span>RADIOLOGY MANAGEMENT</span>
          <h1>Welcome to RadiologyCare</h1>
          <p>Manage scan requests, radiology findings and doctor reports in one place.</p>
        </div>
        <div className="banner-icon"><Scan size={65} /></div>
      </div>

      <div className="dashboard-section-title">
        <div>
          <h2>Dashboard Overview</h2>
          <p>Current radiology activity summary</p>
        </div>
      </div>

      <div className="dashboard-cards">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div className="dashboard-card" key={label}>
            <div className={`dashboard-card-icon ${color}`}>
              <Icon size={23} />
            </div>
            <div>
              <p>{label}</p>
              <h2>{value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-info-grid">
        <div className="info-panel">
          <div className="panel-heading">
            <h3>Radiology Workflow</h3>
            <span>Overview</span>
          </div>

          <div className="workflow-item">
            <div className="workflow-icon purple"><ClipboardList size={19} /></div>
            <div><strong>Doctor Request</strong><p>Register and track scan requests</p></div>
            <CheckCircle size={19} className="workflow-check" />
          </div>

          <div className="workflow-item">
            <div className="workflow-icon blue"><FileText size={19} /></div>
            <div><strong>Report Entry</strong><p>Record scan findings and details</p></div>
            <CheckCircle size={19} className="workflow-check" />
          </div>

          <div className="workflow-item">
            <div className="workflow-icon green"><Users size={19} /></div>
            <div><strong>Report Centre</strong><p>Manage reports for doctors</p></div>
            <CheckCircle size={19} className="workflow-check" />
          </div>
        </div>

        <div className="info-panel quick-panel">
          <div className="panel-heading">
            <h3>System Summary</h3>
          </div>
          <div className="summary-line">
            <span>Total scan requests</span><strong>{counts.requests}</strong>
          </div>
          <div className="summary-line">
            <span>Reports entered</span><strong>{counts.entries}</strong>
          </div>
          <div className="summary-line">
            <span>Reports available</span><strong>{counts.reports}</strong>
          </div>
          <div className="summary-line">
            <span>Pending requests</span><strong>{counts.pending}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
