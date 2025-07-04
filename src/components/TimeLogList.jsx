// Local do arquivo: src/components/TimeLogList.jsx

import React from 'react';
import { Edit, Trash2, User, Calendar, Clock, MapPin, ClipboardList } from 'lucide-react';

// Função para formatar a data (dd/mm/aaaa)
const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

export const TimeLogList = ({ logs, isLoading, onEdit, onDelete }) => {
    if (isLoading) {
        return <p className="text-center text-slate-500 mt-4">Carregando registros...</p>;
    }

    if (!logs || logs.length === 0) {
        return <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mt-8 text-center text-slate-500">
            Nenhum registro de horas encontrado.
        </div>;
    }

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Registros de Horas</h3>
            <div className="space-y-4">
                {logs.map(log => (
                    <div key={log.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-transparent hover:border-blue-500 transition-all duration-300">
                        <div className="flex justify-between items-start">
                            {/* Nome do Funcionário */}
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
                                <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{log.employee}</span>
                            </div>
                            {/* Botões de Ação */}
                            <div className="flex items-center gap-2">
                                <button onClick={() => onEdit(log)} className="text-slate-500 hover:text-blue-500 transition-colors">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => onDelete(log.id)} className="text-slate-500 hover:text-red-500 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span>{formatDate(log.date)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span>{log.startTime} → {log.endTime}</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">({log.durationInHours ? log.durationInHours.toFixed(2) : '0.00'}h)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                <span>{log.location}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <ClipboardList className="w-4 h-4 text-slate-500" />
                                <span>{log.activity}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};