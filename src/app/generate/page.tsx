"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { default as dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

const courses = [
  "Operacijski sustavi",
  "Arhitektura digitalnih računala",
  "Ugradbeni računalni sustavi",
];

const GenerateQrPage = () => {
  const router = useRouter();
  const [activeTimers, setActiveTimers] = useState<{ [key: string]: string }>(
    {}
  );
  const [email, setEmail] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState("");

  // Check for user email on load
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push("/"); // Redirect to login if no email found
    }
  }, [router]);

  // Live Clock using native JS Date
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentDateTime(
        `${now.toLocaleDateString("hr-HR")} ${now.toLocaleTimeString("hr-HR")}`
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check for existing timers on load
  useEffect(() => {
    const timers: { [key: string]: string } = {};

    courses.forEach((course) => {
      const date = dayjs().format("YYYY-MM-DD");
      const qrKey = `${course}-${date}`;
      const startTime = localStorage.getItem(qrKey);

      if (startTime) {
        const now = dayjs();
        const start = dayjs(startTime);
        const diff = now.diff(start, "second");

        if (diff < 600) {
          // Timer is still active
          const remaining = dayjs.duration(600 - diff, "seconds");
          timers[qrKey] = remaining.format("mm:ss");
        } else {
          // Timer expired
          localStorage.removeItem(qrKey);
        }
      }
    });

    setActiveTimers(timers);
  }, []);

  const handleQrAction = (course: string) => {
    const date = dayjs().format("YYYY-MM-DD");
    const qrKey = `${course}-${date}`;

    if (activeTimers[qrKey]) {
      // If an active timer exists, go to the QR Code
      router.push(`/qrcode?course=${encodeURIComponent(course)}&date=${date}`);
    } else {
      // Start a new QR Code timer
      const startTime = dayjs().toISOString();
      localStorage.setItem(qrKey, startTime);

      router.push(`/qrcode?course=${encodeURIComponent(course)}&date=${date}`);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-12 mt-24 bg-white rounded-2xl shadow-md text-center mb-96">
      <h1 className="text-2xl font-bold text-gray-700 mb-4">
        Pozdrav, {email || "Gost"}!
      </h1>
      <p className="text-gray-600 mb-6">Datum i vrijeme: {currentDateTime}</p>
      <h1 className="text-2xl font-bold text-gray-700 mb-6">
        Današnji Popis Kolegija
      </h1>
      <ul className="space-y-4">
        {courses.map((course) => {
          const date = dayjs().format("YYYY-MM-DD");
          const qrKey = `${course}-${date}`;
          const isActive = !!activeTimers[qrKey];

          return (
            <li
              key={course}
              className="bg-gray-100 p-4 rounded-lg flex justify-between items-center"
            >
              <span className="text-gray-800 font-semibold">{course}</span>
              <button
                onClick={() => handleQrAction(course)}
                className={`px-4 py-2 rounded-lg shadow ${
                  isActive
                    ? "bg-green-600 text-white hover:bg-green-500"
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                {isActive ? "Idi na QR Kod" : "Generiraj QR Kod"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default GenerateQrPage;
