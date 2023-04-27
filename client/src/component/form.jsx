import { Box, Button, FormControl, InputLabel, MenuItem, TextField } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Select from '@mui/material/Select';
import axios from 'axios';
import { useState } from "react";
import AutorenewIcon from '@mui/icons-material/Autorenew';
const baseURL = import.meta.env.VITE_BASE_URL; 
const user_id = 1;
export default function Form({onSubmit,setOnSubmit}) {

  const isNonMobile = useMediaQuery("(min-width:600px)");
  let name;
  const [changeButton,setChangeButton] = useState(1);

  const handleSeleteName = (event) => {
    name = event.target.value;
  };

  let data = JSON.parse(localStorage.getItem('allMembers'));

  const handleFormSubmit = debounce(async (values) => {
    if(values.name && values.money){
      const res = await axios.get(`${baseURL}note/addMember?user_id=${user_id}&member=${JSON.stringify(values)}`).then(res =>{
        if(res.data.status == false){
          alert(res.data.message);
          setOnSubmit(false);
        }
        if(res.data.status == true){
          if(onSubmit===true){
            setOnSubmit("true");
          }else{
            setOnSubmit(true);
          }
        }
      });
    }
  },500);

  const handleEdit = debounce(async (values) => {
    if(values.name && values.money){
      const res = await axios.get(`${baseURL}note/addMember?user_id=${user_id}&member=${JSON.stringify(values)}`).then(res =>{
        if(res.data.status == false){
          alert(res.data.message);
          setOnSubmit(false);
        }
        if(res.data.status == true){
          if(onSubmit===true){
            setOnSubmit("true");
          }else{
            setOnSubmit(true);
          }
        }
      });
    }
  },500);

  const handleDelete = debounce(async (values) => {
    alert('deleted '+name)
    // if(values.name && values.money){
    //   const res = await axios.get(`${baseURL}note/addMember?user_id=${user_id}&member=${JSON.stringify(values)}`).then(res =>{
    //     if(res.data.status == false){
    //       alert(res.data.message);
    //       setOnSubmit(false);
    //     }
    //     if(res.data.status == true){
    //       if(onSubmit===true){
    //         setOnSubmit("true");
    //       }else{
    //         setOnSubmit(true);
    //       }
    //     }
    //   });
    // }
  },500);

  const handleSettingButton = () => {
      setChangeButton(changeButton+1)
      if(changeButton>=3){
        setChangeButton(1)
      }
  }

  return (
    <Box m="20px">
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
                sx={{ gridColumn: "span 3" }}
                >
                <TextField
                    fullWidth
                    variant="filled"
                    type="text"
                    label="Name"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.name}
                    name="name"
                    error={!!touched.name && !!errors.name}
                    helperText={touched.name && errors.name}
                    sx={{ gridColumn: "span 2" }}
                    style={changeButton===1?{display:"flex"}:{display:"none"}}
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
                    error={!!touched.money && !!errors.money}
                    helperText={touched.money && errors.money}
                    sx={{ gridColumn: "span 2" }}
                    style={changeButton===1?{display:"flex"}:{display:"none"}}
                />
                <FormControl variant="standard" 
                  sx={{ gridColumn: "span 4" }}
                  style={changeButton===3?{display:"flex"}:{display:"none"}} >
                  <InputLabel id="Name">Name</InputLabel>
                  <Select
                    labelId="Name"
                    id="Name"
                    value={name}
                    onChange={handleSeleteName}
                    label="Name"
                  >
                    {(typeof data != "undefined") && (!!data) && data.map((item,index)=> 
                      <MenuItem key={index} value={item.name}>{item.name}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                
                <TextField
                    fullWidth
                    variant="filled"
                    type="text"
                    label="$ Paid"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.money}
                    name="money"
                    error={!!touched.money && !!errors.money}
                    helperText={touched.money && errors.money}
                    sx={{ gridColumn: "span 2" }}
                    style={changeButton===2?{display:"flex"}:{display:"none"}}
                />
              </Box>
              <Box 
                display="flex"
                justifyContent="space-evenly"
                gap="5px" >
                  <Button sx={{ flex:6 }} style={changeButton===1?{display:"flex"}:{display:"none"}} onClick={handleSubmit} type="button" color="secondary" variant="contained" >
                      Add
                  </Button>
                  <Button sx={{ flex:6 }} style={changeButton===2?{display:"flex"}:{display:"none"}} onClick={handleEdit} type="button" color="neutral" variant="contained" >
                     Edit
                  </Button>
                  <Button sx={{ flex:6 }} style={changeButton===3?{display:"flex"}:{display:"none"}} onClick={handleDelete} type="button" color="warning" variant="contained" >
                     Delete
                  </Button>
                  <Button sx={{ flex:1 }} onClick={handleSettingButton} type="button" color="secondary" variant="outlined"  >
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

function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}