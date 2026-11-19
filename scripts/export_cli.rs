use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, OpenOptions};
use std::io::{BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::time::Instant;
use tokio::process::Command;

// =========================================================================
// CONFIGURABLE PATH VARIABLES
// =========================================================================
const OUTPUT_DIR: &str = "/media/work/fragments/target";
const PROCESSED_JSON_DIR: &str = "/media/work/fragments/processed";
const VIDEO_SEARCH_DIR: &str = "/mnt/big_archive/performances";
const SEED_SQL_PATH: &str = "/home/andres/code/web/seed.sql";

const BASE62_ALPHABET: &[u8] = b"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// =========================================================================
// LENS PROFILE DICTIONARY (CONFIGURED DIRECTLY FROM JSON)
// =========================================================================
#[derive(Debug, Clone, Copy)]
pub struct LensProfile {
    pub name: &'static str,
    pub zoom_factor: f64,
}

fn get_lens_profile(lens_key: &str) -> LensProfile {
    let clean = lens_key.trim().to_lowercase();
    match clean.as_str() {
        "vilmos" | "1.5" | "1.55" => LensProfile {
            name: "Vilmos (Anamorphic 1.55x)",
            zoom_factor: 1.55,
        },
        "vittorio" | "1.3" | "1.33" => LensProfile {
            name: "Vittorio (Anamorphic 1.33x)",
            zoom_factor: 1.3333,
        },
        "roger" | "1.0" | "normal" => LensProfile {
            name: "Roger (Spherical 1.0x)",
            zoom_factor: 1.0,
        },
        _ => LensProfile {
            name: "Default (Spherical 1.0x)",
            zoom_factor: 1.0,
        },
    }
}

// =========================================================================
// STRUCTS
// =========================================================================

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct ScreenshotConfig {
    pub time: f64,
    #[serde(default)]
    pub offset: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct ExpectedFile {
    pub path: String,
    pub category: String,
    pub estimated_bytes: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct OutputSummary {
    pub total_files: usize,
    pub total_estimated_bytes: u64,
    pub files: Vec<ExpectedFile>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct OutputMarkers {
    #[serde(default, deserialize_with = "deserialize_flexible_lens")]
    pub lens: String,
    pub markers: Vec<f64>,
    #[serde(default, deserialize_with = "deserialize_screenshots")]
    pub screenshots: HashMap<usize, ScreenshotConfig>,
    #[serde(default)]
    pub summary: Option<OutputSummary>,
}

fn deserialize_flexible_lens<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum LensValue {
        Str(String),
        Num(f64),
    }

    match LensValue::deserialize(deserializer) {
        Ok(LensValue::Str(s)) => Ok(s),
        Ok(LensValue::Num(n)) => Ok(n.to_string()),
        Err(_) => Ok("roger".to_string()),
    }
}

fn deserialize_screenshots<'de, D>(
    deserializer: D,
) -> Result<HashMap<usize, ScreenshotConfig>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum ScreenshotValue {
        Legacy(f64),
        Modern(ScreenshotConfig),
    }

    let map = HashMap::<usize, ScreenshotValue>::deserialize(deserializer)?;
    Ok(map
        .into_iter()
        .map(|(k, v)| match v {
            ScreenshotValue::Legacy(t) => (
                k,
                ScreenshotConfig {
                    time: t,
                    offset: 0.0,
                },
            ),
            ScreenshotValue::Modern(cfg) => (k, cfg),
        })
        .collect())
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Segment {
    id: String,
    artist_id: String,
    title: String,
    artist_name: String,
    event_date: String,
    venue_name: String,
    index: String,
    start_time: u64,
    end_time: u64,
    duration: u64,
    master_duration: u64,
    master_size: String,
    performance: String,
    status: String,
    source: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VideoManifest {
    performance: String,
    total_duration: u64,
    total_size: String,
    elapsed_seconds: f64,
    segments: Vec<Segment>,
}

// =========================================================================
// HELPERS & IMAGE GENERATORS
// =========================================================================

fn hash_name_to_id(name: &str) -> String {
    let clean_name = name.to_lowercase();
    let clean_name = clean_name.trim();
    let limit = clean_name.len().min(150);
    let bytes = clean_name[..limit].as_bytes();

    let mut hash: u32 = 2166136261;
    for &byte in bytes {
        hash ^= byte as u32;
        hash = hash.wrapping_mul(16777619);
    }

    let mut num = hash;
    let mut result_bytes = Vec::new();

    if num == 0 {
        return "00000".to_string();
    }

    while num > 0 {
        let rem = (num % 62) as usize;
        result_bytes.push(BASE62_ALPHABET[rem]);
        num /= 62;
    }

    result_bytes.reverse();
    let result = String::from_utf8(result_bytes).unwrap_or_default();

    format!("{:0>5}", result)
}

fn format_artist_display_name(raw: &str) -> String {
    raw.split(&['-', '_'][..])
        .filter(|s| !s.is_empty())
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(f) => f.to_uppercase().collect::<String>() + chars.as_str(),
            }
        })
        .collect::<Vec<String>>()
        .join(" ")
}

