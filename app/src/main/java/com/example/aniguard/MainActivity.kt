package com.example.aniguard

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.example.aniguard.theme.AniGuardTheme
import com.example.aniguard.ui.AniGuardApp
import com.example.aniguard.viewmodel.AniGuardViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: AniGuardViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AniGuardTheme {
                AniGuardApp(viewModel = viewModel)
            }
        }
    }
}
