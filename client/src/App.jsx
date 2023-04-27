import React, { useState } from 'react'
import TableComponent from "./component/table";
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ColorModeContext, useMode } from './theme';
import './index.scss'
import Topbar from './global/Topbar';
import Form from './component/form';
import { QueryClientProvider, QueryClient, useQuery } from 'react-query'

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);
  const queryClient = new QueryClient();
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
          <div className="app"> 
              <main className="content">
                <Topbar setIsSidebar={setIsSidebar} />
                <QueryClientProvider client={queryClient} >
                  <TableComponent/>
                </QueryClientProvider>
              </main>
          </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default App
