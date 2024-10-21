import React from "react";

interface ActionButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isLoading: boolean;
  text: string;
  loadingText: string;
  color: "blue" | "green" | "argent" | "braavos";
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  isDisabled,
  isLoading,
  text,
  loadingText,
  color,
  className = "",
}) => {
  const baseClasses =
    "py-3 px-6 rounded-full text-sm font-medium transition duration-300";
  const colorClasses: any = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    green: "bg-green-500 hover:bg-green-600 text-white",
    argent: "bg-[#ff7b53] hover:bg-[#ff8965] text-white",
    braavos: "bg-[#ffa100] hover:bg-[#ffbc27] text-white",
  };
  const enabledClasses = colorClasses[color];
  const disabledClasses = "bg-gray-300 cursor-not-allowed text-gray-500";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${
        isDisabled ? disabledClasses : enabledClasses
      } ${className}`}
      disabled={isDisabled || isLoading}
    >
      {isLoading ? loadingText : text}
    </button>
  );
};

export default ActionButton;
