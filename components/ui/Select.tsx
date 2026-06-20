import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, Modal, FlatList, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'
import { SelectOption } from '@/types'

interface SelectProps {
  label?: string
  options: SelectOption[]
  selectedValue: string | number | null
  onSelect: (value: string | number) => void
  placeholder?: string;
  error?: string
}

export const Select = ({
  label,
  options, 
  selectedValue,
  onSelect,
  placeholder = 'Selecciona una opcion',
  error
} : SelectProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const rotateAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 250, // 250ms es el "sweet spot" para animaciones de UI fluidas pero rápidas
      useNativeDriver: true, // Optimización: corre la animación en el hilo nativo
    }).start()
  }, [isOpen])

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'] // 0 = abajo, 180 = arriba
  })

  const selectedItem = options.find((opt) => opt.value === selectedValue)

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Label superior */}
      {label && (
        <Text style={{ color: COLORS.textMuted, marginBottom: 8, fontSize: 14 }}>
          {label}
        </Text>
      )}

      {/* Boton que simula ser un Input */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsOpen(true)}
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
        <Text style={{ color: selectedItem ? COLORS.text : COLORS.textMuted, fontSize: 16 }}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>

        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Mensaje de error */}
      {error && (
        <Text style={{ color: COLORS.danger, marginTop: 4, fontSize: 12}}>{error}</Text>
      )}

      {/* Modal con la lista de opciones */}
      <Modal visible={isOpen} transparent={true} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, marginTop: 50, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <View style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: 'bold' }}>
              {label || 'Seleccionar'}
            </Text>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Ionicons name="close" size={28} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <FlatList 
            data={options}
            keyExtractor={(item) => String(item.value)}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item.value)
                  setIsOpen(false)
                }}
                style={{
                  padding: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: selectedValue === item.value ? COLORS.surfaceLight : 'transparent'
                }}
              >
                {/* Si la opcion trae un icono se renderiza, ejemplo logo de banco */}
                {item.icon && (
                  <Ionicons name={item.icon as any} size={24} color={COLORS.primary} style={{ marginRight: 15 }} />                
                )}
                <Text style={{ color: COLORS.text, fontSize: 16 }}>{item.label}</Text>
                
                {/* Checkmark para la opcion activa */}
                {selectedValue === item.value && (
                  <View style={{ flex: 1, alignItems: 'flex-end'}}>
                    <Ionicons name="checkmark" size={24} color={COLORS.primary} />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  )
}