import React from 'react';
import { TextField } from '@mui/material';
import { Controller } from 'react-hook-form';

export default function FormDatePicker({ name, control, label, disabled = false, ...rest }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          fullWidth
          label={label}
          type="date"
          disabled={disabled}
          error={!!error}
          helperText={error?.message}
          variant="outlined"
          size="medium"
          InputLabelProps={{ shrink: true }}
          {...rest}
        />
      )}
    />
  );
}
