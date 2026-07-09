import React, { useState } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { Controller } from 'react-hook-form';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CloseIcon from '@mui/icons-material/Close';

export default function FormFileUpload({ name, control, label, accept = '.pdf,.doc,.docx', helperText }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const [fileName, setFileName] = useState(value?.name || '');

        const handleFileChange = (event) => {
          const file = event.target.files[0];
          if (file) {
            onChange(file);
            setFileName(file.name);
          }
        };

        const handleRemove = () => {
          onChange(null);
          setFileName('');
        };

        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'text.primary' }}>
              {label}
            </Typography>
            {!fileName ? (
              <Box
                component="label"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: error ? 'error.main' : '#D1D5DB',
                  borderRadius: 3,
                  p: 4,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: 'primary.main', backgroundColor: '#F8FAFF' },
                }}
              >
                <input type="file" accept={accept} onChange={handleFileChange} hidden />
                <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mb: 0.5 }}>
                  Click to upload or drag and drop
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  PDF, DOC, DOCX (Max 5MB)
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #E5E7EB',
                  borderRadius: 2,
                  p: 2,
                  gap: 2,
                }}
              >
                <InsertDriveFileOutlinedIcon sx={{ color: 'primary.main' }} />
                <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                  {fileName}
                </Typography>
                <IconButton size="small" onClick={handleRemove}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
            {error && (
              <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5 }}>
                {error.message}
              </Typography>
            )}
            {helperText && !error && (
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {helperText}
              </Typography>
            )}
          </Box>
        );
      }}
    />
  );
}
