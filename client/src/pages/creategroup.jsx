import { Autocomplete, Box, Button, Chip, FormControl, Stack, TextField, useMediaQuery } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useGetAllMemberMutation, usePostAddGroupMutation } from '../api/api';
import { Formik } from 'formik';
import * as yup from "yup";
import { useNavigate } from 'react-router-dom';
import { computeFlexColumnsWidth } from '@mui/x-data-grid/hooks/features/columns/gridColumnsUtils';

export default function CreateGroup({ secret, setGroupInfo }) {
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const [triggerMember, resultMember] = useGetAllMemberMutation();
    const [triggerCreateGroup, resultGroup] = usePostAddGroupMutation();
    const [suggestMember, setSuggestMember] = useState([]);
    const [newMember, setNewMember] = useState([]);
    const [newGroupName, setnewGroupName] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        triggerMember()
    }, [])

    useEffect(() => {
        if (resultMember.data?.status) {
            setSuggestMember(resultMember.data.data)
        }
    }, [resultMember.data])

    const handleFormSubmit = debounce(async (values) => {
        const { grp_name, description } = values;
        const members = newMember;
        if (grp_name && description) {
            setnewGroupName(grp_name);
            triggerCreateGroup({ user_id: secret, grp_name, description, status: 1, member: JSON.stringify(members) })
        }
    }, 500);

    useEffect(() => {
        if (resultGroup.data?.status) {
            navigate('/');
        }
    }, [resultGroup])

    return (
        <>
            <Box
                sx={{
                    width: '100%',
                    height: '100vh',
                    minHeight: '50vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }} >
                <Formik
                    onSubmit={handleFormSubmit}
                    initialValues={initialValues}
                    validationSchema={checkoutSchema}
                >
                    {({
                        values,
                        handleChange,
                        handleSubmit,
                    }) => (
                        <form>
                            <Box
                                width={isNonMobile ? undefined : "280px"}
                                display="grid"
                                gap="30px"
                                gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                                sx={{
                                    "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                                }}
                            >
                                <TextField
                                    variant="standard"
                                    type="text"
                                    label="Group's name"
                                    onChange={handleChange}
                                    value={values.grp_name}
                                    name="grp_name"
                                    color="info"
                                    sx={{ gridColumn: "span 2" }}
                                />
                                <TextField
                                    id="standard-multiline-static"
                                    label="Description"
                                    color="info"
                                    multiline
                                    onChange={handleChange}
                                    value={values.description}
                                    name="description"
                                    variant="standard"
                                    sx={{ gridColumn: "span 2" }}
                                />
                                <Autocomplete
                                    multiple
                                    id="tags-filled"
                                    sx={{ gridColumn: "span 4" }}
                                    options={suggestMember.map((option) => option.mem_name)}
                                    freeSolo
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                                        ))
                                    }
                                    onChange={(event, newValue) => {
                                        setNewMember(newValue);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="standard"
                                            label="Add Member"
                                            color='info'
                                            placeholder="member"
                                        />
                                    )}
                                />
                                <Box
                                    sx={{
                                        gridColumn: "span 4",
                                        display: 'flex',
                                        flexDirection: 'row',
                                        gap: '10px'
                                    }}
                                >
                                    <Button
                                        color="info"
                                        variant="outlined"
                                        type="button"
                                        sx={{ flex: '1' }}
                                        onClick={handleSubmit}
                                    >
                                        Create
                                    </Button>
                                    <Button
                                        color="error"
                                        variant="outlined"
                                        type="button"
                                        sx={{ gridColumn: "span 4" }}
                                        onClick={() => {
                                            navigate('/');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Box>
                        </form>
                    )}
                </Formik>
            </Box>
        </>
    )
}


const checkoutSchema = yup.object().shape({
    grp_name: yup.string().required("required"),
    description: yup.string()
});
const initialValues = {
    grp_name: "",
    description: "",
};

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}