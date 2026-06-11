import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'

interface DatePickerProps {
  label?: string
  value: Date
  onChange: (date: Date) => void
  error?: string
}

export const DatePicker = ({ label, value, onChange, error }: DatePickerProps) => {
  const [show, setShow] = useState(false)

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if(Platform.OS === 'android'){
      setShow(false)
    }

    if(selectedDate){
      onChange(selectedDate)
    }
  }

  // Formatear la fecha para mostrarla mejor (ejemplo 15 de Oct, 2026)
  const formatterDate = value.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ color: COLORS.textMuted, marginBottom: 8, fontSize: 14 }}>
          {label}
        </Text>
      )}

      {/* Boton disparador */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setShow(true)}
        style={{
          backgroundColor: COLORS.surfaceLight,
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: error ? COLORS.danger : 'transparent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 16 }}>
          {formatterDate}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>

      {error && (
        <Text style={{ color: COLORS.danger, marginTop: 4, fontSize: 12 }}>{error}</Text>
      )}

      {/* Picker nativo */}
      {show && (
        <DateTimePicker 
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          themeVariant='dark'
        />
      )}

      {/* Boton de confirmar extra solo para iOS */}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity
          onPress={() => setShow(false)}
          style={{ backgroundColor: COLORS.primary, padding: 10, borderRadius: 0, marginTop: 8, alignItems: 'center' }}
        >
          <Text style={{ color: COLORS.text, fontWeight: 'bold' }}>Confirmar Fecha</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}