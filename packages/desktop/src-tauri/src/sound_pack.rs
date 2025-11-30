//! Sound Pack module
//!
//! Handles sound pack loading, rules evaluation, and sound selection.

use log::info;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A sound source - either a file path or URL
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum SoundSource {
    File { path: String },
    Url { url: String },
}

/// A single sound entry with volume and metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SoundEntry {
    pub id: String,
    pub source: SoundSource,
    #[serde(default = "default_volume")]
    pub volume: f32,
    pub weight: Option<f32>,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

fn default_volume() -> f32 {
    1.0
}

fn default_enabled() -> bool {
    true
}

/// How to select from multiple sounds
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum SelectionMode {
    #[default]
    Random,
    Sequential,
    Weighted,
}

/// A pool of sounds with selection behavior
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SoundPool {
    #[serde(default)]
    pub sounds: Vec<SoundEntry>,
    #[serde(default)]
    pub selection_mode: SelectionMode,
}

impl SoundPool {
    /// Select a sound from the pool based on the selection mode
    pub fn select_sound(&self) -> Option<&SoundEntry> {
        let enabled_sounds: Vec<_> = self.sounds.iter().filter(|s| s.enabled).collect();
        if enabled_sounds.is_empty() {
            return None;
        }

        match self.selection_mode {
            SelectionMode::Random => {
                use rand::Rng;
                let mut rng = rand::rng();
                let idx = rng.random_range(0..enabled_sounds.len());
                enabled_sounds.get(idx).copied()
            }
            SelectionMode::Sequential => {
                // For sequential, we'd need state tracking - just return first for now
                enabled_sounds.first().copied()
            }
            SelectionMode::Weighted => {
                use rand::Rng;
                let total_weight: f32 = enabled_sounds
                    .iter()
                    .map(|s| s.weight.unwrap_or(1.0))
                    .sum();
                if total_weight <= 0.0 {
                    return enabled_sounds.first().copied();
                }
                let mut rng = rand::rng();
                let mut target: f32 = rng.random_range(0.0..total_weight);
                for sound in &enabled_sounds {
                    target -= sound.weight.unwrap_or(1.0);
                    if target <= 0.0 {
                        return Some(sound);
                    }
                }
                enabled_sounds.last().copied()
            }
        }
    }
}

