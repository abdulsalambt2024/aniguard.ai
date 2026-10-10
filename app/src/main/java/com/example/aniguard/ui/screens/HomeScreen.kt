package com.example.aniguard.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aniguard.model.Animal
import com.example.aniguard.theme.*
import com.example.aniguard.ui.components.AlertCard
import com.example.aniguard.ui.components.HealthScoreGauge
import com.example.aniguard.viewmodel.AniGuardUiState
import com.example.aniguard.viewmodel.AniGuardViewModel
import com.example.aniguard.viewmodel.MainTab

@Composable
fun HomeScreen(
    uiState: AniGuardUiState,
    viewModel: AniGuardViewModel,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        // 1. Header: Farm Name + Greeting + Avatar
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = uiState.userProfile.farmName + " · " + uiState.userProfile.location.substringBefore(","),
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                    Text(
                        text = "Namaste, ${uiState.userProfile.name.substringBefore(" ")}",
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                }

                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(ForestDark),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = uiState.userProfile.name.take(1),
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // 2. Herd Health Donut Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("herd_health_card")
                    .clip(RoundedCornerShape(20.dp)),
                colors = CardDefaults.cardColors(containerColor = ForestDark)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    HealthScoreGauge(
                        score = uiState.herdHealthScore,
                        size = 80.dp,
                        strokeWidth = 8.dp
                    )

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "${uiState.animalsNeedingCareCount} animals need care today",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Moti is overdue for a vaccine. Lakshmi is sick.",
                            fontSize = 12.sp,
                            color = MintAccent,
                            lineHeight = 16.sp
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Button(
                            onClick = { viewModel.switchTab(MainTab.ALERTS) },
                            modifier = Modifier
                                .height(38.dp)
                                .testTag("take_action_button"),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = AmberGold,
                                contentColor = ForestDark
                            ),
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 0.dp)
                        ) {
                            Text(
                                text = "Take action",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // 3. Milk Production Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("milk_production_card")
                    .clip(RoundedCornerShape(20.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(20.dp)),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Today's Milk Production",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TextSecondary
                        )
                        Text(
                            text = "${uiState.totalMilkToday} / ${uiState.milkTarget} L",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = ForestDark
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    val progress = (uiState.totalMilkToday / uiState.milkTarget).toFloat().coerceIn(0f, 1f)
                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = AmberGold,
                        trackColor = WarmBackground
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Morning: 24.2 L",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                        Text(
                            text = "Evening: 22.6 L",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                    }
                }
            }
        }

        // 4. Quick Actions Grid
        item {
            Text(
                text = "Quick Actions",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                QuickActionButton(
                    icon = Icons.Default.EditNote,
                    label = "Daily log",
                    tag = "quick_daily_log",
                    modifier = Modifier.weight(1f)
                ) {
                    viewModel.toggleDailyLogDialog(true)
                }

                QuickActionButton(
                    icon = Icons.Default.MedicalServices,
                    label = "AI triage",
                    tag = "quick_ai_triage",
                    modifier = Modifier.weight(1f)
                ) {
                    viewModel.toggleEmergencyTriageDialog(true)
                }

                QuickActionButton(
                    icon = Icons.Default.Add,
                    label = "Add animal",
                    tag = "quick_add_animal",
                    modifier = Modifier.weight(1f)
                ) {
                    viewModel.toggleAddAnimalDialog(true)
                }

                QuickActionButton(
                    icon = Icons.Default.Mic,
                    label = "Voice entry",
                    tag = "quick_voice_entry",
                    modifier = Modifier.weight(1f)
                ) {
                    viewModel.switchTab(MainTab.ASK)
                }
            }
        }

        // 5. Urgent Alert Highlights
        val pendingAlerts = uiState.alerts.filter { !it.isResolved }.take(2)
        if (pendingAlerts.isNotEmpty()) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Urgent Alerts",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "View all",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = ForestMedium,
                        modifier = Modifier.clickable { viewModel.switchTab(MainTab.ALERTS) }
                    )
                }
            }

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

        // 6. Animals Overview Carousel
        item {
            Text(
                text = "Herd Snapshot",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(uiState.animals) { animal ->
                    AnimalSnapshotCard(animal = animal) {
                        viewModel.selectAnimalForDetail(animal)
                    }
                }
            }
        }
    }
}

@Composable
fun QuickActionButton(
    icon: ImageVector,
    label: String,
    tag: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .testTag(tag)
            .height(86.dp)
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(WarmBackground),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = label,
                    tint = ForestDark,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
        }
    }
}

@Composable
fun AnimalSnapshotCard(
    animal: Animal,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(130.dp)
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = animal.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = TextPrimary
                )
                Text(
                    text = "${animal.currentHealthScore}%",
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    color = when (animal.healthStatus) {
                        com.example.aniguard.model.HealthStatus.HEALTHY -> StatusHealthyText
                        com.example.aniguard.model.HealthStatus.WATCH, com.example.aniguard.model.HealthStatus.SICK -> StatusSickText
                        com.example.aniguard.model.HealthStatus.CRITICAL -> StatusCriticalText
                    }
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = animal.tagId,
                fontSize = 11.sp,
                color = TextSecondary
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${animal.dailyMilkLiters} L",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = ForestMedium
            )
        }
    }
}
