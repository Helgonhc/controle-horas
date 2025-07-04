import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, storage } from '../firebase/config';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from 'react-toastify';

// Nossos componentes
import { useCollection } from '../hooks/useCollection';
import { ManagementSection } from '../components/ManagementSection';
import { Modal } from '../components/Modal';
import { TimeLogList } from '../components/TimeLogList';
import { TripLogList } from '../components/TripLogList';
import { Dashboard } from './Dashboard'; 
import { TripForm } from '../components/TripForm'; 

// Ícones
import { Clock, PlusCircle, MapPin, ClipboardList, Car, Users, Route, Edit, Sun, Moon, BarChart2, LoaderCircle } from 'lucide-react';

const COST_PER_KM = 0.50;

export const AppContent = ({ user }) => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingInfo, setDeletingInfo] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [timeForm, setTimeForm] = useState({ employee: '', date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', location: '', activity: '' });

    // Memoize as queries para useCollection
    const timeEntriesQuery = useMemo(() => 
        user ? query(collection(db, `users/${user.uid}/time_entries`), orderBy('createdAt', 'desc')) : null,
        [user] 
    );
    const tripsQuery = useMemo(() => 
        user ? query(collection(db, `users/${user.uid}/trips`), orderBy('createdAt', 'desc')) : null,
        [user]
    );
    const employeesQuery = useMemo(() => 
        user ? query(collection(db, `users/${user.uid}/employees`), orderBy('createdAt', 'asc')) : null,
        [user]
    );
    const locationsQuery = useMemo(() => 
        user ? query(collection(db, `users/${user.uid}/locations`), orderBy('createdAt', 'asc')) : null,
        [user]
    );
    const activitiesQuery = useMemo(() => 
        user ? query(collection(db, `users/${user.uid}/activities`), orderBy('createdAt', 'asc')) : null,
        [user]
    );

    // Passe as queries memoizadas para useCollection
    const { documents: timeLogs, isLoading: isLoadingTime } = useCollection(null, timeEntriesQuery); 
    const { documents: tripLogs, isLoading: isLoadingTrips } = useCollection(null, tripsQuery);
    const { documents: employees, isLoading: isLoadingEmployees } = useCollection(null, employeesQuery);
    const { documents: locations, isLoading: isLoadingLocations } = useCollection(null, locationsQuery);
    const { documents: activities, isLoading: isLoadingActivities } = useCollection(null, activitiesQuery);
    
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const chartData = useMemo(() => {
        const safeEmployees = employees || [];
        const safeTimeLogs = timeLogs || [];
        const safeTripLogs = tripLogs || [];

        const hoursByEmployee = safeEmployees.map(employee => {
            const totalHours = safeTimeLogs
                .filter(log => log.employee === employee.name)
                .reduce((sum, log) => sum + (log.durationInHours || 0), 0);
            return { name: employee.name, Horas: parseFloat(totalHours.toFixed(2)) };
        }).filter(item => item.Horas > 0);

        const distanceByDriver = safeEmployees.map(employee => {
            const totalDistance = safeTripLogs
                .filter(log => log.driver === employee.name)
                .reduce((sum, log) => sum + (log.distance || 0), 0);
            return { name: employee.name, Distância: parseFloat(totalDistance.toFixed(2)) };
        }).filter(item => item.Distância > 0);

        return { hoursByEmployee, distanceByDriver };
    }, [employees, timeLogs, tripLogs]);

    const handleAddItem = async (collectionName, name) => {
        if (!user || !name || isSubmitting) return;
        setIsSubmitting(true);
        console.log(`[DEBUG - handleAddItem] Tentando adicionar "${name}" à coleção: users/${user.uid}/${collectionName}`);
        try {
            const collRef = collection(db, "users", user.uid, collectionName);
            const data = { name, createdAt: serverTimestamp() };
            const docRef = await addDoc(collRef, data);
            toast.success(`"${name}" adicionado com sucesso!`);
            console.log(`[DEBUG - handleAddItem] Sucesso! Documento adicionado com ID: ${docRef.id}, em coleção: users/${user.uid}/${collectionName}`);
        } catch (error) {
            toast.error("Falha ao adicionar item.");
            console.error(`[DEBUG - handleAddItem] Erro ao adicionar item:`, error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteItem = (collectionName, id, receiptPath = null) => {
        setDeletingInfo({ collectionName, id, receiptPath });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteItem = async () => {
        if (!user || !deletingInfo) return;
        const { collectionName, id, receiptPath } = deletingInfo;
        setIsDeleteModalOpen(false);
        setDeletingInfo(null);
        try {
            // Apagar o documento do Firestore
            await deleteDoc(doc(db, "users", user.uid, collectionName, id));
            
            // Se houver um recibo associado, apagar do Storage
            if (receiptPath) {
                const fileRef = ref(storage, receiptPath);
                await deleteObject(fileRef);
                console.log(`Recibo ${receiptPath} apagado do Storage.`);
            }

            toast.success("Item apagado com sucesso!");
        } catch (error) {
            toast.error("Falha ao apagar o registro.");
            console.error("Erro ao apagar item:", error);
        }
    };

    const handleAddTimeEntry = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const { startTime, endTime, employee: employeeName } = timeForm;
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            let diff = new Date(0, 0, 0, endH, endM) - new Date(0, 0, 0, startH, startM);
            if (diff < 0) { diff += 24 * 60 * 60 * 1000; }
            const durationInHours = diff / 3600000;
            const employeeData = (employees || []).find(emp => emp.name === employeeName); 
            const totalCost = durationInHours * (employeeData?.costPerHour || 0);
            if (Object.values(timeForm).some(v => !v) || durationInHours <= 0) {
                toast.warn("Por favor, preencha todos os campos corretamente.");
                setIsSubmitting(false);
                return;
            }
            const data = { ...timeForm, durationInHours, totalCost, createdAt: serverTimestamp() };
            await addDoc(collection(db, "users", user.uid, 'time_entries'), data);
            toast.success("Registro de horas adicionado!");
            setTimeForm({ employee: '', date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', location: '', activity: '' });
        } catch (error) {
            toast.error("Falha ao adicionar registro.");
            console.error("Erro ao adicionar registro de horas:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddTripEntry = async (tripData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const expensesWithReceipts = await Promise.all(tripData.expenses.map(async (exp) => {
                if (exp.receipt) {
                    const storageRef = ref(storage, `expense_receipts/${user.uid}/${Date.now()}_${exp.receipt.name}`);
                    await uploadBytes(storageRef, exp.receipt);
                    const downloadURL = await getDownloadURL(storageRef);
                    return { ...exp, receiptURL: downloadURL, receiptPath: storageRef.fullPath };
                }
                return exp;
            }));

            const data = {
                ...tripData,
                totalCost: tripData.distance * COST_PER_KM,
                expenses: expensesWithReceipts.map(({ receipt, ...rest }) => rest), // Remove o objeto File antes de salvar
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, "users", user.uid, 'trips'), data);
            toast.success("Registro de viagem adicionado!");
        } catch (error) {
            toast.error("Falha ao adicionar registro de viagem.");
            console.error("Erro ao adicionar registro de viagem:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignOut = () => { auth.signOut(); };

    const handleOpenEditModal = (record, type) => {
        setEditingRecord({...record, type});
        setIsEditModalOpen(true);
    };

    const handleUpdateRecord = async (updatedRecord) => { 
        if (!user || isSubmitting) return;
        setIsSubmitting(true);
        setIsEditModalOpen(false);
        setEditingRecord(null); 
        
        try {
            const { id, type } = updatedRecord; 
            let dataToUpdate = { ...updatedRecord };
            let collectionName = '';

            if (type === 'horas') {
                collectionName = 'time_entries';
                const { startTime, endTime, employee: employeeName } = updatedRecord;
                const [startH, startM] = startTime.split(':').map(Number);
                const [endH, endM] = endTime.split(':').map(Number);
                let diff = new Date(0, 0, 0, endH, endM) - new Date(0, 0, 0, startH, startM);
                if (diff < 0) { diff += 24 * 60 * 60 * 1000; }
                const durationInHours = diff / 3600000;
                const employeeData = (employees || []).find(emp => emp.name === employeeName); 
                const totalCost = durationInHours * (employeeData?.costPerHour || 0);
                dataToUpdate = { ...dataToUpdate, durationInHours, totalCost };
            } else if (type === 'viagens') {
                collectionName = 'trips';
                // Garante que startKm e endKm são números antes de salvar
                dataToUpdate.startKm = dataToUpdate.startKm ? parseFloat(dataToUpdate.startKm) : null;
                dataToUpdate.endKm = dataToUpdate.endKm ? parseFloat(dataToUpdate.endKm) : null;
                dataToUpdate.distance = dataToUpdate.distance ? parseFloat(dataToUpdate.distance) : 0; // Atualiza a distância também
                dataToUpdate.totalCost = dataToUpdate.distance * COST_PER_KM; // Recalcula o custo total da viagem

                // Lógica para despesas:
                // 1. Processar novos recibos (se houver)
                const expensesWithProcessedReceipts = await Promise.all(dataToUpdate.expenses.map(async (exp) => {
                    // Se a despesa tem um 'receipt' (objeto File), significa que é um novo upload
                    if (exp.receipt && typeof exp.receipt === 'object') {
                        const storageRef = ref(storage, `expense_receipts/${user.uid}/${id}/${Date.now()}_${exp.receipt.name}`);
                        await uploadBytes(storageRef, exp.receipt);
                        const downloadURL = await getDownloadURL(storageRef);
                        return { ...exp, receiptURL: downloadURL, receiptPath: storageRef.fullPath };
                    }
                    // Se não tem 'receipt' ou já é uma URL, mantém como está
                    return exp;
                }));
                // Remove o objeto File antes de salvar no Firestore
                dataToUpdate.expenses = expensesWithProcessedReceipts.map(({ receipt, ...rest }) => rest); 
            }

            const docRef = doc(db, "users", user.uid, collectionName, id);
            await updateDoc(docRef, dataToUpdate);
            toast.success("Registro atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar registro:", error);
            toast.error("Falha ao atualizar o registro.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`bg-slate-100 dark:bg-slate-900 min-h-screen font-sans text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8 ${theme}`}>
            <main className="max-w-7xl mx-auto">
                <header className="mb-8 text-center relative">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Controle de Horas e Viagens</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mt-1">AeC Serviços Especializados</p>
                    {/* Botões de Tema e Sair para mobile e desktop */}
                    <div className="absolute top-0 right-0 flex items-center gap-2 sm:gap-4 p-2 sm:p-0"> {/* Adicionado p-2 sm:p-0 para espaçamento responsivo */}
                        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full bg-slate-200 dark:bg-slate-700">
                            {theme === 'light' ? <Moon /> : <Sun className="text-yellow-300" />}
                        </button>
                        <button onClick={handleSignOut} className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600">Sair</button>
                    </div>
                </header>

                {/* Botões de Navegação Principal: Layout responsivo */}
                <div className="flex flex-col sm:flex-row justify-center mb-8 gap-2 sm:gap-4"> {/* flex-col para mobile, flex-row para sm e acima */}
                    <button onClick={() => setCurrentView('dashboard')} className={`px-4 py-2 font-semibold rounded-lg ${currentView === 'dashboard' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-700'}`}><BarChart2 className="inline mr-2" />Dashboard</button>
                    <button onClick={() => setCurrentView('horas')} className={`px-4 py-2 font-semibold rounded-lg ${currentView === 'horas' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700'}`}><Clock className="inline mr-2" />Horas</button>
                    <button onClick={() => setCurrentView('viagens')} className={`px-4 py-2 font-semibold rounded-lg ${currentView === 'viagens' ? 'bg-green-600 text-white' : 'bg-white dark:bg-slate-700'}`}><Car className="inline mr-2" />Viagens</button>
                </div>

                {currentView === 'dashboard' && <Dashboard chartData={chartData} />}

                {currentView !== 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-8"> {/* Grid responsiva principal */}
                        <div className="md:col-span-1 lg:col-span-2 space-y-4 md:space-y-6 lg:space-y-8"> {/* Colunas para formulário/listas principais */}
                            {currentView === 'horas' && (
                                <div>
                                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg"> {/* Padding responsivo */}
                                        <h2 className="text-xl font-bold mb-4 flex items-center"><PlusCircle className="mr-2 text-blue-500" /> Adicionar Registro de Horas</h2>
                                        <form onSubmit={handleAddTimeEntry} className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Grid responsiva para campos de horas */}
                                                <div><label>Funcionário</label><select value={timeForm.employee} onChange={e => setTimeForm({ ...timeForm, employee: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{(employees || []).map(e => <option key={e.id} value={e.name}>{e.name}</option>)}</select></div>
                                                <div><label>Data</label><input type="date" value={timeForm.date} onChange={e => setTimeForm({ ...timeForm, date: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" /></div>
                                                <div><label>Hora Início</label><input type="time" value={timeForm.startTime} onChange={e => setTimeForm({ ...timeForm, startTime: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" /></div>
                                                <div><label>Hora Fim</label><input type="time" value={timeForm.endTime} onChange={e => setTimeForm({ ...timeForm, endTime: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" /></div>
                                            </div>
                                            <div><label>Local</label><select value={timeForm.location} onChange={e => setTimeForm({ ...timeForm, location: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{(locations || []).map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select></div>
                                                <div><label>Atividade</label><select value={timeForm.activity} onChange={e => setTimeForm({ ...timeForm, activity: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{(activities || []).map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</select></div>
                                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:bg-blue-400">
                                                {isSubmitting ? <><LoaderCircle className="animate-spin mr-2" /> Guardando...</> : 'Guardar'}
                                            </button>
                                        </form>
                                    </div>
                                    <TimeLogList logs={timeLogs} isLoading={isLoadingTime} onEdit={(record) => handleOpenEditModal(record, 'horas')} onDelete={(id) => confirmDeleteItem('time_entries', id)} />
                                </div>
                            )}
                            {currentView === 'viagens' && (
                                <div>
                                    <TripForm 
                                        employees={employees || []} 
                                        onAddTrip={handleAddTripEntry} 
                                        isSubmitting={isSubmitting} 
                                    />
                                    <TripLogList logs={tripLogs} isLoading={isLoadingTrips} onEdit={(record) => handleOpenEditModal(record, 'viagens')} onDelete={(id, receiptPath) => confirmDeleteItem('trips', id, receiptPath)} />
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-1 lg:col-span-3 space-y-4 md:space-y-6 lg:space-y-8"> {/* Colunas para seções de gerenciamento */}
                            <ManagementSection title="Funcionários" icon={Users} items={employees} isLoading={isLoadingEmployees} onAddItem={(name) => handleAddItem('employees', name)} onDeleteItem={(id) => confirmDeleteItem('employees', id)} />
                            <ManagementSection title="Locais" icon={MapPin} items={locations} isLoading={isLoadingLocations} onAddItem={(name) => handleAddItem('locations', name)} onDeleteItem={(id) => confirmDeleteItem('locations', id)} usePlacesAutocomplete={true} />
                            <ManagementSection title="Atividades" icon={ClipboardList} items={activities} isLoading={isLoadingActivities} onAddItem={(name) => handleAddItem('activities', name)} onDeleteItem={(id) => confirmDeleteItem('activities', id)} />
                        </div>
                    </div>
                )}
                
                <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Exclusão">
                    <p>Você tem certeza que deseja apagar este item?</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600">Cancelar</button>
                        <button onClick={handleDeleteItem} className="px-4 py-2 rounded-lg bg-red-600 text-white">Apagar</button>
                    </div>
                </Modal>
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Editar Registro de ${editingRecord?.type === 'horas' ? 'Horas' : 'Viagem'}`}>
                    {/* Renderiza o formulário de horas ou o TripForm para edição */}
                    {editingRecord?.type === 'horas' && (
                        <form onSubmit={(e) => { e.preventDefault(); handleUpdateRecord(editingRecord); }} className="space-y-4"> 
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Grid responsiva para campos de edição de horas */}
                                <div><label>Funcionário</label><select value={editingRecord.employee} onChange={e => setEditingRecord({...editingRecord, employee: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{(employees || []).map(e => <option key={e.id} value={e.name}>{e.name}</option>)}</select></div>
                                <div><label>Data</label><input type="date" value={editingRecord.date} onChange={e => setEditingRecord({...editingRecord, date: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div>
                                <div><label>Hora Início</label><input type="time" value={editingRecord.startTime} onChange={e => setEditingRecord({...editingRecord, startTime: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div>
                                <div><label>Hora Fim</label><input type="time" value={editingRecord.endTime} onChange={e => setEditingRecord({...editingRecord, endTime: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div>
                            </div>
                            <div><label>Local</label><select value={editingRecord.location} onChange={e => setEditingRecord({...editingRecord, location: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{(locations || []).map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select></div>
                            <div><label>Atividade</label><select value={editingRecord.activity} onChange={e => setEditingRecord({...editingRecord, activity: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{(activities || []).map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</select></div>
                            <div className="flex justify-end gap-4 mt-6">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center justify-center disabled:bg-blue-400">
                                    {isSubmitting ? <><LoaderCircle className="animate-spin mr-2" /> Guardando...</> : 'Guardar Alterações'}
                                </button>
                            </div>
                        </form>
                    )}
                    {editingRecord?.type === 'viagens' && (
                        <TripForm 
                            employees={employees || []} 
                            initialData={editingRecord} 
                            onUpdateTrip={handleUpdateRecord} 
                            isSubmitting={isSubmitting} 
                        />
                    )}
                </Modal>
            </main>
        </div>
    );
};