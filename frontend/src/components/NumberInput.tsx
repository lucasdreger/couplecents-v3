import React from 'react';
import { Input } from '@/components/ui/input';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number | string;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

export function NumberInput({ value, onChange, step = 0.01, min, max, ...props }: Props) {
  const [localValue, setLocalValue] = React.useState(value.toString());
  const [isFocused, setIsFocused] = React.useState(false);

  // Update local value when prop value changes and input is not focused
  React.useEffect(() => {
    if (!isFocused) {
      setLocalValue(value.toString());
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Only trigger onChange if the value is a valid number
    const numericValue = parseFloat(newValue);
    if (!isNaN(numericValue)) {
      if (min !== undefined && numericValue < min) return;
      if (max !== undefined && numericValue > max) return;
      onChange(numericValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    // Reset to prop value if input is empty or invalid
    if (localValue === '' || isNaN(parseFloat(localValue))) {
      setLocalValue(value.toString());
    }
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  return (
    <Input
      type="number"
      value={localValue}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      step={step}
      min={min}
      max={max}
      {...props}
    />
  );
}
