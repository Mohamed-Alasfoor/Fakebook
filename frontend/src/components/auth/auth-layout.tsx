interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle: string
    illustration?: string
    activeStep?: number
  }
  
  export function AuthLayout({
    children,
    title,
    subtitle,
    illustration = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrip5udBlRSpPXyYetEPuhjEATRCWz7ZIS4g&s",
  }: AuthLayoutProps) {
    return (
      <div className="flex min-h-screen">
        <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg">
            <div className="flex items-center gap-2 mb-8 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#6C5CE7] to-[#a598ff] rounded-xl flex items-center justify-center shadow-lg shadow-[#6C5CE7]/20 transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="font-semibold text-xl bg-gradient-to-r from-[#6C5CE7] to-[#a598ff] bg-clip-text text-transparent">
                Fakebook
              </span>
            </div>
  
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#6C5CE7] to-[#a598ff] bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-gray-600">{subtitle}</p>
            </div>
  
            {children}
          </div>
        </div>
  
        <div className="hidden lg:block w-1/2 bg-gradient-to-br from-[#6C5CE7] to-[#a598ff] p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative h-full flex flex-col items-center justify-center text-center space-y-8">
            <h2 className="text-4xl font-bold max-w-lg leading-tight">
              Start your journey by one click, explore beautiful world!
            </h2>
            <img
              src={illustration || "/placeholder.svg"}
              alt="Auth illustration"
              className="max-w-md w-full rounded-2xl shadow-2xl transition-transform hover:scale-105 duration-500"
            />
          </div>
        </div>
      </div>
    )
  }
  
  