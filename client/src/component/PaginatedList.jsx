import React, { useState } from 'react';
import { Box, List, ListItem, Typography, Divider, IconButton, MenuItem, Select, useTheme, Tooltip, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import currency from 'currency.js';
import { formatTimeDifference } from '../help/time';

function PaginatedList({ rows, columns, rowsPerPage = 5, isLoading = false }) {
  const [page, setPage] = useState(0);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleNextPage = () => {
    if (page < Math.ceil(rows.length / rowsPerPage) - 1) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const handlePageChange = (event) => {
    setPage(event.target.value);
  };

  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = rows.slice(startIndex, endIndex);

  return (
    <Box sx={{ position: 'relative', paddingBottom: rows.length > rowsPerPage ? '60px' : '0' }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {currentRows.map((row, index) => (
            <React.Fragment key={row.id}>
              <ListItem alignItems="flex-start" sx={{ backgroundColor: isDark ? theme.palette.grey[800] : theme.palette.background.paper }}>
                <Box sx={{ width: '100%' }}>
                  {columns.map((col) => {
                    let value = row[col.field];
                    if (col.valueGetter) {
                      value = col.valueGetter({ value });
                    }
                    if (col.renderCell) {
                      value = col.renderCell({ value });
                    }
                    return (
                      <Box key={col.field} sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                          {col.headerName}:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                          {value}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </ListItem>
              {index < currentRows.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
      {rows.length > rowsPerPage && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          position: 'sticky', 
          bottom: 0, 
          backgroundColor: isDark ? theme.palette.grey[900] : 'white', 
          padding: 1,
          boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)'
        }}>
          <IconButton onClick={handlePrevPage} disabled={page === 0}>
            <ArrowBackIcon />
          </IconButton>
          <Select value={page} onChange={handlePageChange}>
            {Array.from({ length: Math.ceil(rows.length / rowsPerPage) }, (_, index) => (
              <MenuItem key={index} value={index}>
                Page {index + 1}
              </MenuItem>
            ))}
          </Select>
          <IconButton onClick={handleNextPage} disabled={page >= Math.ceil(rows.length / rowsPerPage) - 1}>
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

export default PaginatedList;
