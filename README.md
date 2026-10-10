# AniGuard — AI Livestock Healthcare & Farm Intelligence (Android)

AniGuard is an AI-powered livestock health monitoring, disease early-warning, and farm management platform built for Indian dairy farmers and livestock owners. Rewritten from React into a modern native Android application using Kotlin, Jetpack Compose, and Material Design 3.

## Core Features Ported

1. **Farm Dashboard (`HomeScreen.kt`)**:
   - Herd Health Donut Gauge (59/100 average herd health).
   - Today's Milk Production tracker (46.8 L / 50.0 L target) with visual progress bar, morning and evening breakdown.
   - 2x2 Quick Action Grid: Daily Log, AI Emergency Triage, Add Animal, Voice Entry.
   - Urgent Health Alerts preview and Herd Snapshot carousel.

2. **Herd Management (`HerdScreen.kt`)**:
   - Animals directory with full health status tags (Healthy, Sick, Watch, Critical).
   - Species filtering (All, Cows, Buffalo, Goats).
   - Real-time search by animal name, tag ID, or breed.
   - Comprehensive Animal Detail modal sheet with lactation stage, weight, pregnancy status, and milk metrics.
   - Animal registration dialog (`AddAnimalDialog.kt`) for Cows, Buffalo, Goats, and Sheep.

3. **Health Alerts & Disease Surveillance (`HealthAlertsScreen.kt`)**:
   - Categorized alerts with severity pills (Urgent, Watch, Critical).
   - Regional outbreak warning for disease surveillance (e.g., PPR, FMD).
   - One-tap actions: "Call vet", "Book check-up", "Mark done".

4. **Care Hub (`CareHubScreen.kt`)**:
   - **Vaccination Calendar**: Overdue and upcoming timeline (PPR Sungri 96, FMD trivalent, HS oil adjuvant) with dosage and schedule.
   - **Disease Guide**: Pathology, symptoms, milk impact, prevention guidelines, and official sources (WOAH, ICAR-IVRI, DAHD) for FMD, PPR, HS, LSD, and Bovine Mastitis.
   - **AI Feed Plan**: Dry matter calculation (17.1 kg/day split into 11 kg maintenance and 6.1 kg milk production), 4-way ration grid (Green fodder, Dry fodder, Concentrate, Minerals).
   - **Government Support & Schemes**: Rashtriya Gokul Mission, Pashu Kisan Credit Card, and National Livestock Mission with eligibility and official links.
   - **Plans & Subscriptions**: AniGuard Pro features (₹499/month, ₹4,990/year) and GST billing info.

5. **Ask Agri-Advisor (`AskScreen.kt`)**:
   - Interactive veterinary consultation chat.
   - Quick prompt suggestion chips ("Udder swelling", "Goat with fever", "Not eating").
   - Structured diagnostic response cards with Summary, Differential Diagnoses ("Could be"), Immediate Steps ("Do now"), and Escalation Thresholds ("Call vet if").

6. **Emergency Triage Dialog (`EmergencyTriageDialog.kt`)**:
   - Symptom checklist (high fever, blisters, bloody milk/stool, collapse, breathing distress).
   - Instant AI risk scoring (MILD, URGENT, EMERGENCY) with isolation protocol and vet instructions.

## Technical Architecture

- **Language**: Kotlin 2.0.21
- **UI Framework**: Jetpack Compose with Material Design 3
- **Design Architecture**: MVVM (Model-View-ViewModel) with Kotlin Coroutines and StateFlow
- **Minimum SDK**: 24 (Android 7.0)
- **Target SDK**: 35 (Android 15)
- **Navigation**: Custom state-driven bottom navigation with backstack handling (`BackHandler`)
- **Adaptive Icon**: Material You adaptive icon with custom vector foreground (`ic_launcher_foreground.xml`) and solid background (`#1A3C2B`)
