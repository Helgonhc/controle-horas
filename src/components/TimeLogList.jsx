// Local do arquivo: src/components/TimeLogList.jsx

import React from 'react';
// Ícones: Adicionado 'DollarSign' aqui
import { Edit, Trash2, User, Calendar, Clock, MapPin, ClipboardList, DollarSign } from 'lucide-react'; 

// Função para formatar a data (dd/mm/aaaa)
const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

// Função para formatar moeda (copiada do TripForm/TripDetails para consistência)
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);


export const TimeLogList = ({ logs, isLoading, onEdit, onDelete }) => {
    if (isLoading) {
        return <p className="text-center text-slate-500 mt-4 sm:mt-6">Carregando registros...</p>; 
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg mt-4 sm:mt-8 text-center text-slate-500"> 
                Nenhum registro de horas encontrado.
            </div>
        );
    }

    return (
        <div className="mt-4 sm:mt-8"> 
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-slate-800 dark:text-slate-200">Registros de Horas</h3> 
            <div className="space-y-3 sm:space-y-4"> 
                {logs.map(log => (
                    <div key={log.id} className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl shadow-lg border border-transparent hover:border-blue-500 transition-all duration-300"> 
                        <div className="flex justify-between items-start">
                            {/* Nome do Funcionário */}
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
                                <span className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">{log.employee}</span> 
                            </div>
                            {/* Botões de Ação */}
                            <div className="flex items-center gap-2">
                                <button onClick={() => onEdit(log)} className="text-slate-500 hover:text-blue-500 transition-colors p-1 -m-1 rounded-md"> 
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => onDelete(log.id)} className="text-slate-500 hover:text-red-500 transition-colors p-1 -m-1 rounded-md"> 
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-3 sm:mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400"> 
                            <div className="flex items-center gap-2 sm:gap-3"> 
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span>{formatDate(log.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3"> 
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span>{log.startTime} → {log.endTime}</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">({log.durationInHours ? log.durationInHours.toFixed(2) : '0.00'}h)</span> 
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3"> 
                                <MapPin className="w-4 h-4 text-slate-500" />
                                <span>{log.location}</span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3"> 
                                <ClipboardList className="w-4 h-4 text-slate-500" />
                                <span>{log.activity}</span>
                            </div>
                            {log.totalCost > 0 && ( 
                                <div className="flex items-center gap-2 sm:gap-3 border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                                    <DollarSign className="w-4 h-4 text-slate-500" /> {/* Ícone DollarSign */}
                                    <span className="font-semibold text-green-600 dark:text-green-400">Custo: {formatCurrency(log.totalCost)}</span> {/* Usando formatCurrency */}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};