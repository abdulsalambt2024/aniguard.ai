package com.example.aniguard.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.aniguard.data.AniGuardRepository
import com.example.aniguard.model.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

enum class MainTab(val label: String) {
    HOME("Home"),
    HERD("Herd"),
    ALERTS("Alerts"),
    CARE("Care"),
    ASK("Ask")
}

enum class CareSubTab(val label: String, val icon: String) {
    OVERVIEW("Care Hub", "🌿"),
    VACCINES("Vaccines", "💉"),
    DISEASE("Disease Guide", "🦠"),
    FEED("Feed Plan", "🌾"),
    GOVT("Gov Support", "🏛️"),
    PLANS("Plans", "⭐")
}

data class AniGuardUiState(
    val currentTab: MainTab = MainTab.HOME,
    val careSubTab: CareSubTab = CareSubTab.OVERVIEW,
    val speciesFilter: String = "All",
    val searchQuery: String = "",
    val animals: List<Animal> = emptyList(),
    val alerts: List<HealthAlert> = emptyList(),
    val vaccines: List<VaccineSchedule> = emptyList(),
    val diseases: List<Disease> = emptyList(),
    val govtSchemes: List<GovtScheme> = emptyList(),
    val feedPlan: FeedPlanInfo? = null,
    val chatMessages: List<ChatMessage> = emptyList(),
    val userProfile: UserProfile = UserProfile(),
    val selectedAnimal: Animal? = null,
    val showAddAnimalDialog: Boolean = false,
    val showDailyLogDialog: Boolean = false,
    val showEmergencyTriageDialog: Boolean = false,
    val triageResultSeverity: String? = null,
    val triageAdvice: String? = null,
    val herdHealthScore: Int = 59,
    val totalMilkToday: Double = 46.8,
    val milkTarget: Double = 50.0,
    val animalsNeedingCareCount: Int = 2
)

class AniGuardViewModel(
    private val repository: AniGuardRepository = AniGuardRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(AniGuardUiState())
    val uiState: StateFlow<AniGuardUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            combine(
                repository.animals,
                repository.alerts,
                repository.vaccines,
                repository.diseases,
                repository.govtSchemes,
                repository.feedPlan,
                repository.chatMessages,
                repository.userProfile
            ) { animals, alerts, vaccines, diseases, schemes, feed, messages, profile ->
                val activeAlerts = alerts.filter { !it.isResolved }
                val totalMilk = animals.sumOf { it.dailyMilkLiters }
                val avgHealth = if (animals.isNotEmpty()) animals.map { it.currentHealthScore }.average().toInt() else 0
                val needingCare = animals.count { it.healthStatus == HealthStatus.SICK || it.healthStatus == HealthStatus.CRITICAL }

                _uiState.update { current ->
                    current.copy(
                        animals = animals,
                        alerts = alerts,
                        vaccines = vaccines,
                        diseases = diseases,
                        govtSchemes = schemes,
                        feedPlan = feed,
                        chatMessages = messages,
                        userProfile = profile,
                        herdHealthScore = avgHealth,
                        totalMilkToday = (totalMilk * 10).toInt() / 10.0,
                        animalsNeedingCareCount = needingCare
                    )
                }
            }.collect()
        }
    }

    fun switchTab(tab: MainTab) {
        _uiState.update { it.copy(currentTab = tab) }
    }

    fun switchCareSubTab(subTab: CareSubTab) {
        _uiState.update { it.copy(careSubTab = subTab) }
    }

    fun setSpeciesFilter(filter: String) {
        _uiState.update { it.copy(speciesFilter = filter) }
    }

    fun setSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun selectAnimalForDetail(animal: Animal?) {
        _uiState.update { it.copy(selectedAnimal = animal) }
    }

    fun toggleAddAnimalDialog(show: Boolean) {
        _uiState.update { it.copy(showAddAnimalDialog = show) }
    }

    fun toggleDailyLogDialog(show: Boolean) {
        _uiState.update { it.copy(showDailyLogDialog = show) }
    }

    fun toggleEmergencyTriageDialog(show: Boolean) {
        _uiState.update { it.copy(showEmergencyTriageDialog = show) }
    }

    fun addAnimal(name: String, species: AnimalSpecies, breed: String, ageYears: Int, tagId: String, dailyMilk: Double) {
        val newAnimal = Animal(
            id = "animal-${System.currentTimeMillis()}",
            tagId = tagId.ifBlank { "IN-GJ-${(1000..9999).random()}" },
            name = name,
            species = species,
            breed = breed,
            ageYears = ageYears,
            dailyMilkLiters = dailyMilk,
            currentHealthScore = 95,
            healthStatus = HealthStatus.HEALTHY
        )
        repository.addAnimal(newAnimal)
        toggleAddAnimalDialog(false)
    }

    fun logVitals(animalId: String, morningMilk: Double, eveningMilk: Double, temp: Double, appetite: String, feces: String, notes: String) {
        val animal = _uiState.value.animals.find { it.id == animalId }
        val record = DailyRecord(
            id = "log-${System.currentTimeMillis()}",
            animalId = animalId,
            animalName = animal?.name ?: "Animal",
            date = "Today",
            morningMilkLiters = morningMilk,
            eveningMilkLiters = eveningMilk,
            temperatureCelsius = temp,
            appetite = appetite,
            fecesStatus = feces,
            notes = notes
        )
        repository.addDailyRecord(record)
        toggleDailyLogDialog(false)
    }

    fun resolveAlert(alertId: Long) {
        repository.resolveAlert(alertId)
    }

    fun dismissAlert(alertId: Long) {
        repository.deleteAlert(alertId)
    }

    fun sendChatMessage(text: String) {
        if (text.isBlank()) return
        repository.addChatMessage(text.trim())
    }

    fun runTriage(symptoms: List<String>, tempHigher: Boolean) {
        val hasSevere = symptoms.any { it.contains("Blister", ignoreCase = true) || it.contains("Bloody", ignoreCase = true) || it.contains("Collapse", ignoreCase = true) }
        val severity = when {
            hasSevere || (tempHigher && symptoms.size >= 2) -> "EMERGENCY"
            symptoms.isNotEmpty() || tempHigher -> "URGENT"
            else -> "MILD"
        }
        val advice = when (severity) {
            "EMERGENCY" -> "Immediate isolation required! High risk of contagious outbreak or acute systemic distress. Contact veterinary hospital without delay."
            "URGENT" -> "Moderate distress observed. Monitor temperature every 4 hours, provide electrolyte hydration, and schedule veterinary visit within 24 hours."
            else -> "Mild symptoms. Continue monitoring appetite and milk yield. Ensure fresh clean water and shaded resting area."
        }
        _uiState.update { it.copy(triageResultSeverity = severity, triageAdvice = advice) }
    }

    fun clearTriageResult() {
        _uiState.update { it.copy(triageResultSeverity = null, triageAdvice = null) }
    }
}
