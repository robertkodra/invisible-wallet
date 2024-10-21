import { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";

import { AuthContextProvider } from "@/context/AuthContext";

import "../styles/globals.css";
import "react-toastify/dist/ReactToastify.css";

const MyApp = ({ Component, pageProps }: AppProps) => (
  <AuthContextProvider>
    <Component {...pageProps} />
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
      theme="light"
    />
  </AuthContextProvider>
);

export default MyApp;
