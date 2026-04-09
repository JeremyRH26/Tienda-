"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getRoleHomePath } from "@/lib/app-routes"
import { Spinner } from "@/components/ui/spinner"

export default function HomePage() {
  const { user, ready } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!ready) return
    if (user) router.replace(getRoleHomePath(user.role))
    else router.replace("/login")
  }, [ready, user, router])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Spinner className="size-8 text-muted-foreground" />
    </div>
  )
}
