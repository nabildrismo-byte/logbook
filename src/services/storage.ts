import { FlightLog, LogbookStats } from '../types';

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

    clearLogs: (): void => {
        localStorage.removeItem(STORAGE_KEY);
    },

    getStats: (): LogbookStats => {
        const logs = storageService.getLogs();
        return logs.reduce((acc, log) => {
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
            const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyYL5059jqxE6ShBGzhzLI_Cam3j96CV5yaUHCjjogkJSWbXNuOXO9GJZgZll9JXybQ/exec';

            const response = await fetch(SCRIPT_URL);
            const json = await response.json();

            if (json.result !== 'success' || !Array.isArray(json.data)) {
                console.error('Invalid data format from cloud', json);
                return false;
            }

            const cloudLogs: FlightLog[] = json.data.map((row: any) => {
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

                return {
                    id: Math.random().toString(36).substring(2, 9), // Generate new ID as we don't sync IDs yet
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
                    remarks: row['OBSERVACIONES'] || ''
                } as FlightLog;
            });

            // Filter out invalid logs (e.g. invalid dates)
            const validLogs = cloudLogs.filter(l => l.date && !l.date.includes('undefined'));

            // Always update, even if empty (to allow clearing data)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(validLogs));
            return true;

        } catch (error) {
            console.error('Sync error:', error);
            return false;
        }
    }
};
