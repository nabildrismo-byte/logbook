import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { storageService } from '@/services/storage'
import { authService } from '@/services/auth'
import { FlightLog, ApproachType, FlightType } from '@/types'
import { INSTRUCTORS, STUDENTS, AIRCRAFT_REGISTRATIONS, SESSION_TYPES, FLIGHT_TYPES, AIRPORT_CODES } from '@/lib/constants'
import { ChevronRight, ChevronLeft, Save } from 'lucide-react'

const generateId = () => Math.random().toString(36).substring(2, 9);

export function AddFlight() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const user = authService.getCurrentUser();

    // Wizard State
    const [currentStep, setCurrentStep] = useState(0);

    // Default Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        studentName: '',
        flightType: 'Real' as FlightType,
        sessionType: SESSION_TYPES[0],
        sessionNumber: '1',
        grade: '',

        // Auto-filled if instructor
        instructorName: user?.role === 'instructor' ? user.name : '',

        aircraftReg: AIRCRAFT_REGISTRATIONS[0],
        aircraftType: 'Heli',

        depPlace: 'Base Aérea Armilla',
        // depTime removed
        arrPlace: 'Base Aérea Armilla',
        // arrTime removed

        // Only Total Time
        totalHours: '',

        // Removed splits: pic, dual, ifr, hood...

        approachesCount: 0,
        approachType: 'ILS' as ApproachType,
        approachPlace: 'LEGR',

        // Removed Zone
        procedures: '',
        remarks: '',
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    // Auto-detect Real/Sim
    useEffect(() => {
        if (formData.aircraftReg === 'ET-105' || formData.aircraftReg === 'ET-106') {
            if (formData.flightType === 'Real') {
                setFormData(prev => ({ ...prev, flightType: 'Simulador' }));
            }
        }
    }, [formData.aircraftReg]);

    // Auto-set Reg for Sim/Entrenador
    useEffect(() => {
        if (formData.flightType === 'Entrenador') {
            setFormData(prev => ({ ...prev, aircraftReg: 'ET-106' }));
        } else if (formData.flightType === 'Simulador') {
            setFormData(prev => ({ ...prev, aircraftReg: 'ET-105' }));
        }
    }, [formData.flightType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        const newLog: FlightLog = {
            id: generateId(),
            date: formData.date,
            instructorId: user.id,
            instructorName: formData.instructorName,
            studentName: formData.studentName,
            flightType: formData.flightType,
            session: `${formData.sessionType}-${formData.sessionNumber}`,
            grade: formData.grade,

            aircraft: {
                registration: formData.aircraftReg,
                type: formData.aircraftType
            },
            departure: {
                place: formData.depPlace,
                time: '' // Removed
            },
            arrival: {
                place: formData.arrPlace,
                time: '' // Removed
            },

            // Convert Hours to Minutes
            totalTime: formData.totalHours ? Math.round(parseFloat(formData.totalHours) * 60) : 0,

            // No splits recorded anymore, technically Instructor is usually Total Time in this context
            pilotFunction: {
                instructor: user.role === 'instructor' ? Math.round(parseFloat(formData.totalHours) * 60) : undefined
            },
            conditions: {}, // No detailed splits

            approaches: Number(formData.approachesCount) > 0 ? [{
                type: formData.approachType,
                count: Number(formData.approachesCount),
                place: formData.approachPlace
            }] : [],

            procedures: formData.procedures,
            remarks: formData.remarks,
        };

        // Save Local Copy First (Backup)
        storageService.saveLog(newLog);

        // Send to Google Sheets
        try {
            const formDataToSend = new FormData();

            // Map to requested columns: [SESIÓN] [FECHA] [INSTRUCTOR] [MATRÍCULA] [TIEMPO] [REAL / SIM] [PUNTUACIÓN] [OBSERVACIONES]

            // Calculate REAL / SIM Logic
            let realSim = 'R';
            if (formData.aircraftReg === 'ET-105' || formData.aircraftReg === 'ET-106') {
                realSim = 'S';
            } else if (formData.flightType === 'Simulador') {
                realSim = 'S';
            } else if (formData.flightType === 'Entrenador') {
                realSim = 'E';
            }

            // Format Date (DD/MM/YYYY)
            const [y, m, d] = formData.date.split('-');
            const formattedDate = `${d}/${m}/${y}`;

            // Add ALUMNO as first column
            formDataToSend.append('ALUMNO', formData.studentName);
            formDataToSend.append('SESIÓN', `${formData.sessionType}-${formData.sessionNumber}`);
            formDataToSend.append('FECHA', formattedDate);
            formDataToSend.append('INSTRUCTOR', formData.instructorName);
            formDataToSend.append('MATRÍCULA', formData.aircraftReg);
            formDataToSend.append('TIEMPO', formData.totalHours); // Send raw decimal hours as requested
            formDataToSend.append('REAL / SIM', realSim);
            formDataToSend.append('PUNTUACIÓN', formData.grade);
            formDataToSend.append('OBSERVACIONES', formData.remarks);

            // Add student name if needed, though column requirement didn't explicitly list it? 
            // User request: "[SESIÓN] [FECHA] [INSTRUCTOR] [MATRÍCULA] [TIEMPO] [REAL / SIM] [PUNTUACIÓN] [OBSERVACIONES]" 
            // NOTE: The user's list implies they filter by student in their own way or maybe I missed it. 
            // Wait, "La base de datos debe permitir filtrar por Alumno." -> That's local DB.
            // On spreadsheet, if there's no Student column, they can't know who flew?
            // User said: "El requisito crítico es que la exportación de datos debe coincidir exactamente con la estructura de mi hoja de cálculo actual para facilitar el volcado de notas."
            // The list of columns provided: `[SESIÓN] [FECHA] [INSTRUCTOR] [MATRÍCULA] [TIEMPO] [REAL / SIM] [PUNTUACIÓN] [OBSERVACIONES]`
            // It seems "Alumno" column is NOT in the export list? Maybe they paste into a specific student's sheet? 
            // "Al final del curso, yo descargo un archivo... Copio las celdas... pego directamente en mi Excel Master".
            // If the Master has a sheet PER STUDENT, then that makes sense.
            // Anyway, I will stick EXACTLY to the requested columns.

            await fetch('https://script.google.com/macros/s/AKfycbznDJQ0cZH5b7VYDWFv7Q7C4g879RS2l4AIy-qTZvT0UheXKwY7uqUyGvv4bWnAzh6v/exec', {
                method: 'POST',
                body: formDataToSend,
                mode: 'no-cors' // Creating opaque request to avoid CORS issues with GAS
            });

            alert('Vuelo registrado en la central correctamente');

            // Clean Form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                studentName: '', // Reset Name too? Usually instructor logs many flights. Let's reset for safety.
                flightType: 'Real',
                sessionType: SESSION_TYPES[0],
                sessionNumber: '1',
                grade: '',
                instructorName: user?.role === 'instructor' ? user.name : '',
                aircraftReg: AIRCRAFT_REGISTRATIONS[0],
                aircraftType: 'Heli',
                depPlace: 'Base Aérea Armilla',
                arrPlace: 'Base Aérea Armilla',
                totalHours: '',
                approachesCount: 0,
                approachType: 'ILS',
                approachPlace: 'LEGR',
                procedures: '',
                remarks: '',
            });
            setCurrentStep(0);
            navigate('/');

        } catch (error) {
            console.error(error);
            alert('Error al enviar a la central. Se ha guardado una copia local en el dispositivo.');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    // Calculate Steps dynamically based on Admin role
    // Steps Definition:
    // 0: Student
    // 1: Instructor (Admin Only)
    // 2: Session
    // 3: Grade
    // 4: Date
    // 5: Aircraft
    // 6: Route
    // 7: Time
    // 8: Approaches
    // 9: Details

    // We'll render content based on a simplified switch, managing skip logic in nextStep if needed, 
    // or just conditionally rendering the step in the UI flow.
    // Easier: Map generic steps to content.

    const steps = [
        { id: 'student', title: 'Alumno' },
        ...(user?.role === 'admin' ? [{ id: 'instructor', title: 'Instructor' }] : []),
        { id: 'session', title: 'Sesión' },
        { id: 'grade', title: 'Calificación' },
        { id: 'date', title: 'Fecha' },
        { id: 'aircraft', title: 'Aeronave' },
        { id: 'route', title: 'Ruta' },
        { id: 'time', title: 'Tiempo' },
        { id: 'approaches', title: 'Aproximaciones' },
        { id: 'details', title: 'Detalles' },
    ];

    const currentStepId = steps[currentStep]?.id;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;
    const progress = ((currentStep + 1) / steps.length) * 100;

    const renderStepContent = () => {
        switch (currentStepId) {
            case 'student':
                return (
                    <div className="space-y-4">
                        <Select
                            label="Nombre del Alumno"
                            name="studentName"
                            value={formData.studentName}
                            onChange={handleChange}
                            options={STUDENTS.map(s => ({ label: s, value: s }))}
                            className="text-lg py-3"
                        />
                    </div>
                );
            case 'instructor':
                return (
                    <div className="space-y-4">
                        <Select
                            label="Instructor"
                            name="instructorName"
                            value={formData.instructorName}
                            onChange={handleChange}
                            options={INSTRUCTORS.map(i => ({ label: i, value: i }))}
                            className="text-lg py-3"
                        />
                    </div>
                );
            case 'session':
                return (
                    <div className="space-y-6">
                        <Select
                            label="Tipo de Sesión"
                            name="sessionType"
                            value={formData.sessionType}
                            onChange={handleChange}
                            options={SESSION_TYPES.map(s => ({ label: s, value: s }))}
                            className="text-lg py-3"
                        />
                        <Input
                            label="Número de Sesión"
                            name="sessionNumber"
                            type="number"
                            value={formData.sessionNumber}
                            onChange={handleChange}
                            placeholder="1"
                            className="text-lg py-6"
                        />
                    </div>
                );
            case 'grade':
                return (
                    <div className="space-y-4">
                        <Input
                            label="Calificación / Nota"
                            name="grade"
                            value={formData.grade}
                            onChange={handleChange}
                            placeholder="0-10 o APTO"
                            className="text-lg py-6 font-mono"
                            autoFocus
                        />
                        {(!isNaN(parseFloat(formData.grade)) && parseFloat(formData.grade) < 5) && (
                            <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-center font-bold">
                                NO APTO
                            </div>
                        )}
                    </div>
                );
            case 'date':
                return (
                    <div className="space-y-4">
                        <Input
                            label="Fecha del Vuelo"
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="text-lg py-6"
                        />
                    </div>
                );
            case 'aircraft':
                return (
                    <div className="space-y-6">
                        <Select
                            label="Tipo de Vuelo"
                            name="flightType"
                            value={formData.flightType}
                            onChange={handleChange}
                            options={FLIGHT_TYPES.map(f => ({ label: f, value: f }))}
                            className="text-lg py-3"
                        />
                        {formData.flightType === 'Real' ? (
                            <Select
                                label="Matrícula"
                                name="aircraftReg"
                                value={formData.aircraftReg}
                                onChange={handleChange}
                                options={AIRCRAFT_REGISTRATIONS.map(r => ({ label: r, value: r }))}
                                className="text-lg py-3"
                            />
                        ) : (
                            <Input
                                label="ID Simulador"
                                name="aircraftReg"
                                value={formData.aircraftReg}
                                onChange={handleChange}
                                className="text-lg py-6"
                            />
                        )}
                    </div>
                );
            case 'route':
                return (
                    <div className="space-y-6">
                        <Input
                            label="Lugar de Salida"
                            name="depPlace"
                            value={formData.depPlace}
                            onChange={handleChange}
                            placeholder="Ej. GCXO"
                            list="airport-codes"
                            className="text-lg py-6 uppercase"
                        />
                        <Input
                            label="Lugar de Llegada"
                            name="arrPlace"
                            value={formData.arrPlace}
                            onChange={handleChange}
                            placeholder="Ej. GCLP"
                            list="airport-codes"
                            className="text-lg py-6 uppercase"
                        />
                    </div>
                );
            case 'time':
                return (
                    <div className="space-y-4">
                        <Input
                            label="Tiempo Total (Horas)"
                            type="number"
                            step="0.1"
                            name="totalHours"
                            value={formData.totalHours}
                            onChange={handleChange}
                            placeholder="1.5"
                            className="text-4xl py-8 font-mono text-center tracking-wider"
                            autoFocus
                        />
                    </div>
                );
            case 'approaches':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-[1fr_100px] gap-4">
                            <Select
                                label="Tipo Aprox."
                                name="approachType"
                                value={formData.approachType}
                                onChange={handleChange}
                                options={[
                                    { label: 'ILS', value: 'ILS' },
                                    { label: 'VOR', value: 'VOR' },
                                    { label: 'NDB', value: 'NDB' },
                                    { label: 'RNP', value: 'RNP' },
                                    { label: 'LOC', value: 'LOC' },
                                    { label: 'PAR', value: 'PAR' },
                                    { label: 'TACAN', value: 'TACAN' },
                                ]}
                                className="text-lg py-3"
                            />
                            <Input
                                label="Cantidad"
                                type="number"
                                name="approachesCount"
                                value={formData.approachesCount || ''}
                                onChange={handleChange}
                                className="text-lg py-6 text-center"
                            />
                        </div>
                        <Input
                            label="Lugar (Opcional)"
                            name="approachPlace"
                            value={formData.approachPlace}
                            onChange={handleChange}
                            list="airport-codes"
                            className="text-lg py-6 uppercase"
                        />
                    </div>
                );
            case 'details':
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Procedimientos</label>
                            <textarea
                                name="procedures"
                                className="flex min-h-[100px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-blue-800"
                                value={formData.procedures}
                                onChange={handleChange}
                                placeholder="Detalles de ejercicios..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Observaciones</label>
                            <textarea
                                name="remarks"
                                className="flex min-h-[100px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-blue-800"
                                value={formData.remarks}
                                onChange={handleChange}
                                placeholder="Comentarios del instructor..."
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-md mx-auto h-[calc(100vh-140px)] flex flex-col">
            {/* DATALIST FOR AIRPORTS */}
            <datalist id="airport-codes">
                {AIRPORT_CODES.map(code => (
                    <option key={code} value={code} />
                ))}
            </datalist>
            {/* Header / Progress */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-xl font-bold">{steps[currentStep].title}</h1>
                    <span className="text-xs text-zinc-500 font-medium">
                        Paso {currentStep + 1} de {steps.length}
                    </span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Content Area - Flex Grow to fill space */}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
                <Card className="border-0 shadow-none sm:border sm:shadow-sm">
                    <CardContent className="p-0 sm:p-6">
                        {renderStepContent()}
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-6 flex gap-3 pb-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={isFirstStep}
                    className="flex-1 h-12 text-base"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
                </Button>

                {isLastStep ? (
                    <Button
                        onClick={handleSubmit}
                        className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700"
                        isLoading={loading}
                    >
                        <Save className="mr-2 h-4 w-4" /> Guardar
                    </Button>
                ) : (
                    <Button
                        onClick={nextStep}
                        className="flex-1 h-12 text-base"
                    >
                        Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
