import React from "react";

interface ActionButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isLoading: boolean;
  text: string;
  loadingText: string;
  color: "blue" | "green";
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  isDisabled,
  isLoading,
  text,
  loadingText,
  color,
}) => {
  const baseClasses =
    "py-3 px-6 rounded-full text-sm font-medium transition duration-300";
  const enabledClasses =
    color === "blue"
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-green-500 hover:bg-green-600 text-white";
  const disabledClasses = "bg-gray-300 cursor-not-allowed text-gray-500";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isDisabled ? disabledClasses : enabledClasses}`}
      disabled={isDisabled || isLoading}
    >
      {isLoading ? loadingText : text}
    </button>
  );
};

export default ActionButton;
