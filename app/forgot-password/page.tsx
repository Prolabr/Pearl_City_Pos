"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function sendRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    setMessage(data.message);
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={sendRequest} className="p-6 border rounded w-96">
        <h1 className="text-xl mb-4">Forgot Password</h1>

        <input
          className="border p-2 w-full mb-3"
          placeholder="Your email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button className="bg-blue-600 text-white p-2 w-full rounded">
          Send Reset Link
        </button>

        {message && <p className="mt-3">{message}</p>}
      </form>
    </div>
  );
}
