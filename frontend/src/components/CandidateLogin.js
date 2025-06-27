import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";

const CandidateLogin = ({ onLoginSuccess, onBackToHome }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.email || !formData.phone) {
      setError(t("candidate_login.required_fields"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiService.candidateLogin(formData);
      if (response && response.candidate) {
        // Store candidate info in localStorage for session management
        localStorage.setItem(
          "candidateSession",
          JSON.stringify(response.candidate)
        );
        onLoginSuccess(response.candidate);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(t("candidate_login.login_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray dark:bg-boxdark-2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-w-4xl w-full">
        <div className="flex flex-wrap items-center">
          {/* Left side - Illustration */}
          <div className="hidden w-full xl:block xl:w-1/2">
            <div className="py-17.5 px-26 text-center">
              <div className="mb-5.5 inline-block">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary mx-auto mb-4">
                  <span className="text-white font-bold text-3xl">📚</span>
                </div>
                <h3 className="text-2xl font-bold text-black dark:text-white">
                  AI Exam System
                </h3>
              </div>
              <p className="font-medium 2xl:px-20 text-gray-600 dark:text-gray-300">
                {t("candidate_login.system_description")}
              </p>
              <div className="mt-15 inline-block">
                <div className="w-80 h-80 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center opacity-20">
                  <div className="text-8xl">🎯</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="w-full border-stroke dark:border-strokedark xl:w-1/2 xl:border-l-2">
            <div className="w-full p-4 sm:p-12.5 xl:p-17.5">
              <span className="mb-1.5 block font-medium text-bodydark2 dark:text-bodydark">
                เริ่มต้นใช้งานฟรี
              </span>
              <h2 className="mb-9 text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
                {t("candidate_login.title")}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("candidate_login.email")}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={t("candidate_login.email_placeholder")}
                      className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      required
                    />
                    <span className="absolute right-4 top-4">
                      <svg
                        className="fill-current"
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g opacity="0.5">
                          <path
                            d="M19.2516 3.30005H2.75156C1.58281 3.30005 0.585938 4.26255 0.585938 5.46567V16.6032C0.585938 17.7719 1.54844 18.7688 2.75156 18.7688H19.2516C20.4203 18.7688 21.4172 17.8063 21.4172 16.6032V5.4313C21.4172 4.26255 20.4203 3.30005 19.2516 3.30005ZM19.2516 4.84692C19.2859 4.84692 19.3203 4.84692 19.3547 4.84692L11.0016 10.2094L2.64844 4.84692C2.68281 4.84692 2.71719 4.84692 2.75156 4.84692H19.2516ZM19.2516 17.1532H2.75156C2.40781 17.1532 2.13281 16.8782 2.13281 16.5344V6.35942L10.1766 11.5157C10.4172 11.6875 10.6922 11.7563 10.9672 11.7563C11.2422 11.7563 11.5172 11.6875 11.7578 11.5157L19.8016 6.35942V16.5688C19.8703 16.9125 19.5953 17.1532 19.2516 17.1532Z"
                            fill=""
                          />
                        </g>
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("candidate_login.phone")}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder={t("candidate_login.phone_placeholder")}
                      className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      required
                    />
                    <span className="absolute right-4 top-4">
                      <svg
                        className="fill-current"
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g opacity="0.5">
                          <path
                            d="M6.62188 13.6094L8.05469 15.0422C8.20469 15.1922 8.42969 15.3072 8.68594 15.3072C8.94219 15.3072 9.13438 15.2266 9.28438 15.0766L20.9844 3.37656C21.1344 3.22656 21.2148 3.00156 21.2148 2.74531C21.2148 2.48906 21.1344 2.26406 20.9844 2.11406L18.8859 0.015625C18.7359 -0.134375 18.5109 -0.214844 18.2547 -0.214844C17.9984 -0.214844 17.7734 -0.134375 17.6234 0.015625L5.92344 11.7156C5.77344 11.8656 5.65781 12.0906 5.65781 12.3469C5.65781 12.6031 5.73828 12.7953 5.88828 12.9453L6.62188 13.6094Z"
                            fill=""
                          />
                        </g>
                      </svg>
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mb-5 rounded-md bg-meta-1 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-white">
                          {error}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        <span>{t("candidate_login.login_button")}</span>
                      </div>
                    ) : (
                      t("candidate_login.login_button")
                    )}
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    ← {t("candidate_login.back_to_home")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateLogin;
