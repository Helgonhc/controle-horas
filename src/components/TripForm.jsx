// Local do arquivo: src/components/TripForm.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { LoaderCircle, Route } from 'lucide-react';
import { PlacesAutocompleteInput } from './PlacesAutocompleteInput'; // Importa nosso componente reutilizável

export const TripForm = ({ employees, onAddTrip, isSubmitting }) => {
    const [driver, setDriver] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [distance, setDistance] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!driver || !origin || !destination) {
            toast.warn("Selecione motorista, origem e destino válidos.");
            return;
        }
        
        const tripData = {
            driver,
            date,
            notes,
            origin: origin.address,
            destination: destination.address,
            distance: parseFloat(distance),
        };
        onAddTrip(tripData);
    };

    useEffect(() => {
        if (origin && destination) {
            // A API do Google já está carregada globalmente, podemos usá-la direto
            const service = new window.google.maps.DistanceMatrixService();
            service.getDistanceMatrix(
                {
                    origins: [origin.latLng],
                    destinations: [destination.latLng],
                    travelMode: 'DRIVING',
                },
                (response, status) => {
                    if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
                        const distanceInMeters = response.rows[0].elements[0].distance.value;
                        const distanceInKm = (distanceInMeters / 1000).toFixed(1);
                        setDistance(distanceInKm);
                        toast.info(`Distância calculada: ${distanceInKm} km`);
                    } else {
                        toast.error("Não foi possível calcular a distância.");
                    }
                }
            );
        }
    }, [origin, destination]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center"><Route className="mr-2 text-green-500" /> Adicionar Registro de Viagem</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label>Motorista</label>
                        <select value={driver} onChange={e => setDriver(e.target.value)} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                            <option value="" disabled>Selecione</option>
                            {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Data</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" />
                    </div>
                </div>

                <div>
                    <label>Origem</label>
                    <PlacesAutocompleteInput onSelect={setOrigin} />
                </div>
                <div>
                    <label>Destino</label>
                    <PlacesAutocompleteInput onSelect={setDestination} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label>Distância (KM)</label>
                        <input type="text" value={distance} readOnly placeholder="Calculada automaticamente" className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-slate-200 dark:bg-slate-700 cursor-not-allowed" />
                    </div>
                </div>

                <div>
                    <label>Observações</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" rows="2" />
                </div>
                
                <button type="submit" disabled={isSubmitting || !distance} className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:bg-green-400">
                    {isSubmitting ? <><LoaderCircle className="animate-spin mr-2" /> Guardando...</> : 'Guardar Viagem'}
                </button>
            </form>
        </div>
    );
};