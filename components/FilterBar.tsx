import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'

export const FilterBar = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeType, setActiveType] = useState<'all' | 'income' | 'expense'>('all')
  const [activeTime, setActiveTime] = useState<'day' | 'month' | 'year'>('month')
  const [activeMethod, setActiveMethod] = useState<'all' | 'cash' | 'bank'>('all')

  return (
    <View style={{ marginHorizontal: 15, marginBottom: 15 }}>
      {/* Botón Toggle */}
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => setIsExpanded(!isExpanded)}
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
      >
        <Ionicons name="filter" size={20} color={COLORS.textMuted} />
        <Text style={{ color: COLORS.textMuted, fontSize: 16, marginLeft: 8, flex: 1 }}>Filtros</Text>
        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* Panel Expandible */}
      {isExpanded && (
        <View style={{ backgroundColor: COLORS.surface, padding: 15, borderRadius: 16, marginTop: 10, gap: 15 }}>
          
          {/* Fila 1: Ingreso / Gasto */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <FilterButton label="Ingresos" active={activeType === 'income'} activeColor={COLORS.primary} onPress={() => setActiveType('income')} />
            <FilterButton label="Gastos" active={activeType === 'expense'} activeColor={COLORS.danger} onPress={() => setActiveType('expense')} />
          </View>

          {/* Fila 2: Tiempo */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <FilterButton label="Día" active={activeTime === 'day'} onPress={() => setActiveTime('day')} />
            <FilterButton label="Mes" active={activeTime === 'month'} onPress={() => setActiveTime('month')} />
            <FilterButton label="Año" active={activeTime === 'year'} onPress={() => setActiveTime('year')} />
          </View>

          {/* Fila 3: Método */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <FilterButton label="Efectivo" active={activeMethod === 'cash'} onPress={() => setActiveMethod('cash')} />
            <FilterButton label="Banco" active={activeMethod === 'bank'} onPress={() => setActiveMethod('bank')} />
          </View>

        </View>
      )}
    </View>
  )
}

// Sub-componente interno para botones de filtro
const FilterButton = ({ label, active, activeColor = COLORS.surfaceLight, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: active ? (activeColor === COLORS.surfaceLight ? COLORS.border : activeColor) : COLORS.surfaceLight,
      borderWidth: 1,
      borderColor: active ? 'transparent' : COLORS.border,
    }}
  >
    <Text style={{ color: active ? COLORS.text : COLORS.textMuted, fontWeight: '600' }}>{label}</Text>
  </TouchableOpacity>
)