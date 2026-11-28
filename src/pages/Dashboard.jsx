
import React, { useEffect, useState, useCallback } from "react";
import "./Dashboard.css";

import {
  ClipboardList,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Scan,
  CreditCard,
  Wallet,
  Search,
  X,
} from "lucide-react";

import {
  getData,
  ENTRY_KEY,
  CENTRE_KEY,
  BILLING_KEY,
} from "../utils/storage";

const PAYMENT_KEY = "hospitalPaymentData";

const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const normalizeText = (value) =>
  normalize(value).replace(/[^a-z0-9]/g, "");

const getPatientId = (item) =>
  String(
    item?.patientId ||
    item?.patientID ||
    item?.uhid ||
    item?.patient?.patientId ||
    item?.patient?.patientID ||
    item?.patient?.uhid ||
    item?.patient?.id ||
    ""
  ).trim();

const getPatientName = (item) =>
  String(
    item?.patientName ||
    item?.patient?.name ||
    item?.patient?.fullName ||
    item?.name ||
    ""
  ).trim();

const getBillId = (bill) =>
  String(
    bill?.id ||
    bill?._id ||
    bill?.billId ||
    bill?.invoiceId ||
    ""
  ).trim();

const getBillNumber = (bill) =>
  String(
    bill?.billNumber ||
    bill?.invoiceNumber ||
    bill?.invoiceNo ||
    ""
  ).trim();

const getAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
};

const getBillAmount = (bill) =>
  getAmount(bill.amount ?? bill.totalAmount ?? bill.grandTotal);

const getStoredPaidAmount = (bill) =>
  getAmount(bill.paidAmount ?? bill.paid);

const getPaymentAmount = (payment) =>
  getAmount(
    payment.amount ??
    payment.paymentAmount ??
    payment.paidAmount ??
    payment.receivedAmount ??
    payment.transactionAmount
  );

const isRadiologyBill = (bill) =>
  normalize(bill.department).includes("radiology");

const getPaymentReference = (payment) => ({
  billId: String(
    payment.billId ||
    payment.invoiceId ||
    payment.bill?.id ||
    payment.invoice?.id ||
    payment.referenceId ||
    ""
  ).trim(),

  billNumber: String(
    payment.billNumber ||
    payment.invoiceNumber ||
    payment.invoiceNo ||
    payment.bill?.billNumber ||
    payment.invoice?.billNumber ||
    ""
  ).trim(),
});

