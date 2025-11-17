# Tailwind CSS Migration Guide

## What's Been Done

### ✅ Tailwind Setup Complete
1. **Installed dependencies**: `tailwindcss`, `postcss`, `autoprefixer`
2. **Created config files**:
   - `tailwind.config.js` - Configured to scan all React components
   - `postcss.config.js` - Set up Tailwind and Autoprefixer
3. **Added Tailwind directives** to `src/index.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
4. **Proof of concept**: The duplicate badge in `EntityCard.jsx` (line 174) is already using Tailwind classes

### ✅ What Still Works
- All existing CSS files continue to work
- CSS custom properties (variables) are preserved
- Dark mode support maintained
- No breaking changes to existing components

## Migration Strategy

### Phase 1: New Components (Immediate)
**Rule**: All new components use Tailwind exclusively.

```jsx
// ✅ Good - New component with Tailwind
export function NewFeature() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Click Me
      </button>
    </div>
  );
}

// ❌ Bad - New component with custom CSS
export function NewFeature() {
  return <div className="new-feature-container">...</div>;
}
```

### Phase 2: Opportunistic Refactoring (Ongoing)
When you touch a component for any reason, migrate its styles to Tailwind.

**Priority order**:
1. **High-touch components** - Components you modify frequently
2. **Small components** - Easy wins (cards, badges, buttons)
3. **Shared components** - Maximum impact (EntityCard, Navigation, etc.)
4. **Page components** - Larger effort, lower priority

**Example**: When fixing a bug in `Navigation.jsx`, migrate its CSS to Tailwind at the same time.

### Phase 3: Systematic Refactoring (Future)
Once comfortable with Tailwind, systematically migrate remaining components.

**Order**:
1. Component library (EntityCard, EntityImage, etc.)
2. Layout components (Navigation, Breadcrumbs, etc.)
3. Page components (MyCollection, ItemList, etc.)
4. Finally, delete unused CSS files

## Migration Patterns

### Converting Existing CSS to Tailwind

#### Example: Button
**Before** (custom CSS):
```css
/* Button.css */
.button {
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
}

.button:hover {
  background: #1d4ed8;
}
```

```jsx
<button className="button">Click Me</button>
```

**After** (Tailwind):
```jsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold cursor-pointer hover:bg-blue-700">
  Click Me
</button>
```

#### Example: Card Layout
**Before**:
```css
/* Card.css */
.card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

```jsx
<div className="card">...</div>
```

**After**:
```jsx
<div className="flex flex-col gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
  ...
</div>
```

### Using CSS Variables with Tailwind

Keep using CSS variables for theme colors! Use Tailwind's arbitrary value syntax:

```jsx
// ✅ Good - Mix Tailwind with CSS variables
<div className="bg-[var(--bg-primary)] text-[var(--text-primary)] p-4">
  Content
</div>

// Or extend Tailwind config to use your variables
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: 'var(--navy-blue)',
      secondary: 'var(--bright-blue)',
    }
  }
}

// Then use like normal Tailwind:
<div className="bg-primary text-white">Content</div>
```

### Handling Responsive Design

**Before**:
```css
.header {
  padding: 2rem;
}

@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }
}
```

**After**:
```jsx
<header className="p-8 md:p-4">
  {/* Desktop: 2rem, Mobile: 1rem */}
</header>
```

Tailwind breakpoints:
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up

### Complex Components

For components with lots of styles, consider the `@apply` directive as a stepping stone:

**index.css** (or component CSS file):
```css
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors;
  }
}
```

**Component**:
```jsx
<button className="btn-primary">Click Me</button>
```

**Eventually refactor to**:
```jsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors">
  Click Me
</button>
```

## Common Conversions

| CSS Property | Tailwind Class |
|--------------|----------------|
| `display: flex` | `flex` |
| `flex-direction: column` | `flex-col` |
| `justify-content: center` | `justify-center` |
| `align-items: center` | `items-center` |
| `gap: 1rem` | `gap-4` |
| `padding: 1rem` | `p-4` |
| `margin-top: 0.5rem` | `mt-2` |
| `background-color: white` | `bg-white` |
| `color: #666` | `text-gray-600` |
| `font-size: 1rem` | `text-base` |
| `font-weight: 600` | `font-semibold` |
| `border-radius: 0.5rem` | `rounded-lg` |
| `cursor: pointer` | `cursor-pointer` |
| `position: absolute` | `absolute` |
| `top: 0.5rem` | `top-2` |
| `right: 0.5rem` | `right-2` |
| `z-index: 10` | `z-10` |

