"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PocketBase from "pocketbase";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

const pb = new PocketBase("http://127.0.0.1:8090"); // Adjust to your PocketBase URL
pb.autoCancellation(false)

const courses = [
  "Operacijski sustavi",
  "Arhitektura digitalnih računala",
  "Ugradbeni računalni sustavi",
];

const GenerateQrPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [activeTimers, setActiveTimers] = useState<{ [key: string]: boolean }>({});

  // Check for user email on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await pb.authStore.loadFromCookie(document.cookie);
        const user = pb.authStore.model;

        if (!user) {
          router.push("/login"); // Redirect if not authenticated
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

  // Fetch existing QR code data from PocketBase
  useEffect(() => {
    const checkActiveTimers = async () => {
      const timers: { [key: string]: boolean } = {};

      for (const course of courses) {
        const date = dayjs().format("YYYY-MM-DD");
        try {
          const qrCodeData = await pb
            .collection("qrcodes")
            .getFirstListItem(`course = "${course}" && date = "${date}"`);

          const expiresAt = dayjs(qrCodeData.expiresAt);
          const now = dayjs();
          
          // If QR code exists and expiration time is greater than the current time, it's active
          if (expiresAt.isAfter(now)) {
            timers[course] = true;
          } else {
            timers[course] = false;
          }
        } catch (error) {
          // If no QR code found for the course on that date, assume it's inactive
          timers[course] = false;
        }
      }

      setActiveTimers(timers);
    };

    checkActiveTimers();
  }, []);

  const handleQrAction = async (course: string) => {
    const date = dayjs().format("YYYY-MM-DD");
    const expiresAt = dayjs().add(10, "minutes").format("YYYY-MM-DD HH:mm:ss"); // Expire in 10 minutes
    const qrData = `${course} - ${date}`;

    if (activeTimers[course]) {
      // If an active timer exists, go to the QR Code page
      router.push(`/qrcode?course=${encodeURIComponent(course)}&date=${date}&expiresAt=${expiresAt}`);
    } else {
      try {
        // Create new QR code if it doesn't exist or expired
        await pb.collection("qrcodes").create({
          course,
          date, // Save the full date format
          qrData,
          expiresAt, // Set expiration time (10 minutes from now)
        });

        // After generating, redirect to QR Code page
        router.push(`/qrcode?course=${encodeURIComponent(course)}&date=${date}&expiresAt=${expiresAt}`);
      } catch (error) {
        console.error("Error creating QR code:", error);
      }
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
          const isActive = !!activeTimers[course];

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
