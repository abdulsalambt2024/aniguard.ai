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
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aniguard.model.ChatMessage
import com.example.aniguard.theme.*
import com.example.aniguard.viewmodel.AniGuardUiState
import com.example.aniguard.viewmodel.AniGuardViewModel

@Composable
fun AskScreen(
    uiState: AniGuardUiState,
    viewModel: AniGuardViewModel,
    modifier: Modifier = Modifier
) {
    var textInput by remember { mutableStateOf("") }
    val suggestionPrompts = listOf("Udder swelling", "Goat with fever", "Not eating", "Reduced milk yield")

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        // Top Header
        Column(modifier = Modifier.padding(top = 16.dp, bottom = 10.dp)) {
            Text(
                text = "Ask Agri-Advisor",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "Instant veterinary & husbandry AI triage",
                fontSize = 14.sp,
                color = TextSecondary
            )
        }

        // Suggestion Chips
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(bottom = 12.dp)
        ) {
            items(suggestionPrompts) { prompt ->
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.White)
                        .border(1.dp, CardBorder, RoundedCornerShape(20.dp))
                        .clickable { viewModel.sendChatMessage(prompt) }
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = prompt,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = ForestDark
                    )
                }
            }
        }

        // Messages Thread
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(bottom = 12.dp)
        ) {
            items(uiState.chatMessages) { msg ->
                ChatMessageItem(message = msg)
            }
        }

        // Bottom Input Row
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 80.dp),
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = textInput,
                    onValueChange = { textInput = it },
                    placeholder = {
                        Text(
                            text = "Describe symptom or question…",
                            fontSize = 13.sp,
                            color = TextTertiary
                        )
                    },
                    modifier = Modifier
                        .weight(1f)
                        .testTag("chat_input_field"),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedBorderColor = Color.Transparent,
                        unfocusedBorderColor = Color.Transparent
                    ),
                    singleLine = false,
                    maxLines = 3
                )

                IconButton(
                    onClick = {
                        if (textInput.isNotBlank()) {
                            viewModel.sendChatMessage(textInput)
                            textInput = ""
                        }
                    },
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(ForestDark)
                        .testTag("chat_send_button")
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = "Send",
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun ChatMessageItem(message: ChatMessage) {
    if (message.isUser) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            Box(
                modifier = Modifier
                    .widthIn(max = 280.dp)
                    .clip(RoundedCornerShape(18.dp, 18.dp, 4.dp, 18.dp))
                    .background(ForestDark)
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Text(
                    text = message.text,
                    color = Color.White,
                    fontSize = 14.sp
                )
            }
        }
    } else {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Start
        ) {
            Column(modifier = Modifier.widthIn(max = 330.dp)) {
                if (message.text.isNotBlank()) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(18.dp, 18.dp, 18.dp, 4.dp))
                            .background(Color.White)
                            .border(1.dp, CardBorder, RoundedCornerShape(18.dp, 18.dp, 18.dp, 4.dp))
                            .padding(horizontal = 14.dp, vertical = 10.dp)
                    ) {
                        Text(
                            text = message.text,
                            color = TextPrimary,
                            fontSize = 14.sp
                        )
                    }
                }

                if (message.structured != null) {
                    val s = message.structured
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
                                .padding(14.dp)
                        ) {
                            Text(
                                text = s.summary,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary
                            )

                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Could be:",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = AmberDark
                            )
                            s.couldBe.forEach { item ->
                                Text(
                                    text = "• $item",
                                    fontSize = 12.sp,
                                    color = TextSecondary,
                                    modifier = Modifier.padding(start = 4.dp, top = 2.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Do now:",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = ForestMedium
                            )
                            s.doNow.forEachIndexed { idx, step ->
                                Text(
                                    text = "${idx + 1}. $step",
                                    fontSize = 12.sp,
                                    color = TextPrimary,
                                    modifier = Modifier.padding(start = 4.dp, top = 2.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(StatusCriticalBg)
                                    .padding(10.dp)
                            ) {
                                Text(
                                    text = "Call vet if: ${s.callVetIf}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = StatusCriticalText
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
