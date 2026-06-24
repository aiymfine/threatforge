const AUTH_EVENT = 'tf:auth-required';

export function setupAuthFetch() {
  const originalFetch = window.fetch;

  window.fetch = async function (input, init = {}) {
    const key = localStorage.getItem('tf_api_key');

    if (key) {
      const headers = new Headers(init.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${key}`);
      }
      init.headers = headers;
    }

    const response = await originalFetch.call(this, input, init);

    if (response.status === 401 && key) {
      localStorage.removeItem('tf_api_key');
      document.dispatchEvent(new CustomEvent(AUTH_EVENT));
    }

    return response;
  };
}

export { AUTH_EVENT };
