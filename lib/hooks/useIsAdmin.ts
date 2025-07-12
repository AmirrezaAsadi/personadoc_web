import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function useIsAdmin() {
  const { data: session } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!session?.user?.email) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/check-admin')
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Failed to check admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [session?.user?.email])

  return { isAdmin, loading }
}
