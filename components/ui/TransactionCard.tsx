import React from "react"
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/theme"
import { Transaction } from "@/types"

interface TransactionCardProps {
  transaction: Transaction
  categoryName: string
  categoryIcon: keyof typeof Ionicons.glyphMap
  onLongPress?: () => void
}

export const TransactionCard = ({
  transaction,
  categoryName,
  categoryIcon,
  onLongPress
}: TransactionCardProps) => {
  const isIncome = transaction.type === 'income'
  const typeText = isIncome ? 'Ingreso' : 'Gasto'
  const typeColor = isIncome ? COLORS.primary : COLORS.danger

  // Icono del metodo de pago
  const methodIcon = transaction.paymentMethod === 'efectivo' ? 'cash-outline' : 'card-outline'

  // Formato de fecha <-- luego pasar a  un utility
  const dateObj = new Date(transaction.date)
  const formattedDate = dateObj.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={onLongPress}
      style={{
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      {/* 1. Header  */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: typeColor, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {typeText}
        </Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 12, marginLeft: 8 }}>
          • {formattedDate}
        </Text>
      </View>

      {/* 2 el body con la descripcion con truncate con 2 lineas */}
      <Text
        numberOfLines={2}
        style={{
          color: COLORS.text,
          fontSize: 16,
          fontWeight: '500',
          marginBottom: 16,
          lineHeight: 22
        }}
      >
        {transaction.description}
      </Text>

      {/* 2. el mini footer con el metodo, monto y categoria */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Izquierda metodo de pago y monto */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            backgroundColor: COLORS.surfaceLight, 
            padding: 6, 
            borderRadius: 8, 
            marginRight: 8
          }}>
            <Ionicons name={methodIcon} size={16} color={COLORS.textMuted} />
          </View>
          <Text style={{ color: typeColor, fontWeight: 'bold', fontSize: 16 }}>
            {isIncome ? '+' : '-'} ${transaction.amount.toLocaleString('es-CO')}
          </Text>
        </View>

        {/* Derecha la categoria */}
        <View style={{
          flexDirection: 'row', 
          alignItems: 'center',
          backgroundColor: COLORS.background, // Un fondo más oscuro para que resalte
          paddingHorizontal: 8,
          paddingVertical: 6,
          borderRadius: 8,
        }}>
          <Ionicons name={categoryIcon} size={14} color={COLORS.textMuted} />
          <Text style={{ color: COLORS.textMuted, fontSize: 12, marginLeft: 4, fontWeight: '600' }}>
            {categoryName}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}