import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, LoaderCircle, Download } from 'lucide-react';

export const TripLogList = ({ logs, isLoading, onEdit, onDelete }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg mt-8">
                <LoaderCircle className="animate-spin text-blue-500 text-4xl" />
                <p className="ml-3 text-lg">Carregando viagens...</p>
            </div>
        );
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mt-8 text-center text-slate-500 dark:text-slate-400">
                <p>Nenhum registro de viagem encontrado.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mt-8">
            <h2 className="text-xl font-bold mb-4">Registros de Viagens</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Data</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Motorista</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Início</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Fim</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">KM Início</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">KM Fim</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Distância (KM)</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Custo Total (R$)</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Despesas</th> {/* Nova coluna */}
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{format(new Date(log.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{log.driver}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{log.startLocation}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{log.endLocation}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{log.startKm}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{log.endKm}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">{log.distance.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">R$ {log.totalCost ? log.totalCost.toFixed(2) : '0.00'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">
                                    {log.expenses && log.expenses.length > 0 ? (
                                        <ul className="list-disc list-inside">
                                            {log.expenses.map((exp, idx) => (
                                                <li key={idx}>
                                                    {exp.description} - R$ {exp.amount.toFixed(2)}
                                                    {exp.receiptURL && (
                                                        <a href={exp.receiptURL} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:text-blue-700">
                                                            <Download className="inline-block w-4 h-4" />
                                                        </a>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        'N/A'
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onEdit(log)} className="text-blue-600 hover:text-blue-900 mr-3">
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    {/* Passa o primeiro receiptPath para a função onDelete, se existir */}
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