**Spacing scale** (p-*, m-*, gap-*, etc.):
- `1` = 0.25rem (4px)
- `2` = 0.5rem (8px)
- `4` = 1rem (16px)
- `6` = 1.5rem (24px)
- `8` = 2rem (32px)

## Don't Delete CSS Files Yet

**Important**: Keep CSS files during migration:
1. Many components still depend on them
2. CSS variables are still used (and should stay!)
3. Delete only when ALL usages are migrated

**Track progress**:
```bash
# Find components still importing a CSS file
grep -r "import.*EntityCard.css" src/
```

## Benefits You'll See

### Before (Custom CSS):
```jsx
// EntityCard.jsx
import './EntityCard.css';

<div className="entity-card entity-card-selected entity-card-disabled">
  <div className="entity-card-header">
    <div className="entity-card-title">...</div>
  </div>
</div>
```

```css
/* EntityCard.css - 100+ lines */
.entity-card { ... }
.entity-card-selected { ... }
.entity-card-disabled { ... }
.entity-card-header { ... }
.entity-card-title { ... }
/* etc. */
```

**Issues**:
- Two files to maintain
- Inventing class names (`.entity-card-header` vs `.entity-header` vs `.card-header`?)
- Hard to see what styles apply without switching files
- Inconsistent spacing (`12px` here, `14px` there)

### After (Tailwind):
```jsx
// EntityCard.jsx - No CSS import needed!
<div className="relative border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow data-[selected=true]:border-blue-500 data-[disabled=true]:opacity-50">
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-lg font-semibold text-gray-900">...</h3>
  </div>
</div>
```

**Benefits**:
- One file
- No class naming decisions
- See styles inline with markup
- Consistent spacing (Tailwind scale: 2, 4, 6, 8, etc.)
- Faster development

## Tips & Tricks

### 1. Use the Tailwind CSS IntelliSense Extension
Install in your IDE for autocomplete and class validation.

### 2. Component Extraction for Repeated Patterns
If you use the same Tailwind classes repeatedly, extract to a component:

```jsx
// Instead of repeating this everywhere:
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">

// Create a component:
function Button({ children, ...props }) {
  return (
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      {...props}
    >
      {children}
    </button>
  );
}
```

### 3. Group Related Classes
Make long class strings readable:

```jsx
// ✅ Good - Grouped by concern
<div className={`
  // Layout
  flex flex-col gap-4
  // Spacing
  p-6 m-4
  // Appearance
  bg-white border border-gray-200 rounded-lg shadow-sm
  // States
  hover:shadow-md transition-shadow
`}>

// ❌ Bad - Random order
<div className="shadow-sm p-6 hover:shadow-md flex bg-white m-4 rounded-lg border-gray-200 flex-col gap-4 border transition-shadow">
```

### 4. Customizing Tailwind Config
Add your brand colors to `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      'navy': '#2C4B7B',
      'bright-blue': '#4A90E2',
      'yellow-accent': '#F5C842',
    }
  }
}
```

Then use: `bg-navy`, `text-bright-blue`, etc.

## Questions?

**"Do I have to migrate everything right now?"**
No! This is incremental. Start with new components and migrate old ones opportunistically.

**"What about the duplicate badge?"**
Already migrated! Check `EntityCard.jsx` line 174 - it's using Tailwind classes.

**"Can I still use CSS custom properties?"**
Yes! Use them with Tailwind's arbitrary value syntax: `bg-[var(--primary)]`

**"What about dark mode?"**
Keep using the `.dark-mode` class and CSS variables for now. We can add Tailwind's dark mode later.

**"Should I delete EntityCard.css?"**
Not yet - it still has multi-select and progress bar styles. Migrate those first.

## Next Steps

1. **Try it out**: Start the dev server and verify Tailwind is working
2. **Pick one component**: Choose a small component to fully migrate
3. **Get comfortable**: Use Tailwind for all new code
4. **Gradually migrate**: Refactor old components when you touch them
5. **Enjoy**: Less code, more consistency, faster development

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind CSS Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)
- [Tailwind Play](https://play.tailwindcss.com/) - Try Tailwind in browser
