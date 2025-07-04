import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-toastify';
import { LogIn, Mail, Lock } from 'lucide-react';

// Certifique-se que sua logo transparente está em 'src/assets/logo-aec-transparente.png'
import logoAec from '../assets/logo-aec-transparente.png';

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
            // Mapeamento de erros comuns para mensagens mais amigáveis
            let errorMessage = "Erro de login. Por favor, tente novamente.";
            if (err.code === "auth/invalid-email") {
                errorMessage = "Formato de e-mail inválido.";
            } else if (err.code === "auth/user-disabled") {
                errorMessage = "Usuário desativado.";
            } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                errorMessage = "E-mail ou senha inválidos.";
            }
            setError(errorMessage);
            console.error("Erro de login:", err); // Para depuração
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
            let errorMessage = "Ocorreu um erro ao enviar o link. Tente novamente.";
            if (error.code === "auth/invalid-email") {
                errorMessage = "O e-mail digitado é inválido.";
            } else if (error.code === "auth/user-not-found") {
                errorMessage = "Nenhuma conta encontrada com este e-mail.";
            }
            toast.error(errorMessage);
            console.error("Erro de recuperação de senha:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 flex justify-center items-center p-4 sm:p-0"> {/* Adicionado p-4 para mobile, p-0 em sm e acima */}
            <div className="max-w-screen-xl m-0 sm:m-10 bg-white shadow sm:rounded-lg flex flex-col sm:flex-row justify-center flex-1"> {/* flex-col em mobile, flex-row em sm+ */}
                
                {/* Coluna Esquerda (Informações e Logo) - Visível em todas as telas, mas com layout flexível */}
                <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12 bg-gradient-to-tr from-blue-800 to-purple-700 text-white flex flex-col items-center justify-center text-center rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"> {/* rounded-t-lg para mobile, rounded-l-lg para sm+, rounded-tr-none para evitar canto redondo extra */}
                    <div className="w-full"> {/* Contêiner para centralizar e controlar largura do conteúdo */}
                        
                        {/* Logo: Largura responsiva */}
                        <img 
                            src={logoAec} 
                            alt="Logotipo AeC Serviços Especializados" 
                            className="max-w-[180px] sm:max-w-[220px] md:max-w-xs mx-auto mb-6 sm:mb-8" /* max-w responsivo */
                        />

                        <h1 className="text-2xl sm:text-3xl font-bold">AeC Serviços Especializados</h1> {/* Tamanho de fonte responsivo */}
                        <p className="mt-2 text-sm sm:text-base font-light">Gerenciamento inteligente para sua equipe.</p> {/* Tamanho de fonte responsivo */}
                        
                        <div className="mt-8 sm:mt-12 text-xs text-indigo-200"> {/* Margem responsiva */}
                            <p>Aplicativo desenvolvido por</p>
                            <p className="font-bold tracking-wider">Helgon Henrique</p>
                        </div>
                    </div>
                </div>

                {/* Coluna Direita (Formulário de Login) */}
                <div className="lg:w-1/2 xl:w-7/12 p-6 sm:p-16 flex flex-col justify-center rounded-b-lg sm:rounded-r-lg sm:rounded-bl-none"> {/* rounded-b-lg para mobile, rounded-r-lg para sm+, rounded-bl-none */}
                    <div className="w-full max-w-md mx-auto">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900"> {/* Tamanho de fonte responsivo */}
                            Bem-vindo de volta!
                        </h2>
                        <p className="text-center mt-2 text-sm sm:text-base text-gray-600">Acesse sua conta para continuar.</p> {/* Tamanho de fonte responsivo */}

                        <form onSubmit={handleLogin} className="mt-6 sm:mt-8 space-y-4 sm:space-y-6"> {/* Margem e espaçamento responsivos */}
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 sm:py-3 pl-12 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" /* Padding e tamanho de fonte responsivos */
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
                                    className="w-full px-4 py-2 sm:py-3 pl-12 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" /* Padding e tamanho de fonte responsivos */
                                    required
                                    placeholder="Sua senha"
                                />
                            </div>

                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={handlePasswordReset}
                                    className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800" /* Tamanho de fonte responsivo */
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>

                            {error && <p className="text-xs sm:text-sm text-red-600 text-center">{error}</p>} {/* Tamanho de fonte responsivo */}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-2 sm:py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out disabled:bg-blue-400 text-sm sm:text-base" /* Padding e tamanho de fonte responsivos */
                            >
                                <LogIn className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> {/* Tamanho do ícone responsivo */}
                                {loading ? 'Entrando...' : 'Entrar na Plataforma'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};