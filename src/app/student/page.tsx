"use client";
import React, { useState, useEffect } from "react";
import PocketBase, { RecordModel } from "pocketbase";
import { QRCodeCanvas } from "qrcode.react";
import Webcam from "react-webcam";

const pb = new PocketBase("http://127.0.0.1:8090");
pb.autoCancellation(false);

const StudentViewPage = () => {
  const [qrCodes, setQrCodes] = useState<RecordModel[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    pb.collection("qrcodes")
      .getFullList()
      .then((data) => setQrCodes(data));
  }, []);

  const toggleCamera = () => {
    setIsCameraOpen((prevState) => !prevState);
  };

  // Group QR codes by date
  const groupedByDate = qrCodes.reduce((acc, qr) => {
    if (!acc[qr.date]) {
      acc[qr.date] = [];
    }
    acc[qr.date].push(qr);
    return acc;
  }, {} as Record<string, RecordModel[]>);

  return (
    <div className="flex flex-col items-center justify-center gap-16 mb-96 mt-24">
      <h1 className="font-bold text-3xl text-center">Skenirani QR kodovi studenta:</h1>

      {Object.keys(groupedByDate).length === 0 && (
        <p>Nema skeniranih QR kodova.</p>
      )}

      {Object.entries(groupedByDate).map(([date, qrList]) => {
        const formattedDate = new Date(date).toLocaleDateString("en-CA"); // "YYYY-MM-DD" format
        return (
          <div key={formattedDate} className="w-full max-w-lg">
            <h2 className="font-bold text-xl text-center mb-4">
               QR kodovi za: {formattedDate}
            </h2>
            <div className="flex flex-col gap-6">
              {qrList.map((qr) => (
                <div
                  key={qr.id}
                  className="rounded-xl border-[1px] flex flex-col gap-4 p-4 items-center justify-center"
                >
                  <h3 className="font-bold text-lg">{qr.course}</h3>
                  <QRCodeCanvas value={qr.qrData} size={190} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Button to open/close the camera */}
      <button
        onClick={toggleCamera}
        className="mt-4 bg-blue-600 text-white font-bold px-6 py-3 rounded-lg shadow hover:bg-blue-500"
      >
        {isCameraOpen ? "Zatvori kameru" : "Otvori kameru"}
      </button>

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
