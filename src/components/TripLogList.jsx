import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, LoaderCircle, Download, User, Calendar, MapPin, Route as RouteIcon, DollarSign } from 'lucide-react'; // Adicionado User, Calendar, MapPin, RouteIcon, DollarSign

export const TripLogList = ({ logs, isLoading, onEdit, onDelete }) => {
    // Funções de formatação (já existem, mas para clareza)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        // Supondo que dateString seja 'YYYY-MM-DD'
        return format(new Date(dateString + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR });
    };
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg mt-4 sm:mt-8"> {/* mt responsivo */}
                <LoaderCircle className="animate-spin text-blue-500 text-4xl" />
                <p className="ml-3 text-lg text-slate-500 dark:text-slate-400">Carregando viagens...</p>
            </div>
        );
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg mt-4 sm:mt-8 text-center text-slate-500 dark:text-slate-400"> {/* p e mt responsivos */}
                <p>Nenhum registro de viagem encontrado.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg mt-4 sm:mt-8"> {/* p e mt responsivos */}
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Registros de Viagens</h2>

            {/* --- VISUALIZAÇÃO EM MODO CARD (PARA MOBILE) --- */}
            <div className="md:hidden space-y-4"> {/* Escondido em telas md e maiores */}
                {logs.map((log) => (
                    <div key={log.id} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl shadow-md border border-transparent hover:border-blue-500 transition-all duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center">
                                <User size={18} className="mr-2 text-blue-500" /> {log.driver}
                            </h3>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => onEdit(log)} className="text-blue-600 hover:text-blue-900">
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button onClick={() => onDelete(log.id, log.expenses?.[0]?.receiptPath)} className="text-red-600 hover:text-red-900">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <p className="flex items-center"><Calendar size={16} className="mr-2 text-slate-500" /> {formatDate(log.date)}</p>
                            <p className="flex items-center"><MapPin size={16} className="mr-2 text-slate-500" /> **Origem:** {log.origin}</p>
                            <p className="flex items-center"><MapPin size={16} className="mr-2 text-slate-500" /> **Destino:** {log.destination}</p>
                            <p className="flex items-center"><RouteIcon size={16} className="mr-2 text-slate-500" /> **KM:** {log.startKm} - {log.endKm}</p>
                            <p className="flex items-center"><RouteIcon size={16} className="mr-2 text-slate-500" /> **Distância:** {log.distance.toFixed(2)} KM</p>
                            <p className="flex items-center"><DollarSign size={16} className="mr-2 text-slate-500" /> **Custo:** {formatCurrency(log.totalCost)}</p>
                            {log.notes && <p className="italic text-xs border-t border-slate-300 dark:border-slate-600 pt-2 mt-2">Obs: {log.notes}</p>}
                            
                            {log.expenses && log.expenses.length > 0 && (
                                <div className="border-t border-slate-300 dark:border-slate-600 pt-2 mt-2">
                                    <h4 className="font-semibold mb-1">Despesas:</h4>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        {log.expenses.map((exp, idx) => (
                                            <li key={idx} className="flex items-center justify-between text-xs">
                                                <span>{exp.description} - {formatCurrency(exp.amount)}</span>
                                                {exp.receiptURL && (
                                                    <a href={exp.receiptURL} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:text-blue-700">
                                                        <Download className="inline-block w-3 h-3" />
                                                    </a>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* --- VISUALIZAÇÃO EM MODO TABELA (PARA TABLET E DESKTOP) --- */}
            <div className="hidden md:block overflow-x-auto"> {/* Escondido em telas md e menores */}
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Data</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Motorista</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Início</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Fim</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">KM Início</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">KM Fim</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Distância (KM)</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Custo Total (R$)</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Despesas</th>
                            <th scope="col" className="relative px-3 py-2"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{formatDate(log.date)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{log.driver}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{log.origin}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{log.destination}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{log.startKm}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{log.endKm}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{log.distance.toFixed(2)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{formatCurrency(log.totalCost)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">
                                    {log.expenses && log.expenses.length > 0 ? (
                                        <ul className="list-disc list-inside text-xs">
                                            {log.expenses.map((exp, idx) => (
                                                <li key={idx} className="flex items-center justify-between">
                                                    <span>{exp.description} - {formatCurrency(exp.amount)}</span>
                                                    {exp.receiptURL && (
                                                        <a href={exp.receiptURL} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:text-blue-700">
                                                            <Download className="inline-block w-3 h-3" />
                                                        </a>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        'N/A'
                                    )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onEdit(log)} className="text-blue-600 hover:text-blue-900 mr-2"> {/* Margem responsiva */}
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => onDelete(log.id, log.expenses?.[0]?.receiptPath)} className="text-red-600 hover:text-red-900">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};