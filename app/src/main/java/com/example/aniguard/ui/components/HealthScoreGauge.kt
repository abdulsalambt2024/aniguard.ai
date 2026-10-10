package com.example.aniguard.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aniguard.theme.AmberGold
import com.example.aniguard.theme.ForestLight

@Composable
fun HealthScoreGauge(
    score: Int,
    modifier: Modifier = Modifier,
    size: Dp = 80.dp,
    strokeWidth: Dp = 8.dp,
    trackColor: Color = ForestLight,
    progressColor: Color = AmberGold
) {
    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val stroke = Stroke(width = strokeWidth.toPx(), cap = StrokeCap.Round)
            // Background full track circle
            drawArc(
                color = trackColor,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                style = stroke
            )
            // Progress sweep
            val sweep = (score.coerceIn(0, 100) / 100f) * 360f
            drawArc(
                color = progressColor,
                startAngle = -90f,
                sweepAngle = sweep,
                useCenter = false,
                style = stroke
            )
        }
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "$score",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                lineHeight = 22.sp
            )
            Text(
                text = "herd health",
                fontSize = 9.sp,
                fontWeight = FontWeight.Medium,
                color = Color(0xFFA5C9B4),
                lineHeight = 10.sp
            )
        }
    }
}
