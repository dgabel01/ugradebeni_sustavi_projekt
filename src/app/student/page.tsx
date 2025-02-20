"use client";
import React, { useState, useEffect } from 'react';
import PocketBase, { RecordModel } from "pocketbase";
import { QRCodeCanvas } from "qrcode.react";
import Webcam from 'react-webcam';

const pb = new PocketBase("http://127.0.0.1:8090");
pb.autoCancellation(false)

const StudentViewPage = () => {
  const [qrCodes, setQrCodes] = useState<RecordModel[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const date = new Date().toLocaleDateString();

  // Fetch QR codes when component mounts
  useEffect(() => {
    pb.collection("qrcodes")
      .getFullList()
      .then(setQrCodes);
  }, []);

  const toggleCamera = () => {
    setIsCameraOpen((prevState) => !prevState); // Toggle camera open/close
  };

  return (
    <div className="flex flex-col items-center justify-center gap-16 mb-96">
      <h1 className="font-bold text-2xl text-center">Skenirani QR kodovi za: {date}</h1>

      {qrCodes.length === 0 && <p>Nema skeniranih QR kodova.</p>}

      {qrCodes.map((qr) => (
        <div key={qr.id} className="rounded-xl border-[1px] flex flex-col gap-4 p-4 items-center justify-center">
          <h2 className="font-bold text-xl">{qr.course}</h2>
          <p>{qr.date}</p>
          <QRCodeCanvas value={qr.qrData} size={190} />
        </div>
      ))}

      {/* Button to open/close the camera */}
      <button
        onClick={toggleCamera}
        className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-500"
      >
        {isCameraOpen ? "Close Camera" : "Open Camera"}
      </button>

      {/* Webcam feed */}
      {isCameraOpen && (
        <div className="mt-6">
          <Webcam
            audio={false}
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={{
              facingMode: "environment", // This will try to use the back camera
            }}
          />
        </div>
      )}
    </div>
  );
}

export default StudentViewPage;
