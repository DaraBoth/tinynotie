import React, { useEffect, useState } from 'react';
import {
  Autocomplete, Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, TextField, useMediaQuery, CircularProgress, Typography, Snackbar, Alert
} from '@mui/material';
import { Formik } from 'formik';
import * as yup from "yup";
import { useNavigate } from 'react-router-dom';
import { useGetAllMemberMutation, usePostAddGroupMutation } from '../api/api';

export default function CreateGroup({ secret, setGroupInfo }) {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [triggerMember, resultMember] = useGetAllMemberMutation();
  const [triggerCreateGroup, resultGroup] = usePostAddGroupMutation();
  const [suggestMember, setSuggestMember] = useState([]);
  const [newMember, setNewMember] = useState([]);
  const [currency, setCurrency] = useState("$");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    triggerMember();
  }, []);

  useEffect(() => {
    if (resultMember.data?.status) {
      setSuggestMember(resultMember.data.data);
    }
  }, [resultMember.data]);

  const handleFormSubmit = debounce(async (values) => {
    const { grp_name } = values;
    if (grp_name && currency && newMember.length > 0) {
      try {
        await triggerCreateGroup({
          user_id: secret,
          grp_name,
          currency,
          status: 1,
          member: JSON.stringify(newMember),
        }).unwrap();
        setShowSuccess(true);
        setTimeout(() => navigate('/'), 2000);
      } catch {
        setShowError(true);
      }
    }
  }, 500);

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={checkoutSchema}
      >
        {({
          values,
          handleChange,
          handleSubmit,
          errors,
          touched,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                width: '100%',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              <Typography variant="h4" color="primary" textAlign="center">
                Create New Note
              </Typography>
              <TextField
                variant="outlined"
                label="Note's name"
                onChange={handleChange}
                value={values.grp_name}
                name="grp_name"
                color="primary"
                error={Boolean(touched.grp_name && errors.grp_name)}
                helperText={touched.grp_name && errors.grp_name}
                fullWidth
                InputProps={{
                  startAdornment: <Box sx={{ mr: 1, color: 'gray' }}>🏷️</Box>,
                }}
              />
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  label="Currency"
                >
                  <MenuItem value="$">US Dollar</MenuItem>
                  <MenuItem value="W">Korean Won</MenuItem>
                  <MenuItem value="R">Khmer Reil</MenuItem>
                </Select>
              </FormControl>
              <Autocomplete
                multiple
                id="tags-filled"
                options={suggestMember.map((option) => option.mem_name)}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="filled"
                      label={option}
                      {...getTagProps({ index })}
                      color="primary"
                    />
                  ))
                }
                onChange={(event, newValue) => setNewMember(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Add Members"
                    color="primary"
                    placeholder="Enter member names"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <Box sx={{ mr: 1, color: 'gray' }}>👥</Box>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  fullWidth
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size="1rem" /> : null}
                  sx={{
                    height: '45px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'background-color 0.3s ease',
                    '&:hover': {
                      backgroundColor: '#006bb3',
                    },
                  }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Note'}
                </Button>
                <Button
                  color="error"
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/')}
                  sx={{
                    height: '45px',
                    transition: 'color 0.3s ease',
                    '&:hover': {
                      color: '#ff4444',
                    },
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </form>
        )}
      </Formik>
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Note created successfully!
        </Alert>
      </Snackbar>
      <Snackbar
        open={showError}
        autoHideDuration={4000}
        onClose={() => setShowError(false)}
      >
        <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
          Something went wrong. Please try again.
        </Alert>
      </Snackbar>
    </Box>
  );
}

const checkoutSchema = yup.object().shape({
  grp_name: yup.string().required("Note name is required"),
});

const initialValues = {
  grp_name: "",
};

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}
