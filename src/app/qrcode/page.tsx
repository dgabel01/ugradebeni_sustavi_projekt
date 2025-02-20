"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PocketBase from "pocketbase";
import { QRCodeCanvas } from "qrcode.react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import studentsData from "@/data/studenti.json"; // Import students from JSON

dayjs.extend(duration);

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
  const [addedStudents, setAddedStudents] = useState<
    { name: string; surname: string }[]
  >([]); // Store manually added students
  const [qrCodeId, setQrCodeId] = useState(""); // Store the ID


  useEffect(() => {
    const fetchQrCode = async () => {
      const courseParam = searchParams.get("course");

      if (!courseParam) return;

      try {
        const qrCodeData = await pb
          .collection("qrcodes")
          .getFirstListItem(`course = "${courseParam}"`);

        if (qrCodeData) {
          setQrCode(qrCodeData.qrData);
          setExpiresAt(qrCodeData.expiresAt);
          setCourse(courseParam);
        } else {
          console.error("QR Code not found!");
        }
      } catch (error) {
        console.error("Error fetching QR Code:", error);
      }
    };

    fetchQrCode();
  }, [searchParams]);

  useEffect(() => {
    const fetchQrCode = async () => {
      const courseParam = searchParams.get("course");
  
      if (!courseParam) return;
  
      try {
        const qrCodeData = await pb
          .collection("qrcodes")
          .getFirstListItem(`course = "${courseParam}"`);
  
        if (qrCodeData) {
          setQrCode(qrCodeData.qrData);
          setQrCodeId(qrCodeData.id); // Store the QR Code ID
          setExpiresAt(qrCodeData.expiresAt);
          setCourse(courseParam);
        } else {
          console.error("QR Code not found!");
        }
      } catch (error) {
        console.error("Error fetching QR Code:", error);
      }
    };
  
    fetchQrCode();
  }, [searchParams]);

  // Load manually added students from localStorage
  useEffect(() => {
    const fetchStudents = async () => {
      if (!qrCode) return;
  
      try {
        const studentRecords = await pb.collection("students").getFullList({
          filter: `qrCode = "${qrCode}"`, // Fetch students for this QR code
        });
  
        const formattedStudents = studentRecords.map((record: any) => ({
          name: record.name,
          surname: record.surname,
        }));
        setAddedStudents(formattedStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
  
    fetchStudents();
  }, [qrCode]);
  
  // Countdown Timer Effect
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = dayjs();
      const expirationTime = dayjs(expiresAt);
      const diff = expirationTime.diff(now);

      if (diff <= 0) {
        setTimeLeft("QR kod istekao"); // Stop timer and show expiration message
        return;
      }

      const durationObj = dayjs.duration(diff);
      const minutes = durationObj.minutes();
      const seconds = durationObj.seconds();
      setTimeLeft(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Add student to the local list and save to localStorage
  const handleAddStudent = async () => {
    if (!selectedStudent || !qrCodeId) {
      console.error("Error: Student or QR Code ID is missing.");
      return;
    }
  
    const newStudent = studentsData.find(
      (student: { name: string; surname: string }) =>
        `${student.name} ${student.surname}` === selectedStudent
    );
  
    if (!newStudent) {
      console.error("Student not found in local data");
      return;
    }
  
    try {
      const filterQuery = `name="${newStudent.name}" && surname="${newStudent.surname}"`;
  
      try {
        const existingStudent = await pb.collection("students").getFirstListItem(filterQuery);
  
        if (existingStudent) {
          await pb.collection("students").update(existingStudent.id, { qrCode: qrCodeId });
          console.log("Student updated with QR Code:", existingStudent.id);
        }
      } catch (error) {
        if (error instanceof Error && (error as any).status === 404) {
          console.log("Student not found, creating new record...");
          await pb.collection("students").create({
            name: newStudent.name,
            surname: newStudent.surname,
            qrCode: qrCodeId,
            scannedAt: new Date().toISOString(),
          });
          console.log("New student added and linked to QR Code.");
        } else {
          console.error("Error checking/adding student:", error);
        }
      }
  
      await fetchStudents(); 
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  const fetchStudents = async () => {
    if (!qrCodeId) return;
  
    try {
      const studentRecords = await pb.collection("students").getFullList({
        filter: `qrCode = "${qrCodeId}"`, // Fetch students linked to this QR code
      });
  
      const formattedStudents = studentRecords.map((record: any) => ({
        name: record.name,
        surname: record.surname,
      }));
  
      setAddedStudents(formattedStudents); 
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };
  
  // Fetch students when QR Code ID is available
  useEffect(() => {
    fetchStudents();
  }, [qrCodeId]); 
  
  

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-md text-center mb-64 mt-24">
      <h1 className="text-2xl font-bold text-gray-700 mb-4">QR Kod za:</h1>
      <h2 className="text-xl text-gray-800 mb-2">{course}</h2>

      <div className="flex justify-center mb-4">
        {qrCode ? (
          <div className="bg-gray-100 p-4 rounded-lg inline-block">
            <QRCodeCanvas
              value={qrCode}
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"H"}
            />
            <p className="mt-2 text-red-500 font-semibold">
              Kod istječe za: {timeLeft}
            </p>
          </div>
        ) : (
          <p>QR Code not found!</p>
        )}
      </div>

      {/* Dropdown for selecting a student */}
      <div className="mt-6">
        <label className="block text-gray-700 font-semibold mb-2">
          Odaberi Studenta:
        </label>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="w-full p-2 border rounded-lg"
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
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-500"
        >
          Dodaj ručno
        </button>

        <p className="mt-4 text-gray-700">
          Odabrani student:{" "}
          <span className="font-semibold">{selectedStudent || "Nema"}</span>
        </p>
      </div>

      {/* List of added students */}
      <div className="mt-6 text-left">
        <h3 className="text-lg font-semibold text-gray-700">
          Evidentirani studenti:
        </h3>
        <ul className="mt-2">
          {addedStudents.length > 0 ? (
            addedStudents.map((student, index) => (
              <li key={index} className="text-gray-800">
                {student.name} {student.surname}
              </li>
            ))
          ) : (
            <p className="text-gray-500">Nema evidentiranih studenata.</p>
          )}
        </ul>
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.push("/generate")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-500"
        >
          Povratak
        </button>
      </div>
    </div>
  );
};

export default QrCodePage;