async fn probe_actual_duration(playlist_path: &Path) -> Result<u64, String> {
    let output = Command::new("ffprobe")
        .arg("-v")
        .arg("error")
        .arg("-show_entries")
        .arg("format=duration")
        .arg("-of")
        .arg("default=noprint_wrappers=1:nokey=1")
        .arg(playlist_path)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    let dur_str = String::from_utf8_lossy(&output.stdout);
    let parsed_dur: f64 = dur_str.trim().parse().unwrap_or(0.0);
    Ok(parsed_dur.round() as u64)
}

/// Standard Image Export helper (Used for Card images)
async fn export_image_variant(
    src_file: &Path,
    base_output: &Path,
    crop_geom: Option<&str>,
    gravity: Option<&str>,
    final_resize_geom: Option<&str>,
) -> Result<(), String> {
    for ext in &["jpg", "avif"] {
        let out_path = format!("{}.{}", base_output.display(), ext);

        let quality = if *ext == "avif" { "65" } else { "80" };

        let mut cmd = Command::new("convert");
        cmd.arg(src_file);

        if let Some(g) = gravity {
            cmd.arg("-gravity").arg(g);
        }

        if let Some(crop) = crop_geom {
            cmd.arg("-crop").arg(crop).arg("+repage");
        }

        if let Some(resize) = final_resize_geom {
            cmd.arg("-resize").arg(resize);
        }

        cmd.arg("-strip")
            .arg("-quality")
            .arg(quality)
            .arg(&out_path);

        let status = cmd
            .status()
            .await
            .map_err(|e| format!("ImageMagick convert error: {}", e))?;
        if !status.success() {
            return Err(format!("ImageMagick convert failed for {}", out_path));
        }
    }
    Ok(())
}

/// Extended Image Export helper with Canvas Extent (Used for Desktop & Mobile to offset image flush to top)
async fn export_image_variant_extended(
    src_file: &Path,
    base_output: &Path,
    crop_geom: &str,
    target_extent: &str,
) -> Result<(), String> {
    for ext in &["jpg", "avif"] {
        let out_path = format!("{}.{}", base_output.display(), ext);

        let quality = if *ext == "avif" { "65" } else { "80" };

        let mut cmd = Command::new("convert");
        cmd.arg(src_file);

        // Step 1: Crop active video portion using exact Y-offset, then strip virtual canvas offsets
        cmd.arg("-crop").arg(crop_geom).arg("+repage");

        // Step 2: Resize mobile frame width to fit 400px target before extending height
        if target_extent == "400x500" {
            cmd.arg("-resize").arg("400x");
        }

        // Step 3: Pad canvas downward (North gravity forces video flush to top)
        cmd.arg("-background")
            .arg("black")
            .arg("-gravity")
            .arg("North")
            .arg("-extent")
            .arg(target_extent);

        cmd.arg("-strip")
            .arg("-quality")
            .arg(quality)
            .arg(&out_path);

        let status = cmd
            .status()
            .await
            .map_err(|e| format!("ImageMagick convert error: {}", e))?;

        if !status.success() {
            return Err(format!("ImageMagick convert failed for {}", out_path));
        }
    }
    Ok(())
}

