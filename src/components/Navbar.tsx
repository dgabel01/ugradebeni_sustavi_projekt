"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import PocketBase from "pocketbase";
import { useRouter } from "next/navigation";

const pb = new PocketBase("http://127.0.0.1:8090");

const Navbar = () => {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [, forceUpdate] = useState(0); // Force component update

  useEffect(() => {
    const checkUser = async () => {
      await pb.authStore.loadFromCookie(document.cookie);
      setUserEmail(pb.authStore.model?.email || null);
    };

    checkUser();

    // Listen for authentication state changes
    const unsubscribe = pb.authStore.onChange(() => {
      setUserEmail(pb.authStore.model?.email || null);
      forceUpdate((prev) => prev + 1); // Force component re-render
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    pb.authStore.clear();
    localStorage.clear();
    setUserEmail(null);
    forceUpdate((prev) => prev + 1); // Force re-render
    router.push("/");
  };

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl">
          FESB
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        {userEmail ? (
          <ul className="menu menu-horizontal px-1">
            <li>
              <details>
                <summary>{userEmail}</summary>
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
        ) : (
          <span className="text-gray-500">Gost</span>
        )}
      </div>

      <div className="navbar-end">
        {userEmail ? (
          <button className="btn" onClick={handleLogout}>
            Odjava
          </button>
        ) : (
          <Link href="/login" className="btn">
            Prijava
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
