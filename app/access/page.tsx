"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation";
import { generateToken, isValidAccessCode } from "../lib/access-utils";

export default function AccessPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  // const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isValidAccessCode(code)) {
      const token = generateToken();

      const date = new Date();
      date.setTime(date.getTime() + 43200000);
      const expires = "; expires=" + date.toUTCString();
      document.cookie = "authToken=" + (token || "") + expires + "; path=/;";

      setCode("");

      // router.push("/");
      window.location.href = '/'
    } else {
      setError("Invalid access code. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-baseBackground">
      <div className="w-full max-w-md px-4">
        <div className="bg-baseComplementary p-8 rounded-3xl">
          <h1 className="mb-4 text-xl font-semibold text-center">Enter Access Code</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full mb-4 p-2 border text-baseBlack border-neutral-300 rounded-lg"
              placeholder="84886C054FAC"
              required
            />
            <button className="w-full bg-purple text-white py-3 rounded-2xl font-medium text-xl hover:bg-purple-600 transition-colors">
              Check
            </button>
          </form>
          {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