/// Rule condition types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum RuleCondition {
    Player {
        field: PlayerField,
        players: Vec<String>,
        #[serde(default)]
        include_local_player: bool,
    },
    Champion {
        field: ChampionField,
        champions: Vec<String>,
    },
    Multikill {
        kill_types: Vec<MultikillType>,
    },
    Objective {
        objectives: Vec<ObjectiveType>,
    },
    DragonType {
        dragons: Vec<DragonKind>,
    },
    Stolen {
        is_stolen: bool,
    },
    Team {
        team: TeamType,
    },
    GameResult {
        result: GameResult,
    },
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum PlayerField {
    Killer,
    Victim,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ChampionField {
    KillerChampion,
    VictimChampion,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum MultikillType {
    Double,
    Triple,
    Quadra,
    Penta,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ObjectiveType {
    Tower,
    Inhibitor,
    Dragon,
    Baron,
    Herald,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum DragonKind {
    Infernal,
    Mountain,
    Ocean,
    Cloud,
    Hextech,
    Chemtech,
    Elder,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum TeamType {
    Ally,
    Enemy,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum GameResult {
    Victory,
    Defeat,
}

/// How conditions are combined
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum ConditionLogic {
    #[default]
    All,
    Any,
}

/// A sound rule with conditions and sounds
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SoundRule {
    pub id: String,
    pub name: String,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_priority")]
    pub priority: u32,
    #[serde(default)]
    pub conditions: Vec<RuleCondition>,
    #[serde(default)]
    pub condition_logic: ConditionLogic,
    #[serde(default)]
    pub sounds: SoundPool,
}

fn default_priority() -> u32 {
    50
}

/// Event types that can trigger sounds
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum EventType {
    GameStart,
    GameEnd,
    FirstBlood,
    Kill,
    MultiKill,
    Objective,
    Ace,
}

/// Sound pack settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SoundPackSettings {
    #[serde(default = "default_volume")]
    pub master_volume: f32,
    #[serde(default = "default_enabled")]
    pub normalization: bool,
}

impl Default for SoundPackSettings {
    fn default() -> Self {
        Self {
            master_volume: 1.0,
            normalization: true,
        }
    }
}

/// A complete sound pack
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SoundPack {
    pub id: String,
    pub name: String,
    #[serde(default = "default_version")]
    pub version: String,
    pub author: Option<String>,
    pub description: Option<String>,
    #[serde(default)]
    pub settings: SoundPackSettings,
    #[serde(default)]
    pub defaults: HashMap<EventType, SoundPool>,
    #[serde(default)]
    pub rules: Vec<SoundRule>,
}

fn default_version() -> String {
    "1.0.0".to_string()
}

impl Default for SoundPack {
    fn default() -> Self {
        Self {
            id: "default".to_string(),
            name: "Default Sound Pack".to_string(),
            version: "1.0.0".to_string(),
            author: None,
            description: None,
            settings: SoundPackSettings::default(),
            defaults: HashMap::new(),
            rules: Vec::new(),
        }
    }
}

/// Context for evaluating rules
#[derive(Debug, Clone, Default)]
pub struct EventContext {
    /// The type of event
    pub event_type: Option<EventType>,
    /// Killer's summoner name
    pub killer_name: Option<String>,
    /// Victim's summoner name
    pub victim_name: Option<String>,
    /// Killer's champion
    pub killer_champion: Option<String>,
    /// Victim's champion
    pub victim_champion: Option<String>,
    /// Whether the killer is the local player
    pub killer_is_local: bool,
    /// Whether the victim is the local player
    pub victim_is_local: bool,
    /// Multi-kill type (if applicable)
    pub multikill_type: Option<MultikillType>,
    /// Objective type (if applicable)
    pub objective_type: Option<ObjectiveType>,
    /// Dragon type (if applicable)
    pub dragon_type: Option<DragonKind>,
    /// Whether the objective was stolen
    pub is_stolen: bool,
    /// Whether the killer/actor is on the ally team
    pub is_ally_team: bool,
    /// Game result (if applicable)
    pub game_result: Option<GameResult>,
    /// Local player's summoner name
    pub local_player_name: Option<String>,
}

impl SoundPack {
    /// Evaluate rules and find the best matching sound for an event
    pub fn select_sound_for_event(&self, context: &EventContext) -> Option<(&SoundEntry, f32)> {
        // Sort rules by priority (highest first)
        let mut rules: Vec<_> = self.rules.iter().filter(|r| r.enabled).collect();
        rules.sort_by(|a, b| b.priority.cmp(&a.priority));

        // Try each rule in priority order
        for rule in rules {
            if self.rule_matches(rule, context) {
                if let Some(sound) = rule.sounds.select_sound() {
                    let volume = sound.volume * self.settings.master_volume;
                    info!(
                        "Rule '{}' matched, selected sound '{}' with volume {}",
                        rule.name, sound.id, volume
                    );
                    return Some((sound, volume));
                }
            }
        }

        // Fall back to default sounds
        if let Some(event_type) = context.event_type {
            if let Some(pool) = self.defaults.get(&event_type) {
                if let Some(sound) = pool.select_sound() {
                    let volume = sound.volume * self.settings.master_volume;
                    info!(
                        "Using default sound '{}' for {:?} with volume {}",
                        sound.id, event_type, volume
                    );
                    return Some((sound, volume));
                }
            }
        }

        None
    }

    /// Check if a rule matches the given context
    fn rule_matches(&self, rule: &SoundRule, context: &EventContext) -> bool {
        if rule.conditions.is_empty() {
            return false;
        }

        match rule.condition_logic {
            ConditionLogic::All => rule
                .conditions
                .iter()
                .all(|c| self.condition_matches(c, context)),
            ConditionLogic::Any => rule
                .conditions
                .iter()
                .any(|c| self.condition_matches(c, context)),
        }
    }

    /// Check if a single condition matches
    fn condition_matches(&self, condition: &RuleCondition, context: &EventContext) -> bool {
        match condition {
            RuleCondition::Player {
                field,
                players,
                include_local_player,
            } => {
                let target_name = match field {
                    PlayerField::Killer => &context.killer_name,
                    PlayerField::Victim => &context.victim_name,
                };

                let is_local = match field {
                    PlayerField::Killer => context.killer_is_local,
                    PlayerField::Victim => context.victim_is_local,
                };

                // Check if local player matches
                if *include_local_player && is_local {
                    return true;
                }

                // Check if name is in the list
                if let Some(name) = target_name {
                    players.iter().any(|p| p.eq_ignore_ascii_case(name))
                } else {
                    false
                }
            }
            RuleCondition::Champion { field, champions } => {
                let target_champion = match field {
                    ChampionField::KillerChampion => &context.killer_champion,
                    ChampionField::VictimChampion => &context.victim_champion,
                };

                if let Some(champ) = target_champion {
                    champions.iter().any(|c| c.eq_ignore_ascii_case(champ))
                } else {
                    false
                }
            }
            RuleCondition::Multikill { kill_types } => {
                if let Some(mt) = context.multikill_type {
                    kill_types.contains(&mt)
                } else {
                    false
                }
            }
            RuleCondition::Objective { objectives } => {
                if let Some(obj) = context.objective_type {
                    objectives.contains(&obj)
                } else {
                    false
                }
            }
            RuleCondition::DragonType { dragons } => {
                if let Some(dt) = context.dragon_type {
                    dragons.contains(&dt)
                } else {
                    false
                }
            }
            RuleCondition::Stolen { is_stolen } => context.is_stolen == *is_stolen,
            RuleCondition::Team { team } => match team {
                TeamType::Ally => context.is_ally_team,
                TeamType::Enemy => !context.is_ally_team,
            },
            RuleCondition::GameResult { result } => {
                if let Some(gr) = context.game_result {
                    gr == *result
                } else {
                    false
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sound_pool_random_selection() {
        let pool = SoundPool {
            sounds: vec![
                SoundEntry {
                    id: "test1".to_string(),
                    source: SoundSource::File {
                        path: "test1.mp3".to_string(),
                    },
                    volume: 1.0,
                    weight: None,
                    enabled: true,
                },
                SoundEntry {
                    id: "test2".to_string(),
                    source: SoundSource::File {
                        path: "test2.mp3".to_string(),
                    },
                    volume: 1.0,
                    weight: None,
                    enabled: true,
                },
            ],
            selection_mode: SelectionMode::Random,
        };

        // Should return a sound
        let selected = pool.select_sound();
        assert!(selected.is_some());
    }

    #[test]
    fn test_empty_pool_returns_none() {
        let pool = SoundPool::default();
        assert!(pool.select_sound().is_none());
    }

    #[test]
    fn test_disabled_sounds_not_selected() {
        let pool = SoundPool {
            sounds: vec![SoundEntry {
                id: "disabled".to_string(),
                source: SoundSource::File {
                    path: "test.mp3".to_string(),
                },
                volume: 1.0,
                weight: None,
                enabled: false,
            }],
            selection_mode: SelectionMode::Random,
        };

        assert!(pool.select_sound().is_none());
    }

    #[test]
    fn test_rule_condition_player_match() {
        let pack = SoundPack::default();

        let condition = RuleCondition::Player {
            field: PlayerField::Killer,
            players: vec!["TestPlayer".to_string()],
            include_local_player: false,
        };

        let context = EventContext {
            killer_name: Some("TestPlayer".to_string()),
            ..Default::default()
        };

        assert!(pack.condition_matches(&condition, &context));
    }

    #[test]
    fn test_rule_condition_local_player() {
        let pack = SoundPack::default();

        let condition = RuleCondition::Player {
            field: PlayerField::Killer,
            players: vec![],
            include_local_player: true,
        };

        let context = EventContext {
            killer_is_local: true,
            ..Default::default()
        };

        assert!(pack.condition_matches(&condition, &context));
    }

    #[test]
    fn test_multikill_condition() {
        let pack = SoundPack::default();

        let condition = RuleCondition::Multikill {
            kill_types: vec![MultikillType::Penta],
        };

        let context = EventContext {
            multikill_type: Some(MultikillType::Penta),
            ..Default::default()
        };

        assert!(pack.condition_matches(&condition, &context));
    }
}
