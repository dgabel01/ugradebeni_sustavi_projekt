"use client";
import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react"; // for displaying QR code
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const StudentViewPage = () => {
  const router = useRouter();
  const [qrCodes, setQrCodes] = useState<{ course: string; date: string; qrData: string }[]>([]);
  const [email, setEmail] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState("");

  // Check for user email on load
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setEmail(storedEmail);
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

  // Fetch the QR codes from localStorage
  useEffect(() => {
    const storedQRs = JSON.parse(localStorage.getItem("qrCodes") || "[]");
    setQrCodes(storedQRs);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md text-center mb-64 mt-24">
      <h1 className="text-2xl font-bold text-gray-700 mb-4">
        Pozdrav, {email || "Gost"}!
      </h1>
      <p className="text-gray-600 mb-6">Datum i vrijeme: {currentDateTime}</p>
      
      <h2 className="text-2xl font-bold text-gray-700 mb-6">
        QR Kodovi za Danasnje Kolegije
      </h2>

      <div>
        {qrCodes.length === 0 ? (
          <p className="text-gray-600">Nema QR kodova generiranih za danas.</p>
        ) : (
          qrCodes.map((qr, index) => (
            <div key={index} className="bg-gray-100 p-4 rounded-lg mb-6">
              <h3 className="text-xl text-gray-800">{qr.course}</h3>
              <p className="text-gray-600 mb-2">Datum: {qr.date}</p>
              
              <QRCodeCanvas
                value={qr.qrData}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"}
              />

              <div className="mt-4">
                <button
                  onClick={() => router.push(`/qrcode?course=${encodeURIComponent(qr.course)}&date=${qr.date}`)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-500"
                >
                  Prikaz QR Koda
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={() => router.push("/generate")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-500"
        >
          Odjava
        </button>
      </div>
    </div>
  );
};

export default StudentViewPage;
