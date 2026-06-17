import React, { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/theme"
import { useSettingsStore } from "@/store/useSettingsStore"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useRouter } from 'expo-router'
import { SwipeWrapper } from '@/components/SwiperWrapper'

type PlanType = 'monthly' | 'biweekly' | 'free'

export default function PlanScreen() {
  const router = useRouter()
  const { cycleMode, baseSalary, cycleStartDate, saveSettings } = useSettingsStore()

  const [draftMode, setDraftMode] = useState<PlanType>('monthly')
  const [draftSalary, setDraftSalary] = useState('')

  useEffect(() => {
    if (cycleMode) setDraftMode(cycleMode)
    setDraftSalary(baseSalary.toString())
  }, [cycleMode, baseSalary])

  const getNextCutDate = () => {
    if (!cycleMode || cycleMode === 'free' || !cycleStartDate) return 'No aplica'
    
    const start = new Date(cycleStartDate)
    const nextDate = new Date(start)
    
    if (cycleMode === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1)
    if (cycleMode === 'biweekly') nextDate.setDate(nextDate.getDate() + 15)
    
    return nextDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const handleSave = async () => {
    const finalSalary = draftMode === 'free' ? 0 : Number(draftSalary)
    let startDate = cycleStartDate || new Date().toISOString()

    if (draftMode !== cycleMode) {
      startDate = new Date().toISOString()
    }

    await saveSettings(draftMode, finalSalary, startDate)
    
    Alert.alert(
      "¡Plan Actualizado!", 
      "Tu configuración financiera ha sido guardada con éxito.",
      [{ text: "Entendido", style: "default" }]
    )
  }

  const modeLabels = {
    monthly: 'Mensual',
    biweekly: 'Quincenal',
    free: 'Libre (Sin sueldo fijo)'
  }

  return (
    <SwipeWrapper
      onSwipeRight={() => router.navigate('/')}
    >
      <KeyboardAvoidingView 
        // 'padding' para iOS y 'height' para Android para evitar el desfase con la barra de pestañas
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1, backgroundColor: COLORS.background }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 140 }} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 }}>
            Mi Plan
          </Text>

          {/* --- TARJETA DE RESUMEN ACTUAL --- */}
          <View style={{
            backgroundColor: COLORS.surface,
            padding: 20,
            borderRadius: 20,
            marginBottom: 30,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="wallet" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
              <Text style={{ color: COLORS.textMuted, fontSize: 16, fontWeight: '600', textTransform: 'uppercase' }}>
                Ciclo Actual: {cycleMode ? modeLabels[cycleMode] : 'No definido'}
              </Text>
            </View>
            
            <Text style={{ color: COLORS.text, fontSize: 36, fontWeight: 'bold', marginBottom: 8 }}>
              ${baseSalary.toLocaleString('es-CO')}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, padding: 10, borderRadius: 10 }}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>
                Próximo corte: <Text style={{ color: COLORS.text, fontWeight: 'bold' }}>{getNextCutDate()}</Text>
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 30 }} />

          {/* --- SECCIÓN DE EDICIÓN --- */}
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 }}>
            Modificar Configuración
          </Text>

          <View style={{ gap: 12, marginBottom: 24 }}>
            <PlanCard 
              title="Mensual" 
              desc="Sueldo fijo una vez al mes." 
              icon="calendar-outline" 
              active={draftMode === 'monthly'} 
              onPress={() => setDraftMode('monthly')} 
            />
            <PlanCard 
              title="Quincenal" 
              desc="Pago cada 15 días." 
              icon="calendar-number-outline" 
              active={draftMode === 'biweekly'} 
              onPress={() => setDraftMode('biweekly')} 
            />
            <PlanCard 
              title="Libre" 
              desc="Independiente, sin sueldo fijo." 
              icon="briefcase-outline" 
              active={draftMode === 'free'} 
              onPress={() => setDraftMode('free')} 
            />
          </View>

          {draftMode !== 'free' && (
            <View style={{ marginBottom: 20 }}>
              <Input 
                label="Nuevo Sueldo Base (COP)"
                keyboardType="numeric"
                value={draftSalary}
                onChangeText={setDraftSalary}
                placeholder="Ej: 3000000"
              />
            </View>
          )}

          <Button 
            label="Guardar Cambios" 
            variant="primary" 
            onPress={handleSave} 
            disabled={draftMode !== 'free' && !draftSalary} 
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SwipeWrapper>
  )
}

interface PlanCardProps {
  title: string
  desc: string
  icon: keyof typeof Ionicons.glyphMap
  active: boolean
  onPress: () => void
}

const PlanCard = ({ title, desc, icon, active, onPress }: PlanCardProps) => (
  <TouchableOpacity 
    activeOpacity={0.8} 
    onPress={onPress} 
    style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      padding: 16, 
      borderRadius: 16, 
      borderWidth: 2,
      borderColor: active ? COLORS.primary : COLORS.border, 
      backgroundColor: active ? COLORS.surfaceLight : COLORS.surface 
    }}
  >
    <View style={{
      width: 48, 
      height: 48, 
      borderRadius: 12, 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginRight: 16,
      backgroundColor: active ? COLORS.primary : COLORS.background 
    }}>
      <Ionicons name={icon} size={24} color={active ? COLORS.text : COLORS.textMuted} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: COLORS.textMuted }}>
        {desc}
      </Text>
    </View>
    <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={24} color={active ? COLORS.primary : COLORS.border} />
  </TouchableOpacity>
)