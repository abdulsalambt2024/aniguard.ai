package com.example.aniguard.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aniguard.model.Disease
import com.example.aniguard.model.GovtScheme
import com.example.aniguard.model.VaccineSchedule
import com.example.aniguard.theme.*
import com.example.aniguard.viewmodel.AniGuardUiState
import com.example.aniguard.viewmodel.AniGuardViewModel
import com.example.aniguard.viewmodel.CareSubTab

@Composable
fun CareHubScreen(
    uiState: AniGuardUiState,
    viewModel: AniGuardViewModel,
    modifier: Modifier = Modifier
) {
    when (uiState.careSubTab) {
        CareSubTab.OVERVIEW -> CareOverviewView(uiState, viewModel, modifier)
        CareSubTab.VACCINES -> CareVaccinesView(uiState, viewModel, modifier)
        CareSubTab.DISEASE -> CareDiseaseGuideView(uiState, viewModel, modifier)
        CareSubTab.FEED -> CareFeedPlanView(uiState, viewModel, modifier)
        CareSubTab.GOVT -> CareGovtSupportView(uiState, viewModel, modifier)
        CareSubTab.PLANS -> CarePlansView(uiState, viewModel, modifier)
    }
}

@Composable
fun CareOverviewView(
    uiState: AniGuardUiState,
    viewModel: AniGuardViewModel,
    modifier: Modifier = Modifier
) {
    val careItems = listOf(
        Triple(CareSubTab.VACCINES, "Vaccines", "💉"),
        Triple(CareSubTab.DISEASE, "Disease Guide", "🦠"),
        Triple(CareSubTab.FEED, "Feed Plan", "🌾"),
        Triple(CareSubTab.GOVT, "Gov Support", "🏛️"),
        Triple(CareSubTab.PLANS, "Plans", "⭐")
    )

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        item {
            Column {
                Text(
                    text = "Care",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Tools to keep your herd healthy",
                    fontSize = 14.sp,
                    color = TextSecondary
                )
            }
        }

        items(careItems) { (subTab, title, emoji) ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("care_hub_item_${subTab.name}")
                    .clip(RoundedCornerShape(18.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
                    .clickable { viewModel.switchCareSubTab(subTab) },
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(WarmBackground),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = emoji, fontSize = 22.sp)
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Text(
                        text = title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary,
                        modifier = Modifier.weight(1f)
                    )

                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = "Open",
                        tint = TextTertiary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun CareVaccinesView(
    uiState: AniGuardUiState,
    viewModel: AniGuardViewModel,
    modifier: Modifier = Modifier
) {
    val overdue = uiState.vaccines.filter { it.isOverdue }
    val upcoming = uiState.vaccines.filter { !it.isOverdue }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        item {
            SubViewHeader(title = "Vaccines", onBack = { viewModel.switchCareSubTab(CareSubTab.OVERVIEW) })
        }

        if (overdue.isNotEmpty()) {
            item {
                Text(
                    text = "Overdue",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = StatusCriticalText
                )
            }
            items(overdue) { v ->
                VaccineItemCard(v = v)
            }
        }

        if (upcoming.isNotEmpty()) {
            item {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Upcoming",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
            }
            items(upcoming) { v ->
                VaccineItemCard(v = v)
            }
        }
    }
}

@Composable
fun VaccineItemCard(v: VaccineSchedule) {
    val dateBg = if (v.isOverdue) StatusCriticalBg else StatusInfoBg
    val dateText = if (v.isOverdue) StatusCriticalText else StatusInfoText

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(18.dp)),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(54.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(dateBg),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = v.month,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = dateText
                    )
                    Text(
                        text = v.day,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = dateText,
                        lineHeight = 20.sp
                    )
                }
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = v.vaccineName,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = v.diseaseName,
                    fontSize = 12.sp,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "${v.animalTarget} · ${v.dosage}",
                    fontSize = 12.sp,
                    color = ForestMedium,
                    fontWeight = FontWeight.Medium
                )
            }

            if (v.isOverdue) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(StatusCriticalBg)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Overdue",
                        color = StatusCriticalText,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun CareDiseaseGuideView(
    uiState: AniGuardUiState,
    viewModel: AniGuardViewModel,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        item {
            SubViewHeader(title = "Disease Guide", onBack = { viewModel.switchCareSubTab(CareSubTab.OVERVIEW) })
        }

        items(uiState.diseases) { d ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(18.dp)),
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
                            text = d.name,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            modifier = Modifier.weight(1f)
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (d.severity == "Emergency") StatusCriticalBg else StatusSickBg)
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = d.severity,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (d.severity == "Emergency") StatusCriticalText else StatusSickText
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Affects: ${d.affectedAnimals}",
                        fontSize = 12.sp,
                        color = TextSecondary,
                        fontWeight = FontWeight.Medium
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Symptoms to watch:",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = ForestDark
                    )
                    Text(
                        text = d.keySymptoms,
                        fontSize = 13.sp,
                        color = TextPrimary,
                        lineHeight = 17.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Milk yield impact: ${d.milkImpact}",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Prevention: ${d.prevention}",
                        fontSize = 12.sp,
                        color = ForestMedium,
                        fontWeight = FontWeight.Medium
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Source: ${d.referenceSource}",
                        fontSize = 10.sp,
                        color = TextTertiary
                    )
                }
            }
        }
    }
}

