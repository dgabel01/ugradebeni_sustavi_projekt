"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PocketBase from "pocketbase";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const pb = new PocketBase("http://127.0.0.1:8090"); // Adjust to your PocketBase URL
pb.autoCancellation(false);

const courses = [
  "Operacijski sustavi 250",
  "Arhitektura digitalnih računala 120",
  "Ugradbeni računalni sustavi 250",
];

const GenerateQrPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [activeTimers, setActiveTimers] = useState<{
    [key: string]: string | null;
  }>({});

  // Check for user email on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        pb.authStore.loadFromCookie(document.cookie);
        const user = pb.authStore.model;

        if (!user) {
          router.push("/login");
        } else {
          setEmail(user.email);
        }
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/login");
      }
    };

    checkAuth();
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

  // Fetch existing QR codes for today
  useEffect(() => {
    const checkActiveTimers = async () => {
      const timers: { [key: string]: string | null } = {};

      const startOfDay = dayjs().startOf("day").toISOString();
      const endOfDay = dayjs().endOf("day").toISOString();

      for (const course of courses) {
        try {
          const qrCodeData = await pb
            .collection("qrcodes")
            .getFirstListItem(
              `course = "${course}" && date >= "${startOfDay}" && date <= "${endOfDay}"`
            );

          timers[course] = qrCodeData.id; // Store the QR code ID
        } catch (error) {
          timers[course] = null; // No QR code found
        }
      }

      setActiveTimers(timers);
    };

    checkActiveTimers();
  }, []);

  const handleQrAction = async (course: string) => {
    if (activeTimers[course]) {
      console.log(`QR Code already exists for ${course}`);
      router.push(`/qrcode?course=${encodeURIComponent(course)}`);
      return;
    }

    const date = dayjs().format("YYYY-MM-DD 00:00:00"); // Match stored format
    const expiresAt = dayjs().add(10, "minutes").format("YYYY-MM-DD HH:mm:ss");

    try {
      const qrData = `${course}|${date}`;
      const newQr = await pb.collection("qrcodes").create({
        course,
        date,
        qrData,
        expiresAt,
      });

      setActiveTimers((prev) => ({ ...prev, [course]: newQr.id }));
      router.push(
        `/qrcode?course=${encodeURIComponent(
          course
        )}&date=${date}&expiresAt=${expiresAt}`
      );
    } catch (error) {
      console.error("Error creating QR code:", error);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-16 mt-20 bg-white rounded-3xl shadow-xl text-center mb-32">
      <div className="flex items-center justify-center text-wrap">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Pozdrav, {email || "Gost"}!
        </h1>
      </div>
      <p className="text-gray-600 mb-8 text-2xl">
        Datum i vrijeme: {currentDateTime}
      </p>
      <h1 className="text-3xl font-bold text-gray-700 mb-8">
        Današnji Popis Kolegija
      </h1>
      <ul className="space-y-6">
        {courses.map((course) => {
          const isActive = !!activeTimers[course];
          return (
            <li
              key={course}
              className="bg-gray-200 p-8 rounded-xl flex flex-col sm:flex-row justify-between items-center text-lg sm:text-xl"
            >
              <span className="text-gray-900 font-semibold text-center sm:text-left mb-4 sm:mb-0">
                {course}
              </span>
              <button
                onClick={() => handleQrAction(course)}
                className={`px-6 py-3 text-lg font-medium rounded-xl shadow transition-all duration-300 ${
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
