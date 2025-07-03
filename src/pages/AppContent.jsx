import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

// Nossos componentes
import { useCollection } from '../hooks/useCollection';
import { ManagementSection } from '../components/ManagementSection';
import { Modal } from '../components/Modal';
import { TimeLogList } from '../components/TimeLogList';
import { TripLogList } from '../components/TripLogList';

// Ícones (Adicionamos o 'LoaderCircle' para o nosso spinner)
import { Clock, PlusCircle, MapPin, ClipboardList, Car, Users, Route, Edit, Sun, Moon, BarChart2, LoaderCircle } from 'lucide-react';

const COST_PER_KM = 0.50;

export const AppContent = ({ user }) => {
    const [currentView, setCurrentView] = useState('horas');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingInfo, setDeletingInfo] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    // NOVO: Estado para controlar o carregamento dos formulários
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [timeForm, setTimeForm] = useState({ employee: '', date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', location: '', activity: '' });
    const [tripForm, setTripForm] = useState({ driver: '', date: new Date().toISOString().split('T')[0], origin: '', destination: '', startKm: '', endKm: '', notes: '' });

    const { documents: timeLogs, isLoading: isLoadingTime } = useCollection('time_entries', user.uid);
    const { documents: tripLogs, isLoading: isLoadingTrips } = useCollection('trips', user.uid);
    const { documents: employees, isLoading: isLoadingEmployees } = useCollection('employees', user.uid);
    const { documents: locations, isLoading: isLoadingLocations } = useCollection('locations', user.uid);
    const { documents: activities, isLoading: isLoadingActivities } = useCollection('activities', user.uid);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleAddItem = async (collectionName, name, cost) => {
        if (!user || !name || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const collRef = collection(db, "users", user.uid, collectionName);
            const data = { name, createdAt: serverTimestamp() };
            if (collectionName === 'employees' && cost) {
                data.costPerHour = parseFloat(cost);
            }
            await addDoc(collRef, data);
            toast.success(`"${name}" adicionado com sucesso!`);
        } catch (error) {
            toast.error("Falha ao adicionar item.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteItem = (collectionName, id) => {
        setDeletingInfo({ collectionName, id });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteItem = async () => {
        if (!user || !deletingInfo) return;
        const { collectionName, id } = deletingInfo;
        setIsDeleteModalOpen(false);
        setDeletingInfo(null);
        try {
            await deleteDoc(doc(db, "users", user.uid, collectionName, id));
            toast.success("Item apagado com sucesso!");
        } catch (error) {
            toast.error("Falha ao apagar o registro.");
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
            const employeeData = employees.find(emp => emp.name === employeeName);
            const totalCost = durationInHours * (employeeData?.costPerHour || 0);

            if (Object.values(timeForm).some(v => !v) || durationInHours <= 0) {
                toast.warn("Por favor, preencha todos os campos corretamente.");
                setIsSubmitting(false); // Libera o botão se houver erro de validação
                return;
            }

            const data = { ...timeForm, durationInHours, totalCost, createdAt: serverTimestamp() };
            await addDoc(collection(db, "users", user.uid, 'time_entries'), data);
            toast.success("Registro de horas adicionado!");
            setTimeForm({ employee: '', date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', location: '', activity: '' });
        } catch (error) {
            toast.error("Falha ao adicionar registro.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddTripEntry = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const distance = parseFloat(tripForm.endKm) - parseFloat(tripForm.startKm);
            if (!tripForm.driver || !tripForm.date || !tripForm.origin || !tripForm.destination || !tripForm.startKm || !tripForm.endKm || distance < 0) {
                toast.warn("Por favor, preencha todos os campos corretamente.");
                setIsSubmitting(false); // Libera o botão se houver erro de validação
                return;
            }

            const data = { ...tripForm, distance, totalCost: distance * COST_PER_KM, createdAt: serverTimestamp() };
            await addDoc(collection(db, "users", user.uid, 'trips'), data);
            toast.success("Registro de viagem adicionado!");
            setTripForm({ driver: '', date: new Date().toISOString().split('T')[0], origin: '', destination: '', startKm: '', endKm: '', notes: '' });
        } catch (error) {
            toast.error("Falha ao adicionar registro.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignOut = () => { auth.signOut(); };

    const handleOpenEditModal = (record, type) => {
        setEditingRecord({...record, type});
        setIsEditModalOpen(true);
    };

    const handleUpdateRecord = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        const recordToUpdate = { ...editingRecord };
        setIsEditModalOpen(false);
        setEditingRecord(null);

        try {
            const { id, type } = recordToUpdate;
            let dataToUpdate = { ...recordToUpdate };
            let collectionName = '';

            if (type === 'horas') {
                collectionName = 'time_entries';
                const { startTime, endTime, employee: employeeName } = recordToUpdate;
                const [startH, startM] = startTime.split(':').map(Number);
                const [endH, endM] = endTime.split(':').map(Number);
                let diff = new Date(0, 0, 0, endH, endM) - new Date(0, 0, 0, startH, startM);
                if (diff < 0) { diff += 24 * 60 * 60 * 1000; }
                const durationInHours = diff / 3600000;
                const employeeData = employees.find(emp => emp.name === employeeName);
                const totalCost = durationInHours * (employeeData?.costPerHour || 0);
                dataToUpdate = { ...dataToUpdate, durationInHours, totalCost };
            }
            else if (type === 'viagens') {
                collectionName = 'trips';
                const distance = parseFloat(recordToUpdate.endKm) - parseFloat(recordToUpdate.startKm);
                if (distance < 0) {
                    toast.warn("KM Final não pode ser menor que o KM Inicial.");
                    setIsSubmitting(false); // Libera o botão se houver erro de validação
                    return;
                }
                const totalCost = distance * COST_PER_KM;
                dataToUpdate = { ...dataToUpdate, distance, totalCost };
            }
            
            const docRef = doc(db, "users", user.uid, collectionName, id);
            await updateDoc(docRef, dataToUpdate);
            toast.success("Registro atualizado com sucesso!");
            
        } catch (error) {
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
                    <div className="absolute top-0 right-0 flex items-center gap-4">
                        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full bg-slate-200 dark:bg-slate-700">
                            {theme === 'light' ? <Moon /> : <Sun className="text-yellow-300" />}
                        </button>
                        <button onClick={handleSignOut} className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600">Sair</button>
                    </div>
                </header>

                <div className="flex justify-center mb-8 gap-2 sm:gap-4">
                    <button onClick={() => setCurrentView('dashboard')} className={`px-4 py-2 font-semibold rounded-lg ${currentView === 'dashboard' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-700'}`}><BarChart2 className="inline mr-2" />Dashboard</button>
                    <button onClick={() => setCurrentView('horas')} className={`px-4 py-2 font-semibold rounded-lg ${currentView === 'horas' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700'}`}><Clock className="inline mr-2" />Horas</button>
                    <button onClick={() => setCurrentView('viagens')} className={`px-4 py-2 font-semibold rounded-lg ${currentView === 'viagens' ? 'bg-green-600 text-white' : 'bg-white dark:bg-slate-700'}`}><Car className="inline mr-2" />Viagens</button>
                </div>

                {currentView === 'dashboard' && <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"><h2 className="text-2xl font-bold mb-6 text-center">Dashboard (Em breve)</h2></div>}

                {currentView !== 'dashboard' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {currentView === 'horas' && (
                                <div>
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                                        <h2 className="text-xl font-bold mb-4 flex items-center"><PlusCircle className="mr-2 text-blue-500" /> Adicionar Registro de Horas</h2>
                                        <form onSubmit={handleAddTimeEntry} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label>Funcionário</label><select value={timeForm.employee} onChange={e => setTimeForm({ ...timeForm, employee: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}</select></div>
                                                <div><label>Data</label><input type="date" value={timeForm.date} onChange={e => setTimeForm({ ...timeForm, date: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" /></div>
                                                <div><label>Hora Início</label><input type="time" value={timeForm.startTime} onChange={e => setTimeForm({ ...timeForm, startTime: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" /></div>
                                                <div><label>Hora Fim</label><input type="time" value={timeForm.endTime} onChange={e => setTimeForm({ ...timeForm, endTime: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" /></div>
                                            </div>
                                            <div><label>Local</label><select value={timeForm.location} onChange={e => setTimeForm({ ...timeForm, location: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select></div>
                                            <div><label>Atividade</label><select value={timeForm.activity} onChange={e => setTimeForm({ ...timeForm, activity: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{activities.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</select></div>
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
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                                        <h2 className="text-xl font-bold mb-4 flex items-center"><Route className="mr-2 text-green-500" /> Adicionar Registro de Viagem</h2>
                                        <form onSubmit={handleAddTripEntry} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label>Motorista</label><select value={tripForm.driver} onChange={e => setTripForm({ ...tripForm, driver: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}</select></div>
                                                <div><label>Data</label><input type="date" value={tripForm.date} onChange={e => setTripForm({ ...tripForm, date: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" /></div>
                                                <div><label>Origem</label><input type="text" value={tripForm.origin} onChange={e => setTripForm({ ...tripForm, origin: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" /></div>
                                                <div><label>Destino</label><input type="text" value={tripForm.destination} onChange={e => setTripForm({ ...tripForm, destination: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" /></div>
                                                <div><label>KM Inicial</label><input type="number" value={tripForm.startKm} onChange={e => setTripForm({ ...tripForm, startKm: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" /></div>
                                                <div><label>KM Final</label><input type="number" value={tripForm.endKm} onChange={e => setTripForm({ ...tripForm, endKm: e.target.value })} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" /></div>
                                            </div>
                                            <div><label>Observações</label><textarea value={tripForm.notes} onChange={e => setTripForm({ ...tripForm, notes: e.target.value })} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" rows="2" /></div>
                                            <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:bg-green-400">
                                                {isSubmitting ? <><LoaderCircle className="animate-spin mr-2" /> Guardando...</> : 'Guardar'}
                                            </button>
                                        </form>
                                    </div>
                                    <TripLogList logs={tripLogs} isLoading={isLoadingTrips} onEdit={(record) => handleOpenEditModal(record, 'viagens')} onDelete={(id) => confirmDeleteItem('trips', id)} />
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-3 space-y-6">
                            <ManagementSection title="Funcionários" icon={Users} items={employees} isLoading={isLoadingEmployees} hasCost={true} onAddItem={handleAddItem} onDeleteItem={(id) => confirmDeleteItem('employees', id)} isSubmitting={isSubmitting} />
                            <ManagementSection title="Locais" icon={MapPin} items={locations} isLoading={isLoadingLocations} onAddItem={(name) => handleAddItem('locations', name)} onDeleteItem={(id) => confirmDeleteItem('locations', id)} isSubmitting={isSubmitting} />
                            <ManagementSection title="Atividades" icon={ClipboardList} items={activities} isLoading={isLoadingActivities} onAddItem={(name) => handleAddItem('activities', name)} onDeleteItem={(id) => confirmDeleteItem('activities', id)} isSubmitting={isSubmitting} />
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
                    {editingRecord?.type === 'horas' && (
                        <form onSubmit={handleUpdateRecord} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label>Funcionário</label><select value={editingRecord.employee} onChange={e => setEditingRecord({...editingRecord, employee: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}</select></div>
                                <div><label>Data</label><input type="date" value={editingRecord.date} onChange={e => setEditingRecord({...editingRecord, date: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div>
                                <div><label>Hora Início</label><input type="time" value={editingRecord.startTime} onChange={e => setEditingRecord({...editingRecord, startTime: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div>
                                <div><label>Hora Fim</label><input type="time" value={editingRecord.endTime} onChange={e => setEditingRecord({...editingRecord, endTime: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div>
                            </div>
                            <div className="flex justify-end gap-4 mt-6">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center justify-center disabled:bg-blue-400">
                                    {isSubmitting ? <><LoaderCircle className="animate-spin mr-2" /> Guardando...</> : 'Guardar Alterações'}
                                </button>
                            </div>
                        </form>
                    )}
                    {editingRecord?.type === 'viagens' && (
                        <form onSubmit={handleUpdateRecord} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label>Motorista</label><select value={editingRecord.driver} onChange={e => setEditingRecord({...editingRecord, driver: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}</select></div>
                                <div><label>Data</label><input type="date" value={editingRecord.date} onChange={e => setEditingRecord({...editingRecord, date: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div>
                                <div><label>Origem</label><input type="text" value={editingRecord.origin} onChange={e => setEditingRecord({...editingRecord, origin: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div>
                                <div><label>Destino</label><input type="text" value={editingRecord.destination} onChange={e => setEditingRecord({...editingRecord, destination: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div>
                                <div><label>KM Inicial</label><input type="number" value={editingRecord.startKm} onChange={e => setEditingRecord({...editingRecord, startKm: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div>
                                <div><label>KM Final</label><input type="number" value={editingRecord.endKm} onChange={e => setEditingRecord({...editingRecord, endKm: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div>
                            </div>
                            <div className="flex justify-end gap-4 mt-6">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-green-600 text-white flex items-center justify-center disabled:bg-green-400">
                                    {isSubmitting ? <><LoaderCircle className="animate-spin mr-2" /> Guardando...</> : 'Guardar Alterações'}
                                </button>
                            </div>
                        </form>
                    )}
                </Modal>
            </main>
        </div>
    );
};