import React from 'react'
import { View, Text } from 'react-native'
import { PieChartPro } from 'react-native-gifted-charts'
import { COLORS } from '@/constants/theme'

interface DonutChartProps {
  income: number
  expenses: number
}

export const DonutChart = ({ income, expenses }: DonutChartProps) => {
  const remaining = income - expenses
  const spentPercentage = income > 0 ? (expenses / income) * 100 : 0
  
  // Si gasto mas de lo que ingreso, el restante se vuelve rojo
  const remainingColor = remaining >= 0 ? COLORS.primary : COLORS.danger

  const pieData = [
    {
      value: expenses,
      color: COLORS.danger,
      startEdgeRadius: 10,
      endEdgeRadius: 10,
    },
    {
      value: remaining > 0 ? remaining : 0,
      color: COLORS.surfaceLight
    }
  ]

  return (
    <View style={{ alignItems: 'center', marginVertical: 15 }}>
      <PieChartPro
        donut
        innerRadius={85}
        radius={110}
        data={pieData}
        centerLabelComponent={() => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, color: COLORS.textMuted }}>has gastado</Text>
            <Text style={{ fontSize: 36, color: COLORS.text, fontWeight: 'bold', marginVertical: 4 }}>
              {spentPercentage.toFixed(0)}%
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textMuted }}>este mes</Text>
          </View>
        )}
      />

      {/* Texto de resumen inferior */}
      <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 15, color: COLORS.text, textAlign: 'center', lineHeight: 24 }}>
          De los <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>${income.toLocaleString('es-CO')}</Text> que ingresaste este mes, te quedan <Text style={{ color: remainingColor, fontWeight: 'bold' }}>${remaining.toLocaleString('es-CO')}</Text>
        </Text>
      </View>
    </View>
  )
}