
export const REQUEST_KEY = "radiologyDoctorRequests";
export const ENTRY_KEY = "radiologyReportEntries";
export const CENTRE_KEY = "radiologyReportCentre";

export function getData(key) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to load data:", error);
    return [];
  }
}

export function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event("radiology-data-updated"));
    return true;
  } catch (error) {
    console.error("Unable to save data:", error);
    alert("Unable to save data. Please check your browser storage.");
    return false;
  }
}
