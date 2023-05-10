import { Autocomplete, Box, Button, FormControl, TextField, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useGetGroupMutation } from '../api/api'
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from 'react-router-dom'

export default function Home({ user, secret, setGroupInfo }) {
    const [triggerUser, resultUser] = useGetGroupMutation();
    const [data, setData] = useState([]);
    const [group, setGroup] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        triggerUser({ user, user_id: secret })
    }, [])

    useEffect(() => {
        if (resultUser.data?.status) {
            setData(resultUser.data.data);
        }
    }, [resultUser.data]); // eslint-disable-line

    const handleSubmit = () => {
        if (group.group_id && group.group_name) {
            setGroupInfo(group);
        }
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
            <FormControl>
                <Box
                    display={'flex'}
                    justifyContent={'center'}
                    gap={'5px'}
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
                            setGroup({ group_id: newValue.id, group_name: newValue.label })
                        }}
                        sx={{ width: 300 }}
                        renderInput={(params) => <TextField {...params} label="Pick a Group" color="info" variant="standard" />}
                    />
                    <Button disableRipple sx={{ alignSelf: 'flex-end' ,"&:hover": {boxShadow: `none`,backgroundColor: 'none',background: 'none' }}} onClick={handleSubmit} type="button" color="info" variant="standard" >
                        <SendIcon />
                    </Button>
                </Box>
                <Typography marginTop={'18px'} textAlign={'center'} variant="p">or</Typography>
                <Box
                    display="flex"
                    justifyContent="center"
                    gap="5px"
                    marginTop='5px'
                >
                    <Button
                        onClick={() => {
                            navigate("/creategroup")
                        }}
                        type="button"
                        color="info"
                        variant="text"
                        disableRipple
                        sx={{
                            "&:hover": {
                                boxShadow: `none`,
                                backgroundColor: 'none',
                                background: 'none'
                            },
                            padding: '0px',
                            minWidth: '0px',
                            marginLeft: '5px',
                            textAlign: 'left',
                            textTransform: 'capitalize',
                            textDecoration: 'underline'
                        }}
                    >
                        Create a new group
                    </Button>
                </Box>
            </FormControl>
        </Box>
    )
}
