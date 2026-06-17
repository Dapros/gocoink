import React from 'react'
import { View, Text, TouchableOpacity, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { COLORS } from '@/constants/theme'
import { Button } from '@/components/ui/Button'

export default function NotFoundScreen() {
  const router = useRouter()

  const screenWidth = Dimensions.get('window').width

  return (
    <View style={{
      flex: 1,
      backgroundColor: COLORS.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <Image 
        source={require('@/assets/images/NotFound.avif')}
        style={{
          width: screenWidth * 0.7,
          height: screenWidth * 0.7,
          maxWidth: 300,
          maxHeight: 300,
          marginBottom: 30,
          backgroundColor: COLORS.background
        }}
        contentFit="contain"
        transition={500}
      />

      <Text style={{ fontSize: 26, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, textAlign: 'center' }}>
        ¡Ups! Te has perdido
      </Text>
      <Text style={{ fontSize: 16, color: COLORS.textMuted, marginBottom: 40, textAlign: 'center',lineHeight: 24 }}>
        La pantalla que estás buscando no existe, ha sido movida o está fuera de tu órbita.
      </Text>

      <View style={{ width: '100%' }}>
        <Button 
          label="Volver al Inicio" 
          variant="primary" 
          onPress={() => router.replace('/')} 
        />
      </View>
    </View>
  )
}