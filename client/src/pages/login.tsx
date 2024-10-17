import { useState, FormEvent, useEffect } from "react";
import { useLogin } from "@/hooks/useLogin";
import { useRouter } from "next/router";
import { useAuthContext } from "@/hooks/useAuthContext";
import Link from "next/link";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, isLoading } = useLogin();
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
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
            />
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
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
