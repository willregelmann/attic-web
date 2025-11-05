# Security Issues and Mitigation Plan

## Critical: Token Storage Vulnerability (P0)

### Current Implementation

**Location:** `src/contexts/AuthContext.jsx:58`, `src/apolloClient.js:24`

**Issue:** Authentication tokens are currently stored in `localStorage`:

```javascript
// AuthContext.jsx
localStorage.setItem('token', access_token);

// apolloClient.js
const token = localStorage.getItem('token');
```

### Security Risk

**Severity:** HIGH - OWASP A05:2021 Security Misconfiguration

**Vulnerability:** localStorage is accessible to any JavaScript running on the page. Any XSS (Cross-Site Scripting) vulnerability in the application or any third-party script could:
1. Read the authentication token from localStorage
2. Send it to a malicious server
3. Gain full access to the user's account

**Attack Scenarios:**
- XSS vulnerability in user-generated content (notes, collection names from API)
- Compromised CDN serving malicious JavaScript
- Browser extension with malicious code
- Supply chain attack through compromised npm package

**Impact:**
- Full account takeover
- Unauthorized access to user data
- Potential data theft or manipulation

### Recommended Solution: httpOnly Cookies

**Implementation Steps:**

#### Backend Changes (Laravel Sanctum)

Laravel Sanctum already supports httpOnly cookies. Enable this in `config/sanctum.php`:

```php
// config/sanctum.php
'stateful' => explode(',', env(
    'SANCTUM_STATEFUL_DOMAINS',
    'localhost,localhost:5173,localhost:3000,127.0.0.1,127.0.0.1:8000,::1,attic.yourdomain.com'
)),

'middleware' => [
    'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
    'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
],
```

Enable session-based authentication:
```php
// In your login controller
$request->session()->regenerate();
return response()->json([
    'user' => $user,
    'message' => 'Authenticated successfully'
]);
```

**Important:** Do NOT return `access_token` in the response when using session/cookie auth.

#### Frontend Changes

**1. Remove localStorage token storage:**

```diff
// src/contexts/AuthContext.jsx
  const login = async (credential) => {
    try {
      const { data } = await googleLoginMutation({
        variables: { googleToken: credential }
      });

      if (data?.googleLogin) {
-       const { access_token, user: backendUser } = data.googleLogin;
+       const { user: backendUser } = data.googleLogin;
-       localStorage.setItem('token', access_token);

        const userData = {
          ...googleUserData,
          id: backendUser.id,
          name: backendUser.name,
          email: backendUser.email,
        };

        localStorage.setItem('user_data', JSON.stringify(userData));
        setUser(userData);

        await apolloClient.resetStore();
        return userData;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
```

**2. Remove token from Apollo Client:**

```diff
// src/apolloClient.js
-// Auth link
-const authLink = new ApolloLink((operation, forward) => {
-  const token = localStorage.getItem('token');
-
-  operation.setContext(({ headers = {} }) => ({
-    headers: {
-      ...headers,
-      authorization: token ? `Bearer ${token}` : "",
-    }
-  }));
-
-  return forward(operation);
-});

// HTTP connection to the API
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/graphql` : '/graphql',
  credentials: 'include', // Already set - this sends cookies
});

// Create the apollo client
const client = new ApolloClient({
-  link: ApolloLink.from([errorLink, authLink, httpLink]),
+  link: ApolloLink.from([errorLink, httpLink]),
  cache,
  defaultOptions: { ... }
});
```

**3. Add CSRF token handling:**

Laravel includes CSRF protection. Frontend needs to:

```javascript
// src/apolloClient.js
const csrfLink = new ApolloLink((operation, forward) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      'X-CSRF-TOKEN': csrfToken || '',
    }
  }));

  return forward(operation);
});

const client = new ApolloClient({
  link: ApolloLink.from([errorLink, csrfLink, httpLink]),
  // ...
});
```

**4. Update logout:**

```diff
// src/contexts/AuthContext.jsx
  const logout = async () => {
-   localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    setUser(null);

+   // Call backend logout endpoint to clear session
+   try {
+     await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
+       method: 'POST',
+       credentials: 'include',
+     });
+   } catch (error) {
+     console.error('Logout error:', error);
+   }

    await apolloClient.clearStore();
  };
```

#### Deployment Configuration

**CORS Settings (Backend):**
```php
// config/cors.php
'supports_credentials' => true,
'allowed_origins' => [
    'http://localhost:5173',
    'https://attic.yourdomain.com',
],
```

**Cookie Settings:**
```env
# .env (Backend)
SESSION_DRIVER=cookie
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true  # Production only (HTTPS required)
SESSION_SAME_SITE=lax       # Protects against CSRF
SESSION_DOMAIN=.yourdomain.com  # Allow subdomains if needed
```

**Frontend Environment:**
```env
# .env.local (Frontend)
VITE_API_URL=https://api.yourdomain.com  # Must be same domain or subdomain
```

### Alternative: SessionStorage (Temporary Mitigation)

If cookie-based auth cannot be implemented immediately, migrate to `sessionStorage` as a temporary measure:

**Pros:**
- Slightly more secure than localStorage (clears on tab close)
- No backend changes required
- Quick to implement

**Cons:**
- Still vulnerable to XSS
- User logged out on tab close (poor UX)
- Not a proper long-term solution

```diff
// src/contexts/AuthContext.jsx
- localStorage.setItem('token', access_token);
+ sessionStorage.setItem('token', access_token);

- const storedToken = localStorage.getItem('token');
+ const storedToken = sessionStorage.getItem('token');
```

### Testing the Migration

**1. Test authentication flow:**
- Login with Google OAuth
- Verify cookies are set (check DevTools > Application > Cookies)
- Verify no token in localStorage
- Verify GraphQL requests work

**2. Test cross-tab behavior:**
- Open app in multiple tabs
- Login in one tab
- Verify authenticated in other tabs (cookies are shared)

**3. Test logout:**
- Logout in one tab
- Verify logged out in all tabs
- Verify cookies are cleared

**4. Test CSRF protection:**
- Attempt to make request without CSRF token
- Should fail with 419 error

### Timeline

- **Immediate:** Document this issue (DONE)
- **Week 1:** Backend changes (enable Sanctum session auth)
- **Week 1:** Frontend changes (remove localStorage, add cookie support)
- **Week 2:** Testing in staging environment
- **Week 2:** Deploy to production

### References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Laravel Sanctum SPA Authentication](https://laravel.com/docs/10.x/sanctum#spa-authentication)
- [httpOnly Cookie Security](https://owasp.org/www-community/HttpOnly)

---

## Other Security Considerations

### Input Sanitization

**Status:** Unknown - needs verification

**Action Required:**
- Verify backend sanitizes user input (notes, collection names)
- Add DOMPurify if rendering user-generated HTML
- Implement Content Security Policy (CSP)

### Content Security Policy

**Current:** Not implemented

**Recommendation:**
```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline' https://accounts.google.com;
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               connect-src 'self' https://api.yourdomain.com;">
```

### HTTPS Enforcement

**Production Requirement:** All traffic must use HTTPS

**Implementation:**
- Configure web server to redirect HTTP → HTTPS
- Enable HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### Dependency Security

**Action:** Run regular security audits

```bash
npm audit
npm audit fix
```

### API Rate Limiting

**Backend Requirement:** Implement rate limiting to prevent abuse

```php
// routes/api.php
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // API routes
});
```
