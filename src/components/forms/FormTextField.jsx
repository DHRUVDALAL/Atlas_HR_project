import React from 'react';
import { TextField } from '@mui/material';
import { Controller } from 'react-hook-form';

export default function FormTextField({ name, control, label, type = 'text', multiline = false, rows, placeholder, disabled = false, InputProps, ...rest }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          fullWidth
          label={label}
          type={type}
          multiline={multiline}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          error={!!error}
          helperText={error?.message}
          InputProps={InputProps}
          variant="outlined"
          size="medium"
          {...rest}
        />
      )}
    />
  );
}
