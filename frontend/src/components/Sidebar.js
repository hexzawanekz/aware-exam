import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ sidebarToggle, setSidebarToggle, user, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMenu, setSelectedMenu] = useState("");

  const handleMenuClick = (menuName, path) => {
    setSelectedMenu(selectedMenu === menuName ? "" : menuName);
    if (path) {
      navigate(path);
      setSidebarToggle(false);
    }
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: (
        <svg
          className="fill-current"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.10322 0.956299H2.53135C1.5751 0.956299 0.787598 1.7438 0.787598 2.70005V6.27192C0.787598 7.22817 1.5751 8.01567 2.53135 8.01567H6.10322C7.05947 8.01567 7.84697 7.22817 7.84697 6.27192V2.72817C7.8751 1.7438 7.0876 0.956299 6.10322 0.956299ZM6.60947 6.30005C6.60947 6.5813 6.38447 6.8063 6.10322 6.8063H2.53135C2.2501 6.8063 2.0251 6.5813 2.0251 6.30005V2.72817C2.0251 2.44692 2.2501 2.22192 2.53135 2.22192H6.10322C6.38447 2.22192 6.60947 2.44692 6.60947 2.72817V6.30005Z"
            fill=""
          />
          <path
            d="M15.4689 0.956299H11.8971C10.9408 0.956299 10.1533 1.7438 10.1533 2.70005V6.27192C10.1533 7.22817 10.9408 8.01567 11.8971 8.01567H15.4689C16.4252 8.01567 17.2127 7.22817 17.2127 6.27192V2.72817C17.2127 1.7438 16.4252 0.956299 15.4689 0.956299ZM15.9752 6.30005C15.9752 6.5813 15.7502 6.8063 15.4689 6.8063H11.8971C11.6158 6.8063 11.3908 6.5813 11.3908 6.30005V2.72817C11.3908 2.44692 11.6158 2.22192 11.8971 2.22192H15.4689C15.7502 2.22192 15.9752 2.44692 15.9752 2.72817V6.30005Z"
            fill=""
          />
          <path
            d="M6.10322 9.92822H2.53135C1.5751 9.92822 0.787598 10.7157 0.787598 11.672V15.2438C0.787598 16.2001 1.5751 16.9876 2.53135 16.9876H6.10322C7.05947 16.9876 7.84697 16.2001 7.84697 15.2438V11.7001C7.8751 10.7157 7.0876 9.92822 6.10322 9.92822ZM6.60947 15.272C6.60947 15.5532 6.38447 15.7782 6.10322 15.7782H2.53135C2.2501 15.7782 2.0251 15.5532 2.0251 15.272V11.7001C2.0251 11.4188 2.2501 11.1938 2.53135 11.1938H6.10322C6.38447 11.1938 6.60947 11.4188 6.60947 11.7001V15.272Z"
            fill=""
          />
          <path
            d="M15.4689 9.92822H11.8971C10.9408 9.92822 10.1533 10.7157 10.1533 11.672V15.2438C10.1533 16.2001 10.9408 16.9876 11.8971 16.9876H15.4689C16.4252 16.9876 17.2127 16.2001 17.2127 15.2438V11.7001C17.2127 10.7157 16.4252 9.92822 15.4689 9.92822ZM15.9752 15.272C15.9752 15.5532 15.7502 15.7782 15.4689 15.7782H11.8971C11.6158 15.7782 11.3908 15.5532 11.3908 15.272V11.7001C11.3908 11.4188 11.6158 11.1938 11.8971 11.1938H15.4689C15.7502 11.1938 15.9752 11.4188 15.9752 11.7001V15.272Z"
            fill=""
          />
        </svg>
      ),
      label: t("sidebar.dashboard"),
      path: "/exam",
      hasDropdown: false,
      active: location.pathname === "/exam",
    },
    {
      name: "Exams",
      icon: (
        <svg
          className="fill-current"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.0002 7.79065C11.0814 7.79065 12.7689 6.1594 12.7689 4.1344C12.7689 2.1094 11.0814 0.478149 9.0002 0.478149C6.91895 0.478149 5.23145 2.1094 5.23145 4.1344C5.23145 6.1594 6.91895 7.79065 9.0002 7.79065ZM9.0002 1.7719C10.3783 1.7719 11.5033 2.84065 11.5033 4.16252C11.5033 5.4844 10.3783 6.55315 9.0002 6.55315C7.62207 6.55315 6.49707 5.4844 6.49707 4.16252C6.49707 2.84065 7.62207 1.7719 9.0002 1.7719Z"
            fill=""
          />
          <path
            d="M10.8283 9.05627H7.17207C4.16269 9.05627 1.71582 11.5313 1.71582 14.5406V16.875C1.71582 17.2125 1.99707 17.5219 2.3627 17.5219C2.72832 17.5219 3.00957 17.2407 3.00957 16.875V14.5406C3.00957 12.2344 4.89394 10.3219 7.22832 10.3219H10.8564C13.1627 10.3219 15.0752 12.2063 15.0752 14.5406V16.875C15.0752 17.2125 15.3564 17.5219 15.7221 17.5219C16.0877 17.5219 16.3689 17.2407 16.3689 16.875V14.5406C16.2846 11.5313 13.8377 9.05627 10.8283 9.05627Z"
            fill=""
          />
        </svg>
      ),
      label: t("sidebar.my_exams"),
      path: "/exam",
      hasDropdown: false,
      active: location.pathname.includes("/exam"),
    },
  ];

  if (user?.role === "admin") {
    // Replace default menu items with admin-specific ones
    menuItems.splice(0, menuItems.length);
    menuItems.push(
      {
        name: "AdminDashboard",
        icon: (
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.10322 0.956299H2.53135C1.5751 0.956299 0.787598 1.7438 0.787598 2.70005V6.27192C0.787598 7.22817 1.5751 8.01567 2.53135 8.01567H6.10322C7.05947 8.01567 7.84697 7.22817 7.84697 6.27192V2.72817C7.8751 1.7438 7.0876 0.956299 6.10322 0.956299Z"
              fill=""
            />
          </svg>
        ),
        label: t("admin.dashboard"),
        path: "/admin",
        hasDropdown: false,
        active: location.pathname === "/admin",
      },
      {
        name: "Companies",
        icon: (
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.7499 2.9812H14.2874V2.36245C14.2874 2.02495 14.0062 1.71558 13.6405 1.71558H4.33115C3.96553 1.71558 3.68428 1.99683 3.68428 2.36245V2.9812H2.2499C1.29365 2.9812 0.478027 3.7687 0.478027 4.75308V14.5406C0.478027 15.4968 1.26553 16.3125 2.2499 16.3125H15.7499C16.7062 16.3125 17.5218 15.525 17.5218 14.5406V4.72495C17.5218 3.7687 16.7062 2.9812 15.7499 2.9812Z"
              fill=""
            />
          </svg>
        ),
        label: t("admin.companies"),
        path: "/admin/companies",
        hasDropdown: false,
        active: location.pathname.includes("/companies"),
      },
      {
        name: "Departments",
        icon: (
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.7499 2.9812H14.2874V2.36245C14.2874 2.02495 14.0062 1.71558 13.6405 1.71558H4.33115C3.96553 1.71558 3.68428 1.99683 3.68428 2.36245V2.9812H2.2499C1.29365 2.9812 0.478027 3.7687 0.478027 4.75308V14.5406C0.478027 15.4968 1.26553 16.3125 2.2499 16.3125H15.7499C16.7062 16.3125 17.5218 15.525 17.5218 14.5406V4.72495C17.5218 3.7687 16.7062 2.9812 15.7499 2.9812Z"
              fill=""
            />
          </svg>
        ),
        label: t("admin.departments"),
        path: "/admin/departments",
        hasDropdown: false,
        active: location.pathname.includes("/departments"),
      },
      {
        name: "Positions",
        icon: (
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.7499 2.9812H14.2874V2.36245C14.2874 2.02495 14.0062 1.71558 13.6405 1.71558H4.33115C3.96553 1.71558 3.68428 1.99683 3.68428 2.36245V2.9812H2.2499C1.29365 2.9812 0.478027 3.7687 0.478027 4.75308V14.5406C0.478027 15.4968 1.26553 16.3125 2.2499 16.3125H15.7499C16.7062 16.3125 17.5218 15.525 17.5218 14.5406V4.72495C17.5218 3.7687 16.7062 2.9812 15.7499 2.9812Z"
              fill=""
            />
          </svg>
        ),
        label: t("admin.positions"),
        path: "/admin/positions",
        hasDropdown: false,
        active: location.pathname.includes("/positions"),
      },
      {
        name: "ProgrammingLanguages",
        icon: (
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.7499 2.9812H14.2874V2.36245C14.2874 2.02495 14.0062 1.71558 13.6405 1.71558H4.33115C3.96553 1.71558 3.68428 1.99683 3.68428 2.36245V2.9812H2.2499C1.29365 2.9812 0.478027 3.7687 0.478027 4.75308V14.5406C0.478027 15.4968 1.26553 16.3125 2.2499 16.3125H15.7499C16.7062 16.3125 17.5218 15.525 17.5218 14.5406V4.72495C17.5218 3.7687 16.7062 2.9812 15.7499 2.9812Z"
              fill=""
            />
          </svg>
        ),
        label: t("admin.programming_languages"),
        path: "/admin/programming-languages",
        hasDropdown: false,
        active: location.pathname.includes("/programming-languages"),
      },
      {
        name: "Exams",
        icon: (
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.7499 2.47502H14.2874V2.36245C14.2874 2.02495 14.0062 1.71558 13.6405 1.71558C13.2749 1.71558 12.9937 1.99683 12.9937 2.36245V2.47502H4.97803V2.36245C4.97803 2.02495 4.69678 1.71558 4.33115 1.71558C3.96553 1.71558 3.68428 1.99683 3.68428 2.36245V2.9812H2.2499C1.29365 2.9812 0.478027 3.7687 0.478027 4.75308V14.5406C0.478027 15.4968 1.26553 16.3125 2.2499 16.3125H15.7499C16.7062 16.3125 17.5218 15.525 17.5218 14.5406V4.72495C17.5218 3.7687 16.7062 2.47502 15.7499 2.47502Z"
              fill=""
            />
          </svg>
        ),
        label: t("admin.exams"),
        path: "/admin/exams",
        hasDropdown: false,
        active: location.pathname.includes("/admin/exams"),
      },
      {
        name: "Candidates",
        icon: (
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.0002 7.79065C11.0814 7.79065 12.7689 6.1594 12.7689 4.1344C12.7689 2.1094 11.0814 0.478149 9.0002 0.478149C6.91895 0.478149 5.23145 2.1094 5.23145 4.1344C5.23145 6.1594 6.91895 7.79065 9.0002 7.79065ZM9.0002 1.7719C10.3783 1.7719 11.5033 2.84065 11.5033 4.16252C11.5033 5.4844 10.3783 6.55315 9.0002 6.55315C7.62207 6.55315 6.49707 5.4844 6.49707 4.16252C6.49707 2.84065 7.62207 1.7719 9.0002 1.7719Z"
              fill=""
            />
            <path
              d="M10.8283 9.05627H7.17207C4.16269 9.05627 1.71582 11.5313 1.71582 14.5406V16.875C1.71582 17.2125 1.99707 17.5219 2.3627 17.5219C2.72832 17.5219 3.00957 17.2407 3.00957 16.875V14.5406C3.00957 12.2344 4.89394 10.3219 7.22832 10.3219H10.8564C13.1627 10.3219 15.0752 12.2063 15.0752 14.5406V16.875C15.0752 17.2125 15.3564 17.5219 15.7221 17.5219C16.0877 17.5219 16.3689 17.2407 16.3689 16.875V14.5406C16.2846 11.5313 13.8377 9.05627 10.8283 9.05627Z"
              fill=""
            />
          </svg>
        ),
        label: t("admin.candidates"),
        path: "/admin/candidates",
        hasDropdown: false,
        active: location.pathname.includes("/candidates"),
      }
    );
  }

  return (
    <aside
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarToggle ? "translate-x-0" : "-translate-x-full"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* SIDEBAR HEADER */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <div className="flex items-center gap-3">
          <div
            className="cursor-pointer flex items-center gap-3"
            onClick={() =>
              handleMenuClick("", user?.role === "admin" ? "/admin" : "/exam")
            }
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <span className="text-white font-bold text-lg">📚</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">AI Exam</h3>
              <p className="text-bodydark2 text-sm">Smart Testing</p>
            </div>
          </div>
        </div>
        <button
          className="block lg:hidden"
          onClick={() => setSidebarToggle(!sidebarToggle)}
        >
          <svg
            className="fill-current"
            width="20"
            height="18"
            viewBox="0 0 20 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
              fill=""
            />
          </svg>
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        {/* Sidebar Menu */}
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          {/* Menu Group */}
          <div>
            <h3 className="mb-4 ml-4 text-sm font-medium text-bodydark2">
              {t("sidebar.menu")}
            </h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <button
                    className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 w-full text-left ${
                      item.active ? "bg-graydark dark:bg-meta-4" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleMenuClick(item.name, item.path);
                    }}
                  >
                    {item.icon}
                    {item.label}
                    {item.hasDropdown && (
                      <svg
                        className="absolute right-4 top-1/2 -translate-y-1/2 fill-current"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                          fill=""
                        />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* User Info Section */}
          {user && (
            <div className="border-t border-strokedark pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user.first_name?.charAt(0)?.toUpperCase() || "👤"}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-bodydark2 text-xs">
                    {user.role === "admin"
                      ? t("common.admin")
                      : t("common.candidate")}
                  </p>
                </div>
              </div>
              <button
                className="flex items-center gap-3 w-full py-2 px-4 text-bodydark1 hover:bg-graydark dark:hover:bg-meta-4 rounded-sm duration-300 ease-in-out"
                onClick={() => {
                  setSidebarToggle(false);
                  onLogout();
                }}
              >
                <svg
                  className="fill-current"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.5 0.618744H7.83125C7.04062 0.618744 6.375 1.28437 6.375 2.075V3.6875C6.375 4.0125 6.64687 4.28437 6.97188 4.28437C7.29688 4.28437 7.56875 4.0125 7.56875 3.6875V2.075C7.56875 1.94375 7.675 1.8375 7.80625 1.8375H10.4937C11.0375 1.8375 11.475 2.275 11.475 2.81875V15.1813C11.475 15.725 11.0375 16.1625 10.4937 16.1625H7.80625C7.675 16.1625 7.56875 16.0562 7.56875 15.925V14.3125C7.56875 13.9875 7.29688 13.7156 6.97188 13.7156C6.64687 13.7156 6.375 13.9875 6.375 14.3125V15.925C6.375 16.7156 7.04062 17.3812 7.83125 17.3812H10.5C11.8125 17.3812 12.8813 16.3125 12.8813 15V3C12.8813 1.6875 11.8125 0.618744 10.5 0.618744Z"
                    fill=""
                  />
                  <path
                    d="M3.1875 8.13751L8.8125 3.6875C9.075 3.46875 9.075 3.05625 8.8125 2.8375C8.55 2.61875 8.1375 2.61875 7.91875 2.8375L1.54375 8.5625C1.325 8.825 1.325 9.2375 1.54375 9.45625L7.91875 15.1812C8.05 15.3125 8.225 15.375 8.4 15.375C8.575 15.375 8.75 15.3125 8.88125 15.1812C9.11875 14.9625 9.11875 14.55 8.88125 14.3312L3.25625 9.88125H12.2C12.525 9.88125 12.7969 9.60938 12.7969 9.28438C12.7969 8.95938 12.525 8.6875 12.2 8.6875H3.1875V8.13751Z"
                    fill=""
                  />
                </svg>
                <span className="text-sm">{t("common.log_out")}</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
