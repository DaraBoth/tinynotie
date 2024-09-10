import { X } from "lucide-react";

interface ChipProps {
  children: React.ReactNode;
  onRemove?: () => void;
}

const Chip: React.FC<ChipProps> = ({ children, onRemove }) => {
  return (
    <div className="flex items-center bg-purple-600 text-white px-3 py-1 rounded-full shadow-md">
      <span className="mr-2">{children}</span>
      {onRemove && (
        <button
          type="button"
          className="bg-transparent hover:bg-purple-700 text-white rounded-full p-1 transition-colors"
          onClick={onRemove}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Chip;
