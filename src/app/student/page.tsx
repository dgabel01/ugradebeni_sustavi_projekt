"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import PocketBase, { RecordModel } from "pocketbase";
import Webcam from "react-webcam";
import dayjs from "dayjs";
import jsQR from "jsqr";
import { useRouter } from "next/navigation";

// Create a fresh instance of PocketBase to avoid any cached auth issues
const pb = new PocketBase("http://127.0.0.1:8090");
pb.autoCancellation(false);

const StudentViewPage = () => {
  const router = useRouter();
  const [qrCodes, setQrCodes] = useState<RecordModel[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [scannedData, setScannedData] = useState(""); // Store scanned QR data
  const [userData, setUserData] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const webcamRef = useRef<Webcam>(null);

  // Enhanced authentication check
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      setAuthError(null);
      
      try {
        // Make sure we load the latest cookie data
        pb.authStore.loadFromCookie(document.cookie);
        
        // Check if we have a valid auth token
        if (pb.authStore.isValid) {
          console.log("Auth token is valid");
          
          try {
            // Fetch the latest user data to ensure we have the most up-to-date information
            if (pb.authStore.model) {
              const userData = await pb.collection('users').getOne(pb.authStore.model.id);
              setUserData(userData);
            } else {
              throw new Error("Auth model is null");
            }
            console.log("User data successfully retrieved:", userData);
            setUserData(userData);
          } catch (userFetchError) {
            console.error("Error fetching user data:", userFetchError);
            setAuthError("Failed to load user data. Please log in again.");
            pb.authStore.clear();
          }
        } else {
          console.log("No valid auth token found");
          setAuthError("You're not logged in. Please log in to track attendance.");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setAuthError("Authentication error. Please log in again.");
        // Clear any potentially corrupt auth data
        pb.authStore.clear();
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
    
    // Add event listener for storage changes (to detect login/logout in other tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === 'pocketbase_auth') {
        checkAuth();
      }
    });
    
    return () => {
      window.removeEventListener('storage', () => {});
    };
  }, []);

  // Fetch QR codes after authentication is confirmed
  useEffect(() => {
    if (!authLoading && userData) {
      const fetchQrCodes = async () => {
        try {
          const data = await pb.collection("qrcodes").getFullList();
          setQrCodes(data);
        } catch (error) {
          console.error("Error fetching QR codes:", error);
        }
      };

      fetchQrCodes();
    }
  }, [authLoading, userData]);

  const toggleCamera = () => {
    if (!userData) {
      const shouldLogin = window.confirm("You need to be logged in to scan QR codes. Go to login page?");
      if (shouldLogin) {
        router.push("/login");
      }
      return;
    }
    
    setIsCameraOpen((prevState) => !prevState);
    setScannedData(""); // Clear previous scan when reopening camera
  };

  const scanQRCode = useCallback(() => {
    if (!webcamRef.current) return;

    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

    if (qrCode) {
      setScannedData(qrCode.data);
      setIsCameraOpen(false); // Close camera after successful scan
      
      // Only try to save if we have user data
      if (userData) {
        saveScanToDatabase(qrCode.data);
      } else {
        const shouldLogin = window.confirm("You need to be logged in to record attendance. Go to login page?");
        if (shouldLogin) {
          router.push("/login?redirect=student");
        }
      }
    }
  }, [userData, router]);

  // Save scanned QR to PocketBase
  const saveScanToDatabase = async (qrCodeData: string) => {
    // Double-check authentication again
    if (!userData) {
      console.error("Cannot save scan: No user data available");
      const shouldLogin = window.confirm("Session expired. Please log in again to record attendance.");
      if (shouldLogin) {
        router.push("/login?redirect=student");
      }
      return;
    }
  
    try {
      console.log("Processing QR data:", qrCodeData);
      
      // Extract course from QR data (format is "Course Name|Date")
      const parts = qrCodeData.split("|");
      const courseName = parts[0];
      
      console.log("Looking for QR code with course:", courseName);
      
      // Find the QR code record in the 'qrcodes' collection using multiple strategies
      let matchingQrCode = null;
      
      // Strategy 1: Try exact match on qrData
      try {
        matchingQrCode = await pb.collection("qrcodes").getFirstListItem(`qrData="${qrCodeData}"`);
        console.log("Found QR code by exact match:", matchingQrCode.id);
      } catch (error) {
        console.log("No exact match found, trying course name match...");
        
        // Strategy 2: Try matching by course name
        try {
          matchingQrCode = await pb.collection("qrcodes").getFirstListItem(`course="${courseName}"`);
          console.log("Found QR code by course name:", matchingQrCode.id);
        } catch (innerError) {
          console.error("No matching QR code found:", innerError);
        }
      }
  
      if (!matchingQrCode) {
        alert(`QR code not found in the database. Scanned course: ${courseName}`);
        return;
      }
      
      // Check if user has already scanned this QR code
      try {
        const existingRecord = await pb.collection("students").getFirstListItem(
          `user="${userData.id}" && qrCode="${matchingQrCode.id}"`
        );
        
        if (existingRecord) {
          alert("You have already recorded attendance for this session!");
          return;
        }
      } catch (error) {
        // No existing record found, proceed with creating new one
        console.log("No duplicate attendance record found, proceeding...");
      }
  
      console.log("Creating attendance record with user ID:", userData.id);
      
      // Store the relation by referencing the id of the matched QR code
      const scanRecord = await pb.collection("students").create({
        user: userData.id, // Link scan to user
        name: userData.name || "Unknown",
        surname: userData.surname || "User",
        qrCode: matchingQrCode.id, // Store the related QR code ID
        scannedAt: dayjs().format(), // Store timestamp
      });
  
      console.log("Attendance saved:", scanRecord);
      alert("Attendance successfully recorded!");
    } catch (error) {
      console.error("Error saving attendance:", error);
      if (error instanceof Error) {
        alert(`Failed to record attendance: ${error.message || "Unknown error"}`);
      } else {
        alert("Failed to record attendance: Unknown error");
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isCameraOpen) {
      interval = setInterval(scanQRCode, 1000); // Scan every second
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCameraOpen, scanQRCode]);

  const today = dayjs().format("YYYY-MM-DD");

  const groupedByDate = qrCodes.reduce((acc, qr) => {
    const qrDate = dayjs(qr.date).format("YYYY-MM-DD");
    if (!acc[qrDate]) acc[qrDate] = [];
    acc[qrDate].push(qr);
    return acc;
  }, {} as Record<string, RecordModel[]>);

  const todaysLessons = groupedByDate[today] || [];
  const pastLessons = Object.keys(groupedByDate)
    .filter((date) => date !== today)
    .sort((a, b) => dayjs(b).diff(dayjs(a)));
    
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-lg">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 mb-96 mt-24">
      <h1 className="font-bold text-3xl text-center">Skenirani QR kodovi studenta:</h1>
      
      {authError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 w-full max-w-lg">
          <p className="font-bold">Upozorenje:</p>
          <p>{authError}</p>
          <button 
            onClick={() => router.push("/login?redirect=student")}
            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
          >
            Prijavi se
          </button>
        </div>
      )}
      
      {userData && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 w-full max-w-lg">
          <p className="font-bold">Prijavljeni ste kao:</p>
          <p>{userData.name} {userData.surname} ({userData.email})</p>
        </div>
      )}

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

      {isCameraOpen && (
        <div className="mt-6 w-full max-w-lg">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={{ facingMode: "environment" }}
          />
          <button
            onClick={() => setIsCameraOpen(false)}
            className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Zatvori kameru
          </button>
        </div>
      )}

      {scannedData && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center w-full max-w-lg">
          <h3 className="font-bold text-lg">Skeniran QR kod:</h3>
          <p className="text-green-600 font-semibold break-all">{scannedData}</p>
        </div>
      )}
    </div>
  );
};

export default StudentViewPage;