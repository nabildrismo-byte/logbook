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
    }
};
