// fechaEnvio llega como ISO 8601 sin zona (LocalDateTime de Java: "2026-07-28T10:15:00").
// new Date() lo interpreta como hora local, que es lo que hay que mostrar.
function aFecha(iso: string | null | undefined): Date | null {
  if (!iso) return null;

  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function dosDigitos(valor: number): string {
  return valor.toString().padStart(2, '0');
}

function esMismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Hora de envio de un mensaje, en formato HH:mm.
export function formatearHora(iso: string | null | undefined): string {
  const fecha = aFecha(iso);
  if (!fecha) return '';

  return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

// Resumen de fecha para el listado: la hora si es de hoy, la fecha si es anterior.
// Devuelve '' si no hay dato, para que el item no muestre "Invalid Date".
export function formatearFechaResumen(iso: string | null | undefined): string {
  const fecha = aFecha(iso);
  if (!fecha) return '';

  if (esMismoDia(fecha, new Date())) {
    return formatearHora(iso);
  }

  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}
