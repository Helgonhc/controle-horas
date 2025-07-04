import React, { useState, useEffect } from 'react';
import { useJsApiLoader, GoogleMap, Polyline, Marker } from '@react-google-maps/api';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
import { toast } from 'react-toastify';
// Ícones: Adicionado 'Download' aqui
import { LoaderCircle, MapPin, PlusCircle, Route, Edit, Car, Calendar, DollarSign, Text, Download } from 'lucide-react'; 

const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '8px',
    marginBottom: '1rem',
};

const center = { lat: -23.55052, lng: -46.633308 }; // São Paulo, Brazil as default

export const TripForm = ({ employees, onAddTrip, onUpdateTrip, isSubmitting, initialData = null }) => {
    const [driver, setDriver] = useState(initialData?.driver || '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [origin, setOrigin] = useState(initialData?.origin || '');
    const [destination, setDestination] = useState(initialData?.destination || '');
    const [startKm, setStartKm] = useState(initialData?.startKm || '');
    const [endKm, setEndKm] = useState(initialData?.endKm || '');
    const [distance, setDistance] = useState(initialData?.distance || 0);
    const [totalCost, setTotalCost] = useState(initialData?.totalCost || 0); // Adicionado para exibir custo total
    const [notes, setNotes] = useState(initialData?.notes || ''); // Adicionado para observações

    const [map, setMap] = useState(null);
    const [directions, setDirections] = useState(null);
    const [originLatLng, setOriginLatLng] = useState(initialData?.originLatLng || null); // Carrega do initialData
    const [destinationLatLng, setDestinationLatLng] = useState(initialData?.destinationLatLng || null); // Carrega do initialData

    // Estado para despesas
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseFile, setExpenseFile] = useState(null); // Para o arquivo de recibo
    const [expenses, setExpenses] = useState(initialData?.expenses || []); // Para armazenar múltiplas despesas

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_Maps_API_KEY, // A chave correta
        libraries: ['places'],
    });

    // Efeito para preencher o formulário e carregar o mapa em modo de edição
    useEffect(() => {
        if (initialData) {
            setDriver(initialData.driver || '');
            setDate(initialData.date || new Date().toISOString().split('T')[0]);
            setOrigin(initialData.origin || '');
            setDestination(initialData.destination || '');
            setStartKm(initialData.startKm || '');
            setEndKm(initialData.endKm || '');
            setDistance(initialData.distance || 0);
            setTotalCost(initialData.totalCost || 0);
            setNotes(initialData.notes || '');
            setExpenses(initialData.expenses || []); // Carrega despesas existentes

            setOriginLatLng(initialData.originLatLng || null);
            setDestinationLatLng(initialData.destinationLatLng || null);
            if (initialData.originLatLng && initialData.destinationLatLng && isLoaded) {
                calculateAndDisplayRoute(initialData.originLatLng, initialData.destinationLatLng);
            }
        } else {
            // Reseta o formulário para o modo de adição
            setDriver('');
            setDate(new Date().toISOString().split('T')[0]);
            setOrigin('');
            setDestination('');
            setStartKm('');
            setEndKm('');
            setDistance(0);
            setTotalCost(0);
            setNotes('');
            setExpenses([]);
            setExpenseDescription('');
            setExpenseAmount('');
            setExpenseFile(null);
            setOriginLatLng(null);
            setDestinationLatLng(null);
            setDirections(null);
        }
    }, [initialData, isLoaded]); // Depende de isLoaded para tentar carregar rota no initData

    const calculateAndDisplayRoute = (originLoc, destLoc) => {
        if (!originLoc || !destLoc || !isLoaded) return; // Garante que o Maps API está carregado

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
            {
                origin: originLoc,
                destination: destLoc,
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    setDirections(result);
                    const route = result.routes[0].legs[0];
                    const calculatedDistance = route.distance.value / 1000; // em km
                    setDistance(calculatedDistance);
                    setTotalCost(calculatedDistance * 0.50); // Custo estimado por KM
                    setStartKm(''); // Limpa KMs se a rota for pelo mapa
                    setEndKm('');
                } else {
                    toast.error(`Erro ao calcular rota: ${status}`);
                    setDirections(null);
                    setDistance(0);
                    setTotalCost(0);
                }
            }
        );
    };

    // Efeito para calcular a distância e custo total baseado em KM inicial/final
    useEffect(() => {
        const skm = parseFloat(startKm);
        const ekm = parseFloat(endKm);
        if (!isNaN(skm) && !isNaN(ekm) && ekm >= skm) {
            const calculatedDistance = ekm - skm;
            setDistance(calculatedDistance);
            setTotalCost(calculatedDistance * 0.50); // Custo estimado por KM
            setDirections(null); // Limpa as direções do mapa se usar KMs
            setOriginLatLng(null);
            setDestinationLatLng(null);
        } else if (isNaN(skm) || isNaN(ekm)) { // Se um dos KMs não for número
            // Apenas zera se ambos os KMs são inválidos e não há coordenadas no mapa
            if (!originLatLng && !destinationLatLng) {
                setDistance(0);
                setTotalCost(0);
            }
        }
    }, [startKm, endKm, originLatLng, destinationLatLng]); // Depende das coords para evitar conflito com mapa


    const handleSelectOrigin = async (address) => {
        setOrigin(address);
        try {
            const results = await geocodeByAddress(address);
            const latLng = await getLatLng(results[0]);
            setOriginLatLng(latLng);
            if (destinationLatLng && isLoaded) { // Só calcula se destino e Maps API carregado
                calculateAndDisplayRoute(latLng, destinationLatLng);
            }
        } catch (error) {
            console.error('Erro ao obter lat/lng para origem:', error);
            toast.error('Erro ao validar local de origem.');
            setOriginLatLng(null);
            setDirections(null);
        }
    };

    const handleSelectDestination = async (address) => {
        setDestination(address);
        try {
            const results = await geocodeByAddress(address);
            const latLng = await getLatLng(results[0]);
            setDestinationLatLng(latLng);
            if (originLatLng && isLoaded) { // Só calcula se origem e Maps API carregado
                calculateAndDisplayRoute(originLatLng, latLng);
            }
        } catch (error) {
            console.error('Erro ao obter lat/lng para destino:', error);
            toast.error('Erro ao validar local de destino.');
            setDestinationLatLng(null);
            setDirections(null);
        }
    };

    const handleAddExpense = () => {
        if (expenseDescription && expenseAmount && parseFloat(expenseAmount) > 0) {
            const newExpense = {
                id: Date.now(), // ID único para a despesa (para remoção)
                description: expenseDescription,
                amount: parseFloat(expenseAmount),
                receipt: expenseFile // O objeto File em si
            };
            setExpenses(prev => [...prev, newExpense]);
            setExpenseDescription('');
            setExpenseAmount('');
            setExpenseFile(null); // Limpa o campo de arquivo após adicionar
            toast.success('Despesa adicionada à lista!');
        } else {
            toast.warn('Por favor, preencha a descrição e o valor da despesa.');
        }
    };

    const handleRemoveExpense = (id) => {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
        toast.info('Despesa removida.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validação: Motorista, Data e (Origem/Destino OU KM Inicial/Final)
        const isKmValid = startKm !== '' && endKm !== '' && parseFloat(startKm) >= 0 && parseFloat(endKm) >= 0;
        const isMapValid = originLatLng && destinationLatLng && origin && destination;

        if (!driver || !date || (!isKmValid && !isMapValid)) {
            toast.warn("Por favor, preencha Motorista, Data e pelo menos um dos pares: Origem/Destino (no mapa) OU KM Inicial/Final.");
            return;
        }
        
        // Se usar KM, a distância já está calculada no useEffect
        // Se usar mapa, a distância já está calculada no calculateAndDisplayRoute
        // Se ambos, a prioridade é dada ao último que foi preenchido/calculado

        const tripData = {
            driver,
            date,
            origin,
            destination,
            startKm: startKm ? parseFloat(startKm) : null,
            endKm: endKm ? parseFloat(endKm) : null,
            distance: parseFloat(distance.toFixed(1)),
            totalCost: parseFloat(totalCost.toFixed(2)),
            notes,
            originLatLng: originLatLng, // Salva as coordenadas
            destinationLatLng: destinationLatLng, // Salva as coordenadas
            expenses: expenses // Inclui as despesas adicionadas localmente
        };

        if (initialData) {
            onUpdateTrip({ id: initialData.id, ...tripData });
        } else {
            onAddTrip(tripData);
        }
    };

    if (loadError) {
        return <div className="text-red-500 text-center">Erro ao carregar o mapa.</div>;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                {initialData ? <Edit className="mr-2 text-purple-500" /> : <PlusCircle className="mr-2 text-green-500" />}
                {initialData ? 'Editar Registro de Viagem' : 'Adicionar Nova Viagem'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><Car size={16} className="mr-2" /> Motorista</label>
                        <select
                            value={driver}
                            onChange={(e) => setDriver(e.target.value)}
                            required
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="" disabled>Selecione o motorista</option>
                            {(employees || []).map(e => (
                                <option key={e.id} value={e.name}>{e.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><Calendar size={16} className="mr-2" /> Data</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="w-full p-2 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><MapPin size={16} className="mr-2" /> Origem</label>
                        <PlacesAutocomplete
                            value={origin}
                            onChange={setOrigin}
                            onSelect={handleSelectOrigin}
                        >
                            {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                                <div>
                                    <input
                                        {...getInputProps({
                                            placeholder: 'Endereço de Origem',
                                            className: 'w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white',
                                        })}
                                    />
                                    <div className="autocomplete-dropdown-container bg-white dark:bg-slate-700 rounded-lg shadow-md mt-1 z-10 relative">
                                        {loading && <div className="p-2 text-sm text-slate-500">Carregando sugestões...</div>}
                                        {suggestions.map((suggestion) => {
                                            const className = suggestion.active
                                                ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 cursor-pointer p-2'
                                                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer p-2';
                                            return (
                                                <div
                                                    {...getSuggestionItemProps(suggestion, {
                                                        className,
                                                    })}
                                                    key={suggestion.placeId}
                                                >
                                                    <span>{suggestion.description}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </PlacesAutocomplete>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><MapPin size={16} className="mr-2" /> Destino</label>
                        <PlacesAutocomplete
                            value={destination}
                            onChange={setDestination}
                            onSelect={handleSelectDestination}
                        >
                            {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                                <div>
                                    <input
                                        {...getInputProps({
                                            placeholder: 'Endereço de Destino',
                                            className: 'w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white',
                                        })}
                                    />
                                    <div className="autocomplete-dropdown-container bg-white dark:bg-slate-700 rounded-lg shadow-md mt-1 z-10 relative">
                                        {loading && <div className="p-2 text-sm text-slate-500">Carregando sugestões...</div>}
                                        {suggestions.map((suggestion) => {
                                            const className = suggestion.active
                                                ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 cursor-pointer p-2'
                                                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer p-2';
                                            return (
                                                <div
                                                    {...getSuggestionItemProps(suggestion, {
                                                        className,
                                                    })}
                                                    key={suggestion.placeId}
                                                >
                                                    <span>{suggestion.description}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </PlacesAutocomplete>
                    </div>
                </div>

                {isLoaded && (originLatLng || destinationLatLng) && (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={center}
                        zoom={originLatLng && destinationLatLng ? null : 10}
                        onLoad={setMap}
                        options={{
                            zoomControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: false,
                        }}
                    >
                        {directions && (
                            <Polyline
                                path={directions.routes[0].overview_path}
                                options={{ strokeColor: "#1a73e8", strokeWeight: 5 }}
                            />
                        )}
                        {!directions && originLatLng && <Marker position={originLatLng} />}
                        {!directions && destinationLatLng && <Marker position={destinationLatLng} />}
                    </GoogleMap>
                )}
                {!isLoaded && <div className="text-center text-slate-500">Carregando mapa...</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><Route className="mr-2" /> KM Inicial</label>
                        <input
                            type="number"
                            value={startKm}
                            onChange={(e) => setStartKm(e.target.value)}
                            className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><Route className="mr-2" /> KM Final</label>
                        <input
                            type="number"
                            value={endKm}
                            onChange={(e) => setEndKm(e.target.value)}
                            className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><Route className="mr-2" /> Distância (KM)</label>
                        <input
                            type="text"
                            value={distance.toFixed(2)}
                            readOnly
                            className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><DollarSign className="mr-2" /> Custo Total (R$)</label>
                        <input
                            type="text"
                            value={totalCost.toFixed(2)}
                            readOnly
                            className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Seção de Despesas (Adicionar Nova Despesa) */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-3">Adicionar Despesa</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
                            <input
                                type="text"
                                value={expenseDescription}
                                onChange={e => setExpenseDescription(e.target.value)}
                                className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                                placeholder="Ex: Gasolina, Pedágio"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={expenseAmount}
                                onChange={e => setExpenseAmount(e.target.value)}
                                className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Recibo</label>
                            <input
                                type="file"
                                onChange={e => setExpenseFile(e.target.files[0])}
                                className="w-full mt-1 text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAddExpense}
                            className="w-full col-span-full sm:col-span-1 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center justify-center disabled:bg-blue-400"
                        >
                            <PlusCircle className="mr-2" /> Adicionar Despesa
                        </button>
                    </div>

                    {/* Lista de Despesas Adicionadas */}
                    {expenses.length > 0 && (
                        <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                            <h4 className="text-md font-semibold mb-2">Despesas desta Viagem:</h4>
                            <ul className="space-y-2">
                                {expenses.map((exp, index) => (
                                    <li key={exp.id || index} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-2 rounded-md">
                                        <span>{exp.description} - R$ {exp.amount.toFixed(2)}</span>
                                        {exp.receipt && ( // Mostra que tem recibo anexado (temporariamente no estado)
                                            <span className="text-green-500 text-xs ml-2"> (Recibo anexado)</span>
                                        )}
                                        {exp.receiptURL && ( // Se já tiver URL (despesa carregada do Firestore)
                                            <a href={exp.receiptURL} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:text-blue-700">
                                                <Download className="inline-block w-4 h-4" />
                                            </a>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExpense(exp.id)}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Remover
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:bg-green-400"
                >
                    {isSubmitting ? <><LoaderCircle className="animate-spin mr-2" /> {initialData ? 'Atualizando...' : 'Guardando...'}</> : (initialData ? 'Atualizar Viagem' : 'Guardar Viagem')}
                </button>
            </form>
        </div>
    );
};