 export function formatUbicacion(displayName: string) {
    const split = displayName.split(',')
    return `${split[1]} ${split[0]}`
  }