import React, { useState, useEffect, useMemo } from 'react'
import { View, Text } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { COLORS } from '@/constants/theme'
import { DonutChart } from '@/components/DonutChart'
import { FilterBar } from '@/components/FilterBar'
import { TransactionCard } from '@/components/ui/TransactionCard'
import { DBTransactionRow } from '@/types'
import { useSheetStore } from '@/store/useSheetStore'
import { useFilterStore } from '@/store/useFilterStore'
import { DatabaseService } from '@/services/database'
import { processTransactions } from '@/utils/dateHelpers'
import { useSettingsStore } from '@/store/useSettingsStore'
import { formatCycleTitle } from '@/utils/cycleHelpers'
import { CycleNavigator } from '@/components/CycleNavigator'
import { Button } from '@/components/ui/Button'

export default function HomeScreen() {
  // estados para sheet, modal dragg
  const { openCreate, openDetails, refreshKey, loadCatalogs } = useSheetStore()
  // estados de los filtros
  const { activeType, activeTime, activeMethod } = useFilterStore()
  // sueldo base y el modo del usuario
  const { cycles, currentDb } = useSettingsStore()

  const [rawTransactions, setRawTransactions] = useState<DBTransactionRow[]>([])
  const [cycleOffset, setCycleOffset] = useState(0)

  const fetchTransactions = async () => {
    // FIX CRÍTICO: Si no hay perfil activo (App Vacia en Onboarding), abortamos la búsqueda
    if (!currentDb || currentDb === '') return 

    try {
      const rawData = await DatabaseService.getAllTransactions()
      setRawTransactions(rawData)
    } catch (error) {
      console.error("Error al cargar SQLite:", error)
    }
  }

  useEffect(() => {
    // FIX CRÍTICO: Solo se carga los catálogos si ya existe un perfil confirmado
    if (currentDb && currentDb !== '') {
      loadCatalogs()
    }
  }, [currentDb])

  useEffect(() => {
    // FIX CRÍTICO: Bloqueo la ejecución fantasma
    if (!currentDb || currentDb === '') return 
    
    setRawTransactions([])
    setCycleOffset(0)      
    fetchTransactions()
  }, [currentDb, refreshKey])

  // Límites del viaje en el tiempo controlados por la longitud del array
  const canGoBack = cycleOffset < cycles.length - 1

  const { groupedTransactions, totalBudget, totalExpenses, cycleTitle, isCurrentCycle } = useMemo(() => {
    // ciclo correspondiente según el puntero del navegador
    const currentCycleData = cycles[cycleOffset]

    // Si se cambia de perfil y la data de ciclos de Zustand aún está cargando, evitamos cálculos erróneos
    if (!currentCycleData) {
      return {
        groupedTransactions: [],
        totalBudget: 0,
        totalExpenses: 0,
        cycleTitle: 'Cargando perfil...',
        isCurrentCycle: true
      }
    }
    
    // Formateo de las fechas y título reales del registro
    const cycleInfo = formatCycleTitle(currentCycleData)
    
    // Filtrado estricto: Solo transacciones nacidas entre los límites grabados en este ciclo específico
    const currentCycleTransactions = rawTransactions.filter(tx => {
      const txDate = new Date(tx.date)
      return txDate >= cycleInfo.start && txDate < cycleInfo.end
    })

    const filteredAndGrouped = processTransactions(currentCycleTransactions, {
      type: activeType,
      time: activeTime,
      method: activeMethod
    })

    let incomeSum = 0
    let expenseSum = 0
    currentCycleTransactions.forEach(tx => {
      if (tx.type === 'income') {
        incomeSum += tx.amount
      } else {
        expenseSum += tx.amount
      }
    })

    // se calcula usando el salario base histórico que guardó este ciclo
    const historicalBaseSalary = currentCycleData ? currentCycleData.baseSalary : 0
    const currentBudget = historicalBaseSalary + incomeSum

    return {
      groupedTransactions: filteredAndGrouped,
      totalBudget: currentBudget,
      totalExpenses: expenseSum,
      cycleTitle: cycleInfo.title,
      isCurrentCycle: cycleOffset === 0
    }
  }, [rawTransactions, activeType, activeTime, activeMethod, cycles, cycleOffset])
  
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Grafico y Resumen */}
        <DonutChart 
          income={totalBudget} 
          expenses={totalExpenses} 
        />

        {/* Barra de filtros */}
        <FilterBar />

        {/* Navegacion del tiempo */}
        <CycleNavigator 
          title={cycleTitle}
          isCurrent={isCurrentCycle}
          canGoBack={canGoBack}
          cycleOffset={cycleOffset}
          onPrev={() => setCycleOffset(prev => prev + 1)} // Avanzar en el índice es ir al pasado
          onNext={() => setCycleOffset(prev => prev - 1)} // Retroceder en el índice es volver al presente
        />

        {/* LISTA DE CARDS */}
        <View style={{ paddingHorizontal: 15 }}>
          {groupedTransactions.map((group) => (
            <View key={group.dateKey} style={{ marginBottom: 24 }}>
                
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 4, flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ color: COLORS.textMuted, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }}>
                  {group.dateFormatted}
                </Text>
                <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: COLORS.textMuted, fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {group.dayOfWeek}
                  </Text>
                </View>
                {group.isToday && (
                  <View style={{ borderWidth: 1, borderColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: COLORS.surfaceLight }}>
                    <Text style={{ color: COLORS.primary, fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' }}>
                      HOY
                    </Text>
                  </View>
                )}
              </View>

              {group.data.map((row) => (
                <TransactionCard
                  key={row.id}
                  transaction={row}
                  onLongPress={() => openDetails(row)}
                />
              ))}
            </View>
          ))}

          {groupedTransactions.length === 0 && (
            <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 30 }}>
              No hay movimientos registrados en este corte.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Button 
        variant="fab"
        icon="add"
        onPress={openCreate}
        style={{ position: 'absolute', bottom: 15, right: 15 }}
      />
    </View>
  )
}