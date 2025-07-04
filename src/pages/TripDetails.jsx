// Local do arquivo: src/pages/TripDetails.jsx
// Adicionado useEffect à importação do React
import React, { useState, useMemo, useEffect } from 'react'; 
import { useParams, Link } from 'react-router-dom';
import { useDocument } from '../hooks/useDocument';
import { ArrowLeft, User, Calendar, Route, Gauge, DollarSign, PlusCircle, FileText, Upload, Trash2, Download } from 'lucide-react'; 
import { useFirestore } from '../hooks/useFirestore';
import { db, storage } from '../firebase/config';
import { collection, doc, addDoc, serverTimestamp, query, orderBy, deleteDoc as firestoreDeleteDoc } from 'firebase/firestore'; 
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'; 
import { toast } from 'react-toastify';
import { useCollection } from '../hooks/useCollection'; 

const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const TripDetails = ({ user }) => {
    const { tripId } = useParams();
    
    // [DEBUG] Log do UID do usuário
    console.log("[DEBUG TripDetails] UID do usuário:", user?.uid);

    const { document: trip, isLoading: isLoadingTrip } = useDocument('trips', tripId, user.uid);

    const [expenseType, setExpenseType] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseDate, setExpenseDate] = useState('');
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseFile, setExpenseFile] = useState(null);
    const [fileUploadProgress, setFileUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const { addDocument, response } = useFirestore(`users/${user.uid}/trips/${tripId}/expenses`);

    const expensesQuery = useMemo(() =>
        user && tripId ? query(collection(db, `users/${user.uid}/trips/${tripId}/expenses`), orderBy('date', 'desc')) : null,
        [user, tripId] 
    );

    const { documents: expenses, isLoading: isLoadingExpenses, error: expensesError } = useCollection(
        null, 
        expensesQuery
    );

    // Query e busca para Tipos de Despesa do usuário logado
    const expenseTypesQuery = useMemo(() => {
        // [DEBUG] Log da query de tipos de despesa
        console.log("[DEBUG TripDetails] Construindo expenseTypesQuery. user.uid:", user?.uid);
        return (user && user.uid) ? query(collection(db, `users/${user.uid}/expense_types`), orderBy('name', 'asc')) : null;
    }, [user]);

    const { documents: expenseTypes, isLoading: isLoadingExpenseTypes, error: expenseTypesError } = useCollection(null, expenseTypesQuery);

    // [DEBUG] Log do resultado do useCollection para tipos de despesa
    useEffect(() => { 
        console.log("[DEBUG TripDetails] expenseTypes carregados:", expenseTypes);
        console.log("[DEBUG TripDetails] isLoadingExpenseTypes:", isLoadingExpenseTypes);
        console.log("[DEBUG TripDetails] expenseTypesError:", expenseTypesError);
        // Se houver um erro, exiba um toast para o usuário
        if (expenseTypesError) {
            toast.error(`Erro ao carregar tipos de despesa: ${expenseTypesError}`);
        }
    }, [expenseTypes, isLoadingExpenseTypes, expenseTypesError]);


    const totalExpensesAmount = useMemo(() => {
        if (!expenses) return 0;
        return expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    }, [expenses]);

    const handleFileChange = (e) => {
        let file = e.target.files[0];
        if (file) {
            if (!file.type.includes('image') && !file.type.includes('pdf')) {
                toast.error('Por favor, selecione um arquivo de imagem ou PDF.');
                setExpenseFile(null);
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB
                toast.error('O arquivo é muito grande (máximo 2MB).');
                setExpenseFile(null);
                return;
            }
            setExpenseFile(file);
        } else {
            setExpenseFile(null);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();

        if (!expenseType || !expenseAmount || !expenseDate) {
            toast.error('Por favor, preencha o tipo, valor e data da despesa.');
            return;
        }
        // Validação adicional: garante que expenseTypes está carregado e tem o tipo selecionado
        if (!expenseTypes || !expenseTypes.some(type => type.name === expenseType)) {
            toast.error('Tipo de despesa inválido. Por favor, selecione um tipo da lista.');
            return;
        }

        let fileURL = null;
        let filePath = null;

        try {
            setIsUploading(true);
            if (expenseFile) {
                const storageRef = ref(storage, `expense_receipts/${user.uid}/${tripId}/${Date.now()}_${expenseFile.name}`);
                const uploadTask = uploadBytesResumable(storageRef, expenseFile);

                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setFileUploadProgress(progress);
                        },
                        (error) => {
                            toast.error('Erro ao fazer upload do arquivo: ' + error.message);
                            setIsUploading(false);
                            reject(error);
                        },
                        async () => {
                            fileURL = await getDownloadURL(uploadTask.snapshot.ref);
                            filePath = uploadTask.snapshot.ref.fullPath;
                            resolve();
                        }
                    );
                });
            }

            const newExpense = {
                type: expenseType, 
                amount: parseFloat(expenseAmount),
                date: expenseDate,
                description: expenseDescription,
                receiptURL: fileURL,
                receiptPath: filePath,
                createdAt: serverTimestamp(),
            };
            await addDoc(collection(db, `users/${user.uid}/trips/${tripId}/expenses`), newExpense);
            toast.success('Despesa adicionada com sucesso!');
            resetForm();
        } catch (error) {
            toast.error('Falha ao adicionar despesa.');
            console.error("Erro ao adicionar despesa:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteExpense = async (expenseId, receiptPath) => {
        if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
            try {
                if (receiptPath) {
                    const fileRef = ref(storage, receiptPath);
                    await deleteObject(fileRef);
                    toast.success('Arquivo da nota fiscal excluído do Storage.');
                }
                await firestoreDeleteDoc(doc(db, `users/${user.uid}/trips/${tripId}/expenses`, expenseId));
                toast.success('Despesa excluída com sucesso!');
            } catch (error) {
                toast.error('Falha ao excluir a despesa.');
                console.error('Erro ao excluir despesa:', error);
            }
        }
    };

    const resetForm = () => {
        setExpenseType('');
        setExpenseAmount('');
        setExpenseDate('');
        setExpenseDescription('');
        setExpenseFile(null);
        setFileUploadProgress(0);
    };

    if (isLoadingTrip || isLoadingExpenseTypes) {
        return <div className="text-center mt-10">Carregando detalhes da viagem e tipos de despesa...</div>;
    }

    if (!trip) {
        return <div className="text-center mt-10">Viagem não encontrada.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
                <ArrowLeft size={20} />
                Voltar para a lista
            </Link>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6">
                    Detalhes da Viagem
                </h1>

                {/* Seção de Informações Principais */}
                <div className="space-y-4 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-3"><User size={18} className="text-slate-500" /><span className="font-semibold">{trip.driver}</span></div>
                    <div className="flex items-center gap-3"><Calendar size={18} className="text-slate-500" /><span>{formatDate(trip.date)}</span></div>
                    <div className="flex items-start gap-3">
                        <Route size={18} className="text-slate-500 mt-1" />
                        <div className="flex flex-col">
                            <p><span className="font-semibold">Origem:</span> {trip.origin}</p>
                            <p><span className="font-semibold">Destino:</span> {trip.destination}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3"><Gauge size={18} className="text-slate-500" /><span>{trip.distance?.toFixed(1)} km</span></div>
                    <div className="flex items-center gap-3"><DollarSign size={18} className="text-slate-500" /><span>Custo estimado: {formatCurrency(trip.totalCost)}</span></div>
                    {trip.notes && <p className="text-sm italic pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">Obs: {trip.notes}</p>}
                </div>
            </div>

            {/* Seção de Controle de Despesas */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                    Controle de Despesas
                </h2>

                {/* Exibição do Total de Despesas */}
                <div className="border-t border-b border-slate-200 dark:border-slate-700 py-3 mb-6">
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Total de Despesas:</span>
                        <span className="text-green-600 dark:text-green-400">{formatCurrency(totalExpensesAmount)}</span>
                    </p>
                </div>

                {/* Formulário para Adicionar Despesa */}
                <form onSubmit={handleAddExpense} className="space-y-4 border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Adicionar Nova Despesa</h3>
                    
                    <div>
                        <label htmlFor="expenseType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Despesa</label>
                        <select
                            id="expenseType"
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            value={expenseType}
                            onChange={(e) => setExpenseType(e.target.value)}
                            required
                        >
                            <option value="">Selecione o tipo</option>
                            {/* Mapeia os tipos de despesa do Firestore */}
                            {isLoadingExpenseTypes ? (
                                <option disabled>Carregando tipos...</option>
                            ) : expenseTypesError ? (
                                <option disabled>Erro ao carregar tipos.</option>
                            ) : (
                                (expenseTypes && expenseTypes.length > 0) ? (
                                    expenseTypes.map((type) => (
                                        <option key={type.id} value={type.name}>
                                            {type.name}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>Nenhum tipo de despesa cadastrado. Adicione em "Gerenciamento".</option>
                                )
                            )}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="expenseAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
                        <input
                            type="number"
                            id="expenseAmount"
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(e.target.value)}
                            step="0.01"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="expenseDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data da Despesa</label>
                        <input
                            type="date"
                            id="expenseDate"
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="expenseDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição Adicional (Opcional)</label>
                        <textarea
                            id="expenseDescription"
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            value={expenseDescription}
                            onChange={(e) => setExpenseDescription(e.target.value)}
                            rows="2"
                            placeholder="Detalhes extras sobre a despesa..."
                        ></textarea>
                    </div>

                    <div>
                        <label htmlFor="expenseFile" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Anexar Nota Fiscal (Opcional - Imagem ou PDF, máx. 2MB)</label>
                        <input
                            type="file"
                            id="expenseFile"
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={handleFileChange}
                        />
                        {expenseFile && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Arquivo selecionado: {expenseFile.name}</p>}
                        {isUploading && (
                            <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 mt-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${fileUploadProgress}%` }}></div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{fileUploadProgress.toFixed(0)}%</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
                        disabled={isUploading || response.isPending}
                    >
                        {isUploading || response.isPending ? 'Adicionando...' : (
                            <>
                                <PlusCircle size={20} />
                                Adicionar Despesa
                            </>
                        )}
                    </button>
                    {response.error && <p className="text-red-500 text-sm mt-2">{response.error}</p>}
                </form>

                {/* Lista de Despesas */}
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Despesas da Viagem</h3>
                {isLoadingExpenses && <p className="text-center text-slate-500">Carregando despesas...</p>}
                {expensesError && <p className="text-red-500 text-center">{expensesError}</p>}
                {!isLoadingExpenses && expenses && expenses.length === 0 && (
                    <p className="text-center text-slate-500">Nenhuma despesa registrada para esta viagem.</p>
                )}
                <div className="space-y-3">
                    {expenses && expenses.map(expense => (
                        <div key={expense.id} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg shadow-sm flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{expense.type}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{formatCurrency(expense.amount)} - {formatDate(expense.date)}</p>
                                {expense.description && <p className="text-xs text-slate-500 dark:text-slate-500 italic mt-1">Obs: {expense.description}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                {expense.receiptURL && (
                                    <a 
                                        href={expense.receiptURL} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:text-blue-800"
                                        title="Baixar Nota Fiscal"
                                    >
                                        <Download size={18} />
                                    </a>
                                )}
                                <button 
                                    onClick={() => handleDeleteExpense(expense.id, expense.receiptPath)} 
                                    className="text-red-500 hover:text-red-700"
                                    title="Excluir Despesa"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};