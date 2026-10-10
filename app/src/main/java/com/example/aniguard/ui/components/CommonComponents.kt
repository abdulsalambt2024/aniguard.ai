package com.example.aniguard.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.example.aniguard.model.Animal
import com.example.aniguard.model.HealthAlert
import com.example.aniguard.model.HealthStatus
import com.example.aniguard.theme.*

@Composable
fun StatusBadge(
    status: HealthStatus,
    modifier: Modifier = Modifier
) {
    val (bg, textColor) = when (status) {
        HealthStatus.HEALTHY -> StatusHealthyBg to StatusHealthyText
        HealthStatus.WATCH -> StatusSickBg to StatusSickText
        HealthStatus.SICK -> StatusSickBg to StatusSickText
        HealthStatus.CRITICAL -> StatusCriticalBg to StatusCriticalText
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = status.label,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
fun AnimalCard(
    animal: Animal,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val (avatarBg, avatarText) = when (animal.healthStatus) {
        HealthStatus.HEALTHY -> StatusHealthyBg to StatusHealthyText
        HealthStatus.WATCH, HealthStatus.SICK -> StatusSickBg to StatusSickText
        HealthStatus.CRITICAL -> StatusCriticalBg to StatusCriticalText
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .testTag("animal_card_${animal.id}")
            .clip(RoundedCornerShape(18.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(avatarBg),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = animal.initial,
                    color = avatarText,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Details
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = animal.name,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "· ${animal.tagId}",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "${animal.breed} · ${animal.ageYears} yrs",
                    fontSize = 12.sp,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "${animal.dailyMilkLiters} L/day",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = ForestMedium
                )
            }

            // Health Status & Score Pill
            Column(horizontalAlignment = Alignment.End) {
                StatusBadge(status = animal.healthStatus)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${animal.currentHealthScore}%",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = when (animal.healthStatus) {
                        HealthStatus.HEALTHY -> StatusHealthyText
                        HealthStatus.WATCH, HealthStatus.SICK -> StatusSickText
                        HealthStatus.CRITICAL -> StatusCriticalText
                    }
                )
            }
        }
    }
}

@Composable
fun AlertCard(
    alert: HealthAlert,
    onActionClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isUrgent = alert.severity.equals("Urgent", ignoreCase = true) || alert.severity.equals("Critical", ignoreCase = true)
    val pillBg = if (isUrgent) StatusCriticalBg else StatusSickBg
    val pillText = if (isUrgent) StatusCriticalText else StatusSickText

    Card(
        modifier = modifier
            .fillMaxWidth()
            .testTag("alert_card_${alert.id}")
            .clip(RoundedCornerShape(18.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(18.dp)),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header: Severity badge + Animal Tag
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(pillBg)
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = alert.severity,
                        color = pillText,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Text(
                    text = "${alert.animalName} · ${alert.tagId}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = TextSecondary
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Title
            Text(
                text = alert.title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Description
            Text(
                text = alert.description,
                fontSize = 13.sp,
                color = TextSecondary,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Next step note
            Text(
                text = alert.nextStep,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = if (isUrgent) StatusCriticalText else ForestMedium
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Action Button
            Button(
                onClick = onActionClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp)
                    .testTag("alert_action_button_${alert.id}"),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isUrgent) AmberGold else ForestDark,
                    contentColor = if (isUrgent) ForestDark else Color.White
                )
            ) {
                Text(
                    text = alert.actionLabel,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
            }
        }
    }
}
