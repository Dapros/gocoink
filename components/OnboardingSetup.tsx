import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'
import { useSettingsStore } from '@/store/useSettingsStore'
import { Input } from './ui/Input'

type PlanType = 'monthly' | 'biweekly' | 'free'

export const OnboardingSetup = () => {
  const { saveSettings } = useSettingsStore()
  
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly')
  const [salary, setSalary] = useState('')

  const handleSave = async () => {
    // Si es modo libre, el salario base es 0
    const finalSalary = selectedPlan === 'free' ? 0 : Number(salary)
    const today = new Date().toISOString()
    
    // Guardamos en Zustand y SQLite al mismo tiempo
    await saveSettings(selectedPlan, finalSalary, today)
  }

  const renderStep1 = () => (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 }}>
        Elige tu modalidad
      </Text>
      <Text style={{ fontSize: 16, color: COLORS.textMuted, marginBottom: 30, lineHeight: 22 }}>
        ¿Cómo recibes tus ingresos principales?
      </Text>

      <View style={{ gap: 12, marginBottom: 40 }}>
        <PlanCard 
          title="Mensual" 
          desc="Recibo un sueldo fijo una vez al mes." 
          icon="calendar-outline" 
          active={selectedPlan === 'monthly'} 
          onPress={() => setSelectedPlan('monthly')} 
        />
        <PlanCard 
          title="Quincenal" 
          desc="Me pagan cada 15 días (mitad y mitad)." 
          icon="calendar-number-outline" 
          active={selectedPlan === 'biweekly'} 
          onPress={() => setSelectedPlan('biweekly')} 
        />
        <PlanCard 
          title="Libre" 
          desc="Soy independiente, no tengo un sueldo fijo." 
          icon="briefcase-outline" 
          active={selectedPlan === 'free'} 
          onPress={() => setSelectedPlan('free')} 
        />
      </View>

      <TouchableOpacity 
        style={{ 
          backgroundColor: COLORS.primary, 
          paddingVertical: 18, 
          borderRadius: 16, 
          alignItems: 'center' 
        }}
        onPress={() => selectedPlan === 'free' ? handleSave() : setStep(2)}
      >
        <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: 'bold' }}>
          {selectedPlan === 'free' ? 'Comenzar' : 'Siguiente'}
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderStep2 = () => (
    <View style={{ padding: 20 }}>
      <TouchableOpacity 
        onPress={() => setStep(1)} 
        style={{ marginBottom: 20, alignSelf: 'flex-start' }}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 }}>
        ¿Cuál es tu base?
      </Text>

      <Text style={{ fontSize: 16, color: COLORS.textMuted, marginBottom: 30, lineHeight: 22 }}>
        Ingresa tu sueldo {selectedPlan === 'monthly' ? 'mensual' : 'quincenal'} neto. Esto será tu 100% en la gráfica.
      </Text>

      <Input
        label="Sueldo Neto (COP)"
        keyboardType="numeric"
        placeholder="Ej: 2500000"
        value={salary}
        onChangeText={setSalary}
        autoFocus
      />

      <TouchableOpacity 
        style={{ 
          backgroundColor: COLORS.primary, 
          paddingVertical: 18, 
          borderRadius: 16, 
          alignItems: 'center',
          marginTop: 20,
          opacity: salary ? 1 : 0.5 
        }} 
        onPress={handleSave}
        disabled={!salary}
      >
        <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: 'bold' }}>
          Guardar y Comenzar
        </Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <Modal visible={true} animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ 
          flex: 1, 
          backgroundColor: COLORS.background, 
          justifyContent: 'center' 
        }}>
        {step === 1 ? renderStep1() : renderStep2()}
      </KeyboardAvoidingView>
    </Modal>
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