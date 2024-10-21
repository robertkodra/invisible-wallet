import { useState, FormEvent, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import { useAuthContext } from "@/hooks/useAuthContext";
import { useSignup } from "@/hooks/useSignup";

const Signup = () => {
  const { user } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup, error, isLoading } = useSignup();
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await signup(email, password);
  };

  const isValidEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const getPasswordRequirements = (password: string) => {
    const missing = [];
    if (password.length < 8) missing.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) missing.push("an uppercase letter");
    if (!/[a-z]/.test(password)) missing.push("a lowercase letter");
    if (!/\d/.test(password)) missing.push("a number");
    if (!/\W/.test(password)) missing.push("a special character");
    return missing;
  };

  const passwordRequirements = getPasswordRequirements(password);
  const isPasswordStrong = passwordRequirements.length === 0;

  const canSubmit = isValidEmail(email) && isPasswordStrong;

  return (
    <>
      <Head>
        <title>Sign Up | Invisible Wallet</title>
        <meta
          name="description"
          content="Create your Invisible Wallet account"
        />
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <Link href="/" className="block mb-6">
            <h1 className="text-3xl font-bold text-center text-blue-600 hover:text-blue-800 transition duration-300">
              Invisible Wallet
            </h1>
          </Link>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1 text-gray-700"
                htmlFor="email"
              >
                Email:
              </label>
              <input
                id="email"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                required
                aria-label="Email address"
              />
              {email && !isValidEmail(email) && (
                <p className="text-red-500 text-xs mt-1">
                  Please enter a valid email address.
                </p>
              )}
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1 text-gray-700"
                htmlFor="password"
              >
                Password:
              </label>
              <input
                id="password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                required
                aria-label="Password"
              />
              {password && passwordRequirements.length > 0 && (
                <p className="text-yellow-600 text-xs mt-1">
                  Password needs: {passwordRequirements.join(", ")}
                </p>
              )}
              {password && isPasswordStrong && (
                <p className="text-green-600 text-xs mt-1">
                  Password meets all requirements
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isLoading || !canSubmit}
              aria-label="Sign up"
            >
              {isLoading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
          {error && (
            <div
              ref={errorRef}
              className="mt-4 bg-red-100 border border-red-400 text-red-700 p-3 rounded-md text-sm"
              tabIndex={-1}
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{" "}
            </span>
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
