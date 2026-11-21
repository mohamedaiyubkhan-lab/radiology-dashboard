
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  FileEdit,
  FolderOpen,
  Activity,
  Scan,
} from "lucide-react";

function Sidebar() {
  const links = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/doctor-request", label: "Doctor Request Page", icon: ClipboardList },
    { path: "/report-entry", label: "Report Entry", icon: FileEdit },
    { path: "/report-centre", label: "Report Centre Doctor", icon: FolderOpen },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon"><Scan size={25} /></div>
        <div>
          <h2>Radiology<span>Care</span></h2>
          <small>Management System</small>
        </div>
      </div>

      <p className="sidebar-label">MAIN MENU</p>

      <nav className="sidebar-nav">
        {links.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <Activity size={18} />
        <div>
          <strong>Radiology System</strong>
          <small>Manage your daily workflow</small>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
