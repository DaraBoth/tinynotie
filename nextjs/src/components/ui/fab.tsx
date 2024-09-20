// src/components/ui/FapButton.tsx

import { useState } from "react";
import { PlusIcon, TrashIcon, PencilIcon, UserIcon, FlagIcon } from "@heroicons/react/24/solid";

interface FapButtonProps {
  actions: { label: string; icon: React.ReactNode; onClick: () => void }[];
}

const FapButton = ({ actions }: FapButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-600 text-white rounded-full p-4 shadow-lg focus:outline-none hover:bg-indigo-700 transition"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
      {isOpen && (
        <div className="flex flex-col items-end space-y-2 mt-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="flex items-center bg-white text-gray-800 rounded-md p-2 shadow-md hover:bg-gray-100 transition"
            >
              <span className="mr-2">{action.icon}</span>
              <span className="text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FapButton;
