// Local do arquivo: src/components/TripLogList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, User, Calendar, Route, Gauge, DollarSign } from 'lucide-react'; // Removido Edit, que não estava sendo usado

const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const TripLogList = ({ logs, isLoading, onDelete }) => {
    if (isLoading) {
        return <p className="text-center text-slate-500 mt-4">Carregando registros de viagens...</p>;
    }

    // --- CORREÇÃO AQUI ---
    // Garante que 'logs' seja sempre um array, mesmo que venha como null ou undefined
    const safeLogs = logs || []; 
    // --- FIM DA CORREÇÃO ---

    if (safeLogs.length === 0) {
        return <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mt-8 text-center text-slate-500">
            Nenhum registro de viagem encontrado.
        </div>;
    }

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Registros de Viagens</h3>
            <div className="space-y-4">
                {safeLogs.map(log => ( // Agora usamos safeLogs.map
                    <Link to={`/viagem/${log.id}`} key={log.id} className="block bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-transparent hover:border-green-500 transition-all duration-300 group">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-green-500" />
                                <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{log.driver}</span>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDelete(log.id);
                                }} 
                                className="text-slate-500 hover:text-red-500 transition-colors z-10 opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span>{formatDate(log.date)}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Route className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                                <div className="flex flex-col">
                                    <p className="leading-tight"><span className="font-semibold text-slate-500 dark:text-slate-400">Origem:</span> {log.origin}</p>
                                    <p className="leading-tight"><span className="font-semibold text-slate-500 dark:text-slate-400">Destino:</span> {log.destination}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Gauge className="w-4 h-4 text-slate-500" />
                                <span>{log.distance ? log.distance.toFixed(1) : '0.0'} km</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <DollarSign className="w-4 h-4 text-slate-500" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(log.totalCost)}</span>
                            </div>
                            {log.notes && <p className="text-xs italic text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700 mt-3">{log.notes}</p>}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};