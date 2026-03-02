export function getLocalISODate(date: Date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60000));
    return localDate.toISOString().split('T')[0];
}

export function getStorageKey(date: Date) {
    return `gym_log_${getLocalISODate(date)}`;
}

export function getDayName(dayIndex: number) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[dayIndex];
}
