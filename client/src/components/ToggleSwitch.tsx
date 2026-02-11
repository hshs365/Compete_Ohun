import React from 'react';

interface ToggleSwitchProps {
  isOn: boolean;
  handleToggle: () => void;
  label: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, handleToggle, label }) => {
  return (
    <div className={`flex items-center ${label ? 'justify-between' : 'justify-end'} py-2`}>
      {label && <span className="text-[var(--color-text-primary)]">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] focus:ring-[var(--color-blue-primary)] border-2 shrink-0 ${
          isOn
            ? 'bg-[var(--color-blue-primary)] border-[var(--color-blue-primary)]'
            : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-card)]'
        }`}
        onClick={handleToggle}
      >
        <span
          className={`inline-block w-5 h-5 transform rounded-full transition-transform duration-200 bg-white shadow-md border border-[var(--color-border-card)] ${
            isOn ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
