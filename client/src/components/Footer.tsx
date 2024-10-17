import { SocialIcon } from "react-social-icons";

const Footer = () => {
  return (
    <footer className="bg-blue-600 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-lg font-semibold">Invisible Wallet</p>
            <p className="text-sm">
              Copyright © 2024 - Starknet Foundation. All rights reserved
            </p>
          </div>
          <div className="flex space-x-4">
            {[
              "https://x.com/robertkp13",
              "mailto:robert@starknet.org",
              "https://github.com/starknet-edu/invisiblewallet",
            ].map((url, index) => (
              <div
                key={index}
                className="transition-transform duration-300 ease-in-out hover:scale-110"
              >
                <SocialIcon
                  url={url}
                  bgColor="transparent"
                  fgColor="white"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity duration-300"
                  style={{ width: 40, height: 40 }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
