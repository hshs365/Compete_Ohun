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
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-blue-primary)] ${
          isOn ? 'bg-[var(--color-blue-primary)]' : 'bg-[var(--color-bg-secondary)]'
        }`}
        onClick={handleToggle}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${
            isOn ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
