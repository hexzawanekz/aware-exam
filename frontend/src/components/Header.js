import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const Header = ({
  sidebarToggle,
  setSidebarToggle,
  darkMode,
  setDarkMode,
  user,
  onLogout,
}) => {
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between py-4 px-4 shadow-2 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          {/* Hamburger Toggle BTN */}
          <button
            className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
            onClick={() => setSidebarToggle(!sidebarToggle)}
          >
            <span className="relative block h-5.5 w-5.5 cursor-pointer">
              <span className="du-block absolute right-0 h-full w-full">
                <span
                  className={`relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${
                    !sidebarToggle ? "!w-full delay-300" : ""
                  }`}
                ></span>
                <span
                  className={`relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${
                    !sidebarToggle ? "!w-full delay-400" : ""
                  }`}
                ></span>
                <span
                  className={`relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${
                    !sidebarToggle ? "!w-full delay-500" : ""
                  }`}
                ></span>
              </span>
              <span className="du-block absolute right-0 h-full w-full rotate-45">
                <span
                  className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out dark:bg-white ${
                    !sidebarToggle ? "!h-0 delay-[0]" : ""
                  }`}
                ></span>
                <span
                  className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out dark:bg-white ${
                    !sidebarToggle ? "!h-0 dealy-200" : ""
                  }`}
                ></span>
              </span>
            </span>
          </button>
          {/* Logo for mobile */}
          <div className="block flex-shrink-0 lg:hidden">
            <h2 className="text-title-md font-bold text-primary">
              📚 AI Exam System
            </h2>
          </div>
        </div>

        <div className="hidden sm:block">
          <div className="relative">
            <button className="absolute top-1/2 left-0 -translate-y-1/2">
              <svg
                className="fill-body hover:fill-primary dark:fill-bodydark dark:hover:fill-primary"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.16666 3.33332C5.945 3.33332 3.33332 5.945 3.33332 9.16666C3.33332 12.3883 5.945 15 9.16666 15C12.3883 15 15 12.3883 15 9.16666C15 5.945 12.3883 3.33332 9.16666 3.33332ZM1.66666 9.16666C1.66666 5.02452 5.02452 1.66666 9.16666 1.66666C13.3088 1.66666 16.6667 5.02452 16.6667 9.16666C16.6667 13.3088 13.3088 16.6667 9.16666 16.6667C5.02452 16.6667 1.66666 13.3088 1.66666 9.16666Z"
                  fill=""
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.2857 13.2857C13.6112 12.9603 14.1388 12.9603 14.4642 13.2857L18.0892 16.9107C18.4147 17.2362 18.4147 17.7638 18.0892 18.0892C17.7638 18.4147 17.2362 18.4147 16.9107 18.0892L13.2857 14.4642C12.9603 14.1388 12.9603 13.6112 13.2857 13.2857Z"
                  fill=""
                />
              </svg>
            </button>
            <input
              type="text"
              placeholder={t("common.search")}
              className="w-full bg-transparent pr-4 pl-9 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            <li>
              {/* Dark Mode Toggler */}
              <label
                className={`relative m-0 block h-7.5 w-14 rounded-full ${
                  darkMode ? "bg-primary" : "bg-stroke"
                }`}
              >
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  className="absolute top-0 z-50 m-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className={`absolute top-1/2 left-[3px] flex h-6 w-6 -translate-y-1/2 translate-x-0 items-center justify-center rounded-full bg-white shadow-switcher duration-75 ease-linear ${
                    darkMode ? "!translate-x-full" : ""
                  }`}
                >
                  <span className="dark:hidden">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.99992 12.6666C10.5772 12.6666 12.6666 10.5772 12.6666 7.99992C12.6666 5.42259 10.5772 3.33325 7.99992 3.33325C5.42259 3.33325 3.33325 5.42259 3.33325 7.99992C3.33325 10.5772 5.42259 12.6666 7.99992 12.6666Z"
                        fill="#969AA1"
                      />
                    </svg>
                  </span>
                  <span className="hidden dark:inline-block">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14.3533 10.62C14.2466 10.44 13.9466 10.16 13.1999 10.2933C12.7866 10.3667 12.3666 10.4 11.9466 10.38C10.3933 10.3133 8.98659 9.6 8.00659 8.5C7.13993 7.53333 6.60659 6.27333 6.59993 4.91333C6.59993 4.15333 6.74659 3.42 7.04659 2.72666C7.33993 2.05333 7.13326 1.7 6.98659 1.55333C6.83326 1.4 6.47326 1.18666 5.76659 1.48C3.03993 2.62666 1.35326 5.36 1.55326 8.28666C1.75326 11.04 3.68659 13.3933 6.24659 14.28C6.85993 14.4933 7.50659 14.62 8.17326 14.6467C8.27993 14.6533 8.38659 14.66 8.49326 14.66C10.7266 14.66 12.8199 13.6067 14.1399 11.8133C14.5866 11.1933 14.4666 10.8 14.3533 10.62Z"
                        fill="#969AA1"
                      />
                    </svg>
                  </span>
                </span>
              </label>
            </li>

            {/* User Profile Dropdown */}
            {user && (
              <li className="relative">
                <button
                  className="flex items-center gap-4"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="hidden text-right lg:block">
                    <span className="block text-sm font-medium text-black dark:text-white">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="block text-xs">
                      {user.role === "admin"
                        ? t("common.admin")
                        : t("common.candidate")}
                    </span>
                  </span>
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user.first_name?.charAt(0)?.toUpperCase() || "👤"}
                    </span>
                  </div>
                  <svg
                    className="hidden fill-current sm:block"
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0.410765 0.910734C0.736202 0.585297 1.26384 0.585297 1.58928 0.910734L6.00002 5.32148L10.4108 0.910734C10.7362 0.585297 11.2638 0.585297 11.5893 0.910734C11.9147 1.23617 11.9147 1.76381 11.5893 2.08924L6.58928 7.08924C6.26384 7.41468 5.7362 7.41468 5.41077 7.08924L0.410765 2.08924C0.0853277 1.76381 0.0853277 1.23617 0.410765 0.910734Z"
                      fill=""
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-4 flex w-62.5 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <ul className="flex flex-col gap-5 border-b border-stroke px-6 py-7.5 dark:border-strokedark">
                      <li>
                        <button
                          className="flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
                          onClick={() => {
                            setDropdownOpen(false);
                            // Handle profile click
                          }}
                        >
                          <svg
                            className="fill-current"
                            width="22"
                            height="22"
                            viewBox="0 0 22 22"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M11 9.62499C8.42188 9.62499 6.35938 7.59687 6.35938 5.12187C6.35938 2.64687 8.42188 0.618744 11 0.618744C13.5781 0.618744 15.6406 2.64687 15.6406 5.12187C15.6406 7.59687 13.5781 9.62499 11 9.62499ZM11 2.16562C9.28125 2.16562 7.90625 3.50624 7.90625 5.12187C7.90625 6.73749 9.28125 8.07812 11 8.07812C12.7188 8.07812 14.0938 6.73749 14.0938 5.12187C14.0938 3.50624 12.7188 2.16562 11 2.16562Z"
                              fill=""
                            />
                            <path
                              d="M17.7719 21.4156H4.2281C3.5406 21.4156 2.9906 20.8656 2.9906 20.1781V17.0844C2.9906 13.7156 5.7406 10.9656 9.10935 10.9656H12.8906C16.2594 10.9656 19.0094 13.7156 19.0094 17.0844V20.1781C19.0094 20.8656 18.4594 21.4156 17.7719 21.4156ZM4.53748 19.8687H17.4625V17.0844C17.4625 14.575 15.4 12.5125 12.8906 12.5125H9.10935C6.6 12.5125 4.53748 14.575 4.53748 17.0844V19.8687Z"
                              fill=""
                            />
                          </svg>
                          {t("common.my_profile")}
                        </button>
                      </li>
                      <li>
                        <button
                          className="flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
                          onClick={() => {
                            setDropdownOpen(false);
                            // Handle settings click
                          }}
                        >
                          <svg
                            className="fill-current"
                            width="22"
                            height="22"
                            viewBox="0 0 22 22"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M20.8656 8.86874C20.5125 7.81249 19.8 6.89374 18.8656 6.31249C17.9312 5.73124 16.8406 5.52499 15.7844 5.73124C14.7281 5.93749 13.775 6.54374 13.0969 7.43124L11 9.52499L8.90312 7.43124C8.225 6.54374 7.27187 5.93749 6.21562 5.73124C5.15937 5.52499 4.06875 5.73124 3.13437 6.31249C2.2 6.89374 1.4875 7.81249 1.13437 8.86874C0.78125 9.92499 0.8125 11.0844 1.225 12.1406L3.84375 18.4906C4.11875 19.1687 4.59375 19.7375 5.20312 20.1281C5.8125 20.5187 6.525 20.7156 7.25 20.6969H14.75C15.475 20.7156 16.1875 20.5187 16.7969 20.1281C17.4062 19.7375 17.8812 19.1687 18.1562 18.4906L20.775 12.1406C21.1875 11.0844 21.2187 9.92499 20.8656 8.86874ZM19.4531 11.6687L16.8344 18.0187C16.6844 18.3719 16.4312 18.6687 16.1062 18.8719C15.7812 19.075 15.4031 19.175 15.025 19.1625H6.975C6.59687 19.175 6.21875 19.075 5.89375 18.8719C5.56875 18.6687 5.31562 18.3719 5.16562 18.0187L2.54687 11.6687C2.29062 11.0062 2.26562 10.2656 2.475 9.58749C2.68437 8.90937 3.10937 8.32812 3.67812 7.93749C4.24687 7.54687 4.93437 7.37187 5.6125 7.44062C6.29062 7.50937 6.93437 7.81562 7.43437 8.31562L10.4656 11.3469C10.6062 11.4875 10.7969 11.5656 11 11.5656C11.2031 11.5656 11.3937 11.4875 11.5344 11.3469L14.5656 8.31562C15.0656 7.81562 15.7094 7.50937 16.3875 7.44062C17.0656 7.37187 17.7531 7.54687 18.3219 7.93749C18.8906 8.32812 19.3156 8.90937 19.525 9.58749C19.7344 10.2656 19.7094 11.0062 19.4531 11.6687Z"
                              fill=""
                            />
                          </svg>
                          {t("common.settings")}
                        </button>
                      </li>
                    </ul>
                    <button
                      className="flex items-center gap-3.5 py-4 px-6 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                    >
                      <svg
                        className="fill-current"
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15.5375 0.618744H11.6531C10.7594 0.618744 10.0031 1.37499 10.0031 2.26874V4.64062C10.0031 5.05312 10.3469 5.39687 10.7594 5.39687C11.1719 5.39687 11.5156 5.05312 11.5156 4.64062V2.26874C11.5156 2.23437 11.5469 2.20312 11.5812 2.20312H15.5375C16.3625 2.20312 17.0156 2.85624 17.0156 3.68124V18.3187C17.0156 19.1437 16.3625 19.7969 15.5375 19.7969H11.5812C11.5469 19.7969 11.5156 19.7656 11.5156 19.7312V17.3594C11.5156 16.9469 11.1719 16.6031 10.7594 16.6031C10.3469 16.6031 10.0031 16.9469 10.0031 17.3594V19.7312C10.0031 20.625 10.7594 21.3812 11.6531 21.3812H15.5375C17.2219 21.3812 18.5844 20.0187 18.5844 18.3344V3.66562C18.5844 1.98124 17.2219 0.618744 15.5375 0.618744Z"
                          fill=""
                        />
                        <path
                          d="M6.05001 11.7563H12.2031C12.6156 11.7563 12.9594 11.4125 12.9594 11C12.9594 10.5875 12.6156 10.2438 12.2031 10.2438H6.08439L8.21564 8.07813C8.52501 7.76875 8.52501 7.2875 8.21564 6.97812C7.90626 6.66875 7.42501 6.66875 7.11564 6.97812L3.67814 10.4156C3.36876 10.725 3.36876 11.2063 3.67814 11.5156L7.11564 14.9531C7.27189 15.1094 7.47814 15.1875 7.68439 15.1875C7.89064 15.1875 8.09689 15.1094 8.25314 14.9531C8.56251 14.6438 8.56251 14.1625 8.25314 13.8531L6.05001 11.7563Z"
                          fill=""
                        />
                      </svg>
                      {t("common.log_out")}
                    </button>
                  </div>
                )}
              </li>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
