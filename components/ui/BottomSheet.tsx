import React, { useEffect, useRef, useState } from "react"
import { Modal, View, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native'
import { COLORS } from "@/constants/theme"

// Obtenemos la altura real de la pantalla
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export const BottomSheet = ({ visible, onClose, children }: BottomSheetProps) => {
  const [internalVisible, setInternalVisible] = useState(false)
  
  // Usamos el motor nativo Animated en lugar de Reanimated
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const [sheetHeight, setSheetHeight] = useState(0)

  // Función para abrir suavemente
  const slideIn = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true, // Acelera la animación sin crashear la GPU
    }).start()
  }

  useEffect(() => {
    if (visible) {
      setInternalVisible(true)
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()
      
      if (sheetHeight > 0) {
        translateY.setValue(sheetHeight)
        slideIn()
      }
    } else if (internalVisible) {
      // Al cerrar, animamos ambas cosas al mismo tiempo y luego desmontamos
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: sheetHeight || SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setInternalVisible(false)
      })
    }
  }, [visible])

  const handleLayout = (event: any) => {
    const height = event.nativeEvent.layout.height - 100 // Restamos el parche
    if (height > 0 && sheetHeight === 0) {
      setSheetHeight(height)
      if (visible) {
        translateY.setValue(height)
        slideIn()
      }
    }
  }

  // EL REEMPLAZO A PRUEBA DE CRASHES: PanResponder nativo
  const panResponder = useRef(
    PanResponder.create({
      // Solo captura el gesto si el usuario mueve el dedo más de 5 píxeles (evita toques accidentales)
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          // EFECTO GOMA: Arrastre hacia arriba con resistencia
          translateY.setValue(gestureState.dy * 0.08)
        } else {
          // Arrastre hacia abajo
          translateY.setValue(gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Condiciones de cierre: Pasar 1/3 de la pantalla o deslizar rápido hacia abajo
        if (gestureState.dy > (sheetHeight / 3) || gestureState.vy > 1.5) {
          onClose()
        } else {
          // Si no se cumple, vuelve a su lugar original
          slideIn()
        }
      }
    })
  ).current

  if (!internalVisible) return null

  return (
    <Modal
      visible={internalVisible}
      animationType="none" 
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        
        {/* FONDO OSCURO ANIMADO */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity }]}>
          <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
        </Animated.View>
        
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View
            // LE INYECTAMOS EL DETECTOR DE GESTOS DIRECTAMENTE A LA VISTA
            {...panResponder.panHandlers}
            onLayout={handleLayout}
            style={{
              backgroundColor: COLORS.surface, 
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              maxHeight: SCREEN_HEIGHT * 0.9,
              paddingBottom: 100, 
              marginBottom: -100,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 10,
              transform: [{ translateY }] // Conectamos el movimiento
            }}
          >
            {/* ÁREA DE AGARRE SUPERIOR */}
            <View style={{ width: '100%', paddingTop: 20, paddingBottom: 15, alignItems: 'center' }}>
              <View style={{ width: 50, height: 5, borderRadius: 3, backgroundColor: COLORS.border }} />
            </View>
            
            {/* CONTENEDOR DE HIJOS (AQUÍ ESTÁ EL ESPACIO EXTRA QUE PEDISTE) */}
            <View style={{ flexShrink: 1, paddingBottom: 30 }}>
              {children}
            </View>

          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}