async fn process_chapter_screenshot(
    input_path: &Path,
    shot_timestamp: f64,
    crop_offset: f64,
    seg_dir: &Path,
    seg_id: &str,
    _segment_idx: usize,
    lens_profile: LensProfile,
) -> Result<(), String> {
    let raw_tmp = seg_dir.join(format!("raw_{}.jpg", seg_id));

    let status = Command::new("ffmpeg")
        .stderr(Stdio::null())
        .stdout(Stdio::null())
        .arg("-y")
        .arg("-loglevel")
        .arg("error")
        .arg("-ss")
        .arg(shot_timestamp.to_string())
        .arg("-i")
        .arg(input_path)
        .arg("-vframes")
        .arg("1")
        .arg("-q:v")
        .arg("2")
        .arg(&raw_tmp)
        .status()
        .await
        .map_err(|e| format!("FFmpeg frame capture failed: {}", e))?;

    if !status.success() || !raw_tmp.exists() {
        return Err(format!("Frame extraction failed for segment {}", seg_id));
    }

    // =========================================================================
    // 1. CARD CROP (CENTERED ZOOM TO 320x180)
    // =========================================================================
    let card_zoomed_w = (1920.0 / lens_profile.zoom_factor).round() as u32;
    let card_zoomed_h = (1080.0 / lens_profile.zoom_factor).round() as u32;
    let card_crop_geom = format!("{}x{}+0+0", card_zoomed_w, card_zoomed_h);

    // =========================================================================
    // 2. DESKTOP (CALCULATE TOP BAR Y-OFFSET AND CROP ACTIVE VIDEO)
    // =========================================================================
    let desktop_crop_geom = if lens_profile.zoom_factor > 1.0 {
        let crop_h = (1080.0 / lens_profile.zoom_factor).round() as u32;
        let top_bar_y = ((1080.0 - crop_h as f64) / 2.0).round() as u32;
        format!("1920x{}+0+{}", crop_h, top_bar_y)
    } else {
        "1920x1080+0+0".to_string()
    };

    // =========================================================================
    // 3. MOBILE (HORIZONTAL OFFSET + TOP BAR Y-OFFSET)
    // =========================================================================
    let unzoomed_w = 864.0;
    let unzoomed_travel = 1920.0 - unzoomed_w; // 1056px
    let unzoomed_center_x = unzoomed_travel / 2.0;
    let clamped_offset = crop_offset.clamp(-1.0, 1.0);
    let unzoomed_x = ((unzoomed_center_x + (clamped_offset * unzoomed_center_x)).round() as i32)
        .clamp(0, unzoomed_travel as i32);

    let mobile_crop_geom = if lens_profile.zoom_factor > 1.0 {
        let crop_h = (1080.0 / lens_profile.zoom_factor).round() as u32;
        let top_bar_y = ((1080.0 - crop_h as f64) / 2.0).round() as u32;
        format!("864x{}+{}+{}", crop_h, unzoomed_x, top_bar_y)
    } else {
        format!("864x1080+{}+0", unzoomed_x)
    };

    // --- EXPORTS ---

    // 1. Desktop: Crop middle active video -> Extend canvas downward to 1920x1080
    export_image_variant_extended(
        &raw_tmp,
        &seg_dir.join("desktop"),
        &desktop_crop_geom,
        "1920x1080",
    )
    .await?;

    // 2. Card: Standard zoom crop -> Resize to 320x180
    export_image_variant(
        &raw_tmp,
        &seg_dir.join("card"),
        Some(&card_crop_geom),
        Some("Center"),
        Some("320x180!"),
    )
    .await?;

    // 3. Mobile: Crop active height + X offset -> Resize to 400x500
    export_image_variant_extended(
        &raw_tmp,
        &seg_dir.join("mobile"),
        &mobile_crop_geom,
        "400x500",
    )
    .await?;

    let _ = fs::remove_file(&raw_tmp);

    Ok(())
}

