export type FlightRule = 'VFR' | 'IFR' | 'SVFR';
export type PilotFunction = 'PIC' | 'Dual' | 'Instructor';
export type ApproachType = 'ILS' | 'VOR' | 'NDB' | 'RNP' | 'LOC' | 'PAR' | 'TACAN' | 'NMS' | 'SID' | 'STAR';
export type UserRole = 'admin' | 'instructor';
export type FlightType = 'Real' | 'Entrenador' | 'Simulador';

export interface User {
    id: string;
    username: string;
    name: string; // Display Name (e.g. "DRIS")
    role: UserRole;
    password?: string; // In a real app, never store plain text. Here for mock.
}

export interface Aircraft {
    registration: string;
    type: string;
}

export interface FlightLog {
    id: string;
    date: string; // ISO Date

    // v2.0 Fields
    instructorId: string; // User ID of instructor
    instructorName: string; // Snapshot of name

    studentName: string;
    flightType: FlightType;
    session: string; // VBAS-1, etc.
    // Changed to string to support "APTO", "NO APTO" or numbers "9.5"
    grade: string;

    aircraft: Aircraft;

    departure: {
        place: string;
        time: string;
    };
    arrival: {
        place: string;
        time: string;
    };

    totalTime: number; // minutes

    pilotFunction: {
        pic?: number;
        dual?: number;
        instructor?: number;
    };

    conditions: {
        night?: number;
        ifr?: number;
        hood?: number;
    };

    approaches: {
        type: ApproachType;
        count: number;
        place?: string; // Optional place for approach
    }[];

    zone?: string; // Zones 1-5
    procedures?: string; // Free text for procedures

    remarks: string;
}

export interface LogbookStats {
    totalHours: number;
    realHours: number;
    simHours: number;
    trainerHours: number;
    simTrainerTotalHours: number;
}
