import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell } from 'recharts';

export const Dashboard = ({ chartData }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
                <h3 className="font-bold mb-4 text-center">Total de Horas por Funcionário</h3>
                <div style={{width: '100%', height: 300}}>
                    <ResponsiveContainer>
                        <BarChart data={chartData.hoursByEmployee} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Horas" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
                <h3 className="font-bold mb-4 text-center">Distribuição de Horas por Atividade</h3>
                <div style={{width: '100%', height: 300}}>
                     <ResponsiveContainer>
                        <PieChart>
                            <Pie data={chartData.hoursByActivity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {chartData.hoursByActivity.map((entry, index) => <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff8042'][index % 4]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
             <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 lg:col-span-2">
                <h3 className="font-bold mb-4 text-center">Distância Total por Motorista (km)</h3>
                <div style={{width: '100%', height: 300}}>
                    <ResponsiveContainer>
                        <BarChart data={chartData.distanceByDriver} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Distância" fill="#16a34a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};