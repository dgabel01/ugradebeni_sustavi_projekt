"use client";
import React, { useState, useEffect } from 'react';
import PocketBase, { RecordModel } from "pocketbase";
import { QRCodeCanvas } from "qrcode.react";

const pb = new PocketBase("http://127.0.0.1:8090");
pb.autoCancellation(false)

const StudentViewPage = () => {
  const [qrCodes, setQrCodes] = useState<RecordModel[]>([]);

  const date = new Date().toLocaleDateString();

  useEffect(() => {
    pb.collection("qrcodes")
      .getFullList()
      .then(setQrCodes);
  }, []);

  return (
    <div className="flex flex-col  items-center justify-center gap-16 mb-96">
      <h1 className="font-bold text-2xl text-center">QR kodovi za: {date}</h1>
      {qrCodes.length === 0 ? <p>No QR codes available.</p> : null}
      {qrCodes.map((qr) => (
        <div key={qr.id} className='rounded-xl border-[1px] flex flex-col gap-4 p-4 items-center justify-center'>
          <h2 className='font-bold text-xl'>{qr.course}</h2>
          <p>{qr.date}</p>
          <QRCodeCanvas value={qr.qrData} size={190} />
        </div>
      ))}
    </div>
  );
}

export default StudentViewPage;
