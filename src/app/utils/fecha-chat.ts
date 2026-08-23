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

// Abreviaturas fijas en vez de Intl: el formato pedido ("mar 12, ago") no es un patron estandar
// de Intl, y las abreviaturas que devuelve varian segun el ICU del navegador (con punto o sin).
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Clave de agrupacion por dia (YYYY-MM-DD). Se arma con las partes locales, no con toISOString:
// en UTC un mensaje de la noche caeria en el dia siguiente y se separaria mal.
export function claveDia(iso: string | null | undefined): string {
  const fecha = aFecha(iso);
  if (!fecha) return '';

  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

// Etiqueta del separador de dia dentro del chat, al estilo WhatsApp: "mar 12, ago".
export function formatearDiaSeparador(iso: string | null | undefined): string {
  const fecha = aFecha(iso);
  if (!fecha) return '';

  return `${DIAS[fecha.getDay()]} ${fecha.getDate()}, ${MESES[fecha.getMonth()]}`;
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
