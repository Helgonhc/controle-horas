// Local do arquivo: src/pages/Dashboard.jsx

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Dashboard = ({ chartData }) => {
    const hoursByEmployee = chartData?.hoursByEmployee || [];
    const distanceByDriver = chartData?.distanceByDriver || []; // NOVO: Pega os dados de distância

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-slate-800 dark:text-slate-200">
                Dashboard de Análise
            </h2>
            
            {/* Usamos um grid para organizar os gráficos lado a lado em telas grandes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Gráfico de Horas */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-300">Horas Totais por Funcionário</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hoursByEmployee}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="name" stroke="#cbd5e1" />
                            <YAxis stroke="#cbd5e1"/>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#475569', color: '#f1f5f9' }} />
                            <Legend />
                            <Bar dataKey="Horas" fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* NOVO: Gráfico de Distância */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-300">Distância Total por Motorista (KM)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={distanceByDriver}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="name" stroke="#cbd5e1" />
                            <YAxis stroke="#cbd5e1"/>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#475569', color: '#f1f5f9' }} />
                            <Legend />
                            <Bar dataKey="Distância" fill="#22c55e" /> {/* Cor verde para combinar com a aba de viagens */}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
};