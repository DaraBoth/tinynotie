// src/components/ui/AutocompleteInput.tsx

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import Chip from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";  // Assuming you have a utility for combining classes

interface AutocompleteInputProps {
  suggestions: string[];
  selectedItems: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (item: string) => void;
  placeholder?: string;
}

const AutocompleteInput = ({
  suggestions,
  selectedItems,
  onAddItem,
  onRemoveItem,
  placeholder = "Enter item",
}: AutocompleteInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const filtered = suggestions.filter(
      (item) =>
        item.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedItems.includes(item)
    );
    setFilteredSuggestions(filtered);
  }, [inputValue, suggestions, selectedItems]);

  const handleAdd = (item: string) => {
    if (!item.trim()) return;
    onAddItem(item);
    setInputValue("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="flex-grow"
        />
        <Button variant="outline" onClick={() => handleAdd(inputValue)}>
          +
        </Button>
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute mt-1 w-full bg-black border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto z-10">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              className={cn(
                "p-2 cursor-pointer hover:bg-indigo-600 hover:text-white",
                "transition-colors duration-200 ease-in-out"
              )}
              onMouseDown={() => handleAdd(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        {selectedItems.map((item) => (
          <Chip key={item} onRemove={() => onRemoveItem(item)}>
            {item}
          </Chip>
        ))}
      </div>
    </div>
  );
};


export default AutocompleteInput;