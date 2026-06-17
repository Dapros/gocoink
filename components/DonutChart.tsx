import React, { useEffect, useRef } from 'react'
import { View, Text, Animated } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { COLORS } from '@/constants/theme'

interface DonutChartProps {
  income: number | string 
  expenses: number | string
}

// de SVG normal a un componente capaz de recibir animacion
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export const DonutChart = ({ income, expenses }: DonutChartProps) => {
  const safeIncome = Number(income) || 0
  const safeExpenses = Number(expenses) || 0
  const remaining = safeIncome - safeExpenses
  
  // Cálculo exacto del porcentaje
  const spentPercentage = safeIncome > 0 ? (safeExpenses / safeIncome) * 100 : (safeExpenses > 0 ? 100 : 0)

  // Lógica dinámica de colores
  const getDynamicColor = () => {
    if (spentPercentage < 50) return COLORS.primary // Hasta 49% = Verde
    if (spentPercentage < 80) return '#F59E0B' // 50% a 79% = Amarillo
    return COLORS.danger// 80% o más = Rojo
  }

  const activeColor = getDynamicColor()

  const size = 220
  const strokeWidth = 25
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  const visualPercentage = Math.min(spentPercentage, 100)

  const targetDashoffset = circumference - (visualPercentage / 100) * circumference
  const animatedOffset = useRef(new Animated.Value(circumference)).current

  useEffect(() => {
    Animated.timing(animatedOffset, {
      toValue: targetDashoffset,
      duration: 800, 
      useNativeDriver: false, 
    }).start()
  }, [targetDashoffset])

  return (
    <View style={{ alignItems: 'center', marginVertical: 15 }}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '180deg' }] }}>
          {/* Círculo de fondo */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLORS.surfaceLight}
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Círculo Animado */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={activeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset} 
            strokeLinecap="round"
          />
        </Svg>

        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
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