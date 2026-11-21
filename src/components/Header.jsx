
import React from "react";
import { Bell, Search, UserCircle } from "lucide-react";

function Header() {
  return (
    <header className="top-header">
      <div>
        <h2>Radiology Dashboard</h2>
        <p>Welcome back! Manage your radiology activities.</p>
      </div>

      <div className="header-actions">
        <div className="header-search">
          <Search size={17} />
          <input placeholder="Search..." />
        </div>
        <button className="notification-btn" aria-label="Notifications">
          <Bell size={20} />
          <span />
        </button>
        <div className="admin-profile">
          <UserCircle size={35} />
          <div>
            <strong>Radiology Admin</strong>
            <small>Administrator</small>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