@Composable
fun CareFeedPlanView(
    uiState: AniGuardUiState,
    viewModel: AniGuardViewModel,
    modifier: Modifier = Modifier
) {
    val feed = uiState.feedPlan

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        item {
            SubViewHeader(title = "Feed plan", onBack = { viewModel.switchCareSubTab(CareSubTab.OVERVIEW) })
        }

        if (feed != null) {
            // Animal summary chips
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatBox(label = "Milk", value = "${feed.milkLiters} L", modifier = Modifier.weight(1f))
                    StatBox(label = "Weight", value = "${feed.weightKg.toInt()} kg", modifier = Modifier.weight(1f))
                    StatBox(label = "Fat", value = "${feed.fatPercent}%", modifier = Modifier.weight(1f))
                }
            }

            // Dry Matter Card
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp)),
                    colors = CardDefaults.cardColors(containerColor = ForestDark)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(18.dp)
                    ) {
                        Text(
                            text = "Dry matter needed each day",
                            fontSize = 13.sp,
                            color = MintAccent
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${feed.totalDryMatterKg} kg",
                            fontSize = 38.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        // Progress Bar split
                        val maintenanceRatio = (feed.maintenanceKg / feed.totalDryMatterKg).toFloat().coerceIn(0f, 1f)
                        LinearProgressIndicator(
                            progress = { maintenanceRatio },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = AmberGold,
                            trackColor = ForestLight
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Maintenance: ${feed.maintenanceKg} kg",
                                fontSize = 11.sp,
                                color = MintAccent
                            )
                            Text(
                                text = "Milk: ${feed.milkProductionKg} kg",
                                fontSize = 11.sp,
                                color = AmberGold
                            )
                        }
                    }
                }
            }

            // Daily Feed Breakdown Grid
            item {
                Text(
                    text = "Daily Ration Breakdown",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    FeedComponentCard(
                        title = "Green fodder",
                        amount = "${feed.greenFodderKg} kg",
                        note = "Napier, berseem, maize",
                        color = StatusHealthyText,
                        modifier = Modifier.weight(1f)
                    )
                    FeedComponentCard(
                        title = "Dry fodder",
                        amount = "${feed.dryFodderKg} kg",
                        note = "Wheat or paddy straw",
                        color = Color(0xFFB7791F),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    FeedComponentCard(
                        title = "Concentrate",
                        amount = "${feed.concentrateKg} kg",
                        note = "20% protein pellet",
                        color = StatusInfoText,
                        modifier = Modifier.weight(1f)
                    )
                    FeedComponentCard(
                        title = "Minerals",
                        amount = "${feed.mineralsGrams.toInt()} g",
                        note = "Chelated mineral mix",
                        color = Color(0xFF6B21A8),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
fun StatBox(label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            Text(text = label, fontSize = 11.sp, color = TextSecondary)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        }
    }
}

@Composable
fun FeedComponentCard(title: String, amount: String, note: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            Text(text = title, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = color)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = amount, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = note, fontSize = 11.sp, color = TextSecondary)
        }
    }
}

