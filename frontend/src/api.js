/**
 * api.js — base Axios instance for auth routes.
 * Stock data calls use src/services/stockApi.js instead.
 */
import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 15000 })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
