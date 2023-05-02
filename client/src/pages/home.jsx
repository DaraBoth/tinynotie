import { Autocomplete, Box, Button, FormControl, TextField } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useGetGroupMutation } from '../api/api'
import SendIcon from '@mui/icons-material/Send';

export default function Home({ user, secret ,setGroupInfo }) {
    const [triggerUser, resultUser] = useGetGroupMutation();
    const [data, setData] = useState([]);
    const [group,setGroup] = useState({});

    useEffect(() => {
        triggerUser({ user, user_id: secret })
    }, [])

    useEffect(() => {
        if (resultUser.data?.status) {
            setData(resultUser.data.data);
        }
    }, [resultUser.data]); // eslint-disable-line

    const handleSubmit = () => {
        setGroupInfo(group);
    }

    return (
        <Box sx={{
            width: '100%',
            height: '100vh',
            minHeight: '50vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }} >
            <FormControl

            >
                <Box
                >
                    <Autocomplete
                        disablePortal
                        id="combo-box-demo"
                        options={data.map((item) => {
                            return {
                                label: item.grp_name, id: item.id
                            };
                        })}
                        onChange={(event, newValue) => {
                            setGroup({group_id:newValue.id,group_name:newValue.label})
                        }}
                        sx={{ width: 300 }}
                        renderInput={(params) => <TextField {...params} label="Pick a Group" color="info" variant="standard" />}
                    />
                </Box>
                <Box
                    display="flex"
                    justifyContent="flex-end"
                    gap="5px"
                    marginTop='5px'
                >
                    <Button onClick={handleSubmit} type="button" color="info" variant="standard" >
                        <SendIcon />
                    </Button>
                </Box>
            </FormControl>
        </Box>
    )
}
