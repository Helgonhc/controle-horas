import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-toastify';
import { LogIn, Mail, Lock, ShieldCheck } from 'lucide-react';

// Importe sua imagem de logo aqui (exemplo):
// import logo from '../../assets/sua-logo.png';

export const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = getAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('E-mail ou senha inválidos.');
            console.error("Erro de login:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        const userEmail = prompt("Por favor, digite o seu e-mail para receber o link de recuperação:");
        if (!userEmail) return;

        try {
            await sendPasswordResetEmail(auth, userEmail);
            toast.success("Link de recuperação enviado! Verifique sua caixa de e-mail (e a pasta de spam).");
        } catch (error) {
            toast.error("Ocorreu um erro. Verifique se o e-mail foi digitado corretamente.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 flex justify-center">
            <div className="max-w-screen-xl m-0 sm:m-10 bg-white shadow sm:rounded-lg flex justify-center flex-1">
                
                {/* Painel da Esquerda (Branding) */}
                <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12 bg-gradient-to-tr from-blue-800 to-purple-700 text-white flex flex-col items-center justify-center">
                    <div className="text-center">
                        {/* Se você tiver uma logomarca, pode colocar o <img> aqui no lugar do ícone */}
                        <ShieldCheck className="w-24 h-24 mx-auto" />

                        <h1 className="text-3xl font-bold mt-4">AeC Serviços Especializados</h1>
                        <p className="mt-2 font-light">Gerenciamento inteligente para sua equipe.</p>
                        
                        {/* NOVO: Créditos do desenvolvedor */}
                        <div className="mt-12 text-xs text-indigo-200">
                            <p>Aplicativo desenvolvido por</p>
                            <p className="font-bold tracking-wider">Helgon Henrique</p>
                        </div>
                    </div>
                </div>

                {/* Painel da Direita (Formulário) */}
                <div className="lg:w-1/2 xl:w-7/12 p-6 sm:p-16 flex flex-col justify-center">
                    <div className="w-full max-w-md mx-auto">
                        <h2 className="text-3xl font-extrabold text-center text-gray-900">
                            Bem-vindo de volta!
                        </h2>
                        <p className="text-center mt-2 text-gray-600">Acesse sua conta para continuar.</p>

                        <form onSubmit={handleLogin} className="mt-8 space-y-6">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    placeholder="Seu e-mail"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    placeholder="Sua senha"
                                />
                            </div>

                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={handlePasswordReset}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>

                            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out disabled:bg-blue-400"
                            >
                                <LogIn className="mr-2 h-5 w-5" />
                                {loading ? 'Entrando...' : 'Entrar na Plataforma'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};