package com.example.aniguard.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
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
import com.example.aniguard.model.AnimalSpecies
import com.example.aniguard.theme.*
import com.example.aniguard.ui.components.AnimalCard
import com.example.aniguard.viewmodel.AniGuardUiState
import com.example.aniguard.viewmodel.AniGuardViewModel

@Composable
fun HerdScreen(
    uiState: AniGuardUiState,
    viewModel: AniGuardViewModel,
    modifier: Modifier = Modifier
) {
    val filters = listOf("All", "Cows", "Buffalo", "Goats")

    val filteredAnimals = uiState.animals.filter { a ->
        val query = uiState.searchQuery.trim().lowercase()
        val matchesQuery = query.isEmpty() ||
                a.name.lowercase().contains(query) ||
                a.tagId.lowercase().contains(query) ||
                a.breed.lowercase().contains(query)

        val matchesFilter = when (uiState.speciesFilter) {
            "Cows" -> a.species == AnimalSpecies.COW
            "Buffalo" -> a.species == AnimalSpecies.BUFFALO
            "Goats" -> a.species == AnimalSpecies.GOAT
            else -> true
        }

        matchesQuery && matchesFilter
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.toggleAddAnimalDialog(true) },
                containerColor = AmberGold,
                contentColor = ForestDark,
                modifier = Modifier
                    .padding(bottom = 72.dp)
                    .testTag("fab_add_animal")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Add Animal")
            }
        },
        containerColor = Color.Transparent
    ) { padding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
        ) {
            // Title Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Your herd",
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "${uiState.animals.size} animals · ${uiState.totalMilkToday} L today",
                            fontSize = 14.sp,
                            color = TextSecondary
                        )
                    }

                    Button(
                        onClick = { viewModel.toggleAddAnimalDialog(true) },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ForestDark,
                            contentColor = Color.White
                        ),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                        modifier = Modifier.testTag("btn_add_animal_header")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = "Add", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Search Bar
            item {
                OutlinedTextField(
                    value = uiState.searchQuery,
                    onValueChange = { viewModel.setSearchQuery(it) },
                    placeholder = {
                        Text(text = "Search by name, tag, or breed…", fontSize = 13.sp, color = TextTertiary)
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Search",
                            tint = TextSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("herd_search_input"),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.White,
                        unfocusedContainerColor = Color.White,
                        focusedBorderColor = ForestDark,
                        unfocusedBorderColor = CardBorder
                    ),
                    singleLine = true
                )
            }

            // Filter Tabs
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(filters) { filter ->
                        val isSelected = uiState.speciesFilter == filter
                        Box(
                            modifier = Modifier
                                .testTag("filter_pill_$filter")
                                .clip(RoundedCornerShape(20.dp))
                                .background(if (isSelected) ForestDark else Color.White)
                                .border(
                                    1.dp,
                                    if (isSelected) ForestDark else CardBorder,
                                    RoundedCornerShape(20.dp)
                                )
                                .clickable { viewModel.setSpeciesFilter(filter) }
                                .padding(horizontal = 16.dp, vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = filter,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isSelected) Color.White else TextPrimary
                            )
                        }
                    }
                }
            }

            // Animals List
            if (filteredAnimals.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "No animals found",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = TextPrimary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Try clearing the search or changing the species filter.",
                                fontSize = 12.sp,
                                color = TextSecondary
                            )
                        }
                    }
                }
            } else {
                items(filteredAnimals) { animal ->
                    AnimalCard(
                        animal = animal,
                        onClick = { viewModel.selectAnimalForDetail(animal) }
                    )
                }
            }
        }
    }
}
