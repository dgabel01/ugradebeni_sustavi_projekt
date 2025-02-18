"use client";
import Image from "next/image";
import { useState } from "react";
import logo from "../../public/fesb-logo.webp";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const router = useRouter();
  const [role, setRole] = useState<string>("");

  const handleClick = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const emailElement = document.getElementById(
      "email"
    ) as HTMLInputElement | null;
    if (emailElement && role === "Profesor") {
      const email = emailElement.value;
      localStorage.setItem("userEmail", email); // Store email in localStorage
      router.push(`/generate`);
    } else router.push("/student");
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value);
  };

  return (
    <div className="flex flex-col w-full md:w-1/2 xl:w-2/5 2xl:w-2/5 3xl:w-1/3 mx-auto p-8 md:p-12 2xl:p-12 3xl:p-14 bg-[#ffffff] rounded-2xl shadow-xl my-36">
      <div className="flex flex-col items-center justify-center gap-3 pb-4">
        <div className="my-4">
          <Image width="96" src={logo} alt="Logo" />
        </div>
        <h1 className="text-3xl font-bold text-[#4B5563] my-auto">
          QR Sustav pristutnosti
        </h1>
        <select
          className="select select-bordered w-full max-w-xs my-4"
          value={role} // Use value prop instead of selected
          onChange={handleRoleChange}
        >
          <option disabled value="">
            Prijava kao:
          </option>
          <option value="Profesor">Profesor</option>
          <option value="Student">Student</option>
        </select>
      </div>
      <form className="flex flex-col">
        <div className="pb-2">
          <label
            htmlFor="email"
            className="block mb-2 text-sm font-bold text-[#111827]"
          >
            Email
          </label>
          <div className="relative text-gray-400">
            <span className="absolute inset-y-0 left-0 flex items-center p-1 pl-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-mail"
              >
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
            </span>
            <input
              type="email"
              name="email"
              id="email"
              className="pl-12 mb-2 bg-gray-50 text-gray-600 border focus:border-transparent border-gray-300 sm:text-sm rounded-lg ring-3 ring-transparent focus:ring-1 focus:outline-hidden focus:ring-gray-400 block w-full p-2.5 rounded-l-lg py-3 px-4"
              placeholder="@aaiedu.hr"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="pb-6">
          <label
            htmlFor="password"
            className="block mb-2 text-sm font-bold text-[#111827]"
          >
            Lozinka
          </label>
          <div className="relative text-gray-400">
            <span className="absolute inset-y-0 left-0 flex items-center p-1 pl-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-square-asterisk"
              >
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M12 8v8"></path>
                <path d="m8.5 14 7-4"></path>
                <path d="m8.5 10 7 4"></path>
              </svg>
            </span>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="••••••••••"
              className="pl-12 mb-2 bg-gray-50 text-gray-600 border focus:border-transparent border-gray-300 sm:text-sm rounded-lg ring-3 ring-transparent focus:ring-1 focus:outline-hidden focus:ring-gray-400 block w-full p-2.5 rounded-l-lg py-3 px-4"
              autoComplete="new-password"
            />
          </div>
        </div>
        <button
          type="submit"
          onClick={handleClick}
          className="w-full text-[#FFFFFF] bg-[#4F46E5] focus:ring-4 focus:outline-hidden focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-6"
        >
          Prijava
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
