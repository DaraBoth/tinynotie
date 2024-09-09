"use client";
import { signIn } from "next-auth/react";

export default function FormLogin() {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("credentials", {
      redirect: true,
      callbackUrl: "/",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" placeholder="Email" required />
      <input type="password" placeholder="Password" required />
      <button type="submit">Sign In</button>
    </form>
  );
}