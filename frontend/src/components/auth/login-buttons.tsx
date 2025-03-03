import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export function LoginButtons() {
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <Button variant="outline" className="hover:bg-zinc-900/5">
          <Github className="mr-2 h-4 w-4" />
          Github
        </Button>
      </div>
    </div>
  )
}

