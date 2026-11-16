import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  register: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await axios.get('/api/auth/me')
          setUser(response.data)
        }
      } catch (err) {
        localStorage.removeItem('authToken')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const register = async (name: string, email: string, password: string) => {
    try {
      setError(null)
      const response = await axios.post('/api/auth/register', {
        name,
        email,
        password,
      })
      const { token, user: userData } = response.data
      localStorage.setItem('authToken', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
      navigate('/dashboard')
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Registration failed'
      setError(errorMessage)
      throw err
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      })
      const { token, user: userData } = response.data
      localStorage.setItem('authToken', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
      navigate('/dashboard')
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Login failed'
      setError(errorMessage)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    navigate('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
