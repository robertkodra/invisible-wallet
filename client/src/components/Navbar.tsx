import Link from "next/link";
import { useLogout } from "@/hooks/useLogout";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useState } from "react";

const NetworkIndicator = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        Sepolia Testnet
      </span>
      {isHovered && (
        <div className="absolute z-10 w-64 px-4 py-2 mt-2 text-sm text-gray-700 bg-white rounded-lg shadow-lg">
          This project is currently running on Sepolia testnet. It is not yet
          available on Mainnet.
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { logout } = useLogout();
  const { user } = useAuthContext();

  const handleClick = () => {
    logout();
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight hover:text-gray-200 transition duration-300"
            >
              Invisible Wallet
            </Link>
            <NetworkIndicator />
          </div>
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="hidden md:inline text-sm text-gray-200">
                  Welcome, <span className="font-semibold">{user.email}</span>
                </span>
                <Link
                  href="/profile"
                  className="bg-white text-blue-600 hover:bg-gray-300 py-2 px-4 rounded-full text-sm font-medium transition duration-300"
                >
                  Profile
                </Link>
                <button
                  onClick={handleClick}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-full text-sm font-medium transition duration-300"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-200 hover:text-white hover:bg-blue-500 py-2 px-4 rounded-full text-sm font-medium transition duration-300"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-white text-blue-600 hover:bg-gray-200 py-2 px-4 rounded-full text-sm font-medium transition duration-300"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
