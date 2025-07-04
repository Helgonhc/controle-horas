// Local do arquivo: src/App.jsx

import React, { useState, useEffect } from 'react';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { AppContent } from './pages/AppContent';
import { LoginScreen } from './pages/LoginScreen';
import { TripDetails } from './pages/TripDetails'; // Importa a nova página

// NOVO: Importações do React Router
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLoadScript } from '@react-google-maps/api';

const libraries = ['places'];

function App() {
    const [user, setUser] = useState(null);
    const [authIsReady, setAuthIsReady] = useState(false);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_Maps_API_KEY,
        libraries,
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setAuthIsReady(true);
        });
        return () => unsubscribe();
    }, []);

    if (!authIsReady || !isLoaded) {
        return <div className="flex items-center justify-center min-h-screen text-xl font-bold">Carregando...</div>;
    }

    if (loadError) {
        return <div className="flex items-center justify-center min-h-screen text-xl font-bold text-red-500">Erro ao carregar o serviço de mapas.</div>;
    }

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
            
            {/* NOVO: Sistema de Roteamento */}
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={user ? <AppContent user={user} /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/login"
                        element={!user ? <LoginScreen /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/viagem/:tripId"
                        element={user ? <TripDetails user={user} /> : <Navigate to="/login" />}
                    />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;