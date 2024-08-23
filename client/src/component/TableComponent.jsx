import React, { useState } from 'react';
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../theme";
import { Box, useTheme, useMediaQuery } from "@mui/material";

function TableComponent({ rows, columns, height, hideFooter = false, isLoading = false, addToolBar = true }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [pageSize, setPageSize] = useState(10);

  return (
    <Box
      height={height}
      sx={{
        overflowX: "auto", // Allow horizontal scrolling if needed
        width: "100%", // Make sure the table takes the full width of its container
        "& .MuiDataGrid-root": {
          border: `1px solid ${colors.blueAccent[600]}`,
          backgroundColor: colors.background,
        },
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: colors.primary[500],
          color: colors.grey[100],
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: `1px solid ${colors.blueAccent[600]}`,
        },
        "& .MuiDataGrid-row": {
          backgroundColor: theme.palette.mode === 'dark' ? colors.grey[800] : colors.grey[200],
          color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[900],
          "&:hover": {
            backgroundColor: theme.palette.mode === 'dark' ? colors.grey[700] : colors.grey[300],
          }
        },
        "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
          color: `${colors.blueAccent[500]} !important`,
        },
        "& .MuiDataGrid-overlay": {
          backgroundColor: colors.primary[400],
          opacity: 0.9,
        },
        "& .MuiCircularProgress-root": {
          color: colors.blueAccent[400],
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
          width: '100%', // Ensure the table itself takes the full width of its container
        }}
      />
    </Box>
  );
}

export default TableComponent;
