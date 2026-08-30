import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import App from './App'
import { AuthProvider } from './features/auth'
import AppThemeProvider from './theme/AppThemeProvider'

document.documentElement.setAttribute('dir', 'rtl')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <ToastContainer
            position="top-center"
            rtl
            autoClose={2200}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover={false}
            draggable
            limit={1}
            theme="colored"
            style={{ zIndex: 9999 }}
          />
        </AuthProvider>
      </BrowserRouter>
    </AppThemeProvider>
  </React.StrictMode>
)
