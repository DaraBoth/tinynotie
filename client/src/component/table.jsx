import React, { useEffect, useState } from 'react'
import { DataGrid , GridToolbar , GridToolbarQuickFilter } from "@mui/x-data-grid";
import { tokens } from "../theme";
import { Box, useTheme } from "@mui/material";
import { useQuery } from 'react-query'
import Form from './form';
const baseURL = import.meta.env.VITE_BASE_URL; 
const user_id = 1;
function TableComponent() {

  const members = useQuery('getAllMembers', () =>
  fetch(baseURL+`note/getAllMembers?user_id=${user_id}`).then(res => res.json())
  );

  const trips = useQuery('getTripsByUserId', () =>
  fetch(baseURL+`note/getTripsByUserId?user_id=${user_id}`).then(res => res.json())
  );

  const [onSubmit,setOnSubmit] = useState(false);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [pageSize, setPageSize] = useState(5);

  let rows,columns;
  if(!members.isLoading && !trips.isLoading){
    rows = calculateMoney(members.data , trips.data); 
    columns = functionRenderColumns(rows); 
    localStorage.setItem('allMembers',JSON.stringify(members.data))
  };

  useEffect(()=>{
    if(onSubmit != false){
      alert('sucess!')
    }
  },[onSubmit])

  return (
      <>  
          <Form onSubmit={onSubmit} members={members} setOnSubmit={setOnSubmit} />
          <Box m="20px">
              <Box
                  height="65vh"
                  sx={{
                    "& .MuiDataGrid-root": {
                      border: "none",
                    },
                    "& .MuiDataGrid-cell": {
                      borderBottom: "none",
                    },
                    "& .name-column--cell": {
                      color: colors.greenAccent[300],
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: colors.blueAccent[700],
                      borderBottom: "none",
                    },
                    "& .MuiDataGrid-virtualScroller": {
                      backgroundColor: colors.primary[400],
                    },
                    "& .MuiDataGrid-footerContainer": {
                      borderTop: "none",
                      backgroundColor: colors.blueAccent[700],
                    },
                    "& .MuiCheckbox-root": {
                      color: `${colors.greenAccent[200]} !important`,
                    },
                    "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
                      color: `${colors.grey[100]} !important`,
                    },
                  }}
              >
                {!members.isLoading && !trips.isLoading && 
                  <DataGrid 
                    rows={rows} 
                    columns={columns}  
                    components={{ Toolbar:GridToolbar  }} 
                    disableSelectionOnClick
                    pageSize={pageSize}
                    onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                    rowsPerPageOptions={[5,10, 20 ,50]}
                /> }
              </Box>
          </Box>
      </>
  )
}

export default TableComponent

function calculateMoney(allMembers,trips) {
    let newData = [];
    let i, j , trip;
    let kitLuy = {}
      for (i in allMembers) {
          newData[i] = {};
          let member = allMembers[i];
          let luyForTrip=0;
          let paid = member.money;
          let luySol = paid;
          for(trip in trips){
            let { joinedMembers , spended , place} = trips[trip];
            let osMnek = 0;
            for (j in joinedMembers) {
                let joined = joinedMembers[j]
                if (member.name === joined) { 
                  osMnek = (spended / joinedMembers?.length);
                  luyForTrip += (spended / joinedMembers?.length);
                  luySol = (member.money - luyForTrip);
                }
            }
            kitLuy = Object.assign(kitLuy,{[place]:formatMoney(osMnek,1)})
          } 
          let unPaid = 0;
          newData[i] = {
            id: Number(i) + 1,
            name:allMembers[i].name,
            paid:paid+"$",
          }
          newData[i] = Object.assign(newData[i],kitLuy,{luySol:formatMoney(luySol>0?luySol:unPaid),"Unpaid":formatMoney(luySol>0?unPaid:luySol)})
    }
    return newData;
}

function formatMoney(money,option=2) {
  let newMoney = "";
  if(typeof money == "string"){
    try {
      money = Number(parseFloat(money));
    }catch {
      alert("error typeof money is not number");
      return money;
    }
  }
  if(option==1){
    if(money>0){
      newMoney = "-"+money;
    }else{
      newMoney = money;
    }
  }
  if(option==2){
    newMoney = money;
  }
  return newMoney.toString().substring(0,5)+"$"
}

function functionRenderColumns(rows){
  let newColumns = [];
  let key = Object.keys(rows[0]);
  let headerValues = ["ID","Name","Paid","Sol","Unpaid"]
  for(let i in key){
    let title = key[i];
    for(let j in headerValues){
      if(key[i].toLocaleLowerCase().includes(headerValues[j].toLocaleLowerCase()) ){
        title = headerValues[j];
      }
    }
    // set column style 
    newColumns[i] = {
      field:key[i],
      headerName:title,
      headerAlign: 'right',
      align: 'right'
    }
    if(title === 'Name') {
      newColumns[i] = Object.assign(newColumns[i],{
        minWidth: 110,
        headerAlign: 'left',
        align: 'left'
      })
    }
    if(title === 'ID') {
      newColumns[i] = Object.assign(newColumns[i],{
        minWidth: 50,
        width:50
      })
    }
  }
  return newColumns;
}