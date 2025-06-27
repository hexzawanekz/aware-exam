import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";

const AdminProgrammingLanguages = () => {
  const { t } = useTranslation();
  const [programmingLanguages, setProgrammingLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    version: "",
    is_active: true,
  });

  useEffect(() => {
    loadProgrammingLanguages();
  }, []);

  const loadProgrammingLanguages = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProgrammingLanguages();
      setProgrammingLanguages(response || []);
    } catch (error) {
      console.error("Failed to load programming languages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingLanguage) {
        await apiService.updateProgrammingLanguage(editingLanguage.id, {
          name: formData.name,
          description: formData.description,
          version: formData.version,
          is_active: formData.is_active,
        });
      } else {
        await apiService.createProgrammingLanguage({
          name: formData.name,
          description: formData.description,
          version: formData.version,
          is_active: formData.is_active,
        });
      }

      setFormData({
        name: "",
        description: "",
        version: "",
        is_active: true,
      });
      setShowForm(false);
      setEditingLanguage(null);
      await loadProgrammingLanguages();
    } catch (error) {
      console.error("Failed to save programming language:", error);
    } finally {
      setSaving(false);
    }
  };

  const editLanguage = (language) => {
    setEditingLanguage(language);
    setFormData({
      name: language.name,
      description: language.description || "",
      version: language.version || "",
      is_active: language.is_active,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingLanguage(null);
    setFormData({
      name: "",
      description: "",
      version: "",
      is_active: true,
    });
    setShowForm(false);
  };

  const deleteLanguage = async (languageId) => {
    if (!window.confirm(t("admin.confirm_delete"))) return;

    try {
      await apiService.deleteProgrammingLanguage(languageId);
      await loadProgrammingLanguages();
    } catch (error) {
      console.error("Failed to delete programming language:", error);
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          💻 {t("admin.programming_languages")}
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            {showForm
              ? t("common.cancel")
              : `+ ${t("admin.add_programming_language")}`}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              {editingLanguage
                ? t("admin.edit_programming_language")
                : t("admin.add_programming_language")}
            </h3>
          </div>
          <div className="p-7">
            <form onSubmit={handleSubmit}>
              <div className="mb-5.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  {t("admin.language_name")}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t("admin.language_name_placeholder")}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                />
              </div>

              <div className="mb-5.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  {t("admin.version")} ({t("admin.optional")})
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) =>
                    setFormData({ ...formData, version: e.target.value })
                  }
                  placeholder={t("admin.version_placeholder")}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
              </div>

              <div className="mb-5.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  {t("admin.description")} ({t("admin.optional")})
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={t("admin.language_description_placeholder")}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                ></textarea>
              </div>

              <div className="mb-5.5">
                <label className="flex cursor-pointer select-none items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`mr-4 flex h-6 w-11 items-center rounded-full p-1 duration-200 ${
                      formData.is_active ? "bg-primary" : "bg-[#CCCCCE]"
                    }`}
                  >
                    <div
                      className={`dot h-4 w-4 rounded-full bg-white duration-200 ${
                        formData.is_active ? "translate-x-5" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-black dark:text-white">
                    {t("admin.is_active")}
                  </span>
                </label>
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

      {/* Programming Languages Table */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="px-4 py-6 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("admin.programming_languages_list")}
          </h4>
        </div>

        <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
          <div className="col-span-2 flex items-center">
            <p className="font-medium">{t("admin.language_name")}</p>
          </div>
          <div className="col-span-1 hidden items-center sm:flex">
            <p className="font-medium">{t("admin.version")}</p>
          </div>
          <div className="col-span-2 hidden items-center sm:flex">
            <p className="font-medium">{t("admin.positions_count")}</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="font-medium">{t("admin.status")}</p>
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
        ) : programmingLanguages.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-body dark:text-bodydark">
              {t("admin.no_programming_languages")}
            </p>
          </div>
        ) : (
          programmingLanguages.map((language, key) => (
            <div
              className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
              key={key}
            >
              <div className="col-span-2 flex items-center">
                <div className="flex flex-col">
                  <p className="text-sm text-black dark:text-white font-medium">
                    {language.name}
                  </p>
                  {language.description && (
                    <p className="text-xs text-body dark:text-bodydark">
                      {language.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="col-span-1 hidden items-center sm:flex">
                <p className="text-sm text-black dark:text-white">
                  {language.version || t("admin.no_version")}
                </p>
              </div>
              <div className="col-span-2 hidden items-center sm:flex">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    language.position_count > 0
                      ? "bg-success/10 text-success"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {language.position_count || 0} {t("admin.positions")}
                </span>
              </div>
              <div className="col-span-1 flex items-center">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    language.is_active
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {language.is_active ? t("admin.active") : t("admin.inactive")}
                </span>
              </div>
              <div className="col-span-2 flex items-center space-x-3.5">
                <button
                  onClick={() => editLanguage(language)}
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
                  onClick={() => deleteLanguage(language.id)}
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

export default AdminProgrammingLanguages;
