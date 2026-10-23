import React, { useMemo, useState } from 'react'
import { View, Text, Modal, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'
import { useSettingsStore } from '@/store/useSettingsStore'
import { toLocalISOString } from '@/utils/dateHelpers'
import { Input } from './ui/Input'
import { Button } from './ui/Button'

export const CycleEvaluator = () => {
  const { cycleMode, baseSalary, cycleStartDate, saveSettings } = useSettingsStore()
  
  // null = el usuario no ha editado el sueldo; se pre-llena con el sueldo anterior
  const [editedSalary, setEditedSalary] = useState<string | null>(null)
  const newSalary = editedSalary ?? baseSalary.toString()

  // El modal se muestra mientras el corte esté vencido; al guardar o posponer cambia cycleStartDate y se recalcula solo
  const isVisible = useMemo(() => {
    // Si no hay ciclo, o es modo libre, o no hay fecha de inicio, se apaga
    if (!cycleMode || cycleMode === 'free' || !cycleStartDate) return false

    const today = new Date()

    // Calculo de la fecha del próximo corte
    const nextDate = new Date(cycleStartDate)
    if (cycleMode === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1)
    } else if (cycleMode === 'biweekly') {
      nextDate.setDate(nextDate.getDate() + 15)
    }

    // se limpia las horas para comparar solo los días exactos
    today.setHours(0, 0, 0, 0)
    nextDate.setHours(0, 0, 0, 0)

    // Si hoy es igual o mayor a la fecha de pago, mostramos el modal
    return today.getTime() >= nextDate.getTime()
  }, [cycleMode, cycleStartDate])

  const handleSave = async () => {
    const today = toLocalISOString()
    // Guardamos el nuevo sueldo y reiniciamos el ciclo a partir de HOY
    await saveSettings(cycleMode!, Number(newSalary), today)
    setEditedSalary(null)
  }

  const handleSnooze = async () => {
    const shiftedStart = new Date(cycleStartDate!)
    shiftedStart.setDate(shiftedStart.getDate() + 1)

    await saveSettings(cycleMode!, baseSalary, toLocalISOString(shiftedStart))
  }

  if (!isVisible) return null

  return (
    <Modal visible={isVisible} animationType="fade" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          padding: 20
        }}
      >
        <View style={{
          backgroundColor: COLORS.surface,
          padding: 24,
          borderRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 10
        }}>
          
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ 
              backgroundColor: COLORS.surfaceLight, 
              padding: 16, 
              borderRadius: 50, 
              marginBottom: 16 
            }}>
              <Ionicons name="cash-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' }}>
              ¡Es día de corte!
            </Text>
            <Text style={{ fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
              Ha terminado tu ciclo {cycleMode === 'monthly' ? 'mensual' : 'quincenal'}. Confirma tu nuevo ingreso para iniciar el siguiente periodo.
            </Text>
          </View>

          <Input 
            label="Ingreso para este ciclo (COP)"
            keyboardType="numeric"
            value={newSalary}
            onChangeText={setEditedSalary}
            autoFocus
          />

          <View style={{ gap: 12, marginTop: 10 }}>
            <Button 
              label="Iniciar Nuevo Ciclo" 
              variant="primary" 
              onPress={handleSave} 
            />
            
            <TouchableOpacity 
              onPress={handleSnooze}
              style={{
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{ color: COLORS.textMuted, fontSize: 16, fontWeight: '600' }}>
                Aún no me han pagado (Posponer 1 día)
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}