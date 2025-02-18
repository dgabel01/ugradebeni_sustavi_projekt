"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import studentsData from "@/data/studenti.json";  // Importing the list of students
dayjs.extend(duration);

const QrCodePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [qrData, setQrData] = useState("");
  const [course, setCourse] = useState("");
  const [date, setDate] = useState("");
  const [remainingTime, setRemainingTime] = useState("10:00");
  const [isExpired, setIsExpired] = useState(false);
  const [isTimerLoading, setIsTimerLoading] = useState(true);  // Loading state only for the timer
  const [selectedStudent, setSelectedStudent] = useState("");  // Track selected student
  const [students] = useState(studentsData); // List of all students from the file

  useEffect(() => {
    const courseParam = searchParams.get("course");
    const dateParam = searchParams.get("date");

    if (courseParam && dateParam) {
      setCourse(courseParam);
      setDate(dateParam);
      setQrData(`${courseParam} - ${dateParam}`);

      const qrKey = `${courseParam}-${dateParam}`;
      let startTime = localStorage.getItem(qrKey);

      // If no start time, set a new one
      if (!startTime) {
        startTime = dayjs().toISOString();
        localStorage.setItem(qrKey, startTime);
      }

      // Countdown interval
      const interval = setInterval(() => {
        const now = dayjs();
        const start = dayjs(startTime);
        const diff = now.diff(start, "second");
        const duration = dayjs.duration(600 - diff, "seconds");

        if (diff >= 600) {
          setIsExpired(true);
          clearInterval(interval);
        } else {
          setRemainingTime(duration.format("mm:ss"));
          setIsTimerLoading(false); // Timer is ready
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      router.push("/generate");
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Fetch scanned students from localStorage on page load
    const storedScannedStudents = localStorage.getItem("scannedStudents");
    if (storedScannedStudents) {
      setScannedStudents(JSON.parse(storedScannedStudents));
    }
  }, []);

  const handleAddStudent = () => {
    if (selectedStudent) {
      // Find selected student from the studentsData list
      const student = students.find((s) => `${s.name} ${s.surname}` === selectedStudent);
      if (student) {
        const newScannedStudents = [
          ...scannedStudents,
          { name: student.name, surname: student.surname, scannedAt: dayjs().toISOString() },
        ];

        // Save to localStorage
        localStorage.setItem("scannedStudents", JSON.stringify(newScannedStudents));

        // Update the state to reflect the change
        setScannedStudents(newScannedStudents);
        setSelectedStudent("");  // Clear dropdown selection after adding
      }
    }
  };

  // Retrieve the list of scanned students from localStorage
  const [scannedStudents, setScannedStudents] = useState<{ name: string; surname: string; scannedAt: string }[]>([]);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-md text-center mb-64 mt-24">
      <h1 className="text-2xl font-bold text-gray-700 mb-4">QR Kod za:</h1>
      <h2 className="text-xl text-gray-800 mb-2">{course}</h2>
      <p className="text-gray-600 mb-6">{date}</p>

      <div className="flex justify-center mb-4">
        <div className="bg-gray-100 p-4 rounded-lg inline-block">
          <QRCodeCanvas
            value={qrData}
            size={200}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"H"}
          />
        </div>
      </div>

      <div className="mt-4">
        {!isExpired ? (
          <div>
            {isTimerLoading ? (
              <p className="text-gray-600 font-semibold">Učitavanje vremena...</p>
            ) : (
              <p className="text-red-600 font-semibold">Vrijeme do isteka: {remainingTime}</p>
            )}
          </div>
        ) : (
          <p className="text-red-600 font-bold text-lg">QR Kod je istekao!</p>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.push("/generate")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-500"
        >
          Povratak
        </button>
      </div>

      {/* Dropdown to select and add a student */}
      <div className="mt-6">
        <label htmlFor="studentSelect" className="block text-sm font-semibold mb-2">
          Odaberite studenta ručno:
        </label>
        <select
          id="studentSelect"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="border border-gray-300 p-2 rounded-lg w-full mb-4"
        >
          <option value="">Odaberite studenta</option>
          {students.map((student, index) => (
            <option key={index} value={`${student.name} ${student.surname}`}>
              {student.name} {student.surname}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddStudent}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-500 w-full"
        >
          Dodaj studenta
        </button>
      </div>

      {/* Display list of students who have scanned the QR code */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Studenti koji su skenirali QR kod:</h3>
        <ul className="list-disc pl-5">
          {scannedStudents.length === 0 ? (
            <li className="text-gray-600">Nema studenata koji su skenirali QR kod.</li>
          ) : (
            scannedStudents.map((student, index) => (
              <li key={index} className="text-gray-700">
                {student.name} {student.surname} - {dayjs(student.scannedAt).format("HH:mm:ss")}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default QrCodePage;
