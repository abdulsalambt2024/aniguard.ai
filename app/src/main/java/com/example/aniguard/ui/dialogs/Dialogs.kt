package com.example.aniguard.ui.dialogs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Warning
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
import androidx.compose.ui.window.Dialog
import com.example.aniguard.model.Animal
import com.example.aniguard.model.AnimalSpecies
import com.example.aniguard.theme.*
import com.example.aniguard.ui.components.StatusBadge
import com.example.aniguard.viewmodel.AniGuardViewModel

@Composable
fun AddAnimalDialog(
    onDismiss: () -> Unit,
    onConfirm: (name: String, species: AnimalSpecies, breed: String, age: Int, tagId: String, dailyMilk: Double) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var tagId by remember { mutableStateOf("") }
    var breed by remember { mutableStateOf("") }
    var ageStr by remember { mutableStateOf("3") }
    var dailyMilkStr by remember { mutableStateOf("12.0") }
    var selectedSpecies by remember { mutableStateOf(AnimalSpecies.COW) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("add_animal_dialog"),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Add New Animal",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                    }
                }

                // Species selector pills
                Text(text = "Species", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = TextSecondary)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    AnimalSpecies.entries.forEach { sp ->
                        val isSelected = selectedSpecies == sp
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) ForestDark else WarmBackground)
                                .clickable { selectedSpecies = sp }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = sp.label,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else TextPrimary
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Animal Name (e.g. Ganga)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = tagId,
                    onValueChange = { tagId = it },
                    label = { Text("Tag ID (e.g. IN-GJ-1099)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = breed,
                    onValueChange = { breed = it },
                    label = { Text("Breed (e.g. Gir / Murrah)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = ageStr,
                        onValueChange = { ageStr = it },
                        label = { Text("Age (yrs)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = dailyMilkStr,
                        onValueChange = { dailyMilkStr = it },
                        label = { Text("Milk (L/day)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Button(
                    onClick = {
                        val age = ageStr.toIntOrNull() ?: 3
                        val milk = dailyMilkStr.toDoubleOrNull() ?: 10.0
                        if (name.isNotBlank()) {
                            onConfirm(name, selectedSpecies, breed.ifBlank { "Indigenous" }, age, tagId, milk)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .testTag("submit_add_animal_button"),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ForestDark)
                ) {
                    Text("Register Animal", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun DailyLogDialog(
    animals: List<Animal>,
    onDismiss: () -> Unit,
    onConfirm: (animalId: String, morningMilk: Double, eveningMilk: Double, temp: Double, appetite: String, feces: String, notes: String) -> Unit
) {
    var selectedAnimalId by remember { mutableStateOf(animals.firstOrNull()?.id ?: "") }
    var morningMilk by remember { mutableStateOf("9.0") }
    var eveningMilk by remember { mutableStateOf("8.5") }
    var temperature by remember { mutableStateOf("38.6") }
    var appetite by remember { mutableStateOf("Normal") }
    var feces by remember { mutableStateOf("Normal") }
    var notes by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("daily_log_dialog"),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Log Daily Vitals",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Text(text = "Select Animal", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = TextSecondary)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    animals.take(4).forEach { animal ->
                        val isSelected = selectedAnimalId == animal.id
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) ForestDark else WarmBackground)
                                .clickable { selectedAnimalId = animal.id }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = animal.name,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else TextPrimary
                            )
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = morningMilk,
                        onValueChange = { morningMilk = it },
                        label = { Text("Morning (L)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = eveningMilk,
                        onValueChange = { eveningMilk = it },
                        label = { Text("Evening (L)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                }

                OutlinedTextField(
                    value = temperature,
                    onValueChange = { temperature = it },
                    label = { Text("Temp (°C, Normal 38.3-39.2)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Text(text = "Appetite", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = TextSecondary)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("Normal", "Reduced", "Anorexic").forEach { app ->
                        val isSelected = appetite == app
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) AmberGold else WarmBackground)
                                .clickable { appetite = app }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = app,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) ForestDark else TextPrimary
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Farmer notes (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = false,
                    maxLines = 2
                )

                Button(
                    onClick = {
                        val m = morningMilk.toDoubleOrNull() ?: 0.0
                        val e = eveningMilk.toDoubleOrNull() ?: 0.0
                        val t = temperature.toDoubleOrNull() ?: 38.6
                        onConfirm(selectedAnimalId, m, e, t, appetite, feces, notes)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .testTag("submit_daily_log_button"),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ForestDark)
                ) {
                    Text("Save Daily Record", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun AnimalDetailDialog(
    animal: Animal,
    onDismiss: () -> Unit,
    onRemoveAnimal: (String) -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("animal_detail_dialog"),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = animal.name,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "${animal.species.label} · ${animal.tagId}",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                    }
                    StatusBadge(status = animal.healthStatus)
                }

                Divider(color = CardBorder)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    DetailItem(label = "Breed", value = animal.breed)
                    DetailItem(label = "Age", value = "${animal.ageYears} yrs")
                    DetailItem(label = "Weight", value = "${animal.weightKg.toInt()} kg")
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    DetailItem(label = "Daily Milk", value = "${animal.dailyMilkLiters} L")
                    DetailItem(label = "Health Score", value = "${animal.currentHealthScore}/100")
                    DetailItem(
                        label = "Pregnancy",
                        value = if (animal.pregnancyStatus) "Month ${animal.pregnancyMonth ?: 1}" else "Not pregnant"
                    )
                }

                DetailItem(label = "Lactation Stage", value = animal.lactationStage)

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Close")
                    }
                    Button(
                        onClick = {
                            onRemoveAnimal(animal.id)
                            onDismiss()
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = StatusCriticalText),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Remove")
                    }
                }
            }
        }
    }
}

@Composable
fun DetailItem(label: String, value: String) {
    Column {
        Text(text = label, fontSize = 11.sp, color = TextSecondary)
        Spacer(modifier = Modifier.height(2.dp))
        Text(text = value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
    }
}

@Composable
fun EmergencyTriageDialog(
    onDismiss: () -> Unit,
    onRunTriage: (symptoms: List<String>, tempHigher: Boolean) -> Unit,
    severityResult: String?,
    adviceResult: String?,
    onClearResult: () -> Unit
) {
    val symptomOptions = listOf(
        "Blisters on mouth or hooves",
        "Rectal temperature > 39.5°C",
        "Bloody milk or diarrhoea",
        "Swollen throat or brisket",
        "Loss of appetite & rapid breathing",
        "Animal unable to stand (downer cow)"
    )
    val selectedSymptoms = remember { mutableStateListOf<String>() }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("emergency_triage_dialog"),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = StatusCriticalText,
                            modifier = Modifier.size(22.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Emergency Triage",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                    }
                }

                if (severityResult == null) {
                    Text(
                        text = "Select any critical symptoms observed for instant AI triage:",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )

                    symptomOptions.forEach { symptom ->
                        val checked = selectedSymptoms.contains(symptom)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (checked) StatusCriticalBg else WarmBackground)
                                .clickable {
                                    if (checked) selectedSymptoms.remove(symptom) else selectedSymptoms.add(symptom)
                                }
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Checkbox(
                                checked = checked,
                                onCheckedChange = {
                                    if (it) selectedSymptoms.add(symptom) else selectedSymptoms.remove(symptom)
                                }
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = symptom,
                                fontSize = 12.sp,
                                fontWeight = if (checked) FontWeight.Bold else FontWeight.Normal,
                                color = if (checked) StatusCriticalText else TextPrimary
                            )
                        }
                    }

                    Button(
                        onClick = {
                            val tempHigh = selectedSymptoms.any { it.contains("39.5") }
                            onRunTriage(selectedSymptoms.toList(), tempHigh)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp)
                            .testTag("submit_triage_button"),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = StatusCriticalText)
                    ) {
                        Text("Analyze Emergency Risk", fontWeight = FontWeight.Bold)
                    }
                } else {
                    // Result View
                    val isEmergency = severityResult == "EMERGENCY"
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (isEmergency) StatusCriticalBg else StatusSickBg)
                            .padding(14.dp)
                    ) {
                        Column {
                            Text(
                                text = "Severity Level: $severityResult",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isEmergency) StatusCriticalText else StatusSickText
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = adviceResult ?: "",
                                fontSize = 13.sp,
                                color = TextPrimary,
                                lineHeight = 18.sp
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = onClearResult,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("New Triage")
                        }
                        Button(
                            onClick = onDismiss,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ForestDark)
                        ) {
                            Text("Done")
                        }
                    }
                }
            }
        }
    }
}
