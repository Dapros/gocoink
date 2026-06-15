import React from "react"
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/theme"
import { BottomSheet } from "./ui/BottomSheet"
import { TransactionForm, FormData } from "./ui/TransactionForm"
import { useSheetStore } from "@/store/useSheetStore"
import { DatabaseService } from "@/services/database"

export const GlobalSheet = () => {
  // Traemos el triggerRefresh para avisarle a la app cuando haya cambios
  const { isOpen, mode, selectedTx, setEditMode, closeSheet, triggerRefresh } = useSheetStore()

  // Centralizamos la lógica de guardado
  const handleSave = async (data: FormData) => {
    if (selectedTx) {
      await DatabaseService.updateTransaction(selectedTx.id, data.amount, data.type, data.categoryId, data.paymentMethodId, data.description)
    } else {
      await DatabaseService.insertTransaction(data.amount, data.type, data.categoryId, data.paymentMethodId, data.description)
    }
    triggerRefresh() // Avisamos a las pantallas que la DB cambió
    closeSheet()
  }

  // Centralizamos la lógica de eliminación
  const handleDelete = () => {
    Alert.alert(
      "Eliminar Registro", "¿Seguro que deseas borrar este movimiento?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: async () => {
            if(selectedTx) {
              await DatabaseService.deleteTransaction(selectedTx.id)
              triggerRefresh() // Avisamos a las pantallas que la DB cambió
              closeSheet()
            }
        }}
      ]
    )
  }

  const renderDetails = () => {
    if (!selectedTx) return null
    const isIncome = selectedTx.type === 'income'
    const typeColor = isIncome ? COLORS.primary : COLORS.danger

    return (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: typeColor, fontWeight: 'bold', fontSize: 14 }}>{isIncome ? 'INGRESO' : 'GASTO'}</Text>
        </View>

        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '500', marginBottom: 24 }}>{selectedTx.description}</Text>
        
        <View style={{ backgroundColor: COLORS.surfaceLight, padding: 20, borderRadius: 16, marginBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ backgroundColor: COLORS.surface, padding: 12, borderRadius: 12, marginBottom: 8 }}>
              <Ionicons name={selectedTx.categoryIcon as any} size={28} color={COLORS.textMuted} />
            </View>
            <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>{selectedTx.categoryName}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name={selectedTx.paymentMethodIcon as any} size={20} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <Text style={{ color: typeColor, fontSize: 28, fontWeight: 'bold' }}>${selectedTx.amount.toLocaleString('es-CO')}</Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <TouchableOpacity onPress={setEditMode} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: 16, borderRadius: 12 }}>
            <Ionicons name="pencil" size={20} color={COLORS.text} style={{ marginRight: 8 }} />
            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: 'bold' }}>Editar Movimiento</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.danger }}>
            <Ionicons name="trash" size={20} color={COLORS.danger} style={{ marginRight: 8 }} />
            <Text style={{ color: COLORS.danger, fontSize: 16, fontWeight: 'bold' }}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <BottomSheet visible={isOpen} onClose={closeSheet}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {mode === 'details' ? renderDetails() : (
          <TransactionForm 
            initialData={selectedTx}
            onCancel={closeSheet}
            onSave={handleSave} 
          />
        )}
      </ScrollView>
    </BottomSheet>
  )
}