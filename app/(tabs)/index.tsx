import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { Ionicons } from '@expo/vector-icons'
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

export default function HomeScreen() {
  // estados para sheet, modal dragg
  const { openCreate, openDetails, refreshKey, loadCatalogs } = useSheetStore()
  // estados de los filtros
  const { activeType, activeTime, activeMethod } = useFilterStore()
  // sueldo base y el modo del usuario
  const { baseSalary, cycleMode } = useSettingsStore()
  
  const [rawTransactions, setRawTransactions] = useState<DBTransactionRow[]>([])

  const fetchTransactions = async () => {
    try {
      const rawData = await DatabaseService.getAllTransactions()
      setRawTransactions(rawData)
    } catch (error) {
      console.error("Error al cargar SQLite:", error)
    }
  }

  useEffect(() => {
    loadCatalogs()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [refreshKey])

  const { groupedTransactions, totalBudget, totalExpenses } = useMemo(() => {
    // Filtrado y agrupado usando el helper
    const filteredAndGrouped = processTransactions(rawTransactions, {
      type: activeType,
      time: activeTime,
      method: activeMethod
    })

    let incomeSum = 0
    let expenseSum = 0
    rawTransactions.forEach(tx => {
      if (tx.type === 'income') {
        incomeSum += tx.amount
      } else {
        expenseSum += tx.amount
      }
    })

    const currentBudget = baseSalary + incomeSum

    return {
      groupedTransactions: filteredAndGrouped,
      totalBudget: currentBudget,
      totalExpenses: expenseSum
    }
  }, [rawTransactions, activeType, activeTime, activeMethod, baseSalary])

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

        {/* LISTA DE CARDS */}
        <View style={{ paddingHorizontal: 15, marginTop: 10 }}>
          {groupedTransactions.map((group) => (
            <View key={group.dateKey} style={{ marginBottom: 24 }}>
              
              {/* HEADER PERSONALIZADO DE LA FECHA */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 4, flexWrap: 'wrap', gap: 8 }}>
                
                {/* 1. Fecha completa */}
                <Text style={{ color: COLORS.textMuted, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }}>
                  {group.dateFormatted}
                </Text>

                {/* 2. Etiqueta (Pill) del día de la semana */}
                <View style={{ 
                  borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, 
                  paddingHorizontal: 8, paddingVertical: 2 
                }}>
                  <Text style={{ color: COLORS.textMuted, fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {group.dayOfWeek}
                  </Text>
                </View>

                {/* 3. Etiqueta (Pill) extra si es HOY */}
                {group.isToday && (
                  <View style={{ 
                    borderWidth: 1, borderColor: COLORS.primary, borderRadius: 12, 
                    paddingHorizontal: 8, paddingVertical: 2, backgroundColor: COLORS.surfaceLight 
                  }}>
                    <Text style={{ color: COLORS.primary, fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' }}>
                      HOY
                    </Text>
                  </View>
                )}
              </View>

              {/* RENDER DE CARDS */}
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
              No hay movimientos registrados.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openCreate}
        style={{
          position: 'absolute', bottom: 15, right: 15,
          backgroundColor: COLORS.primary, width: 64, height: 64,
          borderRadius: 32, alignItems: 'center', justifyContent: 'center',
          elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3, shadowRadius: 4
        }}
      >
        <Ionicons name="add" size={32} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  )
}