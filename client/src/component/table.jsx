import React, { useState } from 'react'
import { DataGrid, GridToolbar, GridToolbarQuickFilter } from "@mui/x-data-grid";
import { tokens } from "../theme";
import { Box, useTheme } from "@mui/material";
function TableComponent({ rows, columns }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [pageSize, setPageSize] = useState(5);
  return (
    <Box>
      <Box
        height="85vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: `2px solid ${colors.blueAccent[600]}`,
            // backgroundColor:colors.grey[800]
          },
          "& .MuiDataGrid-cell": {
            // borderTop:'1px solid rgba(81, 81, 81, 1)'
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            // borderTop:'1px solid rgba(81, 81, 81, 1)'
          },
          "& .MuiDataGrid-virtualScroller": {
            // backgroundColor:colors.blueAccent[600]
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
          },
          "& .MuiCheckbox-root": {
            // color: `${colors.greenAccent[200]} !important`,
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.blueAccent[500]} !important`,
          },
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          components={{ Toolbar: GridToolbar }}
          disableSelectionOnClick
          pageSize={pageSize}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[5, 10, 20, 50]}
          initialState={{ pinnedColumns: { left: ['name']} }}
        />
      </Box>
    </Box>
  )
}

export default TableComponent

