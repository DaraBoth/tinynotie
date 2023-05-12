import React, { useEffect, useState } from 'react'
import Topbar from '../global/Topbar'
import TableComponent from '../component/table'
import { Typography, useTheme } from '@mui/material'
import { tokens } from '../theme'
import { useGetAllTripMutation, useGetMemberMutation, useGetTripMutation } from '../api/api'
import ToolTip from '../component/toolTip'
import AddTrip from '../component/addtrip';
import EditTripMem from '../component/editTripMem'

export default function Group({ user, secret, groupInfo }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [triggerTrip, resultTrip] = useGetTripMutation();
  const [triggerMember, resultMember] = useGetMemberMutation();
  const [member, setMember] = useState([]);
  const [trip, setTrip] = useState([]);

  useEffect(() => {
    triggerTrip({ group_id: groupInfo.group_id })
    triggerMember({ group_id: groupInfo.group_id })
  }, [])

  useEffect(() => {
    if (resultTrip.data?.status) {
      setTrip(resultTrip.data?.data)
    }
  }, [resultTrip.data])

  useEffect(() => {
    if (resultMember.data?.status) {
      setMember(resultMember.data?.data)
    }
  }, [resultMember.data])

  const rows = calculateMoney(member, trip);
  const columns = functionRenderColumns(rows);

  return (
    <main className="content">
      <Topbar groupInfo={groupInfo} />
      <div className='body'>
        <TableComponent rows={rows} columns={columns} />
        <ToolTip triggerMember={triggerMember} member={member} group_id={groupInfo.group_id} />
        <AddTrip triggerTrip={triggerTrip} member={member} secret={secret} trip={trip} group_id={groupInfo.group_id} />
        <EditTripMem triggerTrip={triggerTrip} member={member} secret={secret} trip={trip} group_id={groupInfo.group_id} />
      </div>
    </main>
  )
}

function calculateMoney(allMembers, trips) {
  let newData = [];
  let i, j, trip;
  let kitLuy = {}
  for (i in allMembers) {
    newData[i] = {};
    let member = allMembers[i];
    let luyForTrip = 0;
    let paid = member.paid;
    let luySol = paid;
    for (trip in trips) {
      let { mem_id, spend, trp_name } = trips[trip];
      mem_id = JSON.parse(mem_id);
      let osMnek = 0;
      for (j in mem_id) {
        let joined = mem_id[j]
        if (member.id === Number(joined)) {
          osMnek = (spend / mem_id?.length);
          luyForTrip += (spend / mem_id?.length);
          luySol = (member.paid - luyForTrip);
        }
      }
      kitLuy = Object.assign(kitLuy, { [trp_name]: formatMoney(osMnek, 1) })
    }
    let unPaid = 0;
    newData[i] = {
      id: Number(i) + 1,
      name: allMembers[i].mem_name,
      paid: paid + "$",
    }
    newData[i] = Object.assign(newData[i], kitLuy, { remain: formatMoney(luySol > 0 ? luySol : unPaid), "Unpaid": formatMoney(luySol > 0 ? unPaid : luySol) })
  }
  return newData;
}

function formatMoney(money, option = 2) {
  let newMoney = "";
  if (!money) return "-/-  ";
  if (typeof money == "string") {
    try {
      money = Number(parseFloat(money));
    } catch {
      alert("error typeof money is not number");
      return money;
    }
  }
  if (option == 1) {
    if (money > 0) {
      newMoney = "-" + money;
    } else {
      newMoney = money;
    }
  }
  if (option == 2) {
    newMoney = money;
  }
  return newMoney.toString().substring(0, 5) + "$"
}

function functionRenderColumns(rows) {
  let headerValues = ["ID", "Name", "Paid", "Remain", "Unpaid"]
  let newColumns = [], key;
  try {
    key = Object.keys(rows[0]);
  } catch {
    key = headerValues;
  }
  for (let i in key) {
    let title = key[i];
    for (let j in headerValues) {
      if (key[i].toLocaleLowerCase().includes(headerValues[j].toLocaleLowerCase())) {
        title = headerValues[j];
      }
    }
    // set column style 
    newColumns[i] = {
      field: key[i],
      headerName: title,
      headerAlign: 'center',
      align: 'center'
    }
    if (title === 'Name') {
      newColumns[i] = Object.assign(newColumns[i], {
        minWidth: 110,
        headerAlign: 'left',
        align: 'left',
        hideable: false
      })
    }
    if (title === 'Remain' || title === 'Unpaid') {
      newColumns[i] = Object.assign(newColumns[i], {
        minWidth: 110,
        headerAlign: 'right',
        align: 'right'
      })
    }
    if (title === 'ID') {
      newColumns[i] = Object.assign(newColumns[i], {
        hidden: false,
        minWidth: 60,
        width: 60
      })
    }
  }
  return newColumns;
}