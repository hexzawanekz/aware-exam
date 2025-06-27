import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";

const AdminDepartments = () => {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [allPositions, setAllPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company_id: "",
    position_ids: [],
  });

  useEffect(() => {
    loadDepartments();
    loadCompanies();
    loadAllPositions();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDepartments();
      setDepartments(response || []);
    } catch (error) {
      console.error("Failed to load departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await apiService.getCompanies();
      setCompanies(response || []);
      if (response && response.length > 0 && !formData.company_id) {
        setFormData((prev) => ({
          ...prev,
          company_id: response[0].id.toString(),
        }));
      }
    } catch (error) {
      console.error("Failed to load companies:", error);
    }
  };

  const loadAllPositions = async () => {
    try {
      const response = await apiService.getPositions();
      setAllPositions(response || []);
    } catch (error) {
      console.error("Failed to load positions:", error);
    }
  };

  const updatePositionsForDepartment = async (departmentId, positionIds) => {
    try {
      for (const positionId of positionIds) {
        const position = allPositions.find((p) => p.id === positionId);
        if (position) {
          await apiService.updatePosition(positionId, {
            name: position.name,
            description: position.description,
            department_id: departmentId,
            programming_language_id: position.programming_language_id || null,
          });
        }
      }
    } catch (error) {
      console.error("Failed to update positions:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingDepartment) {
        await apiService.updateDepartment(editingDepartment.id, {
          name: formData.name,
          description: formData.description,
          company_id: parseInt(formData.company_id),
        });
        await updatePositionsForDepartment(
          editingDepartment.id,
          formData.position_ids
        );
      } else {
        const response = await apiService.createDepartment(
          parseInt(formData.company_id),
          {
            name: formData.name,
            description: formData.description,
            company_id: parseInt(formData.company_id),
          }
        );
        if (formData.position_ids.length > 0) {
          await updatePositionsForDepartment(
            response.id,
            formData.position_ids
          );
        }
      }

      setFormData({
        name: "",
        description: "",
        company_id: companies[0]?.id?.toString() || "",
        position_ids: [],
      });
      setShowForm(false);
      setEditingDepartment(null);
      await loadDepartments();
      await loadAllPositions();
    } catch (error) {
      console.error("Failed to save department:", error);
    } finally {
      setSaving(false);
    }
  };

  const editDepartment = async (department) => {
    setEditingDepartment(department);
    let existingPositionIds = [];
    try {
      const response = await apiService.getPositions(department.id);
      existingPositionIds = response.map((pos) => pos.id);
    } catch (error) {
      console.error("Failed to load department positions:", error);
    }

    setFormData({
      name: department.name,
      description: department.description || "",
      company_id: (
        department.company_id ||
        department.company?.id ||
        ""
      ).toString(),
      position_ids: existingPositionIds,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingDepartment(null);
    setFormData({
      name: "",
      description: "",
      company_id: companies[0]?.id?.toString() || "",
      position_ids: [],
    });
    setShowForm(false);
  };

  const deleteDepartment = async (departmentId) => {
    if (!window.confirm(t("admin.confirm_delete"))) return;

    try {
      await apiService.deleteDepartment(departmentId);
      await loadDepartments();
    } catch (error) {
      console.error("Failed to delete department:", error);
    }
  };

  const handlePositionToggle = (positionId) => {
    setFormData((prev) => ({
      ...prev,
      position_ids: prev.position_ids.includes(positionId)
        ? prev.position_ids.filter((id) => id !== positionId)
        : [...prev.position_ids, positionId],
    }));
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          🏬 {t("admin.departments")}
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            {showForm ? t("common.cancel") : `+ ${t("admin.add_department")}`}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              {editingDepartment
                ? t("admin.edit_department")
                : t("admin.add_department")}
            </h3>
          </div>
          <div className="p-7">
            <form onSubmit={handleSubmit}>
              <div className="mb-5.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  {t("admin.department_name")}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t("admin.department_name_placeholder")}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                />
              </div>

              <div className="mb-5.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  {t("admin.description")}
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={t("admin.description_placeholder")}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                ></textarea>
              </div>

              <div className="mb-5.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  {t("admin.company")}
                </label>
                <select
                  value={formData.company_id}
                  onChange={(e) =>
                    setFormData({ ...formData, company_id: e.target.value })
                  }
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                >
                  <option value="">{t("admin.select_company")}</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-5.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  {t("admin.positions")} ({t("admin.optional")})
                </label>
                <div className="max-h-40 overflow-y-auto rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 dark:border-form-strokedark dark:bg-form-input">
                  {allPositions.length === 0 ? (
                    <p className="text-sm text-body dark:text-bodydark">
                      {t("admin.no_positions")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {allPositions.map((position) => (
                        <label
                          key={position.id}
                          className="flex items-center space-x-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.position_ids.includes(
                              position.id
                            )}
                            onChange={() => handlePositionToggle(position.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-black dark:text-white">
                            {position.name}
                            {position.description && (
                              <span className="text-xs text-body dark:text-bodydark ml-2">
                                - {position.description}
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4.5">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-95 disabled:opacity-50"
                >
                  {saving ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Departments Table */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="px-4 py-6 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("admin.departments_list")}
          </h4>
        </div>

        <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
          <div className="col-span-2 flex items-center">
            <p className="font-medium">{t("admin.department_name")}</p>
          </div>
          <div className="col-span-2 hidden items-center sm:flex">
            <p className="font-medium">{t("admin.company")}</p>
          </div>
          <div className="col-span-2 hidden items-center sm:flex">
            <p className="font-medium">{t("admin.description")}</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="font-medium">{t("common.actions")}</p>
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-sm text-body dark:text-bodydark">
              {t("common.loading")}
            </p>
          </div>
        ) : departments.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-body dark:text-bodydark">
              {t("admin.no_departments")}
            </p>
          </div>
        ) : (
          departments.map((department, key) => (
            <div
              className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
              key={key}
            >
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {department.name}
                </p>
              </div>
              <div className="col-span-2 hidden items-center sm:flex">
                <p className="text-sm text-black dark:text-white">
                  {department.company?.name || t("admin.no_company")}
                </p>
              </div>
              <div className="col-span-2 hidden items-center sm:flex">
                <p className="text-sm text-black dark:text-white">
                  {department.description || t("admin.no_description")}
                </p>
              </div>
              <div className="col-span-2 flex items-center space-x-3.5">
                <button
                  onClick={() => editDepartment(department)}
                  className="hover:text-primary"
                  title={t("common.edit")}
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
                      d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85605 8.99999C2.4748 10.0406 4.89356 13.2656 8.99981 13.2656C13.1061 13.2656 15.5248 10.0406 16.1436 8.99999C15.5248 7.95936 13.1061 4.73436 8.99981 4.73436C4.89356 4.73436 2.4748 7.95936 1.85605 8.99999Z"
                      fill=""
                    />
                    <path
                      d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 8.10938C8.50313 8.10938 8.10938 8.50313 8.10938 9C8.10938 9.49688 8.50313 9.89063 9 9.89063C9.49688 9.89063 9.89063 9.49688 9.89063 9C9.89063 8.50313 9.49688 8.10938 9 8.10938Z"
                      fill=""
                    />
                  </svg>
                </button>
                <button
                  onClick={() => deleteDepartment(department.id)}
                  className="hover:text-danger"
                  title={t("common.delete")}
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
                      d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.59789 6.1594L4.52539 13.9688C4.63789 15.0313 5.51602 15.8438 6.60664 15.8438H11.3660C12.4566 15.8438 13.3348 15.0313 13.4473 13.9688L14.3748 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502Z"
                      fill=""
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDepartments;
