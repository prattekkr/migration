# AbbVie EDS Migration — Agent Skills Reference

## Migration Skills

These skills provide the knowledge needed to build and maintain import scripts for migrating content from AbbVie's AEM site to Edge Delivery Services.

### Available Skills

| Skill | Path | Purpose |
|-------|------|---------|
| **migration-skill** | `.agents/skills/migration-skill/SKILL.md` | Master reference — all 41 blocks, grid system, class combinations, row structures, data preservation rules |
| **migration-patterns** | `.agents/skills/migration-patterns/SKILL.md` | EDS grid layout (2-8-2 pattern), section metadata, block width utilities, typography/spacing classes |
| **block-analysis** | `.agents/skills/block-analysis/SKILL.md` | Deep analysis of 9 story-page blocks — JS decoration logic, CSS variants, applyCommonProps indices |
| **block-analysis-full** | `.agents/skills/block-analysis-full/SKILL.md` | Analysis of remaining 32 blocks — all templates beyond story articles |
| **migration-rules** | `.agents/skills/migration-rules/SKILL.md` | Fix-forward pipeline, AEM DOM inspection rules, parser/transformer requirements |
| **complex-template-migration** | `.agents/skills/complex-template-migration/SKILL.md` | Multi-grid layouts (1-4-1-5-1, 6-6), sidebars, technology modules, gray sections, related content grids |

### When to Use

- **Building a new import script** → Read `migration-skill` first, then `migration-patterns`
- **Complex multi-section pages** → Read `complex-template-migration` for grid patterns, DOM traversal, alignment
- **Fixing story article imports** → Read `block-analysis`
- **Working on other templates** (leader profiles, science pages, etc.) → Read `block-analysis-full`
- **Debugging import failures** → Read `migration-rules`
- **Understanding grid/layout structure** → Read `migration-patterns` (section on Grid Layout System)

### Key Concepts

1. **Grid System**: Pages use a 12-column grid. The `2-8-2` pattern creates centered narrow content.
2. **Two-level Width**: Grid columns control section width; block utility classes (`width-large`, etc.) further constrain content within.
3. **applyCommonProps**: Every block has 3 trailing rows (blockId, language, analyticsId) consumed by JS at a specific `startIndex`.
4. **Section Metadata**: Last block in each section defines layout classes (grid-container, grid-cols-N, content-wide, etc.)
5. **Conditional Logic**: Import scripts should only generate blocks for content that exists on the source page.

### Import Scripts Location

All import scripts are at `tools/importer/import-{template-name}.js`. Key scripts:
- `import-story-article.js` — 133 story pages (with full edge case handling)
- `import-homepage.js` — Homepage (custom section structure)
- `import-universal.js` — Universal conditional script (detects template automatically)
- `import-corporate-leader-profile.js` — 24 leader pages
- `import-leader-profile.js` — 13 R&D leader pages
