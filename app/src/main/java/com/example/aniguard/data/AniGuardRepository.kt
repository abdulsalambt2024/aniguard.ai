package com.example.aniguard.data

import com.example.aniguard.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class AniGuardRepository {

    private val _animals = MutableStateFlow<List<Animal>>(initialAnimals())
    val animals: StateFlow<List<Animal>> = _animals.asStateFlow()

    private val _alerts = MutableStateFlow<List<HealthAlert>>(initialAlerts())
    val alerts: StateFlow<List<HealthAlert>> = _alerts.asStateFlow()

    private val _dailyRecords = MutableStateFlow<List<DailyRecord>>(initialRecords())
    val dailyRecords: StateFlow<List<DailyRecord>> = _dailyRecords.asStateFlow()

    private val _vaccines = MutableStateFlow<List<VaccineSchedule>>(initialVaccines())
    val vaccines: StateFlow<List<VaccineSchedule>> = _vaccines.asStateFlow()

    private val _diseases = MutableStateFlow<List<Disease>>(initialDiseases())
    val diseases: StateFlow<List<Disease>> = _diseases.asStateFlow()

    private val _govtSchemes = MutableStateFlow<List<GovtScheme>>(initialSchemes())
    val govtSchemes: StateFlow<List<GovtScheme>> = _govtSchemes.asStateFlow()

    private val _feedPlan = MutableStateFlow(initialFeedPlan())
    val feedPlan: StateFlow<FeedPlanInfo> = _feedPlan.asStateFlow()

    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(initialChatMessages())
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages.asStateFlow()

    private val _userProfile = MutableStateFlow(UserProfile())
    val userProfile: StateFlow<UserProfile> = _userProfile.asStateFlow()

    fun addAnimal(animal: Animal) {
        _animals.update { current -> listOf(animal) + current }
    }

    fun removeAnimal(animalId: String) {
        _animals.update { current -> current.filter { it.id != animalId } }
    }

    fun addDailyRecord(record: DailyRecord) {
        _dailyRecords.update { current -> listOf(record) + current }
        // Update animal milk yield if relevant
        _animals.update { current ->
            current.map { animal ->
                if (animal.id == record.animalId) {
                    animal.copy(dailyMilkLiters = record.totalMilkLiters)
                } else animal
            }
        }
    }

    fun resolveAlert(alertId: Long) {
        _alerts.update { current ->
            current.map { if (it.id == alertId) it.copy(isResolved = true) else it }
        }
    }

    fun deleteAlert(alertId: Long) {
        _alerts.update { current -> current.filter { it.id != alertId } }
    }

    fun addChatMessage(userText: String) {
        val userMsg = ChatMessage(
            id = System.currentTimeMillis(),
            isUser = true,
            text = userText
        )

        // Generate intelligent contextual response based on keywords
        val lower = userText.lowercase()
        val structured = when {
            lower.contains("udder") || lower.contains("swelling") || lower.contains("mastitis") -> {
                StructuredAiGuidance(
                    summary = "Udder swelling and heat strongly suggest acute or subacute mastitis.",
                    couldBe = listOf("Bovine Mastitis (Streptococcal/Staphylococcal)", "Udder edema post-calving", "Physical injury"),
                    doNow = listOf(
                        "Perform California Mastitis Test (CMT) immediately.",
                        "Strip milk onto black plate to inspect for clots or watery flakes.",
                        "Apply cold compresses if acute swelling is severe; keep bedding dry."
                    ),
                    callVetIf = "Fever exceeds 39.5°C, or milk turns bloody/foul-smelling."
                )
            }
            lower.contains("fever") || lower.contains("goat") || lower.contains("ppr") -> {
                StructuredAiGuidance(
                    summary = "Fever with discharge in small ruminants requires immediate isolation.",
                    couldBe = listOf("Peste des Petits Ruminants (PPR)", "Contagious Caprine Pleuropneumonia", "Tick-borne fever"),
                    doNow = listOf(
                        "Isolate the goat from the rest of the herd in a dry pen.",
                        "Provide clean electrolyte water and fresh green fodder.",
                        "Check for mouth sores or ocular/nasal discharges."
                    ),
                    callVetIf = "Eye discharge turns purulent or rapid dehydration occurs."
                )
            }
            lower.contains("eating") || lower.contains("feed") || lower.contains("milk drop") -> {
                StructuredAiGuidance(
                    summary = "Reduced appetite coupled with milk drop points to metabolic strain or subclinical illness.",
                    couldBe = listOf("Subacute Ruminal Acidosis (SARA)", "Early ketosis post-feed change", "Monsoon tick stress"),
                    doNow = listOf(
                        "Check rectal temperature (Normal: 38.3 - 39.2°C).",
                        "Evaluate rumination rate (target 50-60 chews per cud).",
                        "Ensure clean drinking water and reduce concentrate by 20% temporarily."
                    ),
                    callVetIf = "Temperature exceeds 39.5°C, or milk drops more than 25% over 48 hours."
                )
            }
            else -> {
                StructuredAiGuidance(
                    summary = "Your herd report has been analyzed against regional health databases.",
                    couldBe = listOf("Environmental heat stress", "Dietary transition response", "Early stage viral or bacterial infection"),
                    doNow = listOf(
                        "Monitor rumination and water intake for the next 12 hours.",
                        "Record rectal temperature and pulse rate morning and evening.",
                        "Isolate suspect animal if fever or discharge develops."
                    ),
                    callVetIf = "Animal becomes recumbent or milk production drops sharply."
                )
            }
        }

        val botMsg = ChatMessage(
            id = System.currentTimeMillis() + 1,
            isUser = false,
            text = "",
            structured = structured
        )

        _chatMessages.update { current -> current + listOf(userMsg, botMsg) }
    }

    private companion object {
        fun initialAnimals() = listOf(
            Animal(
                id = "1",
                tagId = "IN-GJ-1042",
                name = "Gauri",
                species = AnimalSpecies.COW,
                breed = "Holstein cross",
                ageYears = 4,
                weightKg = 440.0,
                pregnancyStatus = true,
                pregnancyMonth = 6,
                lactationStage = "Mid-lactation",
                dailyMilkLiters = 18.5,
                currentHealthScore = 90,
                healthStatus = HealthStatus.HEALTHY
            ),
            Animal(
                id = "2",
                tagId = "IN-GJ-1088",
                name = "Lakshmi",
                species = AnimalSpecies.COW,
                breed = "Gir",
                ageYears = 3,
                weightKg = 380.0,
                pregnancyStatus = false,
                lactationStage = "Early lactation",
                dailyMilkLiters = 11.2,
                currentHealthScore = 51,
                healthStatus = HealthStatus.SICK
            ),
            Animal(
                id = "3",
                tagId = "IN-GJ-2011",
                name = "Shera",
                species = AnimalSpecies.BUFFALO,
                breed = "Murrah",
                ageYears = 5,
                weightKg = 520.0,
                pregnancyStatus = false,
                lactationStage = "Mid-lactation",
                dailyMilkLiters = 15.0,
                currentHealthScore = 90,
                healthStatus = HealthStatus.HEALTHY
            ),
            Animal(
                id = "4",
                tagId = "IN-GJ-3090",
                name = "Moti",
                species = AnimalSpecies.GOAT,
                breed = "Sirohi",
                ageYears = 2,
                weightKg = 45.0,
                pregnancyStatus = false,
                lactationStage = "Active",
                dailyMilkLiters = 2.1,
                currentHealthScore = 5,
                healthStatus = HealthStatus.CRITICAL
            )
        )

        fun initialAlerts() = listOf(
            HealthAlert(
                id = 1,
                severity = "Urgent",
                tagId = "IN-GJ-3090",
                animalName = "Moti",
                title = "PPR vaccine is overdue",
                description = "Moti (Sirohi goat) is 5 days late for the PPR booster.",
                nextStep = "Next step: book a vet visit for the booster.",
                actionLabel = "Call vet",
                isResolved = false
            ),
            HealthAlert(
                id = 2,
                severity = "Watch",
                tagId = "IN-GJ-1042",
                animalName = "Gauri",
                title = "Month 6 of pregnancy",
                description = "Gauri (Holstein) needs more feed to support the calf.",
                nextStep = "Next step: add 0.8 kg concentrate and mineral mix daily.",
                actionLabel = "Book check-up",
                isResolved = false
            ),
            HealthAlert(
                id = 3,
                severity = "Critical",
                tagId = "IN-GJ-1088",
                animalName = "Lakshmi",
                title = "Sudden 18% milk drop & low appetite",
                description = "Morning yield reduced to 4.2 L. Rectal temperature slightly elevated (39.4°C).",
                nextStep = "Next step: isolate and check udder for heat or swelling.",
                actionLabel = "Call vet",
                isResolved = false
            )
        )

        fun initialRecords() = listOf(
            DailyRecord(
                id = "rec-1",
                animalId = "1",
                animalName = "Gauri",
                date = "Today",
                morningMilkLiters = 9.8,
                eveningMilkLiters = 8.7,
                temperatureCelsius = 38.6,
                appetite = "Normal",
                ruminationLevel = "Normal",
                fecesStatus = "Normal"
            ),
            DailyRecord(
                id = "rec-2",
                animalId = "2",
                animalName = "Lakshmi",
                date = "Today",
                morningMilkLiters = 5.2,
                eveningMilkLiters = 6.0,
                temperatureCelsius = 39.4,
                appetite = "Reduced",
                ruminationLevel = "Low",
                fecesStatus = "Normal",
                symptoms = listOf("Mild lethargy", "Decreased feed intake")
            )
        )

        fun initialVaccines() = listOf(
            VaccineSchedule(
                id = "v1",
                month = "OCT",
                day = "04",
                vaccineName = "PPR Sungri 96",
                diseaseName = "Peste des petits ruminants",
                animalTarget = "Moti · 1 ml",
                dosage = "1 ml s/c",
                isOverdue = true
            ),
            VaccineSchedule(
                id = "v2",
                month = "OCT",
                day = "27",
                vaccineName = "FMD trivalent",
                diseaseName = "Foot-and-mouth disease",
                animalTarget = "Gauri · 2 ml",
                dosage = "2 ml deep i/m",
                isOverdue = false
            ),
            VaccineSchedule(
                id = "v3",
                month = "NOV",
                day = "03",
                vaccineName = "HS oil adjuvant",
                diseaseName = "Hemorrhagic septicemia",
                animalTarget = "Shera · 3 ml",
                dosage = "3 ml deep i/m",
                isOverdue = false
            )
        )

        fun initialDiseases() = listOf(
            Disease(
                id = "d1",
                name = "Foot-and-mouth disease (FMD)",
                affectedAnimals = "Cow, buffalo, goat, sheep",
                severity = "Emergency",
                keySymptoms = "High fever, blisters on tongue and gums, ropy saliva, lameness",
                milkImpact = "Sharp fall in output; long-term loss in crossbred cows.",
                prevention = "Isolate suspect animals and disinfect pens strictly.",
                referenceSource = "WOAH, DAHD",
                tags = listOf("Cow", "Buffalo", "Goat")
            ),
            Disease(
                id = "d2",
                name = "PPR (goat plague)",
                affectedAnimals = "Goat, sheep",
                severity = "Emergency",
                keySymptoms = "Fever, eye and nose discharge, mouth sores, foul diarrhoea",
                milkImpact = "Lactation stops quickly; fast dehydration.",
                prevention = "Quarantine new goats for 21 days; annual PPR vaccination.",
                referenceSource = "ICAR-IVRI, DAHD",
                tags = listOf("Goat")
            ),
            Disease(
                id = "d3",
                name = "Hemorrhagic septicemia (HS)",
                affectedAnimals = "Cow, buffalo",
                severity = "Emergency",
                keySymptoms = "Sudden fever, swollen throat and brisket, drooling, respiratory distress",
                milkImpact = "Milk stops completely; animal collapses rapidly.",
                prevention = "Pre-monsoon oil adjuvant vaccination; avoid swampy pastures.",
                referenceSource = "ICAR-IVRI",
                tags = listOf("Cow", "Buffalo")
            ),
            Disease(
                id = "d4",
                name = "Lumpy skin disease (LSD)",
                affectedAnimals = "Cow, buffalo",
                severity = "High",
                keySymptoms = "Fever, firm skin nodules/lumps, swollen lymph nodes, edema",
                milkImpact = "Up to 50% drop in yield, abortion risk.",
                prevention = "Vector control (flies/mosquitoes), quarantine new arrivals.",
                referenceSource = "WOAH",
                tags = listOf("Cow", "Buffalo")
            ),
            Disease(
                id = "d5",
                name = "Bovine mastitis",
                affectedAnimals = "Cow, buffalo",
                severity = "High",
                keySymptoms = "Hot swollen udder, clots or flakes in milk, fever, reduced feed",
                milkImpact = "15–40% drop in yield; milk unsellable.",
                prevention = "Post-milking teat dipping, clean and dry cubicles.",
                referenceSource = "ICAR-CIRB",
                tags = listOf("Cow", "Buffalo")
            )
        )

        fun initialSchemes() = listOf(
            GovtScheme(
                category = "Breed improvement",
                headline = "50% subsidy",
                name = "Rashtriya Gokul Mission",
                description = "Up to ₹2 crore for breed multiplication farms, plus subsidized sex-sorted semen for artificial insemination.",
                eligibility = "Who can apply: dairy farmers, self-help groups and farmer producer organisations with indigenous or crossbred cattle.",
                portalUrl = "https://dahd.gov.in/schemes/programmes/rashtriya_gokul_mission"
            ),
            GovtScheme(
                category = "Working capital",
                headline = "3% interest relief",
                name = "Pashu Kisan Credit Card",
                description = "Loan up to ₹1.60 lakh collateral-free, or up to ₹3 lakh at 4% effective interest if repaid on schedule.",
                eligibility = "Who can apply: farmers with cattle, buffalo, goats or sheep, an Aadhaar card and verified bank account.",
                portalUrl = "https://pmkisan.gov.in"
            ),
            GovtScheme(
                category = "Insurance",
                headline = "50–70% premium subsidy",
                name = "National Livestock Mission",
                description = "Comprehensive livestock cover against death from epidemic disease, accident, or natural disaster.",
                eligibility = "Who can apply: small, marginal and landless farmers with tagged animals.",
                portalUrl = "https://nlm.udyamimitra.in"
            )
        )

        fun initialFeedPlan() = FeedPlanInfo(
            animalName = "Gauri",
            tagId = "IN-GJ-1042",
            milkLiters = 18.5,
            weightKg = 440.0,
            fatPercent = 4.2,
            totalDryMatterKg = 17.1,
            maintenanceKg = 11.0,
            milkProductionKg = 6.1,
            greenFodderKg = 34.2,
            dryFodderKg = 3.8,
            concentrateKg = 7.6,
            mineralsGrams = 60.0
        )

        fun initialChatMessages() = listOf(
            ChatMessage(
                id = 1,
                isUser = false,
                text = "Namaste Ramesh. What is happening with your herd today?"
            ),
            ChatMessage(
                id = 2,
                isUser = true,
                text = "My cow Lakshmi is eating less and giving less milk."
            ),
            ChatMessage(
                id = 3,
                isUser = false,
                text = "",
                structured = StructuredAiGuidance(
                    summary = "Eating less and giving less milk can mean early metabolic stress or subclinical infection.",
                    couldBe = listOf(
                        "Early Bovine Mastitis",
                        "Subacute Ruminal Acidosis after feed change",
                        "Mild fever from tick-borne hemoprotozoa"
                    ),
                    doNow = listOf(
                        "Check rectal temperature. Normal is 38.3–39.2°C.",
                        "Look for clots or watery flakes with a CMT paddle.",
                        "Provide cool shade and clean, unrestricted water."
                    ),
                    callVetIf = "Temperature is above 39.5°C, or milk drops more than 20% over 48 hours."
                )
            )
        )
    }
}
