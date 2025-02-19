"use client";
import { useEffect, useState } from "react";
import PocketBase, { RecordModel } from "pocketbase";
import { QRCodeCanvas } from "qrcode.react";

const pb = new PocketBase("http://127.0.0.1:8090");

const StudentViewPage = () => {
  const [qrCodes, setQrCodes] = useState<RecordModel[]>([]);

  useEffect(() => {
    pb.collection("qrcodes")
      .getFullList()
      .then(setQrCodes);
  }, []);

  return (
    <div>
      <h1>QR Codes</h1>
      {qrCodes.length === 0 ? <p>No QR codes available.</p> : null}
      {qrCodes.map((qr) => (
        <div key={qr.id}>
          <h2>{qr.course}</h2>
          <p>{qr.date}</p>
          <QRCodeCanvas value={qr.qrData} size={150} />
        </div>
      ))}
    </div>
  );
};

export default StudentViewPage;
