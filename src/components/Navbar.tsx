"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

const Navbar = () => {
  const [user, setUser] = useState<string>("");

  // This ensures the user state is set correctly when the page is loaded
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");

    // If there's an email in localStorage, set it; otherwise, set it to "Guest"
    setUser(storedEmail || "Guest");
  }, []); // Empty dependency array to only run once on mount

  const handleLogout = () => {
    localStorage.clear();
    setUser("Guest"); // Update the state after logging out
  };

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            {/* Only show this if the user is a guest */}
            {user === "Guest" && (
              <>
                <li>
                  <p>{user}</p>
                  <ul className="p-2">
                    <li>
                      <a>Pregled kolegija</a>
                    </li>
                    <li>
                      <a>Postavke</a>
                    </li>
                  </ul>
                </li>
              </>
            )}
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl">
          FESB
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        {/* Display the menu for logged-in users */}
        {user !== "Guest" && (
          <ul className="menu menu-horizontal px-1">
            <li>
              <details>
                <summary>{user}</summary>
                <ul className="p-2">
                  <li className="border-[1px] rounded-xl my-4">
                    <a>Pregled kolegija</a>
                  </li>
                  <li className="border-[1px] rounded-xl">
                    <a>Postavke</a>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        )}
      </div>

      <div className="navbar-end">
        <Link href="/" className="btn" onClick={handleLogout}>
          Odjava
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
