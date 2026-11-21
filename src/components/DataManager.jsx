
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, X, ClipboardList } from "lucide-react";
import { getData, saveData } from "../utils/storage";

function DataManager({ title, description, storageKey, fields, idPrefix }) {
  const [records, setRecords] = useState(() => getData(storageKey));
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    const refresh = () => setRecords(getData(storageKey));
    window.addEventListener("radiology-data-updated", refresh);
    return () => window.removeEventListener("radiology-data-updated", refresh);
  }, [storageKey]);

  const filteredRecords = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return records;

    return records.filter((record) =>
      fields.some((field) =>
        String(record[field.name] || "").toLowerCase().includes(query)
      )
    );
  }, [records, search, fields]);

  const openAdd = () => {
    const initial = {};
    fields.forEach((field) => {
      initial[field.name] = field.defaultValue || "";
    });

    if (fields.some((field) => field.name === "reportId")) {
      initial.reportId = `${idPrefix}-${Date.now().toString().slice(-6)}`;
    }

    setForm(initial);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (record) => {
    setForm({ ...record });
    setEditingId(record.id);
    setShowModal(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleaned = { ...form };

    fields.forEach((field) => {
      if (typeof cleaned[field.name] === "string") {
        cleaned[field.name] = cleaned[field.name].trim();
      }
    });

    const missing = fields.some(
      (field) => field.required && !cleaned[field.name]
    );

    if (missing) {
      alert("Please fill in all required fields.");
      return;
    }

    const updated =
      editingId !== null
        ? records.map((record) =>
            record.id === editingId ? { ...cleaned, id: editingId } : record
          )
        : [{ ...cleaned, id: Date.now() }, ...records];

    if (saveData(storageKey, updated)) {
      setRecords(updated);
      setShowModal(false);
      setForm({});
      setEditingId(null);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    const updated = records.filter((record) => record.id !== id);
    if (saveData(storageKey, updated)) setRecords(updated);
  };

  return (
    <div className="module-page">
      <div className="module-heading">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <button className="primary-btn" onClick={openAdd}>
          <Plus size={18} /> Add New
        </button>
      </div>

      <div className="module-summary">
        <div className="summary-icon">
          <ClipboardList size={23} />
        </div>
        <div>
          <span>Total Records</span>
          <h2>{records.length}</h2>
        </div>
      </div>

      <div className="module-table-card">
        <div className="module-table-top">
          <div>
            <h2>{title} Records</h2>
            <p>Search, view and manage records</p>
          </div>

          <div className="module-search">
            <Search size={18} />
            <input
              placeholder="Search records..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="table-scroll">
          <table className="module-table">
            <thead>
              <tr>
                {fields.map((field) => (
                  <th key={field.name}>{field.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length ? (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    {fields.map((field) => (
                      <td key={field.name}>{record[field.name] || "—"}</td>
                    ))}
                    <td>
                      <div className="row-actions">
                        <button
                          className="edit-btn"
                          title="Edit"
                          onClick={() => openEdit(record)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="delete-btn"
                          title="Delete"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-row" colSpan={fields.length + 1}>
                    No records found. Click Add New to create a record.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="module-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h2>{editingId ? "Edit Record" : `Add ${title}`}</h2>
                <p>Enter the details below.</p>
              </div>
              <button
                className="close-modal"
                type="button"
                onClick={() => setShowModal(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {fields.map((field) => (
                  <div
                    className={`form-group ${
                      field.type === "textarea" ? "full-field" : ""
                    }`}
                    key={field.name}
                  >
                    <label>
                      {field.label}{field.required ? " *" : ""}
                    </label>

                    {field.type === "select" ? (
                      <select
                        name={field.name}
                        value={form[field.name] || ""}
                        onChange={handleChange}
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        name={field.name}
                        value={form[field.name] || ""}
                        onChange={handleChange}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        rows="4"
                        required={field.required}
                      />
                    ) : (
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        value={form[field.name] || ""}
                        onChange={handleChange}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        required={field.required}
                        readOnly={field.readOnly}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {editingId ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataManager;
