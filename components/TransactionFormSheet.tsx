import React, { forwardRef, useState, useMemo } from "react"
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native"
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Ionicons } from "@expo/vector-icons"
import { z } from "zod"
import { COLORS } from "@/constants/theme"
import { BottomSheet } from "./ui/BottomSheet"
import { Input } from "./ui/Input"
import { Button } from "./ui/Button"
import { Select } from "./ui/Select"
import { SelectOption, TransactionSchema } from "@/types"

const FormSchema = TransactionSchema.omit({ id: true, date: true })

const CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Comida', value: 1, icon: 'fast-food-outline' },
  { label: 'Servicios', value: 2, icon: 'flash-outline' },
  { label: 'Trabajo', value: 3, icon: 'briefcase-outline' },
]

const METHOD_OPTIONS: SelectOption[] = [
  { label: 'Efectivo', value: 'efectivo', icon: 'cash-outline' },
  { label: 'Bancolombia', value: 'bancolombia', icon: 'card-outline' },
  { label: 'Nequi', value: 'nequi', icon: 'phone-portrait-outline' },
  { label: 'Nu', value: 'nu', icon: 'card-outline' },
]

interface FormSheetProps {
  onClose: () => void
  onSave: (data: any) => void
}

export const TransactionFormSheet = forwardRef<BottomSheetModal, FormSheetProps>(
  ({ onClose, onSave }, ref) => {
    const [description, setDescription] = useState('')
    const [type, setType] = useState<'expense' | 'income'>('expense')
    const [amount, setAmount] = useState('')
    const [categoryId, setCategoryId] = useState<number | string | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<string | number | null>(null)
    
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleSave = () => {
      const result = FormSchema.safeParse({
        description,
        type,
        amount: Number(amount),
        categoryId: Number(categoryId),
        paymentMethod,
      })

      if (!result.success) {
        const newErrors: Record<string, string> = {}
        result.error.issues.forEach(issue => {
          const fieldName = String(issue.path[0])
          newErrors[fieldName] = issue.message
        })
        setErrors(newErrors)
        return
      }

      setErrors({})
      onSave(result.data)
      resetForm()
    }

    const resetForm = () => {
      setDescription('');
      setType('expense');
      setAmount('');
      setCategoryId(null);
      setPaymentMethod(null);
      setErrors({});
      onClose();
    }

    return (
      <BottomSheet ref={ref} snapPoints={['75%']} enableDynamicSizing={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header del Drag */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 }}>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: 'bold' }}>
              Nueva Transacción
            </Text>
            <TouchableOpacity onPress={resetForm} style={{ padding: 4 }}>
              <Ionicons name="close" size={26} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Contenido con Scroll */}
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 5 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Descripción */}
            <Input 
              label="Descripción"
              placeholder="Ej. Almuerzo en el centro"
              value={description}
              onChangeText={setDescription}
              error={errors.description}
            />

            {/* 2. Tipo (Ingreso / Gasto) */}
            <Text style={{ color: COLORS.textMuted, marginBottom: 8, fontSize: 14 }}>Tipo de movimiento</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setType('expense')}
                style={{
                  flex: 1, flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  paddingVertical: 14, 
                  borderRadius: 12,
                  backgroundColor: type === 'expense' ? COLORS.danger : COLORS.surfaceLight,
                  borderWidth: 1, borderColor: type === 'expense' ? COLORS.danger : 'transparent',
                }}
              >
                <Ionicons name="arrow-down" size={20} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 16 }}>Gasto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setType('income')}
                style={{
                  flex: 1, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  paddingVertical: 14, 
                  borderRadius: 12,
                  backgroundColor: type === 'income' ? COLORS.primary : COLORS.surfaceLight,
                  borderWidth: 1, borderColor: type === 'income' ? COLORS.primary : 'transparent',
                }}
              >
                <Ionicons name="arrow-up" size={20} color={COLORS.text} style={{ marginRight: 6 }} />
                <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 16 }}>Ingreso</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Categoría */}
            <Select 
              label="Categoría"
              options={CATEGORY_OPTIONS}
              selectedValue={categoryId}
              onSelect={setCategoryId}
              placeholder="Seleccione una categoría"
              error={errors.categoryId}
            />

            {/* 4. Monto */}
            <Input 
              label="Cantidad (COP)"
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              error={errors.amount}
            />

            {/* 5. Método de pago */}
            <Select 
              label="Método de registro"
              options={METHOD_OPTIONS}
              selectedValue={paymentMethod}
              onSelect={setPaymentMethod}
              placeholder="Efectivo, banco, etc."
              error={errors.paymentMethod}
            />
          </BottomSheetScrollView>

          {/* Botones Flotantes Inferiores */}
          <View style={{
            backgroundColor: COLORS.surface,
            paddingHorizontal: 5,
            paddingTop: 15,
            flexDirection: 'row', 
            gap: 12
          }}>
            <View style={{ flex: 1 }}>
              <Button label="Cancelar" variant="outline" onPress={resetForm} />
            </View>
            <View style={{ flex: 1}}>
              <Button label="Guardar" variant="primary" onPress={handleSave} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>
    )
  }
)