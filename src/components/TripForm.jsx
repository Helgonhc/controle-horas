// Local do arquivo: src/components/TripForm.jsx
import React, { useState, useEffect } from 'react';
import { useJsApiLoader, GoogleMap, Polyline, Marker } from '@react-google-maps/api';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
import { PlusCircle, LoaderCircle, MapPin, Route as RouteIcon, Car, Calendar, DollarSign, Text, Edit } from 'lucide-react';
import { toast } from 'react-toastify';

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
    const [totalCost, setTotalCost] = useState(initialData?.totalCost || 0);
    const [notes, setNotes] = useState(initialData?.notes || '');

    const [map, setMap] = useState(null);
    const [directions, setDirections] = useState(null);
    const [originLatLng, setOriginLatLng] = useState(null);
    const [destinationLatLng, setDestinationLatLng] = useState(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_Maps_API_KEY,
        libraries: ['places'],
    });

    // Reset form or set initial data when initialData changes (for edit mode)
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

            // Try to set map coordinates for existing trip for visualization
            if (initialData.originLatLng && initialData.destinationLatLng) {
                setOriginLatLng(initialData.originLatLng);
                setDestinationLatLng(initialData.destinationLatLng);
                // Calcula e exibe a rota apenas se o mapa estiver carregado
                if (isLoaded) {
                    calculateAndDisplayRoute(initialData.originLatLng, initialData.destinationLatLng);
                }
            }
        } else {
            // Reset form for creation mode
            setDriver('');
            setDate(new Date().toISOString().split('T')[0]);
            setOrigin('');
            setDestination('');
            setStartKm('');
            setEndKm('');
            setDistance(0);
            setTotalCost(0);
            setNotes('');
            setOriginLatLng(null);
            setDestinationLatLng(null);
            setDirections(null);
        }
    }, [initialData, isLoaded]); // Adicionado isLoaded como dependência

    const calculateAndDisplayRoute = (originLoc, destLoc) => {
        if (!originLoc || !destLoc || !isLoaded) return;

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
                    const calculatedDistance = route.distance.value / 1000; // in km
                    setDistance(calculatedDistance);
                    setTotalCost(calculatedDistance * 0.50); // Assuming 0.50 per km
                } else {
                    toast.error(`Erro ao calcular rota: ${status}`);
                    setDirections(null);
                    setDistance(0);
                    setTotalCost(0);
                }
            }
        );
    };

    // Recalcula distância e custo se KM inicial/final mudarem
    useEffect(() => {
        if (startKm !== '' && endKm !== '') {
            const calculatedDistanceKm = Math.abs(parseFloat(endKm) - parseFloat(startKm));
            if (!isNaN(calculatedDistanceKm)) {
                setDistance(calculatedDistanceKm);
                setTotalCost(calculatedDistanceKm * 0.50); // Assuming 0.50 per km
                setDirections(null); // Clear map directions if using KM input
                setOriginLatLng(null);
                setDestinationLatLng(null);
            }
        } else if (!originLatLng || !destinationLatLng) { // Se não tem KM E não tem coordenadas do mapa
            setDistance(0);
            setTotalCost(0);
        }
    }, [startKm, endKm, originLatLng, destinationLatLng]);


    const handleOriginSelect = async (address) => {
        setOrigin(address);
        try {
            const results = await geocodeByAddress(address);
            const latLng = await getLatLng(results[0]);
            setOriginLatLng(latLng);
            if (destinationLatLng && isLoaded) { // Adicionado isLoaded
                calculateAndDisplayRoute(latLng, destinationLatLng);
            }
        } catch (error) {
            console.error('Error', error);
            toast.error("Não foi possível encontrar as coordenadas de origem.");
            setOriginLatLng(null);
            setDirections(null);
        }
    };

    const handleDestinationSelect = async (address) => {
        setDestination(address);
        try {
            const results = await geocodeByAddress(address);
            const latLng = await getLatLng(results[0]);
            setDestinationLatLng(latLng);
            if (originLatLng && isLoaded) { // Adicionado isLoaded
                calculateAndDisplayRoute(originLatLng, latLng);
            }
        } catch (error) {
            console.error('Error', error);
            toast.error("Não foi possível encontrar as coordenadas de destino.");
            setDestinationLatLng(null);
            setDirections(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validação mais robusta: pelo menos um dos pares (origem/destino OU KM inicial/final) deve estar preenchido.
        const isKmValid = startKm !== '' && endKm !== '' && parseFloat(startKm) >= 0 && parseFloat(endKm) >= 0;
        const isMapValid = originLatLng && destinationLatLng;

        if (!driver || !date || (!isKmValid && !isMapValid)) {
            toast.error('Por favor, preencha Motorista, Data e pelo menos um dos pares: Origem/Destino (no mapa) OU KM Inicial/Final.');
            return;
        }

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
            originLatLng: originLatLng,
            destinationLatLng: destinationLatLng,
        };

        if (initialData) {
            // Modo de Edição
            onUpdateTrip({ id: initialData.id, ...tripData });
        } else {
            // Modo de Criação
            onAddTrip(tripData);
        }
    };

    if (loadError) {
        return <div className="text-red-500 text-center">Erro ao carregar o mapa.</div>;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
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
                            {(employees || []).map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><Calendar size={16} className="mr-2" /> Data</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><MapPin size={16} className="mr-2" /> Origem</label>
                        <PlacesAutocomplete
                            value={origin}
                            onChange={setOrigin}
                            onSelect={handleOriginSelect}
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
                            onSelect={handleDestinationSelect}
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
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><RouteIcon size={16} className="mr-2" /> KM Inicial</label>
                        <input
                            type="number"
                            value={startKm}
                            onChange={(e) => setStartKm(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><RouteIcon size={16} className="mr-2" /> KM Final</label>
                        <input
                            type="number"
                            value={endKm}
                            onChange={(e) => setEndKm(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><RouteIcon size={16} className="mr-2" /> Distância (KM)</label>
                        <input
                            type="text"
                            value={distance.toFixed(1)}
                            readOnly
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><DollarSign size={16} className="mr-2" /> Custo Total (R$)</label>
                        <input
                            type="text"
                            value={totalCost.toFixed(2)}
                            readOnly
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white cursor-not-allowed"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center"><Text size={16} className="mr-2" /> Observações (Opcional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows="3"
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:bg-green-400 transition-colors"
                >
                    {isSubmitting ? <><LoaderCircle className="animate-spin mr-2" /> Guardando...</> : (
                        initialData ? 'Salvar Alterações' : 'Adicionar Viagem'
                    )}
                </button>
            </form>
        </div>
    );
};