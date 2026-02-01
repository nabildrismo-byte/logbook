import { FlightLog, LogbookStats } from '../types';
import { GOOGLE_SCRIPT_URL } from '../lib/constants';

const STORAGE_KEY = 'heli_flight_log_v2'; // Bump version for safety

export const storageService = {
    getLogs: (): FlightLog[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading logs', error);
            return [];
        }
    },

    saveLog: (log: FlightLog): void => {
        const logs = storageService.getLogs();
        const existingIndex = logs.findIndex(l => l.id === log.id);
        if (existingIndex >= 0) {
            logs[existingIndex] = log;
        } else {
            logs.unshift(log);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    },

    deleteLog: (id: string): void => {
        const logs = storageService.getLogs();
        const newLogs = logs.filter(l => l.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
    },

    validateFlight: async (id: string, status: 'validated' | 'rejected', feedback?: string): Promise<void> => {
        const logs = storageService.getLogs();
        const existingIndex = logs.findIndex(l => l.id === id);

        if (existingIndex >= 0) {
            // 1. Update Local
            const log = logs[existingIndex];
            log.validationStatus = status;
            if (feedback) {
                log.studentFeedback = feedback;
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

            // 2. Send to Cloud (Fire and Forget)
            try {
                const SCRIPT_URL = GOOGLE_SCRIPT_URL;

                // Composite ID to be robust against fresh syncs
                const compositeId = `${log.date}|${log.studentName}|${log.session}`;

                const formData = new FormData();
                formData.append('action', 'validate');
                formData.append('flightId', compositeId);
                formData.append('status', status);
                if (feedback) formData.append('feedback', feedback);

                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors' // Simple mode
                });
            } catch (e) {
                console.error('Error sending validation to cloud:', e);
            }
        }
    },

    clearLogs: (): void => {
        localStorage.removeItem(STORAGE_KEY);
    },

    getStats: (): LogbookStats => {
        const logs = storageService.getLogs();
        return logs.reduce((acc, log) => {
            // ONLY COUNT VALIDATED FLIGHTS
            if (log.validationStatus !== 'validated') return acc;

            const time = log.totalTime || 0;
            acc.totalHours += time;

            if (log.flightType === 'Real') {
                acc.realHours += time;
            } else if (log.flightType === 'Simulador') {
                acc.simHours += time;
                acc.simTrainerTotalHours += time;
            } else if (log.flightType === 'Entrenador') {
                acc.trainerHours += time;
                acc.simTrainerTotalHours += time;
            }

            return acc;
        }, {
            totalHours: 0,
            realHours: 0,
            simHours: 0,
            trainerHours: 0,
            simTrainerTotalHours: 0
        });
    },

    syncWithCloud: async (): Promise<boolean> => {
        try {
            // Replace with the user's current URL
            const SCRIPT_URL = GOOGLE_SCRIPT_URL;

            // 1. Fetch Flights
            const responseFlights = await fetch(SCRIPT_URL + '?table=flights');
            const jsonFlights = await responseFlights.json();

            // 2. Fetch Validations
            let validations: any[] = [];
            try {
                const responseValidations = await fetch(SCRIPT_URL + '?table=validations');
                validations = await responseValidations.json();
            } catch (e) {
                console.warn('Could not fetch validations (maybe sheet missing)', e);
            }

            if (!Array.isArray(jsonFlights)) {
                console.error('Invalid data format from cloud', jsonFlights);
                return false;
            }

            // Create a Map for validations for O(1) lookup
            // Key: date|student|session -> { status, feedback }
            const validationMap = new Map();
            if (Array.isArray(validations)) {
                validations.forEach(v => {
                    const key = v['ID_VUELO'];
                    // If overwrite logic needed, we could sort by timestamp. 
                    // Using the latest one encountered (or we could sort validations array first)
                    validationMap.set(key, { status: v['ESTADO'], feedback: v['FEEDBACK'] });
                });
            }

            const cloudLogs: FlightLog[] = jsonFlights.map((row: any) => {
                // Parse Date (Handle ISO string from Sheets 'Date' object OR 'DD/MM/YYYY' string)
                let isoDate = '';
                const rawDate = row['FECHA'];

                if (rawDate) {
                    if (typeof rawDate === 'string' && rawDate.includes('/')) {
                        // DD/MM/YYYY format
                        const [d, m, y] = rawDate.split('/');
                        isoDate = `${y}-${m}-${d}`;
                    } else if (typeof rawDate === 'string') {
                        // Try parsing formatted ISO string or other string format
                        try {
                            const dateObj = new Date(rawDate);
                            if (!isNaN(dateObj.getTime())) {
                                isoDate = dateObj.toISOString().split('T')[0];
                            }
                        } catch (e) { console.error('Date parse error', e) }
                    }
                }

                // Parse Flight Type
                let fType: any = 'Real';
                const rSim = row['REAL / SIM'] || 'R';
                if (rSim === 'S') fType = 'Simulador';
                if (rSim === 'E') fType = 'Entrenador';

                // Parse Time (Hours -> Minutes)
                const totalHours = parseFloat(row['TIEMPO'] || '0');
                const totalMinutes = Math.round(totalHours * 60);

                // Parse Approaches String: "1x ILS @ LECV, 2x VOR @ LEBA"
                const approaches = [];
                const apprString = row['MANIOBRAS'] || '';
                if (apprString) {
                    const parts = apprString.split(','); // Split by comma
                    for (const p of parts) {
                        const match = p.trim().match(/(\d+)x\s(\w+)\s@\s(\w+)/);
                        if (match) {
                            approaches.push({
                                count: parseInt(match[1]),
                                type: match[2],
                                place: match[3]
                            });
                        }
                    }
                }

                // Construct ID for validation matching
                const compositeId = `${isoDate}|${row['ALUMNO'] || ''}|${row['SESIÓN'] || ''}`;

                // Check if we have a cloud validation
                const cloudVal = validationMap.get(compositeId);

                // Also check local storage to see if we have a NEWER local validation pending sync?
                // For now, let's trust Cloud if it exists, otherwise keep local? 
                // Actually, if we just synced, Cloud is truth.
                // But wait, if I just validated locally and haven't synced yet, I want to keep it?
                // No, user specifically asked to fix sync overwrite. 
                // Using Cloud Validations is the robust way.

                // Fallback: If no cloud validation, check if we have an existing local one that we want to keep?
                // The previous fix was "preserve local". 
                // Now that we have cloud sync, "Cloud wins" is safer IF the cloud has data.

                const existingLog = storageService.getLogs().find(l =>
                    l.date === isoDate &&
                    l.studentName === (row['ALUMNO'] || '') &&
                    l.session === (row['SESIÓN'] || '')
                );

                return {
                    id: existingLog?.id || Math.random().toString(36).substring(2, 9), // Keep ID if exists
                    date: isoDate,
                    instructorId: 'imported',
                    instructorName: row['INSTRUCTOR'] || '',
                    studentName: row['ALUMNO'] || '',
                    flightType: fType,
                    session: row['SESIÓN'] || '',
                    grade: String(row['PUNTUACIÓN'] || ''), // Force String to avoid .toUpperCase() crash on numbers
                    aircraft: {
                        registration: row['MATRÍCULA'] || '',
                        type: 'Heli'
                    },
                    departure: {
                        place: row['LUGAR SALIDA'] || 'LECV'
                    },
                    arrival: {
                        place: row['LUGAR LLEGADA'] || 'LECV'
                    },
                    totalTime: totalMinutes,
                    pilotFunction: {
                        instructor: totalMinutes // Assume instructor time for now
                    },
                    conditions: {},
                    approaches: approaches,
                    procedures: row['PROCEDIMIENTOS'] || '',
                    remarks: row['OBSERVACIONES'] || '',
                    // Validation Logic: Cloud is source of truth. If missing in cloud, it means it is pending.
                    validationStatus: cloudVal?.status,
                    studentFeedback: cloudVal?.feedback
                } as FlightLog;
            });

            // Filter out invalid logs (e.g. invalid dates)
            const validLogs = cloudLogs.filter(l => l.date && !l.date.includes('undefined'));

            // Always update
            localStorage.setItem(STORAGE_KEY, JSON.stringify(validLogs));
            return true;

        } catch (error) {
            console.error('Sync error:', error);
            return false;
        }
    }
};
