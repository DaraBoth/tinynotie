import React, { useState } from 'react';
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../theme";
import { Box, useMediaQuery, useTheme } from "@mui/material";

function TableComponent({ rows, columns, height , hideFooter=false}) {
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
        }}
      >
        <DataGrid
          density={isNonMobile ? "standard" : "compact"}
          rows={rows}
          columns={columns}
          components={{ Toolbar: GridToolbar }}
          disableSelectionOnClick
          pageSize={pageSize}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[5, 10, 20, 50]}
          initialState={{ pinnedColumns: { left: ['name'] } }}
          columnBuffer={5}  // Improve performance on resizing
          columnResizeMode="onResize"
          resizable
          hideFooter={hideFooter}
        />
      </Box>
    </Box>
  );
}

export default TableComponent;
