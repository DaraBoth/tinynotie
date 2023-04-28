import { Box, Button, FormControl, InputLabel, MenuItem, TextField, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Select from '@mui/material/Select';
import axios from 'axios';
import { useState } from "react";
import AutorenewIcon from '@mui/icons-material/Autorenew';
const baseURL = import.meta.env.VITE_BASE_URL;
const user_id = 2;
export default function AddTripForm({ onSubmit, setOnSubmit }) {
  let deletName, editName, editMoney;
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [changeButton, setChangeButton] = useState(1);

  let data = JSON.parse(localStorage.getItem('allMembers'));

  const getEditName = (events) => {
    editName = events.target.value;
  }

  const getEditMoney = (events) => {
    editMoney = events.target.value;
  }

  const getDeleteName = (events) => {
    deletName = events.target.value;
  }

  const handleFormSubmit = debounce(async (values) => {
    if (values.name && values.money) {
      const res = await axios.get(`${baseURL}note/addMember?user_id=${user_id}&member=${JSON.stringify(values)}`).then(res => {
        if (res.data.status == false) {
          alert(res.data.message);
          setOnSubmit(false);
        }
        if (res.data.status == true) {
          alert('sucess!')
        }
      });
    }
  }, 500);

  const handleEdit = debounce(async () => {
    const member = { editName, editMoney }
    if (member.editName && member.editMoney) {
      const res = await axios.get(`${baseURL}note/editMember?user_id=${user_id}&member=${JSON.stringify(member)}`).then(res => {
        if (res.data.status == false) {
          alert(res.data.message);
          setOnSubmit(false);
        }
        if (res.data.status == true) {
          alert('sucess!')
        }
      });
    }

  }, 500);

  const handleDelete = debounce(async () => {
    if (deletName) {
      const res = await axios.get(`${baseURL}note/deleteMember?user_id=${user_id}&name=${deletName}`).then(res => {
        if (res.data.status == false) {
          alert(res.data.message);
          setOnSubmit(false);
        }
        if (res.data.status == true) {
          if (onSubmit === true) {
            setOnSubmit("true");
          } else {
            setOnSubmit(true);
          }
        }
      });
    }
  }, 500);

  const handleSettingButton = () => {
    setChangeButton(changeButton + 1)
    if (changeButton >= 3) {
      setChangeButton(1)
    }
  }

  return (
    <Box
      marginTop={5}
    >
      <Typography variant="h3"
        sx={{ marginBottom: 1 }}
      >
        Trips
      </Typography>
      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={checkoutSchema}
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
        }) => (
          <form>
            <Box

              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
              }}
            >
              <Box
                display="grid"
                gap="30px"
                gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                sx={{ gridColumn: "span 2" }}
              >

                {/* add member */}
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.name}
                  name="name"
                  color="info"
                  error={!!touched.name && !!errors.name}
                  helperText={touched.name && errors.name}
                  sx={{ gridColumn: "span 2" }}
                  style={changeButton === 1 ? { display: "flex" } : { display: "none" }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="$ Paid"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.money}
                  name="money"
                  color="info"
                  error={!!touched.money && !!errors.money}
                  helperText={touched.money && errors.money}
                  sx={{ gridColumn: "span 2" }}
                  style={changeButton === 1 ? { display: "flex" } : { display: "none" }}
                />

                {/* edit user  */}
                <FormControl
                  fullWidth
                  sx={{ gridColumn: "span 2" }}
                  style={changeButton === 2 ? { display: "flex" } : { display: "none" }} >
                  <InputLabel id="editName" color="info" >Name</InputLabel>
                  <Select
                    labelId="editName"
                    id="editName"
                    value={editName}
                    color="info"
                    onChange={getEditName}
                    label="Name"
                  >
                    {(typeof data != "undefined") && (!!data) && data.map((item, index) =>
                      <MenuItem key={index} value={item.name}>{item.name}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="$ Paid"
                  color="info"
                  value={editMoney}
                  onChange={getEditMoney}
                  error={!!touched.money && !!errors.money}
                  helperText={touched.money && errors.money}
                  sx={{ gridColumn: "span 2" }}
                  style={changeButton === 2 ? { display: "flex" } : { display: "none" }}
                />

                {/* delete user */}
                <FormControl
                  fullWidth
                  sx={{ gridColumn: "span 4" }}
                  style={changeButton === 3 ? { display: "flex" } : { display: "none" }} >
                  <InputLabel id="Name" color="info" >Name</InputLabel>
                  <Select
                    labelId="Name"
                    id="Name"
                    color="info"
                    value={deletName}
                    onChange={getDeleteName}
                    label="Name"
                  >
                    {(typeof data != "undefined") && (!!data) && data.map((item, index) =>
                      <MenuItem key={index} value={item.name}>{item.name}</MenuItem>
                    )}
                  </Select>
                </FormControl>

              </Box>
              <Box
                display="flex"
                justifyContent="space-evenly"
                gap="5px" >
                <Button sx={{ flex: 6 }} style={changeButton === 1 ? { display: "flex" } : { display: "none" }} onClick={handleSubmit} type="button" color="info" variant="contained" >
                  Add
                </Button>
                <Button sx={{ flex: 6 }} style={changeButton === 2 ? { display: "flex" } : { display: "none" }} onClick={handleEdit} type="button" color="secondary" variant="contained" >
                  Edit
                </Button>
                <Button sx={{ flex: 6 }} style={changeButton === 3 ? { display: "flex" } : { display: "none" }} onClick={handleDelete} type="button" color="warning" variant="contained" >
                  Delete
                </Button>
                <Button sx={{ flex: 1 }} onClick={handleSettingButton} type="button" color="info" variant="outlined"  >
                  <AutorenewIcon />
                </Button>
              </Box>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  );
};

const checkoutSchema = yup.object().shape({
  name: yup.string().required("required"),
  money: yup.number().required("required")
});
const initialValues = {
  name: "",
  money: "",
};

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}