function Dashboard() {
  const [counts, setCounts] = useState({
    requests: 0,
    entries: 0,
    reports: 0,
    pending: 0,
    paid: 0,
    unpaid: 0,
  });

  const [paymentRows, setPaymentRows] = useState([]);
  const [patientIdSearch, setPatientIdSearch] = useState("");

  const updateDashboard = useCallback(() => {
    // Read dashboard data
    const medicalRecords = safeArray(
      getData("doctorMedicalRecords")
    );

    const entries = safeArray(getData(ENTRY_KEY));
    const reports = safeArray(getData(CENTRE_KEY));

    // Read central invoices and separately saved payments
    const bills = safeArray(getData(BILLING_KEY));
    const payments = safeArray(getData(PAYMENT_KEY));

    // -----------------------------------------
    // 1. GET DOCTOR RADIOLOGY REQUESTS
    // -----------------------------------------

    const requests = [];

    medicalRecords.forEach((record, recordIndex) => {
      let scans = record?.radiologyRequests || [];

      if (typeof scans === "string") {
        scans = scans.trim()
          ? scans.split(",").map((item) => item.trim())
          : [];
      }

      if (!Array.isArray(scans)) return;

      scans.forEach((scan, scanIndex) => {
        const scanName =
          typeof scan === "string"
            ? scan.trim()
            : (
              scan?.scanName ||
              scan?.testName ||
              scan?.name ||
              scan?.test ||
              scan?.scanType ||
              ""
            ).trim();

        if (!scanName) return;

        const requestId =
          `${record.id ?? recordIndex}-${scanIndex}-${scanName}`;

        requests.push({
          requestId,
          patientName: getPatientName(record) || "Unknown Patient",
          patientId: getPatientId(record),
          scanName,
          status:
            typeof scan === "object"
              ? scan?.status || "Pending"
              : "Pending",
        });
      });
    });

    // -----------------------------------------
    // 2. REQUEST STATUS
    // -----------------------------------------

    let savedStatuses = {};

    try {
      savedStatuses = JSON.parse(
        localStorage.getItem("radiologyRequestStatuses") || "{}"
      );
    } catch {
      savedStatuses = {};
    }

    const pending = requests.filter((request) => {
      const status =
        savedStatuses[request.requestId] || request.status;

      return ["pending", "in progress"].includes(
        normalize(status)
      );
    }).length;

    // -----------------------------------------
    // 3. GET RADIOLOGY INVOICES
    // -----------------------------------------

    const radiologyBills = bills.filter(isRadiologyBill);

    // -----------------------------------------
    // 4. MATCH SEPARATELY SAVED PAYMENTS
    // -----------------------------------------

    const getPaymentsForBill = (bill) => {
      const billId = getBillId(bill);
      const billNumber = getBillNumber(bill);

      if (!billId && !billNumber) return [];

      return payments.filter((payment) => {
        const reference = getPaymentReference(payment);

        const sameBillId =
          billId &&
          reference.billId &&
          billId === reference.billId;

        const sameBillNumber =
          billNumber &&
          reference.billNumber &&
          normalize(billNumber) === normalize(reference.billNumber);

        return Boolean(sameBillId || sameBillNumber);
      });
    };

    // -----------------------------------------
    // 5. MATCH REQUESTS WITH INVOICES
    // -----------------------------------------

    const rows = requests.map((request) => {
      const matchingBills = radiologyBills.filter((bill) => {
        const requestPatientId = normalize(getPatientId(request));
        const billPatientId = normalize(getPatientId(bill));

        const samePatient =
          requestPatientId && billPatientId
            ? requestPatientId === billPatientId
            : (
              normalize(getPatientName(request)) !== "" &&
              normalize(getPatientName(request)) ===
              normalize(getPatientName(bill))
            );

        if (!samePatient) return false;

        const scanName = normalizeText(request.scanName);
        const serviceName = normalizeText(
          bill.serviceName || bill.testName || bill.scanName
        );

        // If no service is saved on the invoice,
        // use the patient match.
        if (!serviceName) return true;

        return (
          scanName === serviceName ||
          serviceName.includes(scanName) ||
          scanName.includes(serviceName)
        );
      });

      // -----------------------------------------
      // 6. CALCULATE AMOUNTS FOR MATCHED INVOICES
      // -----------------------------------------

      let totalAmount = 0;
      let paidAmount = 0;

      matchingBills.forEach((bill) => {
        const billAmount = getBillAmount(bill);
        const linkedPayments = getPaymentsForBill(bill);

        totalAmount += billAmount;

        if (linkedPayments.length > 0) {
          // Separate payment records are available.
          // Use them instead of adding them to paidAmount,
          // which may already contain the same payments.
          const billPaid = linkedPayments.reduce(
            (sum, payment) => {
              const status = normalize(
                payment.paymentStatus || payment.status
              );

              if (
                ["failed", "cancelled", "canceled", "rejected", "refunded", "void"].includes(status)
              ) {
                return sum;
              }

              return sum + getPaymentAmount(payment);
            },
            0
          );

          paidAmount += billPaid;
        } else {
          // Fall back to the paid amount stored on the invoice.
          paidAmount += getStoredPaidAmount(bill);
        }
      });

      // Do not count more payment than the bill amount.
      paidAmount = Math.min(paidAmount, totalAmount);

      const isPaid =
        matchingBills.length > 0 &&
        totalAmount > 0 &&
        paidAmount >= totalAmount;

      const balanceAmount = Math.max(
        0,
        totalAmount - paidAmount
      );

      return {
        ...request,
        totalAmount,
        paidAmount,
        balanceAmount,
        paymentStatus: isPaid ? "Paid" : "Unpaid",
      };
    });

    // -----------------------------------------
    // 7. UPDATE DASHBOARD CARDS
    // -----------------------------------------

    const paid = rows.filter(
      (row) => row.paymentStatus === "Paid"
    ).length;

    const unpaid = rows.filter(
      (row) => row.paymentStatus === "Unpaid"
    ).length;

    setPaymentRows(rows);

    setCounts({
      requests: requests.length,
      entries: entries.length,
      reports: reports.length,
      pending,
      paid,
      unpaid,
    });
  }, []);

  // -----------------------------------------
  // 8. AUTOMATIC REFRESH
  // -----------------------------------------

  useEffect(() => {
    updateDashboard();

    const handleStorage = (event) => {
      const relevantKeys = [
        BILLING_KEY,
        PAYMENT_KEY,
        "doctorMedicalRecords",
        ENTRY_KEY,
        CENTRE_KEY,
        "radiologyRequestStatuses",
      ];

      if (!event.key || relevantKeys.includes(event.key)) {
        updateDashboard();
      }
    };

    const handleUpdate = () => updateDashboard();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("doctor-data-updated", handleUpdate);
    window.addEventListener("radiology-data-updated", handleUpdate);
    window.addEventListener("hospital-data-updated", handleUpdate);
    window.addEventListener("billing-data-updated", handleUpdate);
    window.addEventListener("focus", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("doctor-data-updated", handleUpdate);
      window.removeEventListener("radiology-data-updated", handleUpdate);
      window.removeEventListener("hospital-data-updated", handleUpdate);
      window.removeEventListener("billing-data-updated", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [updateDashboard]);

  // -----------------------------------------
  // 9. PATIENT ID SEARCH
  // -----------------------------------------

  const filteredPaymentRows = paymentRows.filter((row) =>
    normalize(row.patientId).includes(
      normalize(patientIdSearch)
    )
  );

  // -----------------------------------------
  // 10. DASHBOARD CARDS
  // -----------------------------------------

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
    {
      label: "Paid Requests",
      value: counts.paid,
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "Unpaid Requests",
      value: counts.unpaid,
      icon: Wallet,
      color: "orange",
    },
  ];

  // -----------------------------------------
  // 11. DASHBOARD UI
  // -----------------------------------------

  return (
    <div className="dashboard-page">

      <div className="welcome-banner">
        <div>
          <span>RADIOLOGY MANAGEMENT</span>
          <h1>Welcome to RadiologyCare</h1>
          <p>
            Manage scan requests, radiology findings and doctor reports in one place.
          </p>
        </div>

        <div className="banner-icon">
          <Scan size={65} />
        </div>
      </div>

      <div className="dashboard-section-title">
        <div>
          <h2>Dashboard Overview</h2>
          <p>Current radiology activity and payment summary</p>
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

      {/* RADIOLOGY PAYMENT STATUS */}

      <div className="info-panel radiology-payment-panel">

        <div className="panel-heading">
          <div>
            <h3>Radiology Payment Status</h3>
            <p>Search patients and view their radiology payment details</p>
          </div>

          <CreditCard size={24} />
        </div>

        {/* PATIENT ID SEARCH */}

        <div className="radiology-search-row">
          <div className="radiology-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Enter Patient ID to search..."
              value={patientIdSearch}
              onChange={(e) =>
                setPatientIdSearch(e.target.value)
              }
            />

            {patientIdSearch && (
              <button
                type="button"
                className="radiology-search-clear"
                onClick={() => setPatientIdSearch("")}
                title="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <span className="radiology-search-count">
            {filteredPaymentRows.length} result(s)
          </span>
        </div>

        {/* PAYMENT TABLE */}

        <div className="radiology-payment-table-wrapper">
          <table className="radiology-payment-table">

            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Patient ID</th>
                <th>Scan / Test</th>
                <th>Bill Amount</th>
                <th>Paid Amount</th>
                <th>Balance</th>
                <th>Payment Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredPaymentRows.length > 0 ? (
                filteredPaymentRows.map((row) => (
                  <tr key={row.requestId}>
                    <td>{row.patientName}</td>

                    <td>
                      <strong>{row.patientId || "—"}</strong>
                    </td>

                    <td>{row.scanName}</td>

                    <td>
                      ₹{row.totalAmount.toLocaleString("en-IN")}
                    </td>

                    <td>
                      ₹{row.paidAmount.toLocaleString("en-IN")}
                    </td>

                    <td>
                      ₹{row.balanceAmount.toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span
                        className={`radiology-payment-status ${row.paymentStatus === "Paid"
                            ? "paid"
                            : "unpaid"
                          }`}
                      >
                        {row.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-payment-row">
                    {patientIdSearch.trim()
                      ? "No patient found with this Patient ID."
                      : "No radiology requests available."}
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* DASHBOARD INFORMATION */}

      <div className="dashboard-info-grid">

        <div className="info-panel">
          <div className="panel-heading">
            <h3>Radiology Workflow</h3>
            <span>Overview</span>
          </div>

          <div className="workflow-item">
            <div className="workflow-icon purple">
              <ClipboardList size={19} />
            </div>

            <div>
              <strong>Doctor Request</strong>
              <p>Register and track scan requests</p>
            </div>

            <CheckCircle size={19} className="workflow-check" />
          </div>

          <div className="workflow-item">
            <div className="workflow-icon blue">
              <FileText size={19} />
            </div>

            <div>
              <strong>Report Entry</strong>
              <p>Record scan findings and details</p>
            </div>

            <CheckCircle size={19} className="workflow-check" />
          </div>

          <div className="workflow-item">
            <div className="workflow-icon green">
              <Users size={19} />
            </div>

            <div>
              <strong>Report Centre</strong>
              <p>Manage reports for doctors</p>
            </div>

            <CheckCircle size={19} className="workflow-check" />
          </div>
        </div>

        <div className="info-panel quick-panel">
          <div className="panel-heading">
            <h3>System Summary</h3>
          </div>

          <div className="summary-line">
            <span>Total scan requests</span>
            <strong>{counts.requests}</strong>
          </div>

          <div className="summary-line">
            <span>Reports entered</span>
            <strong>{counts.entries}</strong>
          </div>

          <div className="summary-line">
            <span>Reports available</span>
            <strong>{counts.reports}</strong>
          </div>

          <div className="summary-line">
            <span>Pending requests</span>
            <strong>{counts.pending}</strong>
          </div>

          <div className="summary-line">
            <span>Paid requests</span>
            <strong>{counts.paid}</strong>
          </div>

          <div className="summary-line">
            <span>Unpaid requests</span>
            <strong>{counts.unpaid}</strong>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
