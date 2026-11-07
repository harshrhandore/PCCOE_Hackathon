import React from'react';import{createRoot}from'react-dom/client';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{BrowserRouter}from'react-router-dom';
import'./i18n';
import'@fontsource/newsreader/latin-400.css';import'@fontsource/newsreader/latin-600.css';import'@fontsource/atkinson-hyperlegible-next/latin-400.css';import'@fontsource/atkinson-hyperlegible-next/latin-600.css';import'@fontsource/ibm-plex-mono/latin-400.css';import'@fontsource/noto-sans-devanagari/devanagari-400.css';import'@fontsource/noto-serif-devanagari/devanagari-400.css';
import'./styles/app.css';import App from'./App';
const queryClient=new QueryClient({defaultOptions:{queries:{refetchOnWindowFocus:false}}});
createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><App/></BrowserRouter></QueryClientProvider></React.StrictMode>);