fn find_matching_video(stem: &str) -> Result<PathBuf, String> {
    let video_extensions = ["mp4", "mkv", "mov", "webm"];
    for ext in video_extensions {
        let candidate = PathBuf::from(VIDEO_SEARCH_DIR).join(format!("{}.{}", stem, ext));
        if candidate.exists() {
            return Ok(candidate);
        }
    }
    Err(format!(
        "No matching video file found for stem '{}' in '{}'",
        stem, VIDEO_SEARCH_DIR
    ))
}

// =========================================================================
// MAIN ENTRY POINT (PRODUCTION)
// =========================================================================

#[tokio::main]
async fn main() {
    let start_time = Instant::now();

    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: export_cli <path_to_json_file>");
        std::process::exit(1);
    }

    let json_path = PathBuf::from(&args[1]);
    if !json_path.exists() {
        eprintln!("Error: Metadata JSON file missing at {:?}", json_path);
        std::process::exit(1);
    }

    let stem = json_path
        .file_stem()
        .and_then(|s| s.to_str())
        .expect("Invalid JSON filename stem");

    let input_path = match find_matching_video(stem) {
        Ok(path) => path,
        Err(err) => {
            eprintln!("Error: {}", err);
            std::process::exit(1);
        }
    };

    let master_size = fs::metadata(&input_path).map(|m| m.len()).unwrap_or(0);
    let formatted_master_size = format!("{:.2}", master_size as f64 / 1_073_741_824.0);

    let file = fs::File::open(&json_path).expect("Failed to open JSON file");
    let data: OutputMarkers =
        serde_json::from_reader(BufReader::new(file)).expect("Failed to parse JSON");

    let lens_profile = get_lens_profile(&data.lens);

    let _summary = data
        .summary
        .as_ref()
        .expect("JSON metadata is missing the 'summary' block!");

    println!("🎬 Processing performance: {}", stem);
    println!("📹 Video source: {:?}", input_path);
    println!("📂 Target output folder: {}", OUTPUT_DIR);
    println!(
        "🔍 Active Lens Profile: \"{}\" -> Zoom Factor: {:.2}x",
        lens_profile.name, lens_profile.zoom_factor
    );

    let base_out_dir = PathBuf::from(OUTPUT_DIR);
    tokio::fs::create_dir_all(&base_out_dir)
        .await
        .expect("Failed to create base output directory");

    let duration_output = std::process::Command::new("ffprobe")
        .arg("-v")
        .arg("error")
        .arg("-show_entries")
        .arg("format=duration")
        .arg("-of")
        .arg("default=noprint_wrappers=1:nokey=1")
        .arg(&input_path)
        .output()
        .expect("ffprobe failed");

    let total_duration: u64 = String::from_utf8_lossy(&duration_output.stdout)
        .trim()
        .parse::<f64>()
        .unwrap_or(1.0)
        .round() as u64;

    let performance = stem.to_string();
    let parts: Vec<&str> = performance.split('-').collect();
    let artist_name = parts
        .get(0)
        .copied()
        .unwrap_or("unknown_artist")
        .to_string();
    let venue_name = parts.get(1).copied().unwrap_or("unknown_venue").to_string();
    let event_date = parts.get(2).copied().unwrap_or("unknown_date").to_string();
    let artist_id = hash_name_to_id(&artist_name);

    let mut timeline = vec![0.0];
    timeline.extend(&data.markers);
    timeline.push(total_duration as f64);
    timeline.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    timeline.dedup();

    let master_dir = base_out_dir.join("masters").join(stem);
    tokio::fs::create_dir_all(&master_dir)
        .await
        .expect("Failed to create master dir");

    // PHASE 1: 1080p Stream Copy Cuts & Chapter Images
    println!("\n✂️ [1/3] Slicing 1080p stream-copy & images concurrently...");
    let mut phase1_handles = Vec::new();

    for i in 0..(timeline.len() - 1) {
        let s_start = timeline[i].round() as u64;
        let s_end = timeline[i + 1].round() as u64;
        let expected_duration = s_end.saturating_sub(s_start);

        if expected_duration > 0 {
            let index_str = i.to_string();
            let performance = performance.clone();
            let artist_id = artist_id.clone();
            let artist_name = artist_name.clone();
            let event_date = event_date.clone();
            let venue_name = venue_name.clone();
            let seg_id = hash_name_to_id(&format!("{}{}", performance, index_str));
            let seg_dir = base_out_dir.join(&seg_id);
            let input_path = input_path.clone();
            let formatted_master_size = formatted_master_size.clone();

            let shot_cfg = data
                .screenshots
                .get(&i)
                .cloned()
                .or_else(|| {
                    data.screenshots
                        .values()
                        .find(|cfg| cfg.time >= timeline[i] && cfg.time <= timeline[i + 1])
                        .cloned()
                })
                .unwrap_or_else(|| ScreenshotConfig {
                    time: timeline[i],
                    offset: 0.0,
                });

            let handle = tokio::spawn(async move {
                tokio::fs::create_dir_all(&seg_dir)
                    .await
                    .expect("Failed to create segment dir");

                let m3u8_1080 = seg_dir.join("output_1080.m3u8");
                if !m3u8_1080.exists() {
                    println!(
                        "▶️ Slicing 1080p Stream Copy for Segment {} ({})",
                        i, seg_id
                    );
                    let seg_pattern_1080 = seg_dir.join("segment_1080_%03d.ts");

                    Command::new("ffmpeg")
                        .stderr(Stdio::null())
                        .stdout(Stdio::null())
                        .arg("-y")
                        .arg("-ss")
                        .arg(s_start.to_string())
                        .arg("-to")
                        .arg(s_end.to_string())
                        .arg("-i")
                        .arg(&input_path)
                        .arg("-c")
                        .arg("copy")
                        .arg("-force_key_frames")
                        .arg("expr:gte(t,n_forced*6)")
                        .arg("-hls_time")
                        .arg("6")
                        .arg("-hls_playlist_type")
                        .arg("vod")
                        .arg("-hls_segment_filename")
                        .arg(seg_pattern_1080)
                        .arg(&m3u8_1080)
                        .status()
                        .await
                        .expect("FFmpeg 1080p cut failed");
                }

                process_chapter_screenshot(
                    &input_path,
                    shot_cfg.time,
                    shot_cfg.offset,
                    &seg_dir,
                    &seg_id,
                    i,
                    lens_profile,
                )
                .await
                .expect("Image extraction failed");

                let actual_duration = probe_actual_duration(&m3u8_1080)
                    .await
                    .unwrap_or(expected_duration);

                Segment {
                    id: seg_id.clone(),
                    artist_id,
                    title: format!("segment_{}", i),
                    artist_name,
                    event_date,
                    venue_name,
                    index: index_str,
                    start_time: s_start,
                    end_time: s_start + actual_duration,
                    duration: actual_duration,
                    master_duration: total_duration,
                    master_size: formatted_master_size,
                    performance,
                    status: "public".to_string(),
                    source: format!("{}/output", seg_id),
                }
            });
            phase1_handles.push(handle);
        }
    }

    let mut segments = Vec::new();
    for handle in phase1_handles {
        segments.push(handle.await.expect("Phase 1 concurrent task failed"));
    }

    // PHASE 2: GPU Masters & Master Audio (Low-res 300px High-Compression & MP3)
    println!("\n⚡ [2/3] Executing GPU master encodes & audio extraction...");

    let master_300 = master_dir.join("master_300p.mp4");
    let master_mp3 = master_dir.join("master_audio.mp3");

    if !master_300.exists() {
        println!("🎥 Encoding Highly-Compressed 300px Master via NVENC/CUDA...");
        Command::new("ffmpeg")
            .stderr(Stdio::inherit())
            .stdout(Stdio::null())
            .arg("-y")
            .arg("-stats")
            .arg("-hwaccel")
            .arg("cuda")
            .arg("-hwaccel_output_format")
            .arg("cuda")
            .arg("-i")
            .arg(&input_path)
            .arg("-vf")
            .arg("scale_cuda=300:-2")
            .arg("-c:v")
            .arg("h264_nvenc")
            .arg("-preset")
            .arg("p1")
            .arg("-rc")
            .arg("vbr")
            .arg("-cq")
            .arg("34")
            .arg("-b:v")
            .arg("150k")
            .arg("-maxrate:v")
            .arg("250k")
            .arg("-bufsize:v")
            .arg("500k")
            .arg("-g")
            .arg("60")
            .arg("-keyint_min")
            .arg("60")
            .arg("-c:a")
            .arg("aac")
            .arg("-b:a")
            .arg("64k")
            .arg(&master_300)
            .status()
            .await
            .expect("300p master encode failed");
    }

    if !master_mp3.exists() {
        println!("🎵 Encoding Master MP3 Track...");
        Command::new("ffmpeg")
            .stderr(Stdio::inherit())
            .stdout(Stdio::null())
            .arg("-y")
            .arg("-stats")
            .arg("-i")
            .arg(&input_path)
            .arg("-vn")
            .arg("-c:a")
            .arg("libmp3lame")
            .arg("-b:a")
            .arg("192k")
            .arg(&master_mp3)
            .status()
            .await
            .expect("Master MP3 encode failed");
    }

    // PHASE 2.5: Concurrent Sub-Resolution Slicing
    println!("\n⚡ [2.5/3] Slicing low-res 300px HLS and audio concurrently...");
    let mut phase2_handles = Vec::new();

    for i in 0..(timeline.len() - 1) {
        let s_start = timeline[i].round() as u64;
        let s_end = timeline[i + 1].round() as u64;

        if s_end > s_start {
            let performance = performance.clone();
            let seg_id = hash_name_to_id(&format!("{}{}", performance, i));
            let seg_dir = base_out_dir.join(&seg_id);
            let master_300 = master_300.clone();
            let master_mp3 = master_mp3.clone();

            let handle = tokio::spawn(async move {
                let m3u8_480 = seg_dir.join("output_480.m3u8");
                if !m3u8_480.exists() {
                    println!(
                        "▶️ Slicing 300px Low-Res HLS for Segment {} ({})",
                        i, seg_id
                    );
                    let seg_pattern_480 = seg_dir.join("segment_480_%03d.ts");
                    Command::new("ffmpeg")
                        .stderr(Stdio::null())
                        .stdout(Stdio::null())
                        .arg("-y")
                        .arg("-ss")
                        .arg(s_start.to_string())
                        .arg("-to")
                        .arg(s_end.to_string())
                        .arg("-i")
                        .arg(&master_300)
                        .arg("-c")
                        .arg("copy")
                        .arg("-hls_time")
                        .arg("6")
                        .arg("-hls_playlist_type")
                        .arg("vod")
                        .arg("-hls_segment_filename")
                        .arg(seg_pattern_480)
                        .arg(&m3u8_480)
                        .status()
                        .await
                        .expect("300px HLS slice failed");
                }

                let mp3_path = seg_dir.join("audio.mp3");
                if !mp3_path.exists() {
                    println!("✂️ Slicing MP3 for Segment {} ({})", i, seg_id);
                    Command::new("ffmpeg")
                        .stderr(Stdio::null())
                        .stdout(Stdio::null())
                        .arg("-y")
                        .arg("-ss")
                        .arg(s_start.to_string())
                        .arg("-to")
                        .arg(s_end.to_string())
                        .arg("-i")
                        .arg(&master_mp3)
                        .arg("-c:a")
                        .arg("copy")
                        .arg(&mp3_path)
                        .status()
                        .await
                        .expect("MP3 slice failed");
                }
            });
            phase2_handles.push(handle);
        }
    }

    for handle in phase2_handles {
        handle
            .await
            .expect("Phase 2 concurrent slicing task failed");
    }

    let elapsed_seconds = (start_time.elapsed().as_millis() as f64) / 1000.0;
    println!("\n⏱️ Total Processing Time: {:.2} seconds", elapsed_seconds);

    // PHASE 3: Write Root Video Manifest JSON & Append SQL Seed Statements
    println!("📝 [3/3] Writing root performance manifest & appending SQLite seed...");
    let manifest = VideoManifest {
        performance: performance.clone(),
        total_duration,
        total_size: formatted_master_size.clone(),
        elapsed_seconds,
        segments: segments.clone(),
    };

    let performance_id = hash_name_to_id(&stem);
    let manifest_filename = format!("{}_manifest.json", performance_id);
    let manifest_path = base_out_dir.join(&manifest_filename);
    let manifest_file = fs::File::create(&manifest_path).expect("Failed to create manifest JSON");
    serde_json::to_writer_pretty(manifest_file, &manifest).expect("Failed to write manifest JSON");

    // Append INSERT statements to seed.sql
    if let Ok(mut seed_file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(SEED_SQL_PATH)
    {
        // 1. Append Artist Record (INSERT OR IGNORE)
        let formatted_artist_name = format_artist_display_name(&artist_name);
        let artist_sql = format!(
            "INSERT OR IGNORE INTO artists (id, token_version) VALUES ('{}', 1);\n",
            artist_id
        );
        if let Err(e) = seed_file.write_all(artist_sql.as_bytes()) {
            eprintln!("⚠️ Warning: Failed to write artist row to seed.sql: {}", e);
        } else {
            println!(
                "👤 Appended artist '{}' ({}) to {}",
                formatted_artist_name, artist_id, SEED_SQL_PATH
            );
        }

        // 2. Append Segment Records
        for seg in &segments {
            let sql_statement = format!(
                "INSERT OR REPLACE INTO segments (id, artistId, title, artistName, eventDate, venueName, \"index\", startTime, duration, masterDuration, masterSize, hash, performance, status) VALUES ('{}', '{}', '{}', '{}', '{}', '{}', '{}', {}, {}, {}, '{}', '', '{}', '{}');\n",
                seg.id,
                seg.artist_id,
                seg.title,
                seg.artist_name,
                seg.event_date,
                seg.venue_name,
                seg.index,
                seg.start_time,
                seg.duration,
                seg.master_duration,
                seg.master_size,
                seg.performance,
                seg.status
            );
            if let Err(e) = seed_file.write_all(sql_statement.as_bytes()) {
                eprintln!("⚠️ Warning: Failed to write segment row to seed.sql: {}", e);
            }
        }
        println!(
            "🗄️ Successfully appended {} segments to {}",
            segments.len(),
            SEED_SQL_PATH
        );
    } else {
        eprintln!(
            "⚠️ Warning: Could not open seed.sql file at {}",
            SEED_SQL_PATH
        );
    }

    // PHASE 4: Move original JSON file to PROCESSED_JSON_DIR
    let processed_dir = PathBuf::from(PROCESSED_JSON_DIR);
    tokio::fs::create_dir_all(&processed_dir)
        .await
        .expect("Failed to create processed directory");

    let dest_json_path = processed_dir.join(format!("{}.json", stem));

    if fs::rename(&json_path, &dest_json_path).is_err() {
        fs::copy(&json_path, &dest_json_path).expect("Failed to copy JSON to processed directory");
        fs::remove_file(&json_path).expect("Failed to remove original JSON file");
    }

    println!("📦 Moved JSON metadata file to {:?}", dest_json_path);
    println!("✨ Encoding and SQL seeding completed successfully!");
}
