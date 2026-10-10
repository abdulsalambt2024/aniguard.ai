package com.example.aniguard.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = ForestDark,
    onPrimary = TextOnDark,
    primaryContainer = ForestMedium,
    onPrimaryContainer = TextOnDark,
    secondary = AmberGold,
    onSecondary = ForestDark,
    secondaryContainer = AmberLight,
    onSecondaryContainer = AmberDark,
    tertiary = MintAccent,
    background = WarmBackground,
    onBackground = TextPrimary,
    surface = WarmSurface,
    onSurface = TextPrimary,
    surfaceVariant = WarmBackground,
    onSurfaceVariant = TextSecondary,
    outline = CardBorder
)

private val DarkColorScheme = darkColorScheme(
    primary = MintAccent,
    onPrimary = ForestDark,
    primaryContainer = ForestMedium,
    onPrimaryContainer = TextOnDark,
    secondary = AmberGold,
    onSecondary = ForestDark,
    background = ForestDark,
    onBackground = TextOnDark,
    surface = ForestMedium,
    onSurface = TextOnDark,
    outline = ForestLight
)

@Composable
fun AniGuardTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = ForestDark.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
