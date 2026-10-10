package com.example.aniguard.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aniguard.theme.*
import com.example.aniguard.ui.components.AlertCard
import com.example.aniguard.viewmodel.AniGuardUiState
import com.example.aniguard.viewmodel.AniGuardViewModel
import com.example.aniguard.viewmodel.MainTab

@Composable
fun HealthAlertsScreen(
    uiState: AniGuardUiState,
    viewModel: AniGuardViewModel,
    modifier: Modifier = Modifier
) {
    val pendingAlerts = uiState.alerts.filter { !it.isResolved }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        // Title
        item {
            Column {
                Text(
                    text = "Health alerts",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "${pendingAlerts.size} need action",
                    fontSize = 14.sp,
                    color = TextSecondary
                )
            }
        }

        // Regional Outbreak Notice Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("regional_outbreak_notice")
                    .clip(RoundedCornerShape(16.dp))
                    .border(1.dp, Color(0xFFFDE8E8), RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF5F5))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFFFDECEA)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = "Advisory",
                            tint = StatusCriticalText,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Regional Advisory · Anand District",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = StatusCriticalText
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Active surveillance for PPR and FMD reported in 3 neighboring talukas. Verify booster vaccination records and minimize inter-herd mixing.",
                            fontSize = 12.sp,
                            color = TextPrimary,
                            lineHeight = 16.sp
                        )
                    }
                }
            }
        }

        // Alert Items
        if (pendingAlerts.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "All clear!",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = ForestMedium
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "No active health alerts for your herd today.",
                            fontSize = 13.sp,
                            color = TextSecondary
                        )
                    }
                }
            }
        } else {
            items(pendingAlerts) { alert ->
                AlertCard(
                    alert = alert,
                    onActionClick = {
                        if (alert.actionLabel.contains("vet", ignoreCase = true)) {
                            viewModel.switchTab(MainTab.ASK)
                        } else {
                            viewModel.resolveAlert(alert.id)
                        }
                    }
                )
            }
        }
    }
}
