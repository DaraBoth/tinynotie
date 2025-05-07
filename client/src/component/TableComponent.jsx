import React, { useState } from 'react';
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../theme";
import { Box, useTheme, useMediaQuery, alpha } from "@mui/material";
import PaginatedList from './PaginatedList';
import { motion } from "framer-motion";

function TableComponent({ rows, columns, height, hideFooter = false, isLoading = false, addToolBar = true, rowsPerPage = 5, viewMode = 'table' }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [pageSize, setPageSize] = useState(10);

  const isDark = theme.palette.mode === 'dark';

  if (viewMode === 'list' || (!isNonMobile && viewMode === 'table')) {
    // Render paginated list view for mobile screens or when viewMode is 'list'
    return (
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        height={height}
        sx={{
          overflowX: "auto",
          width: "100%",
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(20, 23, 39, 0.6)' : 'rgba(255, 255, 255, 0.6)',
          padding: "8px 16px",
          color: theme.palette.text.primary,
          fontFamily: 'Bricolage Grotesque, Montserrat, Poppins, sans-serif',
          fontSize: "0.85rem",
          position: "relative",
          overflow: "hidden",
          borderRadius: "16px",
          border: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.08)'}`,
          backdropFilter: "blur(8px)",
          "& .MuiListItem-root": {
            backgroundColor: "transparent",
            color: theme.palette.mode === 'dark'
              ? colors.grey[100]
              : colors.grey[800],
            padding: "8px 0",
            borderRadius: 0,
            marginBottom: 0,
            borderBottom: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.05)'}`,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "transparent",
            }
          },
        }}
      >


        <PaginatedList
          rows={rows}
          columns={columns}
          rowsPerPage={rowsPerPage}
          isLoading={isLoading}
        />
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      height={height}
      sx={{
        overflowX: "auto",
        width: "100%",
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(20, 23, 39, 0.6)'
          : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: "blur(8px)",
        borderRadius: "16px",
        border: `1px solid ${theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.08)'}`,
        padding: 0,
        fontFamily: 'Bricolage Grotesque, Montserrat, Poppins, sans-serif',
        fontSize: "0.85rem",
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 20px rgba(0, 0, 0, 0.4)'
          : '0 8px 20px rgba(0, 0, 0, 0.1)',
        position: "relative",
        overflow: "hidden",
        "& .MuiDataGrid-root": {
          border: "none",
          fontSize: "0.85rem",
          fontWeight: 500,
        },
        "& .MuiDataGrid-cell": {
          borderBottom: theme.palette.mode === 'dark'
            ? `1px solid rgba(255, 255, 255, 0.08)`
            : `1px solid rgba(0, 0, 0, 0.08)`,
          padding: "0 16px",
          color: theme.palette.mode === 'dark'
            ? colors.grey[100]
            : colors.grey[800],
          height: "52px !important",
          lineHeight: "52px",
          display: "flex",
          alignItems: "center",
        },
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha(colors.primary[600], 0.2)
            : alpha(colors.primary[600], 0.1),
          color: theme.palette.mode === 'dark'
            ? colors.grey[100]
            : colors.grey[900],
          borderBottom: theme.palette.mode === 'dark'
            ? `1px solid rgba(255, 255, 255, 0.12)`
            : `1px solid rgba(0, 0, 0, 0.12)`,
          borderRadius: 0,
          fontWeight: 600,
          minHeight: "52px !important",
          maxHeight: "52px !important",
          lineHeight: "52px",
        },
        "& .MuiDataGrid-columnHeaderTitle": {
          fontWeight: 600,
          fontSize: "0.85rem",
        },
        "& .MuiDataGrid-virtualScroller": {
          backgroundColor: "transparent",
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: theme.palette.mode === 'dark'
            ? `1px solid rgba(255, 255, 255, 0.12)`
            : `1px solid rgba(0, 0, 0, 0.12)`,
          backgroundColor: "transparent",
          minHeight: "52px !important",
          height: "52px !important",
        },
        "& .MuiDataGrid-toolbarContainer": {
          padding: "8px 16px",
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha(colors.primary[900], 0.2)
            : alpha(colors.primary[100], 0.2),
          "& .MuiButton-root": {
            color: theme.palette.mode === 'dark'
              ? colors.grey[300]
              : colors.grey[700],
            fontSize: "0.75rem",
            fontWeight: 500,
            textTransform: "none",
            padding: "4px 8px",
            minWidth: "auto",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(colors.primary[600], 0.2)
                : alpha(colors.primary[600], 0.1),
            }
          },
        },
        "& .MuiDataGrid-row": {
          backgroundColor: "transparent",
          color: theme.palette.mode === 'dark'
            ? colors.grey[100]
            : colors.grey[800],
          minHeight: "52px !important",
          maxHeight: "52px !important",
          "&:hover": {
            backgroundColor: theme.palette.mode === 'dark'
              ? alpha(colors.primary[600], 0.1)
              : alpha(colors.primary[600], 0.05),
          },
          "&.Mui-selected": {
            backgroundColor: theme.palette.mode === 'dark'
              ? alpha(colors.primary[600], 0.2)
              : alpha(colors.primary[600], 0.1),
            "&:hover": {
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(colors.primary[600], 0.3)
                : alpha(colors.primary[600], 0.15),
            }
          }
        },
        "& .MuiDataGrid-overlay": {
          backgroundColor: "transparent",
        },
        "& .MuiCircularProgress-root": {
          color: colors.primary[500],
        },
        "& .MuiTablePagination-root": {
          color: theme.palette.mode === 'dark'
            ? colors.grey[300]
            : colors.grey[700],
        },
        "& .MuiTablePagination-selectIcon": {
          color: theme.palette.mode === 'dark'
            ? colors.grey[300]
            : colors.grey[700],
        },
        "& .MuiIconButton-root.Mui-disabled": {
          color: theme.palette.mode === 'dark'
            ? alpha(colors.grey[300], 0.3)
            : alpha(colors.grey[700], 0.3),
        },
      }}
    >
      {/* Subtle gradient overlay for depth */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <DataGrid
        density="standard"
        rows={rows}
        columns={columns}
        loading={isLoading}
        components={addToolBar && { Toolbar: GridToolbar }}
        disableSelectionOnClick
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        rowsPerPageOptions={[5, 10, 20, 50]}
        initialState={{ pinnedColumns: { left: ['name'] } }}
        columnBuffer={5}
        columnResizeMode="onResize"
        resizable
        rowHeight={52}
        headerHeight={52}
        hideFooter={hideFooter}
        sx={{
          width: '100%',
          '& .MuiTablePagination-root': {
            fontSize: '0.8rem',
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontSize: '0.8rem',
          },
          '& .MuiSelect-select': {
            fontSize: '0.8rem',
            padding: '4px 24px 4px 8px',
          },
          '& .MuiMenuItem-root': {
            fontSize: '0.8rem',
          },
          '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-columnHeader:focus': {
            outline: 'none',
          }
        }}
      />
    </Box>
  );
}

export default TableComponent;