@Composable
fun CareGovtSupportView(
    uiState: AniGuardUiState,
    viewModel: AniGuardViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        item {
            SubViewHeader(title = "Government support", onBack = { viewModel.switchCareSubTab(CareSubTab.OVERVIEW) })
        }

        items(uiState.govtSchemes) { s ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(18.dp)),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(text = s.category, fontSize = 11.sp, color = TextSecondary)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = s.headline,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1A5C30)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = s.name,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = s.description,
                        fontSize = 13.sp,
                        color = TextSecondary,
                        lineHeight = 18.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = s.eligibility,
                        fontSize = 12.sp,
                        color = TextTertiary,
                        lineHeight = 16.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedButton(
                        onClick = {
                            try {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(s.portalUrl))
                                context.startActivity(intent)
                            } catch (_: Exception) {}
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(text = "Open official portal", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
fun CarePlansView(
    uiState: AniGuardUiState,
    viewModel: AniGuardViewModel,
    modifier: Modifier = Modifier
) {
    var billingMonthly by remember { mutableStateOf(true) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        item {
            SubViewHeader(title = "Plans & Subscriptions", onBack = { viewModel.switchCareSubTab(CareSubTab.OVERVIEW) })
        }

        // Toggle Monthly / Yearly
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { billingMonthly = true },
                    shape = RoundedCornerShape(20.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (billingMonthly) ForestDark else Color.White,
                        contentColor = if (billingMonthly) Color.White else TextPrimary
                    ),
                    modifier = Modifier.border(1.dp, if (billingMonthly) ForestDark else CardBorder, RoundedCornerShape(20.dp))
                ) {
                    Text("Monthly", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = { billingMonthly = false },
                    shape = RoundedCornerShape(20.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (!billingMonthly) ForestDark else Color.White,
                        contentColor = if (!billingMonthly) Color.White else TextPrimary
                    ),
                    modifier = Modifier.border(1.dp, if (!billingMonthly) ForestDark else CardBorder, RoundedCornerShape(20.dp))
                ) {
                    Text("Yearly · save 17%", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // AniGuard Pro Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp)),
                colors = CardDefaults.cardColors(containerColor = ForestDark)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(AmberGold)
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text("Most popular", color = ForestDark, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Text("किसान प्रो", color = MintAccent, fontSize = 12.sp)
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text("AniGuard Pro", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (billingMonthly) "₹499/month" else "₹4,990/year",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    val features = listOf(
                        "Unlimited animals & herd logs",
                        "AI disease scanner & symptom triage",
                        "Automated dry matter feed optimizer",
                        "Priority veterinary tele-consultation",
                        "Outbreak early warning SMS alerts"
                    )

                    features.forEach { f ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 4.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = AmberGold, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = f, color = Color.White, fontSize = 13.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    Button(
                        onClick = { /* Upgrade active */ },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(46.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AmberGold,
                            contentColor = ForestDark
                        )
                    ) {
                        Text("Upgrade to Pro", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun SubViewHeader(title: String, onBack: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(
            onClick = onBack,
            modifier = Modifier
                .size(38.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Color.White)
                .border(1.dp, CardBorder, RoundedCornerShape(10.dp))
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint = TextPrimary,
                modifier = Modifier.size(18.dp)
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = title,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )
    }
}
