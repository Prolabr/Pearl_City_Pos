"use client";

import { useState } from "react";

export default function ResetPassword({ params }: { params: { token: string } }) {
  const token = params.token;
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password })
    });

    const data = await res.json();
    setMessage(data.message);
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="p-6 border rounded w-96">
        <h1 className="text-xl mb-4">Reset Password</h1>

        <input
          className="border p-2 w-full mb-3"
          placeholder="New password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="bg-blue-600 text-white p-2 w-full rounded">
          Update Password
        </button>

        {message && <p className="mt-3">{message}</p>}
      </form>
    </div>
  );
}
