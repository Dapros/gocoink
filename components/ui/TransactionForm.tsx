import React, { useState } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/theme"
import { Input } from "./Input"
import { Button } from "./Button"
import { Select } from "./Select"
import z from "zod"
import { TransactionSchema, DBTransactionRow } from "@/types"
import { useSheetStore } from "@/store/useSheetStore"

const FormSchema = TransactionSchema.omit({ id: true, date: true })
export type FormData = z.infer<typeof FormSchema>

interface TransactionFormProps {
  initialData: DBTransactionRow | null
  onCancel: () => void
  onSave: (data: FormData) => void
}

export const TransactionForm = ({ initialData, onCancel, onSave }: TransactionFormProps) => {
  const { categories, paymentMethods } = useSheetStore()

  // El estado nace de initialData; GlobalSheet monta el formulario con key para reiniciarlo al cambiar de transacción
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [type, setType] = useState<'expense' | 'income'>(initialData?.type ?? 'expense')
  const [amount, setAmount] = useState(initialData?.amount.toString() ?? '')
  const [categoryId, setCategoryId] = useState<number | string | null>(initialData?.categoryId ?? null)
  const [paymentMethodId, setPaymentMethodId] = useState<number | string | null>(initialData?.paymentMethodId ?? null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sin selección propia se usa la primera opción; los catálogos pueden llegar después del montaje
  const selectedCategoryId = categoryId ?? categories[0]?.value ?? null
  const selectedPaymentMethodId = paymentMethodId ?? paymentMethods[0]?.value ?? null

  const handleSave = () => {
    const result = FormSchema.safeParse({
      description, type, amount: Number(amount), categoryId: Number(selectedCategoryId), paymentMethodId: Number(selectedPaymentMethodId),
    })

    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.issues.forEach(issue => newErrors[String(issue.path[0])] = issue.message)
      setErrors(newErrors)
      return
    }
    onSave(result.data)
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 15, 
        paddingHorizontal: 5 
      }}>
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: 'bold' }}>
          {initialData ? 'Editar Transacción' : 'Nueva Transacción'}
        </Text>

        <TouchableOpacity onPress={onCancel} style={{ padding: 4 }}>
          <Ionicons name="close" size={26} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 5 }}>
        <Input 
          label="Descripción" 
          value={description} 
          onChangeText={setDescription} 
          error={errors.description} 
        />

        <Text style={{ color: COLORS.textMuted, marginBottom: 8, fontSize: 14 }}>
          Tipo de movimiento
        </Text>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity 
            onPress={() => setType('expense')} 
            style={{ 
              flex: 1, 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center', 
              paddingVertical: 14, 
              borderRadius: 12, 
              backgroundColor: type === 'expense' ? COLORS.danger : COLORS.surfaceLight, 
              borderWidth: 1, borderColor: type === 'expense' ? COLORS.danger : 'transparent' 
            }}>
            <Ionicons name="arrow-down" size={20} color={COLORS.textMuted} style={{ marginRight: 6 }} />
            <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 16 }}>
              Gasto
            </Text>
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
              borderWidth: 1, borderColor: type === 'income' ? COLORS.primary : 'transparent' 
            }}>
            <Ionicons name="arrow-up" size={20} color={COLORS.text} style={{ marginRight: 6 }} />
            <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 16 }}>
              Ingreso
            </Text>
          </TouchableOpacity>
        </View>

        <Select 
          label="Categoría" 
          options={categories} 
          selectedValue={selectedCategoryId}
          onSelect={setCategoryId} 
          error={errors.categoryId} 
        />
        <Input 
          label="Cantidad (COP)" 
          keyboardType="numeric" 
          value={amount} 
          onChangeText={setAmount} 
          error={errors.amount} 
        />
        <Select 
          label="Método de registro" 
          options={paymentMethods} 
          selectedValue={selectedPaymentMethodId}
          onSelect={setPaymentMethodId} 
          error={errors.paymentMethodId} 
        />
      </View>

      <View style={{ backgroundColor: COLORS.surface, paddingHorizontal: 5, paddingTop: 15, flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button label="Cancelar" variant="outline" onPress={onCancel} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Guardar" variant="primary" onPress={handleSave} />
        </View>
      </View>
    </View>
  )
}