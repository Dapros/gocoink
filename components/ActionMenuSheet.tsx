import React, { forwardRef, useMemo } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/theme'
import { Transaction } from '../types'

const CATEGORY_MAP: Record<number, { name: string; icon: any }> = {
  1: { name: 'Comida', icon: 'fast-food-outline' },
  2: { name: 'Servicios', icon: 'flash-outline' },
  3: { name: 'Trabajo', icon: 'briefcase-outline' },
}

interface ActionMenuProps {
  transaction: Transaction | null
  onClose: () => void
  onEdit: (tx: Transaction) => void
  onDelete: (id: number) => void
}

export const ActionMenuSheet = forwardRef<BottomSheetModal, ActionMenuProps>(
  ({ transaction, onClose, onEdit, onDelete }, ref) => {
    
    const snapPoints = useMemo(() => ['50%', '75%'], [])

    if (!transaction) return null

    const isIncome = transaction.type === 'income'
    const typeColor = isIncome ? COLORS.primary : COLORS.danger
    const category = CATEGORY_MAP[transaction.categoryId] || { name: 'General', icon: 'list-outline' }
    const methodIcon = transaction.paymentMethod === 'efectivo' ? 'cash-outline' : 'card-outline'

    const formattedDate = new Date(transaction.date).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

    const handleDeleteClick = () => {
      Alert.alert(
        "Eliminar Registro",
        "¿Confirmas que deseas borrar permanentemente este movimiento?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: () => {
              onDelete(transaction.id!);
              onClose();
          }}
        ],
        { userInterfaceStyle: 'dark' }
      )
    }

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: COLORS.surface }} // Fondo sólido normal
        handleIndicatorStyle={{ backgroundColor: COLORS.border, width: 40 }}
      >
        <BottomSheetScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: typeColor, fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {isIncome ? 'Ingreso' : 'Gasto'}
            </Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 14, marginLeft: 8 }}>
              • {formattedDate}
            </Text>
          </View>

          <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '500', lineHeight: 28, marginBottom: 24 }}>
            {transaction.description}
          </Text>

          <View style={{ backgroundColor: COLORS.surfaceLight, padding: 20, borderRadius: 16, marginBottom: 30 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ backgroundColor: COLORS.surface, padding: 12, borderRadius: 12, marginBottom: 8 }}>
                  <Ionicons name={category.icon} size={28} color={COLORS.textMuted} />
                </View>
                <Text style={{ color: COLORS.textMuted, fontSize: 14, fontWeight: '600' }}>
                  {category.name}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name={methodIcon} size={20} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                  <Text style={{ color: typeColor, fontSize: 28, fontWeight: 'bold' }}>
                    <Ionicons name={isIncome ? 'arrow-up' : 'arrow-down'} size={24} color={typeColor} />
                    ${transaction.amount.toLocaleString('es-CO')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <TouchableOpacity 
              onPress={() => onEdit(transaction)} // Delegamos la coordinación a index.tsx
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: 16, borderRadius: 12 }}
            >
              <Ionicons name="pencil" size={20} color={COLORS.text} style={{ marginRight: 8 }} />
              <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: 'bold' }}>Editar Movimiento</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleDeleteClick}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.danger }}
            >
              <Ionicons name="trash" size={20} color={COLORS.danger} style={{ marginRight: 8 }} />
              <Text style={{ color: COLORS.danger, fontSize: 16, fontWeight: 'bold' }}>Eliminar</Text>
            </TouchableOpacity>
          </View>

        </BottomSheetScrollView>
      </BottomSheetModal>
    )
  }
)