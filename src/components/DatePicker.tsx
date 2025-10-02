import React from 'react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const DatePicker: React.FC<DatePickerProps> = React.memo(({ value, onChange, label }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
    />
  </div>
));

DatePicker.displayName = 'DatePicker';

export default DatePicker;