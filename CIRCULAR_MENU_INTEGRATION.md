# CircularMenu Integration Guide

## Overview

The CircularMenu component provides a mobile-friendly floating action button (FAB) that expands into a circular menu with quick access to common actions.

## Features

- ✅ Mobile-first design (hidden on desktop by default)
- ✅ Smooth animations with spring physics
- ✅ Backdrop overlay when open
- ✅ Keyboard accessible
- ✅ Touch-optimized
- ✅ Dark mode support
- ✅ Reduced motion support
- ✅ Extensible for additional actions

## Integration Steps

### 1. Add CircularMenu to App.jsx

```jsx
import CircularMenu from './components/CircularMenu';

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const searchInputRef = useRef(null); // Add this ref

  const handleAddToCollection = () => {
    setShowAddItemsModal(true);
  };

  const handleSearchFromMenu = () => {
    // Focus the search input in Navigation
    // We'll need to pass a ref to Navigation component
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ApolloProvider client={client}>
        <ThemeProvider>
          <AuthProvider>
            <div className="app">
              <Navigation
                onLogin={handleLogin}
                onSignup={handleSignup}
                onAddToCollection={handleAddToCollection}
              />

              <main className="app-content">
                <Routes>
                  <Route path="/" element={<CollectionView />} />
                  <Route path="/collection/:id" element={<CollectionView />} />
                  <Route path="/item/:id" element={<ItemView />} />
                  <Route path="/wishlist" element={<WishlistView />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Add CircularMenu here */}
              <CircularMenu
                onAddToCollection={handleAddToCollection}
                onSearch={handleSearchFromMenu}
              />

              <AddItemsModal
                isOpen={showAddItemsModal}
                onClose={() => setShowAddItemsModal(false)}
                onItemsAdded={() => {
                  setShowAddItemsModal(false);
                }}
              />

              <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
              />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </ApolloProvider>
    </GoogleOAuthProvider>
  );
}
```

### 2. (Optional) Add className to search input in Navigation.jsx

For better targeting when focusing from the circular menu, add a className to your search input:

```jsx
// In Navigation.jsx
<input
  type="text"
  className="search-input"  // Add this
  placeholder="Search items..."
  value={searchQuery}
  onChange={handleSearchInputChange}
/>
```

### 3. Usage

The circular menu will:
- Show only on mobile devices (< 768px width) by default
- Appear as a floating button in the bottom-right corner
- Expand when tapped to show action buttons
- Close when tapping outside or after selecting an action

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onAddToCollection` | Function | - | Callback when "Add to Collection" button is clicked |
| `onSearch` | Function | - | Callback when "Search" button is clicked |
| `showOnDesktop` | Boolean | `false` | Show the menu on desktop screens as well |

## Customization

### Adding More Actions

To add more menu items, edit `CircularMenu.jsx`:

```jsx
<nav className="items-wrapper" aria-label="Circular menu">
  {/* Existing items */}
  <button className="menu-item" onClick={() => handleMenuItemClick(onAddToCollection)}>
    <i className="fas fa-plus-circle"></i>
  </button>

  <button className="menu-item" onClick={() => handleMenuItemClick(onSearch)}>
    <i className="fas fa-search"></i>
  </button>

  {/* Add new item */}
  <button className="menu-item" onClick={() => handleMenuItemClick(onBackToTop)}>
    <i className="fas fa-arrow-up"></i>
  </button>
</nav>
```

The CSS already has positions defined for up to 5 menu items. They will automatically arrange in a circular arc.

### Changing Colors

Edit `CircularMenu.css` to customize the gradient and colors:

```css
.floating-btn {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

.circular-menu.active .floating-btn {
  background: linear-gradient(135deg, #your-color-3 0%, #your-color-4 100%);
}
```

### Show on Desktop

If you want the menu to appear on desktop as well:

```jsx
<CircularMenu
  onAddToCollection={handleAddToCollection}
  onSearch={handleSearchFromMenu}
  showOnDesktop={true}
/>
```

## Accessibility

- All buttons have proper `aria-label` attributes
- Keyboard navigation supported
- Focus indicators visible
- Respects `prefers-reduced-motion`
- Screen reader friendly

## Browser Support

Works in all modern browsers that support:
- CSS transforms
- CSS transitions
- CSS Grid/Flexbox
- ES6+ JavaScript

## Dependencies

Requires Font Awesome for icons. If not already installed:

```bash
npm install --save @fortawesome/fontawesome-free
```

Then import in your main.jsx or App.jsx:

```js
import '@fortawesome/fontawesome-free/css/all.min.css';
```

## Examples

### Basic Usage (Mobile Only)
```jsx
<CircularMenu
  onAddToCollection={() => setShowAddModal(true)}
  onSearch={() => focusSearchInput()}
/>
```

### With Desktop Support
```jsx
<CircularMenu
  onAddToCollection={() => setShowAddModal(true)}
  onSearch={() => focusSearchInput()}
  showOnDesktop={true}
/>
```

### With Navigation Integration
```jsx
const handleSearchFocus = () => {
  const input = document.querySelector('.search-input');
  if (input) {
    input.focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

<CircularMenu
  onAddToCollection={handleAddToCollection}
  onSearch={handleSearchFocus}
/>
```

## Tips

1. **Keep it Simple**: Limit to 3-5 actions for best UX
2. **Most Common First**: Place most-used actions in the easiest-to-reach positions
3. **Test on Real Devices**: Touch targets should be at least 44x44px (already implemented)
4. **Consider Context**: Only show relevant actions based on current page/state

## Future Enhancements

Potential additions you could make:

- [ ] Badge notifications on menu items
- [ ] Long-press for alternative actions
- [ ] Swipe to open/close
- [ ] Customizable positions (bottom-left, top-right, etc.)
- [ ] Voice control integration
- [ ] Haptic feedback on mobile
