import React from 'react';
import { TextField, MenuItem } from '@mui/material';
import { Controller } from 'react-hook-form';

export default function FormSelect({ name, control, label, options = [], placeholder, disabled = false, ...rest }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          select
          fullWidth
          label={label}
          placeholder={placeholder}
          disabled={disabled}
          error={!!error}
          helperText={error ? `⚠ ${error.message}` : null}
          variant="outlined"
          size="medium"
          {...rest}
        >
          {placeholder && (
            <MenuItem value="" disabled>
              {placeholder}
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem key={typeof option === 'string' ? option : option.value} value={typeof option === 'string' ? option : option.value}>
              {typeof option === 'string' ? option : option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
