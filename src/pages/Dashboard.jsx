// Local do arquivo: src/pages/Dashboard.jsx

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Dashboard = ({ chartData }) => {
    const hoursByEmployee = chartData?.hoursByEmployee || [];
    const distanceByDriver = chartData?.distanceByDriver || [];

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg"> {/* Padding responsivo: p-4 em mobile, p-6 em sm e acima */}
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-slate-800 dark:text-slate-200"> {/* Tamanho da fonte e margem responsivos */}
                Dashboard de Análise
            </h2>
            
            {/* Usamos um grid para organizar os gráficos. O gap será responsivo. */}
            {/* grid-cols-1 em mobile, lg:grid-cols-2 em telas grandes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12"> {/* Gap responsivo: menor em mobile/md, maior em lg */}
                
                {/* Gráfico de Horas */}
                <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-slate-700 dark:text-slate-300">Horas Totais por Funcionário</h3> {/* Tamanho da fonte e margem responsivos */}
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

                {/* Gráfico de Distância */}
                <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-slate-700 dark:text-300">Distância Total por Motorista (KM)</h3> {/* Tamanho da fonte e margem responsivos */}
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={distanceByDriver}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="name" stroke="#cbd5e1" />
                            <YAxis stroke="#cbd5e1"/>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#475569', color: '#f1f5f9' }} />
                            <Legend />
                            <Bar dataKey="Distância" fill="#22c55e" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};