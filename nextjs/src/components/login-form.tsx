"use client";

import { cn } from "@/lib/utils";
import Button from "@/components/ui/CustomButton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShineBorder } from "./magicui/shine-border";
import { useTheme } from "next-themes";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false); // Loading state
  const theme = useTheme();

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

    // Set loading to false after request
    if (result?.error) {
      setError("Invalid username or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 relative ", className)} {...props}>
      <ShineBorder
        className="bg-transparent dark:bg-transparent p-0"
        color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
      >
        <Card className="overflow-hidden">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form onSubmit={handleSubmit} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Welcome</h1>
                  <p className="text-balance text-muted-foreground">
                    Login to your Tiny Notie account
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">ID</Label>
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    {/* <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a> */}
                  </div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                {error && (
                  <p className="font-thin text-sm text-red-500">{error}</p>
                )}
                <Button
                  isLoading={loading}
                  disabled={loading}
                  type="submit"
                  text="Login"
                />
                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <a href="#" className="underline underline-offset-4">
                    Poor you :(
                  </a>
                </div>
              </div>
            </form>
            <div className="relative hidden bg-muted md:block">
              <img
                src="https://vongpichdaraboth.netlify.app/assets/profile-792cecc4.jpg"
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>
      </ShineBorder>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
