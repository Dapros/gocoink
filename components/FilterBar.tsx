import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'
import { useFilterStore } from '@/store/useFilterStore'

export const FilterBar = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { activeType, activeTime, activeMethod, setType, setTime, setMethod } = useFilterStore()
  
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
            <FilterButton icon="apps-outline" active={activeType === 'all'} onPress={() => setType('all')} />
            <FilterButton label="Ingresos" active={activeType === 'income'} activeColor={COLORS.primary} onPress={() => setType('income')} />
            <FilterButton label="Gastos" active={activeType === 'expense'} activeColor={COLORS.danger} onPress={() => setType('expense')} />
          </View>

          {/* Fila 2: Tiempo */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <FilterButton label="Día" active={activeTime === 'day'} onPress={() => setTime('day')} />
            <FilterButton label="Mes" active={activeTime === 'month'} onPress={() => setTime('month')} />
            <FilterButton label="Año" active={activeTime === 'year'} onPress={() => setTime('year')} />
          </View>

          {/* Fila 3: Método */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <FilterButton icon="apps-outline" active={activeMethod === 'all'} onPress={() => setMethod('all')} />
            <FilterButton label="Efectivo" active={activeMethod === 'cash'} onPress={() => setMethod('cash')} />
            <FilterButton label="Banco" active={activeMethod === 'bank'} onPress={() => setMethod('bank')} />
          </View>

        </View>
      )}
    </View>
  )
}

// Sub-componente interno para botones de filtro
const FilterButton = ({ label, icon, active, activeColor = COLORS.surfaceLight, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flex: icon ? 0.25 : 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: active ? (activeColor === COLORS.surfaceLight ? COLORS.border : activeColor) : COLORS.surfaceLight,
      borderWidth: 1,
      borderColor: active ? 'transparent' : COLORS.border,
      minHeight: 42
    }}
  >
    {icon ? (
      <Ionicons name={icon} size={18} color={active ? COLORS.text : COLORS.textMuted} />
    ) : (
      <Text style={{ color: active ? COLORS.text : COLORS.textMuted, fontWeight: '600' }}>{label}</Text>
    )}
  </TouchableOpacity>
)