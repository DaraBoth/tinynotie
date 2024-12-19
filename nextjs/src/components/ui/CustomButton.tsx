import React, { useState } from "react";
import { Button as B } from "./button";

type ButtonProps = {
  text?: string;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
};

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  isLoading = false,
  disabled = false,
  className = "",
  type = "button"
}) => {
  const [dots, setDots] = useState("");

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + "." : ""));
      }, 500);
    } else {
      setDots("");
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <B
      onClick={onClick}
      disabled={isLoading || disabled}
      type={type}
      className={` ${className}`}
    >
      {isLoading ? `${text}${dots}` : text}
    </B>
  );
};

export default Button;
