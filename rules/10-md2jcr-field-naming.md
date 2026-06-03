# md2jcr Field Naming Rules — Avoiding _fixFieldOrder Bugs

## The Problem

md2jcr's `_fixFieldOrder()` method silently **drops fields** whose names end with certain suffixes when no matching "base field" exists in the model. This causes values to be lost during import — they never appear in JCR output.

## Dangerous Suffixes

md2jcr treats these as collapsible suffixes: **`Alt`**, **`MimeType`**, **`Type`**, **`Text`**, **`Title`**

### How it works:

1. `_fixFieldOrder` scans for "base fields" — fields NOT ending with any suffix
2. For each base field, it looks for `baseField + Suffix` (e.g., `image` → `imageAlt`, `imageMimeType`)
3. Suffix fields that have a matching base field are **kept** (reordered to follow their base)
4. Suffix fields that do NOT have a matching base field are **silently dropped**

### Examples of DROPPED fields:

| Field Name | Suffix | Expected Base | Exists? | Result |
|-----------|--------|---------------|---------|--------|
| `overlayTitle` | Title | `overlay` | NO | **DROPPED** |
| `overlayBtnText` | Text | `overlayBtn` | NO | **DROPPED** |
| `placeholderAlt` | Alt | `placeholder` | NO | **DROPPED** |
| `overlayButtonIconType` | Type | `overlayButtonIcon` | NO | **DROPPED** |

### Examples of KEPT fields (correctly collapsed):

| Field Name | Suffix | Expected Base | Exists? | Result |
|-----------|--------|---------------|---------|--------|
| `imageMimeType` | MimeType | `image` | YES | Collapsed into `image` group |
| `imageAlt` | Alt | `image` | YES | Collapsed into `image` group |
| `backgroundImageAlt` | Alt | `backgroundImage` | YES | Collapsed into `backgroundImage` group |

## The Fix: Rename Orphan Suffix Fields

When a field name ends with a suffix but has NO matching base field in the same model, **rename it** to avoid the suffix pattern.

### Naming Patterns That Work:

| Original (BROKEN) | Renamed (WORKS) | Why |
|-------------------|-----------------|-----|
| `overlayTitle` | `overlayHeading` | Doesn't end with "Title" |
| `overlayBtnText` | `overlayButtonLabel` | Doesn't end with "Text" |
| `placeholderAlt` | `placeholderAltLabel` | Doesn't end with "Alt" |
| `overlayButtonIconType` | `overlayBtnIconVariation` | Doesn't end with "Type" |
| `linkText` | Keep if `link` field exists | `link` is the base → correctly collapsed |

### Safe Alternatives for Each Suffix:

| Suffix | Avoid ending with | Use instead |
|--------|-------------------|-------------|
| `Alt` | `*Alt` | `*AltLabel`, `*AltDescription`, `*AccessibleName` |
| `MimeType` | `*MimeType` | Only use when base field exists (e.g., `image` → `imageMimeType`) |
| `Type` | `*Type` | `*Variation`, `*Style`, `*Mode`, `*Kind` |
| `Text` | `*Text` | `*Label`, `*Content`, `*Value`, `*Copy` |
| `Title` | `*Title` | `*Heading`, `*Name`, `*Label`, `*Caption` |

## When to Apply This Rule

**Before adding or renaming any field in `component-models.json`:**

1. Check if the field name ends with `Alt`, `MimeType`, `Type`, `Text`, or `Title`
2. If YES, check if a field named `fieldNameWithoutSuffix` exists in the SAME model
3. If NO base field exists → **rename the field** to avoid the suffix

## Files to Update When Renaming

When renaming a field, update ALL references:

1. `component-models.json` — field `name` property
2. `component-definition.json` — template default keys
3. `component-filters.json` — usually not affected (filter by component ID, not field names)
4. Import scripts — row mappings
5. Block JS/CSS — if they read field values from DOM attributes

## Validation Script

Run this to detect orphan suffix fields in your models:

```javascript
node -e "
const models = JSON.parse(require('fs').readFileSync('component-models.json','utf8'));
const suffixes = ['Alt', 'MimeType', 'Type', 'Text', 'Title'];
models.forEach(model => {
  const fields = model.fields.filter(f => f.component !== 'tab');
  const baseNames = fields.filter(f => !suffixes.some(s => f.name.endsWith(s))).map(f => f.name);
  fields.forEach(f => {
    const suffix = suffixes.find(s => f.name.endsWith(s));
    if (suffix) {
      const base = f.name.substring(0, f.name.lastIndexOf(suffix));
      if (!baseNames.includes(base)) {
        console.log('[ORPHAN]', model.id + '.' + f.name, '→ base \"' + base + '\" not found → WILL BE DROPPED');
      }
    }
  });
});
"
```

## Applied Fixes in This Project

### Video block (`video` model):
- `overlayTitle` → `overlayHeading`
- `overlayBtnText` → `overlayButtonLabel`
- `placeholderAlt` → `placeholderAltLabel`
- `overlayButtonIconType` → `overlayBtnIconVariation`

### Impact on import script field groups (Video — 18 groups):
```
[0]  uri
[1]  placeholderImage (collapsed: placeholderImageMimeType)
[2]  placeholderAltLabel
[3]  overlayHeading          ← title value goes here
[4]  overlayDescription
[5]  overlayButtonLabel      ← "Watch 7:25" button text
[6]  videoContentLayout
[7]  classes (overlayColor, overlayBtnStyle, customDynamicClass, commonCustomClass)
[8]  overlayBtnIconVariation ← "icon-font" or "image"
[9]  overlayButtonFontIcon   ← "play"
[10] projectNumber
[11] enableAutoplay
[12] enableCaptions
[13] enablePlayerControls
[14] enableFullscreen
[15] blockId
[16] language
[17] analytics (analytics_id)
```
