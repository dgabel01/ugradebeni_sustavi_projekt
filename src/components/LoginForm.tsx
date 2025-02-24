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
    <div className="max-w-sm mx-auto bg-white p-6 rounded shadow mt-24">
      <h2 className="text-2xl font-bold text-center mb-4">Login</h2>

      {/* Error message */}
      {error && <p className="text-red-500 text-center">{error}</p>}

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
