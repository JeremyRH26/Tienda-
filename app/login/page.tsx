"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginScreen } from "@/components/auth/login-screen"
import { useAuth } from "@/lib/auth-context"
import { getRoleHomePath } from "@/lib/app-routes"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const { user, ready } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!ready) return
    if (user) router.replace(getRoleHomePath(user.role))
  }, [ready, user, router])

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  return <LoginScreen />
}
