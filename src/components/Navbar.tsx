"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import PocketBase from "pocketbase";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Image from "next/image";
import fesbLogo from "../../public/fesb-logo.webp";

const pb = new PocketBase("http://127.0.0.1:8090");

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [, forceUpdate] = useState(0); // Force component update
  const [isStudentView, SetisStudentView] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      await pb.authStore.loadFromCookie(document.cookie);
      setUserEmail(pb.authStore.model?.email || null);
    };

    checkUser();
    checkStudentView(pathname);

    const unsubscribe = pb.authStore.onChange(() => {
      setUserEmail(pb.authStore.model?.email || null);
      forceUpdate((prev) => prev + 1);
    });

    return () => unsubscribe();
  }, [pathname]); // Include pathname as a dependency

  const handleLogout = async () => {
    pb.authStore.clear();
    localStorage.clear();
    setUserEmail(null);
    forceUpdate((prev) => prev + 1); // Force re-render
    router.push("/");
  };

  const checkStudentView = (pathname: string) => {
    SetisStudentView(pathname === "/student");
  };

  const toggleCamera = () => {
    setIsCameraOpen((prevState) => !prevState);
  };

  return (
    <div className="navbar bg-blue-gray-50 rounded-lg bg-blend-exclusion"   style={{ backgroundImage: "url('/Tekstura.png')" }}>
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl">
          <Image src={fesbLogo} width={64} alt="navbar-logo" />
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        {userEmail ? (
          <ul className="menu menu-horizontal px-1">
            <li>
              <details>
                <summary className="font-bold text-lg">{userEmail}</summary>
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
          <button className="btn border-[1px] border-neutral-300" onClick={handleLogout}>
            Odjava
          </button>
        ) : (
          <Link href="/" className="btn">
            Prijava
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
