import { RoutineConfig } from './types';

export const DEFAULT_ROUTINE: RoutineConfig = {
    1: { // LUNES
        title: "Pecho + Tríceps + Bíceps",
        exercises: [
            { id: "pecho_press_plano", name: "Press Plano Mancuernas", notes: "4 series de 6-8 reps. Reemplaza Barra.", sets: 4, rephs: "6-8" },
            { id: "pecho_press_inclinado", name: "Press Inclinado Mancuernas", notes: "3 series de 6-8 reps. Pecho superior.", sets: 3, rephs: "6-8" },
            { id: "pecho_aperturas", name: "Aperturas (Flyes) Plano", notes: "3 series de 8-10 reps. No bajar a 6.", sets: 3, rephs: "8-10" },
            { id: "triceps_press_frances", name: "Press Francés Mancuernas", notes: "3 series de 6-8 reps. Acostado, codos cerrados.", sets: 3, rephs: "6-8" },
            { id: "triceps_copa", name: "Copa a Dos Manos Sentado", notes: "3 series de 6-8 reps. Espalda apoyada.", sets: 3, rephs: "6-8" },
            { id: "biceps_curl_sentado", name: "Curl Bíceps Sentado", notes: "3 series de 6-8 reps. Sin balanceo.", sets: 3, rephs: "6-8" },
            { id: "biceps_martillo", name: "Curl Martillo", notes: "3 series de 6-8 reps. Braquial y antebrazo.", sets: 3, rephs: "6-8" }
        ]
    },
    3: { // MIÉRCOLES
        title: "Piernas (Protección Columna)",
        exercises: [
            { id: "piernas_sillon_cuad", name: "Sillón de Cuádriceps", notes: "4 series de 8 reps. Aguantá 1s arriba.", sets: 4, rephs: "8" },
            { id: "piernas_prensa_45", name: "Prensa Inclinada 45°", notes: "4 series de 6-8 reps. Pesado.", sets: 4, rephs: "6-8" },
            { id: "piernas_sillon_isquio", name: "Sillón Isquiotibiales", notes: "4 series de 6-8 reps.", sets: 4, rephs: "6-8" },
            { id: "piernas_gemelos", name: "Gemelos en Prensa", notes: "4 series de 10 reps. Mucho peso.", sets: 4, rephs: "10" }
        ]
    },
    5: { // VIERNES
        title: "Espalda + Hombros (Posterior)",
        exercises: [
            { id: "espalda_jalon", name: "Jalón al Pecho", notes: "4 series de 6-8 reps (120kg aprox).", sets: 4, rephs: "6-8" },
            { id: "espalda_serrucho", name: "Remo Serrucho", notes: "4 series de 6-8 reps. Espalda neutra.", sets: 4, rephs: "6-8" },
            { id: "hombros_militar", name: "Press Militar SENTADO", notes: "4 series de 6-8 reps. Respaldo obligatorio.", sets: 4, rephs: "6-8" },
            { id: "hombros_vuelos_lat", name: "Vuelos Laterales", notes: "4 series de 8 reps estrictas.", sets: 4, rephs: "8" },
            { id: "hombros_vuelos_post", name: "Vuelos Posteriores (Pájaros)", notes: "3 series de 8-10 reps. Pecho apoyado 45°.", sets: 3, rephs: "8-10" }
        ]
    }
};
