use crate::models::ScheduleRule;
use chrono::{DateTime, Datelike, Local, NaiveTime, Timelike};

fn parse_time(s: &str) -> Option<NaiveTime> {
    NaiveTime::parse_from_str(s, "%H:%M").ok()
}
pub fn matching_rule<'a>(
    rules: &'a [ScheduleRule],
    now: DateTime<Local>,
) -> Option<&'a ScheduleRule> {
    let day = now.weekday().num_days_from_monday();
    let previous_day = (day + 6) % 7;
    let clock = NaiveTime::from_hms_opt(now.hour(), now.minute(), now.second())?;
    rules
        .iter()
        .filter(|r| r.enabled)
        .filter(|r| {
            let Some(start) = parse_time(&r.start) else {
                return false;
            };
            let Some(end) = parse_time(&r.end) else {
                return false;
            };
            if start < end {
                r.weekdays.contains(&day) && clock >= start && clock < end
            } else if start > end {
                (r.weekdays.contains(&day) && clock >= start)
                    || (r.weekdays.contains(&previous_day) && clock < end)
            } else {
                false
            }
        })
        .max_by(|a, b| a.priority.cmp(&b.priority).then_with(|| b.id.cmp(&a.id)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{LocalResult, TimeZone};
    fn at(y: i32, m: u32, d: u32, h: u32) -> DateTime<Local> {
        match Local.with_ymd_and_hms(y, m, d, h, 0, 0) {
            LocalResult::Single(dt) => dt,
            LocalResult::Ambiguous(dt, _) => dt,
            LocalResult::None => panic!("non-existent local hour"),
        }
    }
    fn rule(id: &str, start: &str, end: &str, priority: u8) -> ScheduleRule {
        ScheduleRule {
            id: id.into(),
            profile_id: "reading".into(),
            weekdays: (0..7).collect(),
            start: start.into(),
            end: end.into(),
            priority,
            enabled: true,
        }
    }
    #[test]
    fn picks_highest_priority_and_stable_tiebreak() {
        let rules = vec![
            rule("z", "08:00", "17:00", 4),
            rule("a", "08:00", "17:00", 4),
            rule("lower", "08:00", "17:00", 1),
        ];
        assert_eq!(matching_rule(&rules, at(2026, 10, 15, 12)).unwrap().id, "a");
    }
    #[test]
    fn overnight_rules_use_previous_day() {
        let rules = vec![rule("night", "22:00", "07:00", 3)];
        assert!(matching_rule(&rules, at(2026, 10, 15, 2)).is_some());
        assert!(matching_rule(&rules, at(2026, 10, 15, 14)).is_none());
    }
}
