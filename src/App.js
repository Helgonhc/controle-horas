import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Clock, User, Calendar, PlusCircle, MapPin, ClipboardList, Trash2, LogIn, Car, Users, Route, Edit, Sun, Moon, BarChart2 } from 'lucide-react';
import { Dashboard } from './Dashboard';

// --- Configuração do Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyDxdyed2m2Xf9TgZsty8stpiPVwFT9sGJk",
  authDomain: "controle-aec.firebaseapp.com",
  projectId: "controle-aec",
  storageBucket: "controle-aec.appspot.com",
  messagingSenderId: "465157161843",
  appId: "1:465157161843:web:6b3f22106ee15144f4bb06"
};

// --- Constantes e Funções ---
const COST_PER_KM = 0.50;
const formatCurrency = (value) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value || 0);

// --- Componentes ---
const LoginScreen = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleLogin = (e) => { e.preventDefault(); if (username === 'admin' && password === 'aec123') { onLogin(); } else { setError('Utilizador ou senha inválidos.'); } };
    return (<div className="flex items-center justify-center min-h-screen bg-slate-200"><div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg"><div className="text-center"><h1 className="text-3xl font-bold text-slate-900">Controlo de Horas e Viagens</h1><p className="text-slate-600">AeC Serviços Especializados</p></div><form onSubmit={handleLogin} className="space-y-6"><div><label className="block text-sm font-medium text-slate-700">Utilizador</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 mt-1 border border-slate-300 rounded-lg" required /></div><div><label className="block text-sm font-medium text-slate-700">Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 mt-1 border border-slate-300 rounded-lg" required /></div>{error && <p className="text-sm text-red-600 text-center">{error}</p>}<button type="submit" className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700"><LogIn className="mr-2 h-5 w-5" />Entrar</button></form></div></div>);
};

