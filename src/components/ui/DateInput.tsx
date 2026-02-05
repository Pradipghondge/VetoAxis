'use client';

import { useState, useEffect, useRef } from 'react';
import { format, parse, isValid } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';

interface DateInputProps {
  value: string; // Expects 'YYYY-MM-DD'
  onChange: (value: string) => void; // Emits 'YYYY-MM-DD'
  placeholder?: string;
}

export function DateInput({ value, onChange, placeholder = 'MM/DD/YYYY' }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const date = parse(value, 'yyyy-MM-dd', new Date());
      if (isValid(date)) {
        setDisplayValue(format(date, 'MM/dd/yyyy'));
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    const parsedDate = parse(inputValue, 'MM/dd/yyyy', new Date());
    if (isValid(parsedDate)) {
      onChange(format(parsedDate, 'yyyy-MM-dd'));
    }
  };

  const handleHiddenDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value;
    if (isoDate) {
      onChange(isoDate);
      setDisplayValue(format(parse(isoDate, 'yyyy-MM-dd', new Date()), 'MM/dd/yyyy'));
    }
  };

  const handleBlur = () => {
    // On blur, ensure the display value is correctly formatted or cleared
    if (value) {
        const date = parse(value, 'yyyy-MM-dd', new Date());
        if (isValid(date)) {
            setDisplayValue(format(date, 'MM/dd/yyyy'));
        } else {
            setDisplayValue('');
        }
    } else {
        setDisplayValue('');
    }
  };

  return (
    <div className="relative flex items-center">
      <Input
        type="text"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleDisplayChange}
        onBlur={handleBlur}
        className="h-10 bg-background pr-10"
      />
      <input
        type="date"
        ref={dateInputRef}
        value={value || ''}
        onChange={handleHiddenDateChange}
        className="absolute w-0 h-0 opacity-0"
        tabIndex={-1}
      />
      <Button
        type="button"
        variant="ghost"
        className="absolute right-0 h-9 w-10 px-2"
        onClick={() => dateInputRef.current?.showPicker()}
      >
        <CalendarIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
