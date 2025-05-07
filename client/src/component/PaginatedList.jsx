import React, { useState } from 'react';
import { Box, List, ListItem, Typography, Divider, IconButton, MenuItem, Select, useTheme, Tooltip, CircularProgress, alpha, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import currency from 'currency.js';
import { formatTimeDifference } from '../help/time';
import { motion } from "framer-motion";
import { tokens } from "../theme";

function PaginatedList({ rows, columns, rowsPerPage = 5, isLoading = false }) {
  const [page, setPage] = useState(0);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
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

  // Animation variants for list items
  const listItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
  };

  return (
    <Box sx={{ position: 'relative', paddingBottom: rows.length > rowsPerPage ? '60px' : '0' }}>
      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            width: '100%'
          }}
        >
          <CircularProgress
            size={40}
            thickness={4}
            sx={{
              color: colors.primary[500],
            }}
          />
        </Box>
      ) : (
        <List sx={{
          padding: 0,
          backgroundColor: 'transparent',
        }}>
          {currentRows.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
                width: '100%',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                No data available
              </Typography>
            </Box>
          ) : (
            currentRows.map((row, index) => (
              <Box
                component={motion.div}
                key={row.id}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={listItemVariants}
                sx={{ marginBottom: "0" }}
              >
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    backgroundColor: 'transparent',
                    padding: "8px 0",
                    borderBottom: `1px solid ${theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)'}`,
                    transition: "all 0.2s ease",
                    width: "100%",
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    {columns.map((col, colIndex) => {
                      let value = row[col.field];
                      if (col.valueGetter) {
                        value = col.valueGetter({ value });
                      }
                      if (col.renderCell) {
                        value = col.renderCell({ row, value });
                      }

                      // Special formatting for certain column types
                      const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(value) && value.trim() !== '');
                      const isDate = col.field.toLowerCase().includes('date') || col.field.toLowerCase().includes('dttm');
                      const isStatus = col.field.toLowerCase().includes('status');

                      return (
                        <Box
                          key={col.field}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 0,
                            padding: "4px 0",
                            borderBottom: 'none',
                            width: '100%'
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                              minWidth: '80px',
                            }}
                          >
                            {col.headerName}
                          </Typography>

                          {isStatus ? (
                            <Chip
                              label={value}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                backgroundColor: value === 'active' || value === 'paid' || value === 'completed'
                                  ? alpha(colors.greenAccent[500], 0.2)
                                  : value === 'pending' || value === 'in progress'
                                    ? alpha(colors.blueAccent[500], 0.2)
                                    : alpha(colors.redAccent[500], 0.2),
                                color: value === 'active' || value === 'paid' || value === 'completed'
                                  ? colors.greenAccent[theme.palette.mode === 'dark' ? 400 : 700]
                                  : value === 'pending' || value === 'in progress'
                                    ? colors.blueAccent[theme.palette.mode === 'dark' ? 400 : 700]
                                    : colors.redAccent[theme.palette.mode === 'dark' ? 400 : 700],
                                borderRadius: '6px',
                                height: '22px'
                              }}
                            />
                          ) : (
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                color: isNumeric
                                  ? colors.primary[theme.palette.mode === 'dark' ? 300 : 600]
                                  : isDate
                                    ? colors.blueAccent[theme.palette.mode === 'dark' ? 300 : 600]
                                    : theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                                textAlign: 'right',
                                minWidth: '100px',
                                maxWidth: '60%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {value}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </ListItem>
              </Box>
            ))
          )}
        </List>
      )}

      {rows.length > rowsPerPage && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            bottom: 0,
            backgroundColor: theme.palette.mode === 'dark'
              ? alpha(colors.grey[900], 0.8)
              : alpha(colors.grey[100], 0.8),
            backdropFilter: "blur(8px)",
            padding: "8px 12px",
            borderRadius: "12px",
            marginTop: "8px",
            boxShadow: theme.palette.mode === 'dark'
              ? '0 -4px 12px rgba(0, 0, 0, 0.3)'
              : '0 -4px 12px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.05)'}`,
          }}
        >
          <IconButton
            onClick={handlePrevPage}
            disabled={page === 0}
            size="small"
            sx={{
              padding: "6px",
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(colors.grey[800], 0.5)
                : alpha(colors.grey[200], 0.5),
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(colors.grey[700], 0.7)
                  : alpha(colors.grey[300], 0.7),
              },
              '&.Mui-disabled': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(colors.grey[800], 0.2)
                  : alpha(colors.grey[200], 0.2),
                color: theme.palette.mode === 'dark'
                  ? alpha(colors.grey[500], 0.5)
                  : alpha(colors.grey[500], 0.5),
              }
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>

          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              fontSize: '0.8rem',
              color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
            }}
          >
            Page {page + 1} of {Math.ceil(rows.length / rowsPerPage)}
          </Typography>

          <IconButton
            onClick={handleNextPage}
            disabled={page >= Math.ceil(rows.length / rowsPerPage) - 1}
            size="small"
            sx={{
              padding: "6px",
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(colors.grey[800], 0.5)
                : alpha(colors.grey[200], 0.5),
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(colors.grey[700], 0.7)
                  : alpha(colors.grey[300], 0.7),
              },
              '&.Mui-disabled': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(colors.grey[800], 0.2)
                  : alpha(colors.grey[200], 0.2),
                color: theme.palette.mode === 'dark'
                  ? alpha(colors.grey[500], 0.5)
                  : alpha(colors.grey[500], 0.5),
              }
            }}
          >
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

export default PaginatedList;
