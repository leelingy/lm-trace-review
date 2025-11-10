// User identity management (session-based, no authentication)

const STORAGE_KEY = 'lm-trace-user-identity';

export function getUserIdentity() {
  // Check session storage first
  let identity = sessionStorage.getItem(STORAGE_KEY);
  if (identity) {
    return JSON.parse(identity);
  }

  // Check local storage if "remember me" was used
  identity = localStorage.getItem(STORAGE_KEY);
  if (identity) {
    return JSON.parse(identity);
  }

  return null;
}

export function setUserIdentity(displayName, email = '', rememberMe = false) {
  const identity = {
    display_name: displayName,
    email: email || '',
    created_at: new Date().toISOString()
  };

  const identityStr = JSON.stringify(identity);

  if (rememberMe) {
    localStorage.setItem(STORAGE_KEY, identityStr);
  } else {
    sessionStorage.setItem(STORAGE_KEY, identityStr);
  }

  return identity;
}

export function clearUserIdentity() {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
}

export function hasUserIdentity() {
  return getUserIdentity() !== null;
}
