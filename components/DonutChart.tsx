import React from 'react'
import { View, Text } from 'react-native'
import { PolarChart, Pie } from 'victory-native'
import { COLORS } from '@/constants/theme'

interface DonutChartProps {
  income: number
  expenses: number
}

type ChartData = {
  value: number
  color: string
}

export const DonutChart = ({ income, expenses }: DonutChartProps) => {
  const remaining = income - expenses

  // Porcentaje de gasto
  let spentPercentage = 0
  if (income > 0) {
    spentPercentage = (expenses / income) * 100
  } else if (expenses > 0) {
    spentPercentage = 100
  }

  // Colores dinamicos
  const getDynamicColor = () => {
    if (spentPercentage < 65) return COLORS.primary
    if (spentPercentage < 90) return '#F59E0B'
    return COLORS.danger
  }

  const activeColor = getDynamicColor()

  const pieData: ChartData[] = (() => {
    if (income === 0 && expenses === 0) {
      return [{ value: 1, color: COLORS.surfaceLight }]
    } 
    if (expenses >= income) {
      return [{ value: 1, color: activeColor }]
    } 
    if (expenses === 0) {
      return [{ value: 1, color: COLORS.surfaceLight }]
    } 
    
    return [
      { value: expenses, color: activeColor },
      { value: remaining > 0 ? remaining : 0, color: COLORS.surfaceLight }
    ]
  })()

  return (
    <View style={{ alignItems: 'center', marginVertical: 15 }}>
      
      {/* Contenedor con tamaño fijo para alinear perfectamente Skia y el Texto */}
      <View style={{ width: 220, height: 220, justifyContent: 'center', alignItems: 'center' }}>
        
        {/* EL MOTOR GRÁFICO SKIA */}
        <PolarChart
          data={pieData}
          colorKey={"color" as keyof ChartData}
          valueKey={"value" as keyof ChartData}
        >
          <Pie.Chart 
            innerRadius={85} 
          />
        </PolarChart>

        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <Text style={{ fontSize: 14, color: COLORS.textMuted }}>has gastado</Text>
          <Text style={{ fontSize: 36, color: COLORS.text, fontWeight: 'bold', marginVertical: 4 }}>
            {spentPercentage.toFixed(0)}%
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textMuted }}>este mes</Text>
        </View>

      </View>

      <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 15, color: COLORS.text, textAlign: 'center', lineHeight: 24 }}>
          De los <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>${income.toLocaleString('es-CO')}</Text> que ingresaste este mes, te quedan{' '}
          <Text style={{ color: activeColor, fontWeight: 'bold' }}>
            ${remaining.toLocaleString('es-CO')}
          </Text>
        </Text>
      </View>

    </View>
  )
}