import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography, useTheme } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { tokens } from '../theme'
import DeleteIcon from '@mui/icons-material/Delete';
import { rspWidth } from '../responsive'
import { useDeleteMemberMutation } from '../api/api';

export default function DeleteMember({ triggerMember, member, group_id }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [deleteName, setDeleteName] = useState();
  const [triggerDeleteMember, ResultDeleteMember] = useDeleteMemberMutation();

  const handleFont = () => {
    return rspWidth("1.2rem", "1rem", "1rem")
  }

  const handleChange = (event) => {
    setDeleteName(event.target.value);
  }

  const handleDelete = () => {
    if(deleteName){
      triggerDeleteMember(deleteName)
    }
  }

  useEffect(() => {
    if (ResultDeleteMember.data?.status) {
      triggerMember({ group_id })
    }
  }, [ResultDeleteMember.data])

  return (
    <>
      <Box
        display="grid"
        gap="10px"
        gridTemplateColumns="repeat(4, 1fr)"
        sx={{
          "& > div": { gridColumn: "span 4" },
        }}
      >
        <Typography
          fontSize={handleFont}
          sx={{ gridColumn: "span 4" }}
        >
          Delete Member
        </Typography>
        <FormControl>
          <InputLabel variant='standard' color='info' >Pick a member</InputLabel>
          <Select
            value={deleteName}
            onChange={handleChange}
            label="trpNametoEdit"
            variant='standard'
            color='info'
          >
            <MenuItem disabled={deleteName ? false : true} value={false} >
              Pick a member
            </MenuItem>
            {member?.map((item) => (
              <MenuItem
                key={item.id}
                value={item.id}
                id={item.id}
                title={item.mem_name}
              >
                {item.mem_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          sx={{ gridColumn: "span 4" }}
          onClick={handleDelete}
          type="button"
          variant='outlined'
          color='error'
        >
          Delete member&nbsp;<DeleteIcon />
        </Button>
      </Box>
    </>
  )
}
