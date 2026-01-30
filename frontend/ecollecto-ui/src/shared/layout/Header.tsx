import React, {useState} from 'react';
import {useLocation} from 'react-router-dom';
import brandIcon from '@/assets/logo_75.ico';
import LanguageDropdown from "../../features/product/components/HeaderDetails/LanguageDropdown";

export default function Header({onSearch}: { onSearch: (term: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const location = useLocation();
  const isProductPage = location.pathname.startsWith('/stamps/');
  const effectiveSearchOpen = !isProductPage && isSearchOpen;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  const toggleSearch = () => {
    if (isSearchOpen) {
      setSearchValue("");
      onSearch("");
    }
    setIsSearchOpen(v => !v);
  };

  return (
    <header
      className="sticky top-4 inset-x-0 before:absolute before:inset-0 before:max-w-5xl before:mx-2 lg:before:mx-auto before:rounded-4xl before:border before:border-gray-200 dark:before:border-neutral-700 after:absolute after:inset-0 after:-z-1 after:max-w-5xl after:mx-2 lg:after:mx-auto after:rounded-4xl after:bg-white dark:after:bg-neutral-900 flex flex-wrap md:justify-start md:flex-nowrap z-50 w-full">
      <nav
        className="relative max-w-5xl w-full md:flex md:items-center md:justify-between md:gap-3 ps-5 pe-2 mx-2 lg:mx-auto py-2 dark:bg-neutral-900 rounded-4xl">

        {/* Logo and Mobile Controls */}
        <div className="flex items-center justify-between">
          <a className="flex items-center font-semibold text-xl text-black dark:text-white focus:outline-hidden"
             href="/" aria-label="Brand">
            <img src={brandIcon} alt="sCollecto" className="h-8 w-auto"/>
          </a>

          <div className="md:hidden flex items-center gap-1">
            {/* Mobile Search Toggle */}
            {!isProductPage && !isSearchOpen && (
              <button
                onClick={toggleSearch}
                className="size-9 flex justify-center items-center text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full"
              >
                <SearchIcon/>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="size-9 flex justify-center items-center text-gray-800 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700"
            >
              {!isOpen ? <MenuIcon/> : <CloseIcon/>}
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className={`${isOpen ? 'block' : 'hidden'} transition-all duration-300 basis-full grow md:block`}>
          <div className="py-2 md:py-0 flex flex-col md:flex-row md:items-center md:justify-end gap-1">
            <a className="p-2 text-sm text-gray-800 dark:text-neutral-200 hover:text-gray-500" href="/">
              Stamps
            </a>
            <a className="p-2 text-sm text-gray-800 dark:text-neutral-200 hover:text-gray-500" href="/firstday">
              First day of issue
            </a>
            <a className="p-2 text-sm text-gray-800 dark:text-neutral-200 hover:text-gray-500" href="/collection">
              Collection
            </a>

            <div
              className="relative flex items-center md:ps-2.5 md:ms-1.5 md:before:block md:before:absolute md:before:top-1/2 md:before:-start-px md:before:w-px md:before:h-4 md:before:bg-gray-300 dark:md:before:bg-neutral-700 md:before:-translate-y-1/2">

              {/* Desktop Search Toggle Button */}
              {!isProductPage && !isSearchOpen && (
                <button
                  onClick={toggleSearch}
                  className="hidden md:flex p-2 text-gray-800 dark:text-neutral-200 hover:text-gray-500 focus:outline-hidden"
                >
                  <SearchIcon/>
                </button>
              )}

              <LanguageDropdown />

              <a className="p-2 flex items-center text-sm text-gray-800 dark:text-neutral-200 hover:text-gray-500"
                 href="#">
                <UserIcon/>
                Log in
                <sup className="ms-0.5 text-xs bg-blue-700 text-white py-0.5 px-1 rounded-lg">TBD</sup>
              </a>
            </div>
          </div>
        </div>

        {/* --- Search Bar Module --- */}
        {effectiveSearchOpen && (
          <div className="absolute top-full left-0 w-full pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div
              className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-2 shadow-lg">
              <form className="flex items-center w-full">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <SearchIcon className="size-4 text-gray-400"/>
                  </div>
                  <input
                    type="search"
                    value={searchValue}
                    onChange={handleSearch}
                    className="block w-full p-2 ps-10 text-sm text-gray-900 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                    placeholder="Search stamps, series, or years..."
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleSearch}
                  className="ms-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white px-2"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

/* Icons Components */
function SearchIcon({className = "size-4"}) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.3-4.3"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="shrink-0 size-4 me-3 md:me-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
         strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" x2="21" y1="6" y2="6"/>
      <line x1="3" x2="21" y1="12" y2="12"/>
      <line x1="3" x2="21" y1="18" y2="18"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  );
}