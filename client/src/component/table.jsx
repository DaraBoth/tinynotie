import React, { useState } from 'react';
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../theme";
import { Box, useMediaQuery, useTheme } from "@mui/material";

function TableComponent({ rows, columns, height, hideFooter = false, isLoading = false }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [pageSize, setPageSize] = useState(isNonMobile ? 5 : 10);

  return (
    <Box>
      <Box
        height={height}
        sx={{
          "& .MuiDataGrid-root": {
            border: `2px solid ${colors.blueAccent[600]}`,
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.grey[800],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.blueAccent[500]} !important`,
          },
          "& .MuiDataGrid-overlay": {
            backgroundColor: colors.primary[400], // Ensure background matches your theme
            opacity: 0.9,
          },
          "& .MuiCircularProgress-root": {
            color: colors.blueAccent[500], // Make loading indicator more visible
          },
        }}
      >
        <DataGrid
          density={isNonMobile ? "standard" : "compact"}
          rows={rows}
          columns={columns}
          loading={isLoading} // Use the loading prop
          components={{ Toolbar: GridToolbar }}
          disableSelectionOnClick
          pageSize={pageSize}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[5, 10, 20, 50]}
          initialState={{ pinnedColumns: { left: ['name'] } }}
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
