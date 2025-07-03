// Substitua todo o conteúdo deste arquivo

import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

export const TimeLogList = ({ logs, isLoading, onEdit, onDelete }) => {
    if (isLoading) {
        return <p className="text-center text-slate-500 mt-4">Carregando registros...</p>; // CORRIGIDO
    }

    if (!logs || logs.length === 0) {
        return <p className="text-center text-slate-500 mt-4">Nenhum registro de horas encontrado.</p>; // CORRIGIDO
    }

    return (
        <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Registros de Horas</h3> {/* CORRIGIDO */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th scope="col" className="px-4 py-3">Funcionário</th>
                            <th scope="col" className="px-4 py-3">Data</th>
                            <th scope="col" className="px-4 py-3">Horas</th>
                            <th scope="col" className="px-4 py-3">Local</th>
                            <th scope="col" className="px-4 py-3">Atividade</th>
                            <th scope="col" className="px-4 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                <td className="px-4 py-3 font-medium">{log.employee}</td>
                                <td className="px-4 py-3">{formatDate(log.date)}</td>
                                <td className="px-4 py-3">{log.durationInHours ? log.durationInHours.toFixed(2) : '0.00'}h</td>
                                <td className="px-4 py-3">{log.location}</td>
                                <td className="px-4 py-3">{log.activity}</td>
                                <td className="px-4 py-3 flex items-center gap-2">
                                    <button onClick={() => onEdit(log)} className="text-blue-500 hover:text-blue-700"><Edit size={16} /></button>
                                    <button onClick={() => onDelete(log.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};