package com.example.aniguard.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.aniguard.theme.*
import com.example.aniguard.ui.dialogs.AddAnimalDialog
import com.example.aniguard.ui.dialogs.AnimalDetailDialog
import com.example.aniguard.ui.dialogs.DailyLogDialog
import com.example.aniguard.ui.dialogs.EmergencyTriageDialog
import com.example.aniguard.ui.screens.*
import com.example.aniguard.viewmodel.AniGuardViewModel
import com.example.aniguard.viewmodel.CareSubTab
import com.example.aniguard.viewmodel.MainTab

@Composable
fun AniGuardApp(
    viewModel: AniGuardViewModel
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Handle back button when on sub-screens or dialogs
    BackHandler(enabled = uiState.currentTab != MainTab.HOME || uiState.careSubTab != CareSubTab.OVERVIEW) {
        if (uiState.careSubTab != CareSubTab.OVERVIEW) {
            viewModel.switchCareSubTab(CareSubTab.OVERVIEW)
        } else {
            viewModel.switchTab(MainTab.HOME)
        }
    }

    Scaffold(
        containerColor = WarmBackground,
        contentWindowInsets = WindowInsets.statusBars
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Main Screen Content
            when (uiState.currentTab) {
                MainTab.HOME -> HomeScreen(uiState = uiState, viewModel = viewModel)
                MainTab.HERD -> HerdScreen(uiState = uiState, viewModel = viewModel)
                MainTab.ALERTS -> HealthAlertsScreen(uiState = uiState, viewModel = viewModel)
                MainTab.CARE -> CareHubScreen(uiState = uiState, viewModel = viewModel)
                MainTab.ASK -> AskScreen(uiState = uiState, viewModel = viewModel)
            }

            // Floating Bottom Navigation Pill (matching AniGuard's signature rounded bar)
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 16.dp, start = 16.dp, end = 16.dp)
                    .widthIn(max = 420.dp)
                    .fillMaxWidth()
            ) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(16.dp, CircleShape)
                        .clip(CircleShape),
                    color = ForestDark
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceAround,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        MainTab.entries.forEach { tab ->
                            val isActive = uiState.currentTab == tab
                            Box(
                                modifier = Modifier
                                    .testTag("nav_tab_${tab.name.lowercase()}")
                                    .clip(CircleShape)
                                    .background(if (isActive) AmberGold else Color.Transparent)
                                    .clickable { viewModel.switchTab(tab) }
                                    .padding(horizontal = 14.dp, vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = tab.label,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isActive) ForestDark else MintAccent
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Dialogs & Sheets
    if (uiState.showAddAnimalDialog) {
        AddAnimalDialog(
            onDismiss = { viewModel.toggleAddAnimalDialog(false) },
            onConfirm = { name, species, breed, age, tagId, dailyMilk ->
                viewModel.addAnimal(name, species, breed, age, tagId, dailyMilk)
            }
        )
    }

    if (uiState.showDailyLogDialog) {
        DailyLogDialog(
            animals = uiState.animals,
            onDismiss = { viewModel.toggleDailyLogDialog(false) },
            onConfirm = { animalId, morning, evening, temp, appetite, feces, notes ->
                viewModel.logVitals(animalId, morning, evening, temp, appetite, feces, notes)
            }
        )
    }

    if (uiState.selectedAnimal != null) {
        AnimalDetailDialog(
            animal = uiState.selectedAnimal!!,
            onDismiss = { viewModel.selectAnimalForDetail(null) },
            onRemoveAnimal = { id -> viewModel.selectAnimalForDetail(null) }
        )
    }

    if (uiState.showEmergencyTriageDialog) {
        EmergencyTriageDialog(
            onDismiss = { viewModel.toggleEmergencyTriageDialog(false) },
            onRunTriage = { symptoms, tempHigher ->
                viewModel.runTriage(symptoms, tempHigher)
            },
            severityResult = uiState.triageResultSeverity,
            adviceResult = uiState.triageAdvice,
            onClearResult = { viewModel.clearTriageResult() }
        )
    }
}
