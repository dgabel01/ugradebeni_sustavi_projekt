"use client";
import React, { useState, useEffect } from "react";
import PocketBase, { RecordModel } from "pocketbase";
import Webcam from "react-webcam";
import dayjs from "dayjs";

const pb = new PocketBase("http://127.0.0.1:8090");
pb.autoCancellation(false);

const StudentViewPage = () => {
  const [qrCodes, setQrCodes] = useState<RecordModel[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchQrCodes = async () => {
      try {
        const data = await pb.collection("qrcodes").getFullList();
        setQrCodes(data);
      } catch (error) {
        console.error("Error fetching QR codes:", error);
      }
    };

    fetchQrCodes();
  }, []);

  const toggleCamera = () => {
    setIsCameraOpen((prevState) => !prevState);
  };

  // Get today's date in YYYY-MM-DD format
  const today = dayjs().format("YYYY-MM-DD");

  // Group QR codes by date
  const groupedByDate = qrCodes.reduce((acc, qr) => {
    const qrDate = dayjs(qr.date).format("YYYY-MM-DD");
    if (!acc[qrDate]) {
      acc[qrDate] = [];
    }
    acc[qrDate].push(qr);
    return acc;
  }, {} as Record<string, RecordModel[]>);

  // Separate today's lessons
  const todaysLessons = groupedByDate[today] || [];
  const pastLessons = Object.keys(groupedByDate)
    .filter((date) => date !== today)
    .sort((a, b) => dayjs(b).diff(dayjs(a))); // Sort from newest to oldest

  return (
    <div className="flex flex-col items-center justify-center gap-8 mb-96 mt-24">
      <h1 className="font-bold text-3xl text-center">Skenirani QR kodovi studenta:</h1>

      {/* Today's lessons without QR codes */}
      {todaysLessons.length > 0 ? (
        <div className="w-full max-w-lg">
          <h2 className="font-bold text-xl text-center mb-4">
            Današnje lekcije ({today}):
          </h2>
          <div className="flex flex-col gap-6">
            {todaysLessons.map((qr) => (
              <div
                key={qr.id}
                className="rounded-xl border-[1px] flex flex-row justify-between p-4 items-center"
              >
                <h3 className="font-bold text-lg">{qr.course}</h3>
                <button
                  onClick={toggleCamera}
                  className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-green-500"
                >
                  Skeniraj
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Nema današnjih QR kodova.</p>
      )}

      {/* Past lessons dropdown */}
      {pastLessons.length > 0 && (
        <div className="w-full max-w-lg mt-8">
          <h2 className="font-bold text-xl text-center mb-4">Prošli QR kodovi:</h2>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">-- Odaberi datum --</option>
            {pastLessons.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>

          {/* Display selected past QR codes */}
          {selectedDate && (
            <div className="mt-6 flex flex-col gap-6">
              {groupedByDate[selectedDate].map((qr) => (
                <div
                  key={qr.id}
                  className="rounded-xl border-[1px] flex flex-col gap-4 p-4 items-center justify-center"
                >
                  <h3 className="font-bold text-lg">{qr.course}</h3>
                  <p className="text-gray-500">QR kod za {qr.course}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Webcam feed */}
      {isCameraOpen && (
        <div className="mt-6">
          <Webcam
            audio={false}
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={{ facingMode: "environment" }}
          />
        </div>
      )}
    </div>
  );
};

export default StudentViewPage;