const ManagementSection = ({ title, icon, items, onAddItem, onDeleteItem, isLoading, hasCost = false }) => {
    const [newItemName, setNewItemName] = useState('');
    const [newItemCost, setNewItemCost] = useState('');
    const IconComponent = icon;
    const handleSubmit = (e) => { e.preventDefault(); if (newItemName.trim()) { onAddItem(newItemName.trim(), newItemCost); setNewItemName(''); setNewItemCost(''); } };
    return (<div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg"><h3 className="font-bold mb-2 flex items-center text-slate-800 dark:text-slate-200"><IconComponent className="mr-2" size={20} />{title}</h3><form onSubmit={handleSubmit} className="flex items-center gap-2 mb-2"><input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Nome..." className="flex-grow p-2 border rounded-lg h-10 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />{hasCost && <input type="number" value={newItemCost} onChange={e => setNewItemCost(e.target.value)} placeholder="Custo/h" className="w-24 p-2 border rounded-lg h-10 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />}<button type="submit" className="bg-green-500 text-white rounded-lg hover:bg-green-600 h-10 w-10 flex-shrink-0 flex items-center justify-center text-xl font-bold">+</button></form><div className="max-h-32 overflow-y-auto space-y-1 pr-1">{isLoading ? <p className="text-sm text-slate-500">A carregar...</p> : items.map(item => (<div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-1.5 rounded"><span className="text-sm truncate pr-2 text-slate-700 dark:text-slate-300">{item.name}{hasCost && ` (${formatCurrency(item.costPerHour)})`}</span><button onClick={() => onDeleteItem(item.id)} className="text-red-500 hover:text-red-700 flex-shrink-0"><Trash2 size={16} /></button></div>))}</div></div>);
};

const Modal = ({ isOpen, onClose, title, children }) => { if (!isOpen) return null; return (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"><div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h3><button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">&times;</button></div>{children}</div></div>); };

const AppContent = () => {
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentView, setCurrentView] = useState('horas');
    const [theme, setTheme] = useState('light');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingInfo, setDeletingInfo] = useState(null);
    const [timeLogs, setTimeLogs] = useState([]);
    const [tripLogs, setTripLogs] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [locations, setLocations] = useState([]);
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState({ time: true, trips: true, employees: true, locations: true, activities: true });
    const [timeForm, setTimeForm] = useState({ employee: '', date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', location: '', activity: '' });
    const [tripForm, setTripForm] = useState({ driver: '', date: new Date().toISOString().split('T')[0], origin: '', destination: '', startKm: '', endKm: '', notes: '' });

    useEffect(() => { if (theme === 'dark') { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); } }, [theme]);

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            setDb(firestoreDb);
            const auth = getAuth(app);
            onAuthStateChanged(auth, async (user) => {
                if (user) { setUserId(user.uid); } 
                else { await signInAnonymously(auth); }
                setIsAuthReady(true);
            });
        } catch (error) { console.error("Firebase Init Error:", error); setIsAuthReady(true); }
    }, []);

    useEffect(() => {
        if (!isAuthReady || !db || !userId) return;
        const setupSnapshot = (collectionName, setData, loadingKey) => {
            const collRef = collection(db, "users", userId, collectionName);
            const q = query(collRef);
            setIsLoading(prev => ({ ...prev, [loadingKey]: true }));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const dataList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                dataList.sort((a, b) => (b.timestamp?.toDate() || b.createdAt?.toDate() || 0) - (a.timestamp?.toDate() || a.createdAt?.toDate() || 0));
                setData(dataList);
                setIsLoading(prev => ({ ...prev, [loadingKey]: false }));
            });
            return unsubscribe;
        };
        const unsubs = [ setupSnapshot('time_entries', setTimeLogs, 'time'), setupSnapshot('trips', setTripLogs, 'trips'), setupSnapshot('employees', setEmployees, 'employees'), setupSnapshot('locations', setLocations, 'locations'), setupSnapshot('activities', setActivities, 'activities'), ];
        return () => unsubs.forEach(unsub => unsub());
    }, [isAuthReady, db, userId]);

    const handleAddItem = async (collectionName, name, cost) => { if (!db || !userId || !name) return; const collRef = collection(db, "users", userId, collectionName); const data = { name, createdAt: serverTimestamp() }; if (collectionName === 'employees' && cost) { data.costPerHour = parseFloat(cost); } await addDoc(collRef, data); };
    const confirmDeleteItem = (collectionName, id) => { setDeletingInfo({ collectionName, id }); setIsDeleteModalOpen(true); };
    const handleDeleteItem = async () => { if (!db || !userId || !deletingInfo) return; const { collectionName, id } = deletingInfo; try { const docRef = doc(db, "users", userId, collectionName, id); await deleteDoc(docRef); } catch (error) { console.error("Erro ao excluir o item:", error); } setIsDeleteModalOpen(false); setDeletingInfo(null); };
    const handleOpenEditModal = (record, type) => { setEditingRecord({ ...record, type }); setIsEditModalOpen(true); };
    const handleUpdateRecord = async (e) => { e.preventDefault(); if (!db || !userId || !editingRecord) return; const { type, id, ...dataToUpdate } = editingRecord; const collectionName = type === 'horas' ? 'time_entries' : 'trips'; const docRef = doc(db, "users", userId, collectionName, id); await updateDoc(docRef, dataToUpdate); setIsEditModalOpen(false); setEditingRecord(null); };

    const handleAddTimeEntry = (e) => {
        e.preventDefault();
        const { startTime, endTime, employee: employeeName } = timeForm;
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        let diff = new Date(0,0,0,endH, endM) - new Date(0,0,0,startH, startM);
        if (diff < 0) { diff += 24 * 60 * 60 * 1000; }
        const durationInHours = diff / 3600000;
        const employeeData = employees.find(emp => emp.name === employeeName);
        const totalCost = durationInHours * (employeeData?.costPerHour || 0);
        if (Object.values(timeForm).some(v => !v) || durationInHours <= 0) return;
        const data = { ...timeForm, durationInHours, totalCost, timestamp: serverTimestamp() };
        addDoc(collection(db, "users", userId, 'time_entries'), data);
        setTimeForm({ employee: '', date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', location: '', activity: '' });
    };

    const handleAddTripEntry = (e) => {
        e.preventDefault();
        const distance = parseFloat(tripForm.endKm) - parseFloat(tripForm.startKm);
        if (!tripForm.driver || !tripForm.date || !tripForm.origin || !tripForm.destination || !tripForm.startKm || !tripForm.endKm || distance < 0) return;
        const data = { ...tripForm, distance, totalCost: distance * COST_PER_KM, timestamp: serverTimestamp() };
        addDoc(collection(db, "users", userId, 'trips'), data);
        setTripForm({ driver: '', date: new Date().toISOString().split('T')[0], origin: '', destination: '', startKm: '', endKm: '', notes: '' });
    };

    const chartData = useMemo(() => ({
        hoursByEmployee: employees.map(emp => ({ name: emp.name, Horas: timeLogs.filter(log => log.employee === emp.name).reduce((sum, log) => sum + log.durationInHours, 0) })),
        hoursByActivity: activities.map(act => ({ name: act.name, value: timeLogs.filter(log => log.activity === act.name).reduce((sum, log) => sum + log.durationInHours, 0) })).filter(d => d.value > 0),
        distanceByDriver: employees.map(emp => ({ name: emp.name, Distância: tripLogs.filter(log => log.driver === emp.name).reduce((sum, log) => sum + log.distance, 0) })),
    }), [timeLogs, tripLogs, employees, activities]);
    
    if (!isAuthReady) return <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900"><p>A carregar...</p></div>;

    return (
        <div className={`bg-slate-100 dark:bg-slate-900 min-h-screen font-sans text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8 ${theme}`}>
            <main className="max-w-7xl mx-auto">
                <header className="mb-8 text-center relative"><h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Controlo de Horas e Viagens</h1><p className="text-lg text-slate-600 dark:text-slate-400 mt-1">AeC Serviços Especializados</p><button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="absolute top-0 right-0 p-2 rounded-full bg-slate-200 dark:bg-slate-700">{theme === 'light' ? <Moon /> : <Sun className="text-yellow-300" />}</button></header>
                <div className="flex justify-center mb-8 gap-2 sm:gap-4"><button onClick={() => setCurrentView('dashboard')} className={`px-4 py-2 font-semibold rounded-lg ${currentView === 'dashboard' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-700'}`}><BarChart2 className="inline mr-2" />Dashboard</button><button onClick={() => setCurrentView('horas')} className={`px-4 py-2 font-semibold rounded-lg ${currentView === 'horas' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700'}`}><Clock className="inline mr-2" />Horas</button><button onClick={() => setCurrentView('viagens')} className={`px-4 py-2 font-semibold rounded-lg ${currentView === 'viagens' ? 'bg-green-600 text-white' : 'bg-white dark:bg-slate-700'}`}><Car className="inline mr-2" />Viagens</button></div>
                
                {currentView === 'dashboard' && <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"><h2 className="text-2xl font-bold mb-6 text-center">Dashboard de Análise</h2><Dashboard chartData={chartData} /></div>}
                
                {currentView !== 'dashboard' && <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {currentView === 'horas' && <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"><h2 className="text-xl font-bold mb-4 flex items-center"><PlusCircle className="mr-2 text-blue-500" /> Adicionar Registo de Horas</h2><form onSubmit={handleAddTimeEntry} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><label>Funcionário</label><select value={timeForm.employee} onChange={e => setTimeForm({...timeForm, employee: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}</select></div><div><label>Data</label><input type="date" value={timeForm.date} onChange={e => setTimeForm({...timeForm, date: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div><div><label>Hora Início</label><input type="time" value={timeForm.startTime} onChange={e => setTimeForm({...timeForm, startTime: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div><div><label>Hora Fim</label><input type="time" value={timeForm.endTime} onChange={e => setTimeForm({...timeForm, endTime: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div></div><div><label>Local</label><select value={timeForm.location} onChange={e => setTimeForm({...timeForm, location: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select></div><div><label>Atividade</label><select value={timeForm.activity} onChange={e => setTimeForm({...timeForm, activity: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{activities.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</select></div><button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700">Guardar</button></form></div>}
                        {currentView === 'viagens' && <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"><h2 className="text-xl font-bold mb-4 flex items-center"><Route className="mr-2 text-green-500" /> Adicionar Registo de Viagem</h2><form onSubmit={handleAddTripEntry} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><label>Motorista</label><select value={tripForm.driver} onChange={e => setTripForm({...tripForm, driver: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"><option value="" disabled>Selecione</option>{employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}</select></div><div><label>Data</label><input type="date" value={tripForm.date} onChange={e => setTripForm({...tripForm, date: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div><div><label>Origem</label><input type="text" value={tripForm.origin} onChange={e => setTripForm({...tripForm, origin: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div><div><label>Destino</label><input type="text" value={tripForm.destination} onChange={e => setTripForm({...tripForm, destination: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div><div><label>KM Inicial</label><input type="number" value={tripForm.startKm} onChange={e => setTripForm({...tripForm, startKm: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div><div><label>KM Final</label><input type="number" value={tripForm.endKm} onChange={e => setTripForm({...tripForm, endKm: e.target.value})} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"/></div></div><div><label>Observações</label><textarea value={tripForm.notes} onChange={e => setTripForm({...tripForm, notes: e.target.value})} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" rows="2"/></div><button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-700">Guardar</button></form></div>}
                    </div>
                    <div className="lg:col-span-3 space-y-6">
                        <ManagementSection title="Funcionários" icon={Users} items={employees} isLoading={isLoading.employees} hasCost={true} onAddItem={(name, cost) => handleAddItem('employees', name, cost)} onDeleteItem={(id) => confirmDeleteItem('employees', id)} />
                        <ManagementSection title="Locais" icon={MapPin} items={locations} isLoading={isLoading.locations} onAddItem={(name) => handleAddItem('locations', name)} onDeleteItem={(id) => confirmDeleteItem('locations', id)} />
                        <ManagementSection title="Atividades" icon={ClipboardList} items={activities} isLoading={isLoading.activities} onAddItem={(name) => handleAddItem('activities', name)} onDeleteItem={(id) => confirmDeleteItem('activities', id)} />
                    </div>
                </div>}
                <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Exclusão"><p>Tem a certeza?</p><div className="flex justify-end gap-4 mt-6"><button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600">Cancelar</button><button onClick={handleDeleteItem} className="px-4 py-2 rounded-lg bg-red-600 text-white">Apagar</button></div></Modal>
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Editar Registo`}>{editingRecord && (<form onSubmit={handleUpdateRecord}>{editingRecord.type === 'horas' ? (<div>...</div>) : (<div>...</div>)}<div className="flex justify-end gap-4 mt-6"><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600">Cancelar</button><button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Guardar</button></div></form>)}</Modal>
            </main>
        </div>
    );
};

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    return isAuthenticated ? <AppContent /> : <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
}
