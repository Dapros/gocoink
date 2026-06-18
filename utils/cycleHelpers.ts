interface DBCycleRow {
  id: number
  cycleMode: 'monthly' | 'biweekly' | 'free'
  baseSalary: number
  startDate: string
  endDate: string
}

export const formatCycleTitle = (cycle: DBCycleRow | undefined) => {
  if (!cycle) return { title: 'Sin ciclo activo', start: new Date(), end: new Date() }

  const start = new Date(cycle.startDate)
  const end = new Date(cycle.endDate)
  
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
  const startStr = start.toLocaleDateString('es-CO', options)
  const endStr = end.toLocaleDateString('es-CO', options)

  let title = ''
  if (cycle.cycleMode === 'monthly' && start.getDate() === 1) {
    title = `Corte de ${start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`
  } else if (cycle.cycleMode === 'free') {
    title = `Mes de ${start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`
  } else {
    title = `Corte del ${startStr} al ${endStr}`
  }

  return {
    title,
    start,
    end
  }
}