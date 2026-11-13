#!/usr/bin/env bun
/**
 * CSS drift check — compares classes emitted by templates against classes
 * defined in the compiled stylesheets. Zero dependencies (regex-based).
 *
 * Usage: bun scripts/css-check.ts [--baseline]
 *   --baseline  write scripts/css-baseline.json instead of failing on drift
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, relative, basename } from "path";

const root = join(import.meta.dir, "..");
const cssFiles = [
  "public/css/app.css",
  "public/css/main.css",
  "public/css/review-studio.css",
  "public/css/status.css",
  "public/css/archflow.css",
];

// ---------------------------------------------------------------------------
// CSS parsing (flattened output: no nested at-rules except @media/@supports)
// ---------------------------------------------------------------------------
function parseCss(css: string) {
  const rules: { media: string; sel: string; decl: string }[] = [];
  const stack: string[] = [];
  let i = 0;
  let buf = "";
  while (i < css.length) {
    const ch = css[i];
    if (ch === "{") {
      const header = buf.trim();
      buf = "";
      if (header.startsWith("@media") || header.startsWith("@supports")) {
        stack.push(header);
      } else {
        let j = i + 1;
        let depth = 1;
        let decl = "";
        while (j < css.length && depth > 0) {
          if (css[j] === "{") depth++;
          else if (css[j] === "}") depth--;
          if (depth > 0) decl += css[j];
          j++;
        }
        rules.push({ media: stack.join(" && ") || "top", sel: header.replace(/\s+/g, " "), decl: decl.trim() });
        i = j;
        continue;
      }
    } else if (ch === "}") {
      stack.pop();
      buf = "";
    } else buf += ch;
    i++;
  }
  return rules;
}

function selectorClasses(sel: string) {
  const out = new Set<string>();
  for (const m of sel.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)) out.add(m[1]);
  return out;
}

// ---------------------------------------------------------------------------
// Markup scraping: static class attrs, template literals, bind-class, JS hooks
// ---------------------------------------------------------------------------
function walk(dir: string, acc: string[]) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?|html)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function classesInText(text: string): string[] {
  const found: string[] = [];
  const add = (s: string) => {
    for (const t of s.split(/[\s"'`{}()?:;,+]+/)) {
      const v = t.trim();
      if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(v)) found.push(v);
    }
  };
  for (const m of text.matchAll(/(?:class|className)="([^"]*)"/g)) add(m[1]);
  for (const m of text.matchAll(/(?:class|className)=\{\s*[`"']([^`"']*)[`"']\s*\}/g)) add(m[1]);
  for (const m of text.matchAll(/data-bind-class="([^"]*)"/g)) add(m[1]);
  for (const m of text.matchAll(/data-bind-class="\{([^"]*)\}"/g)) add(m[1]);
  for (const m of text.matchAll(/classList\.(?:add|remove|toggle)\(\s*["']([^"']+)["']/g)) add(m[1]);
  for (const m of text.matchAll(/className\s*=\s*["'`]([^"'`]+)["'`]/g)) add(m[1]);
  for (const m of text.matchAll(/querySelector(?:All)?\(\s*["']\.([A-Za-z0-9_-]+)/g)) add(m[1]);
  return found;
}

const markupFiles = [
  ...walk(join(root, "src"), []),
  ...walk(join(root, "public", "js"), []),
].filter((f) => !f.endsWith(".css"));

const usage = new Map<string, Set<string>>();
for (const f of markupFiles) {
  for (const c of classesInText(readFileSync(f, "utf8"))) {
    if (!usage.has(c)) usage.set(c, new Set());
    usage.get(c)!.add(relative(root, f));
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const defined = new Map<string, Set<string>>(); // class -> files
let totalRules = 0;
const cssStats: Record<string, { rules: number; classes: number; dupes: number }> = {};

for (const rel of cssFiles) {
  let source: string;
  try {
    source = readFileSync(join(root, rel), "utf8");
  } catch {
    console.error(`Missing ${rel}. Run \`bun run pages:build\` first.`);
    process.exit(1);
  }
  const rules = parseCss(source);
  totalRules += rules.length;
  const classes = new Set<string>();
  const seen = new Map<string, number>();
  for (const r of rules) {
    for (const c of selectorClasses(r.sel)) {
      classes.add(c);
      if (!defined.has(c)) defined.set(c, new Set());
      defined.get(c)!.add(basename(rel));
    }
    const key = r.media + "|" + r.sel;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  cssStats[basename(rel)] = {
    rules: rules.length,
    classes: classes.size,
    dupes: [...seen.values()].filter((n) => n > 1).length,
  };
}

const usedButUndefined = [...usage.keys()].filter((c) => !defined.has(c)).sort();
const definedButUnused = [...defined.keys()].filter((c) => !usage.has(c)).sort();

/**
 * Classes that are legitimately defined outside this stylesheet graph:
 * - generated by third-party runtimes (Leaflet) or dynamic template strings
 * - declared inside page-local <style> blocks (AuditDashboard)
 * - dynamic values that cannot be resolved statically
 */
const IGNORED_UNDEFINED = [
  /^leaflet-/,
  /^audit-/,
  /^badge-/,
  /^pipeline-/,
  /^stage-/,
  /^toast-$/,
  "lvml",
  "stateClass",
  "color",
  "date",
  "text-err",
  "status-badge",
];

const isIgnored = (c: string) =>
  IGNORED_UNDEFINED.some((rule) => (typeof rule === "string" ? rule === c : rule.test(c)));

const unexpectedUndefined = usedButUndefined.filter((c) => !isIgnored(c));

const report = {
  generatedAt: new Date().toISOString(),
  css: cssStats,
  totalRules,
  usedClasses: usage.size,
  definedClasses: defined.size,
  usedButUndefined,
  definedButUnused,
  unexpectedUndefined,
};

const outPath = join(root, "scripts/css-baseline.json");
if (process.argv.includes("--baseline")) {
  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`Baseline written to ${relative(root, outPath)}`);
} else {
  console.log(JSON.stringify(report, null, 2));
  if (unexpectedUndefined.length > 0) {
    console.error(
      `\n❌ ${unexpectedUndefined.length} class(es) used in markup but missing from CSS:`,
    );
    for (const c of unexpectedUndefined) console.error(`   - ${c}`);
    process.exit(1);
  }
}
