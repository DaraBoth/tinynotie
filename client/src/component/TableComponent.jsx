import React, { useState } from 'react';
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../theme";
import { Box, useMediaQuery, useTheme } from "@mui/material";

function TableComponent({ rows, columns, height, hideFooter = false, isLoading = false, addToolBar = true }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [pageSize, setPageSize] = useState(10);

  return (
    <Box>
      <Box
        height={height}
        sx={{
          "& .MuiDataGrid-root": {
            border: `1px solid ${theme.palette.mode === 'dark' ? colors.grey[700] : colors.grey[300]}`,
            boxShadow: 'none',
            backgroundColor: theme.palette.mode === 'dark' ? colors.grey[800] : colors.grey[100], // Lighter background for light theme
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.primary[400], // Slightly darker header
            color: colors.grey[100],
          },
          "& .MuiDataGrid-cell": {
            color: theme.palette.mode === 'dark' ? colors.grey[200] : colors.grey[900], // Adjust text color for better visibility
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: theme.palette.mode === 'dark' ? colors.grey[900] : colors.grey[200], // Slight contrast
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
          initialState={{ pinnedColumns: { left: ['Name'] } }}
          columnBuffer={5}
          columnResizeMode="onResize"
          resizable
          hideFooter={hideFooter}
        />
      </Box>
    </Box>
  );
}

export default TableComponent;
