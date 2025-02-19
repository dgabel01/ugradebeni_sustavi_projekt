"use client"
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PocketBase from "pocketbase";
import { QRCodeCanvas } from "qrcode.react";
import { useRouter } from "next/navigation";

const pb = new PocketBase("http://127.0.0.1:8090");
pb.autoCancellation(false)


const QrCodePage = () => {
  const router = useRouter();

  const searchParams = useSearchParams();
  const [qrData, setQrData] = useState("");
  const [course, setCourse] = useState("");
  const [date, setDate] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    const fetchQrCode = async () => {
      const courseParam = searchParams.get("course");
      const expiresAtParam = searchParams.get("expiresAt");
      console.log('crcodepage expires at:'+''+expiresAtParam)
    
      if (courseParam && expiresAtParam) {
        setCourse(courseParam);
        setExpiresAt(expiresAtParam);
    
        try {
          // Ensure the expiresAtParam is in the same format as stored in the database
          const qrCodeData = await pb.collection("qrcodes").getFirstListItem(
            `course = "${courseParam}"`
          );
    
          if (qrCodeData) {
            setQrCode(qrCodeData.qrData);  // Set the qrData if found
          } else {
            console.error("QR Code not found!");
          }
        } catch (error) {
          console.error("Error fetching QR Code:", error);
        }
      }
    };
    

    fetchQrCode();
  }, [searchParams]);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-md text-center mb-64 mt-24">
      <h1 className="text-2xl font-bold text-gray-700 mb-4">QR Kod za:</h1>
      <h2 className="text-xl text-gray-800 mb-2">{course}</h2>
      <p className="text-gray-600 mb-6">{date}</p>

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
          </div>
        ) : (
          <p>QR Code not found!</p>
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
    </div>
  );
};

export default QrCodePage;
