"use client";

import { useState, useEffect, useRef } from "react";

type MultiSelectDropdownProps = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
};

export default function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  }

  return (
    <div className="multiselect-wrapper" ref={wrapperRef}>
      <button
        className={`multiselect-btn ${selected.length > 0 ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {label}
        {selected.length > 0 ? ` (${selected.length})` : ""} ▾
      </button>
      {isOpen && (
        <div className="multiselect-dropdown">
          {options.length === 0 ? (
            <p className="multiselect-empty">No options yet</p>
          ) : (
            options.map((option) => (
              <label key={option} className="multiselect-item">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                />
                {option}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
