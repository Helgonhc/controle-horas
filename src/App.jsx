// Local: src/App.jsx
// Substitua todo o conteúdo por este:

import React, { useState, useEffect } from 'react';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { AppContent } from './pages/AppContent';
import { LoginScreen } from './pages/LoginScreen';

// Importações da biblioteca de notificações
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const [user, setUser] = useState(null);
    const [authIsReady, setAuthIsReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setAuthIsReady(true);
        });
        return () => unsubscribe();
    }, []);

    if (!authIsReady) {
        return <div className="flex items-center justify-center min-h-screen text-xl font-bold">Carregando...</div>;
    }

    return (
        <>
            {/* Container que vai exibir as notificações */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
            
            {user ? <AppContent user={user} /> : <LoginScreen />}
        </>
    );
}

export default App;