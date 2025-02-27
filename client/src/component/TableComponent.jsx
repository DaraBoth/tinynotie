import React, { useState } from 'react';
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../theme";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import PaginatedList from './PaginatedList';

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
        height={height}
        sx={{
          overflowX: "auto",
          width: "100%",
          backgroundColor: colors.background,
          border: `2px solid ${colors.primary[600]}`,
          padding: 2,
        }}
      >
        <PaginatedList rows={rows} columns={columns} rowsPerPage={rowsPerPage} />
      </Box>
    );
  }

  return (
    <Box
      height={height}
      sx={{
        overflowX: "auto",
        width: "100%",
        "& .MuiDataGrid-root": {
          border: `2px solid ${colors.primary[600]}`,
          backgroundColor: colors.background,
        },
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: colors.primary[600],
          color: colors.grey[100],
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: `2px solid ${colors.primary[600]}`,
          backgroundColor: colors.background,
        },
        "& .MuiDataGrid-row": {
          backgroundColor: isDark ? colors.grey[800] : colors.grey[200],
          color: isDark ? colors.grey[100] : colors.grey[900],
          "&:hover": {
            backgroundColor: isDark ? colors.grey[700] : colors.grey[300],
          }
        },
        "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
          color: `${colors.primary[600]} !important`,
        },
        "& .MuiDataGrid-overlay": {
          backgroundColor: colors.primary[300],
          opacity: 0.9,
        },
        "& .MuiCircularProgress-root": {
          color: colors.blueAccent[900],
        },
      }}
    >
      <DataGrid
        density={isNonMobile ? "standard" : "compact"}
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
        hideFooter={hideFooter}
        sx={{
          width: '100%',
        }}
      />
    </Box>
  );
}

export default TableComponent;
