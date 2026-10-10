package com.example.aniguard.model

enum class HealthStatus(val label: String) {
    HEALTHY("Healthy"),
    WATCH("Watch"),
    SICK("Sick"),
    CRITICAL("Critical")
}

enum class AnimalSpecies(val label: String) {
    COW("Cow"),
    BUFFALO("Buffalo"),
    GOAT("Goat"),
    SHEEP("Sheep")
}

data class Animal(
    val id: String,
    val tagId: String,
    val name: String,
    val species: AnimalSpecies,
    val breed: String,
    val ageYears: Int,
    val gender: String = "Female",
    val weightKg: Double = 400.0,
    val pregnancyStatus: Boolean = false,
    val pregnancyMonth: Int? = null,
    val lactationStage: String = "Mid-lactation",
    val dailyMilkLiters: Double = 10.0,
    val currentHealthScore: Int = 85,
    val healthStatus: HealthStatus = HealthStatus.HEALTHY,
    val initial: String = name.take(1)
)

data class DailyRecord(
    val id: String,
    val animalId: String,
    val animalName: String,
    val date: String,
    val morningMilkLiters: Double,
    val eveningMilkLiters: Double,
    val totalMilkLiters: Double = morningMilkLiters + eveningMilkLiters,
    val temperatureCelsius: Double = 38.6,
    val appetite: String = "Normal",
    val ruminationLevel: String = "Normal",
    val fecesStatus: String = "Normal",
    val symptoms: List<String> = emptyList(),
    val notes: String = ""
)

data class Disease(
    val id: String,
    val name: String,
    val affectedAnimals: String,
    val severity: String, // Emergency, High, Moderate
    val keySymptoms: String,
    val milkImpact: String,
    val prevention: String,
    val referenceSource: String,
    val tags: List<String>
)

data class HealthAlert(
    val id: Long,
    val severity: String, // Urgent, Watch, Critical
    val tagId: String,
    val animalName: String,
    val title: String,
    val description: String,
    val nextStep: String,
    val actionLabel: String,
    val isResolved: Boolean = false
)

data class VaccineSchedule(
    val id: String,
    val month: String,
    val day: String,
    val vaccineName: String,
    val diseaseName: String,
    val animalTarget: String,
    val dosage: String,
    val isOverdue: Boolean
)

data class FeedPlanInfo(
    val animalName: String,
    val tagId: String,
    val milkLiters: Double,
    val weightKg: Double,
    val fatPercent: Double,
    val totalDryMatterKg: Double,
    val maintenanceKg: Double,
    val milkProductionKg: Double,
    val greenFodderKg: Double,
    val dryFodderKg: Double,
    val concentrateKg: Double,
    val mineralsGrams: Double
)

data class GovtScheme(
    val category: String,
    val headline: String,
    val name: String,
    val description: String,
    val eligibility: String,
    val portalUrl: String
)

data class StructuredAiGuidance(
    val summary: String,
    val couldBe: List<String>,
    val doNow: List<String>,
    val callVetIf: String
)

data class ChatMessage(
    val id: Long,
    val isUser: Boolean,
    val text: String,
    val structured: StructuredAiGuidance? = null,
    val timestamp: Long = System.currentTimeMillis()
)

data class BioMaterialListing(
    val id: String,
    val farmerName: String,
    val materialName: String,
    val quantity: Int,
    val region: String,
    val contactInfo: String,
    val availableDate: String
)

data class UserProfile(
    val name: String = "Ramesh Patel",
    val farmName: String = "GreenPastures Dairy Farm",
    val location: String = "Anand, Gujarat",
    val language: String = "English",
    val role: String = "Farmer"
)
