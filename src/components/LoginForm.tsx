"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PocketBase from "pocketbase";

const pb = new PocketBase("http://127.0.0.1:8090"); // Your PocketBase URL

const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const authData = await pb.collection("users").authWithPassword(email, password);

      // Store auth in cookies for middleware
      document.cookie = pb.authStore.exportToCookie({ httpOnly: false });

      if (authData.record.role === "professor") {
        router.push("/generate"); // Redirect professors
      } else if (authData.record.role === "student") {
        router.push("/student"); // Redirect students
      } else {
        setError("Unauthorized role");
      }
    } catch (err: any) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-12 rounded-2xl shadow-lg mt-20 border-t-[1px] border-t-muted">
      <h2 className="text-3xl font-bold text-center mb-6">QR evidencija prijava</h2>

      {/* Error message */}
      {error && <p className="text-red-500 text-center text-lg">{error}</p>}

      <form onSubmit={handleLogin} className="space-y-6">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-4 border rounded-lg text-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 border rounded-lg text-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-lg text-lg hover:bg-blue-700 transition">
          Prijava
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
