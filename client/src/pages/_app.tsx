import "../styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import dotenv from "dotenv";
import type { AppProps } from "next/app";
import { AuthContextProvider } from "@/context/AuthContext";

dotenv.config();

const MyApp = ({ Component, pageProps }: AppProps) => (
  <>
    <AuthContextProvider>
      <Component {...pageProps} />
    </AuthContextProvider>
    <ToastContainer
      position="bottom-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  </>
);

export default MyApp;
