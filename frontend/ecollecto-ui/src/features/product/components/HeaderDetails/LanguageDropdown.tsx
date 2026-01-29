import React from "react";

export default function LanguageDropdown() {
  return(
    <div className="hs-dropdown [--strategy:absolute] [--placement:bottom-right] relative inline-flex">
      <button id="hs-pro-aimtlg" type="button"
              className="flex justify-center items-center gap-x-3 size-9 text-sm text-gray-800 dark:text-neutral-200 hover:text-gray-500 rounded-lg disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:hover:text-neutral-200 dark:focus:text-neutral-200">
        <svg className="shrink-0 size-4.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
             strokeLinejoin="round">
          <path d="m5 8 6 6"/>
          <path d="m4 14 6-6 2-3"/>
          <path d="M2 5h12"/>
          <path d="M7 2h1"/>
          <path d="m22 22-5-10-5 10"/>
          <path d="M14 18h6"/>
        </svg>
        <span className="sr-only">Language</span>
      </button>

      {/* Dropdown Options */}
      <div
        className="hs-dropdown-menu hs-dropdown-open:opacity-100 w-40 transition-[opacity,margin] duration opacity-0 hidden z-11 bg-white border border-gray-200 rounded-xl shadow-lg before:absolute before:-top-4 before:start-0 before:w-full before:h-5 dark:bg-neutral-950 dark:border-neutral-700"
        role="menu" aria-orientation="vertical" aria-labelledby="hs-pro-aimtlg">
        <div className="p-1 space-y-0.5">
          <button type="button"
                  className="w-full flex items-center gap-x-3 py-1.5 px-2 rounded-lg text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800">
            English (US)
          </button>
          <button type="button"
                  className="w-full flex items-center gap-x-3 py-1.5 px-2 rounded-lg text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800">
            Ukraine (UA)
          </button>
        </div>
      </div>
      {/* End Dropdown Options */}
    </div>
  )
}