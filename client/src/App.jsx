import React, { useState } from 'react'
import TableComponent from "./component/table";
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ColorModeContext, useMode } from './theme';
import './index.scss'
import Topbar from './global/Topbar';
import { QueryClientProvider, QueryClient, useQuery } from 'react-query'
import AddTripForm from './component/addtrip';
import Form from './component/form';

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);
  const [onSubmit,setOnSubmit] = useState(false);
  const queryClient = new QueryClient();
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
          <div className="app"> 
              <main className="content">
                <Topbar setIsSidebar={setIsSidebar} />
                <QueryClientProvider client={queryClient} >
                  <div className='body'>
                    <Form onSubmit={onSubmit} setOnSubmit={setOnSubmit} />
                    <TableComponent onSubmit={onSubmit} setOnSubmit={setOnSubmit}  />
                    <AddTripForm onSubmit={onSubmit} setOnSubmit={setOnSubmit} />
                  </div>
                </QueryClientProvider>
              </main>
          </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default App
