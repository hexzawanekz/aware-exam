import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const dashboardCards = [
    {
      title: t("admin.companies"),
      description: t("admin.companies_description"),
      icon: "🏢",
      color: "bg-primary",
      path: "/admin/companies",
      count: null,
    },
    {
      title: t("admin.departments"),
      description: t("admin.departments_description"),
      icon: "🏬",
      color: "bg-secondary",
      path: "/admin/departments",
      count: null,
    },
    {
      title: t("admin.positions"),
      description: t("admin.positions_description"),
      icon: "💼",
      color: "bg-success",
      path: "/admin/positions",
      count: null,
    },
    {
      title: t("admin.programming_languages"),
      description: t("admin.programming_languages_description"),
      icon: "💻",
      color: "bg-warning",
      path: "/admin/programming-languages",
      count: null,
    },
    {
      title: t("admin.exams"),
      description: t("admin.exams_description"),
      icon: "📝",
      color: "bg-danger",
      path: "/admin/exams",
      count: null,
    },
    {
      title: t("admin.candidates"),
      description: t("admin.candidates_description"),
      icon: "👥",
      color: "bg-info",
      path: "/admin/candidates",
      count: null,
    },
  ];

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          {t("admin.dashboard_title")}
        </h2>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.path)}
            className="cursor-pointer rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default transition-all duration-300 hover:shadow-lg dark:border-strokedark dark:bg-boxdark"
          >
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <span className="text-2xl">{card.icon}</span>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-semibold text-black dark:text-white">
                  {card.title}
                </h4>
                <p className="text-sm text-body dark:text-bodydark">
                  {card.description}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <svg
                className="fill-current text-primary"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 0L16 8L8 16L0 8L8 0Z" fill="currentColor" />
              </svg>
              <span className="text-sm font-medium text-primary">
                {t("admin.manage")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-7.5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <span className="text-2xl">📊</span>
          </div>
          <div className="mt-4">
            <h4 className="text-title-md font-semibold text-black dark:text-white">
              {t("admin.system_status")}
            </h4>
            <p className="text-sm text-body dark:text-bodydark">
              {t("admin.system_status_description")}
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <span className="text-2xl">📈</span>
          </div>
          <div className="mt-4">
            <h4 className="text-title-md font-semibold text-black dark:text-white">
              {t("admin.reports")}
            </h4>
            <p className="text-sm text-body dark:text-bodydark">
              {t("admin.reports_description")}
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <span className="text-2xl">⚙️</span>
          </div>
          <div className="mt-4">
            <h4 className="text-title-md font-semibold text-black dark:text-white">
              {t("admin.settings")}
            </h4>
            <p className="text-sm text-body dark:text-bodydark">
              {t("admin.settings_description")}
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <span className="text-2xl">🔧</span>
          </div>
          <div className="mt-4">
            <h4 className="text-title-md font-semibold text-black dark:text-white">
              {t("admin.maintenance")}
            </h4>
            <p className="text-sm text-body dark:text-bodydark">
              {t("admin.maintenance_description")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
