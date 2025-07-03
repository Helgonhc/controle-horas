// Local do arquivo: src/components/TripLogList.jsx

import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

// Função para formatar a data (dd/mm/aaaa)
const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

// Função para formatar como moeda (R$)
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const TripLogList = ({ logs, isLoading, onEdit, onDelete }) => {
    // Se estiver carregando, mostra uma mensagem
    if (isLoading) {
        return <p className="text-center text-slate-500 mt-4">Carregando registros de viagens...</p>;
    }

    // Se não houver registros, mostra outra mensagem
    if (!logs || logs.length === 0) {
        return <p className="text-center text-slate-500 mt-4">Nenhum registro de viagem encontrado.</p>;
    }

    // Se houver registros, mostra a tabela
    return (
        <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Registros de Viagens</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th scope="col" className="px-4 py-3">Motorista</th>
                            <th scope="col" className="px-4 py-3">Data</th>
                            <th scope="col" className="px-4 py-3">Trajeto</th>
                            <th scope="col" className="px-4 py-3">Distância</th>
                            <th scope="col" className="px-4 py-3">Custo</th>
                            <th scope="col" className="px-4 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                <td className="px-4 py-3 font-medium">{log.driver}</td>
                                <td className="px-4 py-3">{formatDate(log.date)}</td>
                                <td className="px-4 py-3">{log.origin} → {log.destination}</td>
                                <td className="px-4 py-3">{log.distance ? log.distance.toFixed(1) : '0.0'} km</td>
                                <td className="px-4 py-3">{formatCurrency(log.totalCost)}</td>
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