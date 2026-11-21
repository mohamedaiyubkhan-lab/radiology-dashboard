
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import DoctorRequest from "./pages/DoctorRequest";
import ReportEntry from "./pages/ReportEntry";
import ReportCentre from "./pages/ReportCentre";

function App() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-area">
        <Header />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/doctor-request" element={<DoctorRequest />} />
            <Route path="/report-entry" element={<ReportEntry />} />
            <Route path="/report-centre" element={<ReportCentre />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
