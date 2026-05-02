const API_URL = `http://${window.location.hostname}:5000/api`;

const api = {
    get: async (url) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}${url}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return { data, ok: response.ok };
    },
    post: async (url, body) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}${url}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        return { data, ok: response.ok };
    },
    put: async (url, body) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}${url}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        return { data, ok: response.ok };
    },
    delete: async (url) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}${url}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return { data, ok: response.ok };
    }
};

export default api;
