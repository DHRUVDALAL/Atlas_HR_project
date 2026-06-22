import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination } from '@mui/material';

export default function DataTable({ columns, rows, page, rowsPerPage, onPageChange, onRowsPerPageChange, totalCount, onRowClick }) {
  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #F0F0F0', boxShadow: 'none' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} sx={{ width: col.width, minWidth: col.minWidth }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow
                key={row.id || idx}
                hover
                onClick={() => onRowClick && onRowClick(row)}
                sx={{ cursor: onRowClick ? 'pointer' : 'default', '&:last-child td': { borderBottom: 0 } }}
              >
                {columns.map((col) => (
                  <TableCell key={col.id}>
                    {col.render ? col.render(row) : row[col.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {totalCount !== undefined && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page || 0}
          onPageChange={onPageChange || (() => {})}
          rowsPerPage={rowsPerPage || 10}
          onRowsPerPageChange={onRowsPerPageChange || (() => {})}
          rowsPerPageOptions={[5, 10, 25]}
        />
      )}
    </Paper>
  );
}
