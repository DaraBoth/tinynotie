"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function FormLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true); // Set loading to true

    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
      callbackUrl: "/",
    });

    setLoading(false); // Set loading to false after request
    if (result?.error) {
      setError("Invalid username or password. Please try again.");
    } else {
      window.location.href = result?.url || "/";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-8 mx-auto shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold mb-4">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
            {error && <p className="text-red-500">{error}</p>}
            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"} {/* Loading indicator */}
            </Button>
          </form>
        </CardContent>
        <CardFooter>{/* Additional footer content can go here */}</CardFooter>
      </Card>
    </div>
  );
}
