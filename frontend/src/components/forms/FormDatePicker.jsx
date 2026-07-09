import React from 'react';
import { Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

export default function FormDatePicker({ name, control, label, disabled = false, ...rest }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value, ref, ...field }, fieldState: { error } }) => (
          <DatePicker
            {...field}
            label={label}
            disabled={disabled}
            value={value ? dayjs(value) : null}
            onChange={(date) => {
              onChange(date ? date.format('YYYY-MM-DD') : '');
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!error,
                helperText: error ? `⚠ ${error.message}` : null,
                variant: 'outlined',
                size: 'medium',
                inputRef: ref,
                ...rest
              }
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
}
