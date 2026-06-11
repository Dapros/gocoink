import React, { useRef, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { COLORS } from '@/constants/theme'
import { DonutChart } from '@/components/DonutChart'
import { FilterBar } from '@/components/FilterBar'
import { TransactionCard } from '@/components/ui/TransactionCard'
import { Transaction } from '@/types'
import { TransactionFormSheet } from '@/components/TransactionFormSheet'

// MOCKS para UI
const CATEGORY_MAP: Record<number, { name: string; icon: any }> = {
  1: { name: 'Comida', icon: 'fast-food-outline' },
  2: { name: 'Servicios', icon: 'flash-outline' },
  3: { name: 'Trabajo', icon: 'briefcase-outline' },
}

const MOCK_GROUPED_TRANSACTIONS = [
  {
    title: 'Hoy, 10 de Junio',
    data: [
      {
        id: 1,
        amount: 45000,
        type: 'expense',
        categoryId: 1,
        paymentMethod: 'efectivo',
        description: 'Almuerzo corriente en el restaurante de la esquina con los compañeros.',
        date: '2026-06-10T13:30:00.000Z',
      } as Transaction,
      {
        id: 2,
        amount: 2500000,
        type: 'income',
        categoryId: 3,
        paymentMethod: 'banco',
        description: 'Pago quincena adelantado',
        date: '2026-06-10T09:00:00.000Z',
      } as Transaction,
    ]
  },
  {
    title: 'Ayer, 9 de Junio',
    data: [
      {
        id: 3,
        amount: 120000,
        type: 'expense',
        categoryId: 2,
        paymentMethod: 'banco',
        description: 'Pago factura del internet y telefonía móvil de este mes, incluye recargos adicionales que pusieron por error y toca reclamar.',
        date: '2026-06-09T18:45:00.000Z',
      } as Transaction,
    ]
  }
]

export default function HomeScreen() {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const [isActionLocked, setIsActionLocked] = useState(false)

  const [mockIncome] = useState(2500000)
  const [mockExpenses] = useState(165000)

  const handleOpenDrag = useCallback(() => {
    if (isActionLocked) return
    setIsActionLocked(true)

    // Abre el Bottom Sheet usando requestAnimationFrame para no ahogar el hilo
    requestAnimationFrame(() => {
      bottomSheetRef.current?.present()
    })
    
    setTimeout(() => setIsActionLocked(false), 300)
  }, [isActionLocked])

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Grafico y Resumen */}
        <DonutChart income={mockIncome} expenses={mockExpenses} />

        {/* Barra de filtros */}
        <FilterBar />

        {/* LISTA DE CARDS */}
        <View style={{ paddingHorizontal: 15, marginTop: 10 }}>
          {MOCK_GROUPED_TRANSACTIONS.map((group, groupIndex) => (
            <View key={groupIndex} style={{ marginBottom: 20 }}>
              <Text style={{ 
                color: COLORS.textMuted, fontSize: 14, fontWeight: '600', marginBottom: 12, marginLeft: 4
              }}>
                {group.title}
              </Text>

              {group.data.map((transaction) => {
                const category = CATEGORY_MAP[transaction.categoryId];
                return (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    categoryName={category.name}
                    categoryIcon={category.icon}
                    onLongPress={() => {
                      console.log('Dejó presionada la card (Inicio de tu lógica):', transaction.id)
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleOpenDrag}
        disabled={isActionLocked}
        style={{
          position: 'absolute', bottom: 15, right: 15,
          backgroundColor: COLORS.primary, width: 64, height: 64,
          borderRadius: 32, alignItems: 'center', justifyContent: 'center',
          elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3, shadowRadius: 4,
          opacity: isActionLocked ? 0.7 : 1
        }}
      >
        <Ionicons name="add" size={32} color={COLORS.text} />
      </TouchableOpacity>

      {/* Formulario Drag */}
      <TransactionFormSheet 
        ref={bottomSheetRef}
        onClose={() => bottomSheetRef.current?.dismiss()}
        onSave={(data) => {
          console.log('NUEVO REGISTRO GUARDADO:', data)
          bottomSheetRef.current?.dismiss()
        }}
      />      
    </View>
  )
}