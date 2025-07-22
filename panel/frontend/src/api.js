import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`)
    return response
  },
  (error) => {
    console.error(`API Error: ${error.response?.status} - ${error.message}`)
    return Promise.reject(error)
  }
)

export default api