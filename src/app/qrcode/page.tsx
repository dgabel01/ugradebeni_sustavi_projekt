"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PocketBase from "pocketbase";
import { QRCodeCanvas } from "qrcode.react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import studentsData from "@/data/studenti.json"; // Import students from JSON
import utc from "dayjs/plugin/utc";

dayjs.extend(duration);
dayjs.extend(utc);

const pb = new PocketBase("http://127.0.0.1:8090");
pb.autoCancellation(false);

const QrCodePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [course, setCourse] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [qrCode, setQrCode] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [addedStudents, setAddedStudents] = useState<{ name: string; surname: string }[]>([]);
  const [qrCodeId, setQrCodeId] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const fetchQrCode = async () => {
      const courseParam = searchParams.get("course");
      if (!courseParam) return;

      try {
        const qrCodeData = await pb.collection("qrcodes").getFirstListItem(`course = "${courseParam}"`, {
          sort: "-created" // Sort by creation time in descending order, so the newest one is fetched
        });
                if (qrCodeData) {
          setQrCode(qrCodeData.qrData);
          setQrCodeId(qrCodeData.id);
          setExpiresAt(qrCodeData.expiresAt);  // This is the expiration time from the database
          setCourse(courseParam);
          setIsExpired(qrCodeData.expired);
        } else {
          console.error("QR Code not found!");
        }
      } catch (error) {
        console.error("Error fetching QR Code:", error);
      }
    };

    fetchQrCode();
  }, [searchParams]);

  // Countdown timer effect
  useEffect(() => {
    if (!expiresAt || isExpired) {
      setTimeLeft("QR kod istekao");
      return;
    }
  
    let expirationTime = dayjs(expiresAt).utc().subtract(1, "hour");
    const now = dayjs().utc();
    const diffSeconds = expirationTime.diff(now, "seconds");
  
    if (diffSeconds <= 0) {
      setTimeLeft("QR kod istekao");
      setIsExpired(true);
  
      const updateExpiredFlag = async () => {
        try {
          await pb.collection("qrcodes").update(qrCodeId, { expired: true });
          console.log("QR Code marked as expired.");
        } catch (error) {
          console.error("Error updating expiration:", error);
        }
      };
  
      updateExpiredFlag();
      return;
    }
  
    const updateTimer = () => {
      const now = dayjs().utc();
      const diff = expirationTime.diff(now);
  
      if (diff <= 0) {
        setTimeLeft("QR kod istekao");
        setIsExpired(true);
        return;
      }
  
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s`);
    };
  
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
  
    return () => clearInterval(interval);
  }, [expiresAt, isExpired, qrCodeId]);
  
  

  // Load manually added students from PocketBase
  useEffect(() => {
    const fetchStudents = async () => {
      if (!qrCodeId) return;

      try {
        const studentRecords = await pb.collection("students").getFullList({
          filter: `qrCode = "${qrCodeId}"`,
        });

        const formattedStudents = studentRecords.map((record) => ({
          name: record.name,
          surname: record.surname,
        }));

        setAddedStudents(formattedStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, [qrCodeId]);

  const handleAddStudent = async () => {
    if (!selectedStudent || !qrCodeId || isExpired) {
      console.error("Error: Student or QR Code ID is missing, or QR is expired.");
      return;
    }
  
    const newStudent = studentsData.find(
      (student) => `${student.name} ${student.surname}` === selectedStudent
    );
  
    if (!newStudent) {
      console.error("Student not found in local data");
      return;
    }
  
    try {
      // Check if the student has already scanned THIS specific QR code
      const filterQuery = `name="${newStudent.name}" && surname="${newStudent.surname}" && qrCode="${qrCodeId}"`;
      const existingScans = await pb.collection("students").getFirstListItem(filterQuery).catch(() => null);
  
      if (existingScans) {
        console.log("Student has already scanned this QR Code.");
        return;
      }
  
      // If not, create a new record for this QR code scan
      await pb.collection("students").create({
        name: newStudent.name,
        surname: newStudent.surname,
        qrCode: qrCodeId,
        scannedAt: new Date().toISOString(),
      });
  
      setAddedStudents([...addedStudents, newStudent]);
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };
  

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8 max-w-md mx-auto p-6 bg-white rounded-2xl shadow-md text-center mb-64 mt-24 border-t-[1px]">
      <h1 className="text-2xl font-bold text-gray-700 mb-4">QR Kod za:</h1>
      <h2 className="text-xl text-white font-extrabold  mb-2 rounded-xl border-[2px] bg-indigo-600 w-64 mx-auto">{course}</h2>

      <div className="flex justify-center mb-4">
        {qrCode ? (
          <div className="bg-gray-100 p-4 rounded-lg flex flex-col gap-2 items-center justify-center">
            <QRCodeCanvas
              value={qrCode}
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"H"}
            />
            <p className="mt-2 text-red-500 text-lg font-semibold">
              Kod istječe za: {timeLeft}
            </p>
          </div>
        ) : (
          <p>QR Code not found!</p>
        )}
      </div>

      <div className="mt-6">
        <label className="block text-gray-700 text-xl font-semibold mb-2">
          Odaberi Studenta:
        </label>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="w-full p-2 border rounded-lg"
          disabled={isExpired}
        >
          <option value="">-- Odaberi --</option>
          {studentsData.map((student, index) => (
            <option key={index} value={`${student.name} ${student.surname}`}>
              {student.name} {student.surname}
            </option>
          ))}
        </select>

        <button
          onClick={handleAddStudent}
          className={`mt-4 px-4 py-2 rounded-lg shadow font-bold ${
            isExpired
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-500"
          }`}
          disabled={isExpired}
        >
          Dodaj ručno
        </button>

        <p className="mt-4 text-gray-700 text-xl">
          Odabrani student:{" "}
          <span className="font-semibold">{selectedStudent || "Nema"}</span>
        </p>
      </div>

      <div className="mt-6 text-left">
        <h3 className="text-xl font-semibold text-gray-700">Evidentirani studenti:</h3>
        <ul className="mt-2">
          {addedStudents.length > 0 ? (
            addedStudents.map((student, index) => (
              <li key={index} className="text-gray-800 text-lg">
                {student.name} {student.surname}
              </li>
            ))
          ) : (
            <p className="text-gray-500 text-xl">Nema evidentiranih studenata.</p>
          )}
        </ul>
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.push("/generate")}
          className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg shadow hover:bg-indigo-500"
        >
          Povratak
        </button>
      </div>
    </div>
  );
};

export default QrCodePage;
